import { useState, useEffect, useMemo, useRef } from 'react';
import { financeService } from '@/services/finance.service';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Loader2, Download, TrendingUp, DollarSign, FileSpreadsheet, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

const fmtMoney = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export default function ReportFinansialPage() {
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ total_in: 0, total_out: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const chartRef = useRef<HTMLDivElement>(null);

    const loadData = () => {
        setLoading(true);
        financeService.getTransactions(startDate, endDate)
            .then(res => {
                setData(res.data?.transactions || res.transactions || []);
                setSummary(res.data?.summary || res.summary || { total_in: 0, total_out: 0, balance: 0 });
            })
            .catch(() => Swal.fire('Error', 'Gagal memuat data laporan keuangan', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate]);

    const { chartData, pieData } = useMemo(() => {
        if (data.length === 0) return { chartData: [], pieData: [] };

        let minTime = Number.MAX_SAFE_INTEGER;
        let maxTime = 0;

        data.forEach(t => {
            const time = new Date(t.created_at).setHours(0, 0, 0, 0);
            if (time < minTime) minTime = time;
            if (time > maxTime) maxTime = time;
        });

        if (startDate) {
            const sTime = new Date(startDate).setHours(0, 0, 0, 0);
            if (sTime < minTime) minTime = sTime;
        }
        if (endDate) {
            const eTime = new Date(endDate).setHours(0, 0, 0, 0);
            if (eTime > maxTime) maxTime = eTime;
        }

        // Jika hanya ada 1 hari transaksi, beri jarak 1 hari sebelum & sesudah agar grafik garis terbentuk
        if (minTime === maxTime) {
            minTime -= 86400000;
            maxTime += 86400000;
        }

        const dailyMap: Record<string, { in: number, out: number, timestamp: number }> = {};

        // 1. Pre-fill semua hari di rentang waktu dengan nilai 0
        for (let time = minTime; time <= maxTime; time += 86400000) {
            const dateStr = new Date(time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            dailyMap[dateStr] = { in: 0, out: 0, timestamp: time };
        }

        // 2. Isi nilai dari data transaksi
        data.forEach(t => {
            const date = new Date(t.created_at);
            const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

            if (!dailyMap[dateStr]) {
                dailyMap[dateStr] = { in: 0, out: 0, timestamp: date.setHours(0, 0, 0, 0) };
            }

            if (t.type === 'in') {
                dailyMap[dateStr].in += t.amount;
            } else {
                dailyMap[dateStr].out += t.amount;
            }
        });

        // 3. Convert ke array dan urutkan
        const chart = Object.keys(dailyMap).map(key => ({
            name: key, // Label lengkap untuk Tooltip "8 Feb 2026"
            shortName: new Date(dailyMap[key].timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), // Label pendek "8 Feb"
            timestamp: dailyMap[key].timestamp,
            Pemasukan: dailyMap[key].in,
            Pengeluaran: dailyMap[key].out
        })).sort((a, b) => a.timestamp - b.timestamp);

        const pie = [
            { name: 'Pemasukan', value: summary.total_in, color: '#10b981' },
            { name: 'Pengeluaran', value: summary.total_out, color: '#ef4444' }
        ];

        return { chartData: chart, pieData: pie };
    }, [data, summary, startDate, endDate]);

    // Formatter Rupiah untuk Y-Axis
    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1)}Jt`;
        if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}Rb`;
        return `Rp ${value}`;
    };

    const handleExportExcel = () => {
        if (data.length === 0) return Swal.fire('Ops', 'Tidak ada data untuk diexport', 'warning');

        const headers = ['Tanggal', 'Kategori', 'Tipe', 'Nominal', 'Keterangan'];
        const csvRows = data.map(t => {
            const date = new Date(t.created_at).toLocaleDateString('id-ID');
            const type = t.type === 'in' ? 'Pemasukan' : 'Pengeluaran';
            return `"${date}","${t.category || '-'}","${type}","${t.amount}","${t.description || '-'}"`;
        });

        const csvString = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Laporan_Keuangan_Global_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadChart = () => {
        if (!chartRef.current) return;

        const svgElement = chartRef.current.querySelector('svg');
        if (!svgElement) return Swal.fire('Error', 'Grafik tidak ditemukan untuk diunduh', 'error');

        try {
            // Clone & Prepare SVG
            const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
            const boundingBox = svgElement.getBoundingClientRect();

            // Recharts viewport matching
            const width = boundingBox.width;
            const height = boundingBox.height + 40; // Extra space for legends

            clonedSvg.setAttribute("width", width.toString());
            clonedSvg.setAttribute("height", height.toString());
            clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
            clonedSvg.style.backgroundColor = "#ffffff";
            clonedSvg.style.fontFamily = "sans-serif";

            // INJECT CSS CLASSES UNTUK RECHARTS
            const style = document.createElement("style");
            style.innerHTML = `
                .recharts-text { font-family: Inter, sans-serif; font-size: 12px; fill: #64748b; }
                .recharts-cartesian-grid-horizontal line { stroke: #e2e8f0; }
                .recharts-cartesian-grid-vertical line { stroke: #e2e8f0; }
                .recharts-line-curve { fill: none; stroke-width: 3; stroke-linecap: round; }
                .recharts-legend-item-text { font-family: Inter, sans-serif; font-size: 14px; color: #334155; }
            `;
            clonedSvg.insertBefore(style, clonedSvg.firstChild);

            // Fetch explicit paths stroke color for lines
            const lines = svgElement.querySelectorAll('.recharts-line-curve');
            const clonedLines = clonedSvg.querySelectorAll('.recharts-line-curve');
            lines.forEach((l, i) => {
                const stroke = window.getComputedStyle(l).stroke;
                if (stroke) (clonedLines[i] as SVGPathElement).style.stroke = stroke;
            });

            // Fetch explicit fills for dots
            const dots = svgElement.querySelectorAll('.recharts-line-dot');
            const clonedDots = clonedSvg.querySelectorAll('.recharts-line-dot');
            dots.forEach((d, i) => {
                const fill = window.getComputedStyle(d).fill;
                const stroke = window.getComputedStyle(d).stroke;
                if (fill) (clonedDots[i] as SVGCircleElement).style.fill = fill;
                if (stroke) (clonedDots[i] as SVGCircleElement).style.stroke = stroke;
            });

            // Convert to Canvas
            const svgData = new XMLSerializer().serializeToString(clonedSvg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            // Handle high resolution
            const scale = 2;
            canvas.width = width * scale;
            canvas.height = height * scale;

            img.onload = () => {
                if (ctx) {
                    ctx.scale(scale, scale);
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    const pngFile = canvas.toDataURL("image/png", 1.0);
                    const downloadLink = document.createElement("a");
                    downloadLink.download = `Laporan_Grafik_${new Date().getTime()}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                }
            };

            // Base64 encode SVG to bypass tainted canvas issues
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        } catch (error) {
            console.error("Export Error:", error);
            Swal.fire('Error', 'Gagal memproses ekspor grafik', 'error');
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-10" /></div>;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Laporan Keuangan Manager</h1>
                    <p className="text-slate-500 text-sm">Analitik komprehensif arus kas perusahaan.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl text-sm shadow-sm w-full sm:w-auto">
                        <Calendar size={16} className="text-slate-400 ml-2" />
                        <input
                            type="date"
                            className="outline-none bg-transparent text-slate-600 cursor-pointer"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="date"
                            className="outline-none bg-transparent text-slate-600 cursor-pointer pr-2"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-start md:justify-end gap-3">
                <button
                    onClick={handleDownloadChart}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Download size={18} /> Download Grafik
                </button>
                <button
                    onClick={handleExportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <FileSpreadsheet size={18} /> Export Excel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl"><ArrowUpRight size={28} /></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Pemasukan</p>
                        <h3 className="text-2xl font-black text-slate-800">{fmtMoney(summary.total_in)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl"><ArrowDownRight size={28} /></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Total Pengeluaran</p>
                        <h3 className="text-2xl font-black text-slate-800">{fmtMoney(summary.total_out)}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${summary.balance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}><DollarSign size={28} /></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase">Saldo Bersih</p>
                        <h3 className={`text-2xl font-black ${summary.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{fmtMoney(summary.balance)}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2" ref={chartRef}>
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-blue-600" /> Tren Keuangan Bulanan
                    </h3>
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="99%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={formatYAxis} width={65} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1 }}
                                    formatter={(value: any, name: any) => [fmtMoney(Number(value)), name]}
                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PieChart className="text-blue-600" /> Komposisi Arus Kas
                    </h3>
                    <div className="h-72 w-full flex items-center justify-center">
                        {summary.total_in === 0 && summary.total_out === 0 ? (
                            <p className="text-slate-400 text-sm">Belum ada data</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        labelLine={false}
                                        label={({ cx, cy, midAngle = 0, innerRadius, outerRadius, percent = 0 }) => {
                                            if (percent === 0) return null;
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                            return (
                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            );
                                        }}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => fmtMoney(Number(value))} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}