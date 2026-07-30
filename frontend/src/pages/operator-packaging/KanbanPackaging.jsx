import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Package, LogOut, Clock, ExternalLink, Loader2, CheckCircle2, 
  History, Box, FileCheck2, Menu, X, LayoutDashboard 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const getDeadlineStatus = (deadlineStr) => {
  const diffDays = Math.ceil((new Date(deadlineStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Terlewat', color: 'text-red-700 bg-red-100', border: 'border-red-300' };
  if (diffDays <= 2) return { label: `${diffDays} Hari Lagi`, color: 'text-orange-700 bg-orange-100', border: 'border-orange-300' };
  return { label: `${diffDays} Hari Lagi`, color: 'text-emerald-700 bg-emerald-100', border: 'border-emerald-300' };
};

export default function KanbanPackaging() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Menunggu'); 
  
  const [columns, setColumns] = useState({
    'Menunggu': { id: 'Menunggu', title: '📥 Antrean Packing', items: [] },
    'Dikerjakan': { id: 'Dikerjakan', title: '📦 Sedang Dipacking', items: [] },
    'Kendala': { id: 'Kendala', title: '⚠️ Kendala Packing', items: [] },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [accModalData, setAccModalData] = useState(null);
  const [selesaiModalData, setSelesaiModalData] = useState(null);
  const [cekKualitas, setCekKualitas] = useState(false);
  const [cekJumlah, setCekJumlah] = useState(false);

  const fetchWorkOrders = async () => {
    const res = await fetch('/api/work-orders?stage=Operator Packaging');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error);
    return result.data.workOrders;
  };

  const processColumns = (workOrders) => {
    const newCols = {
      'Menunggu': { id: 'Menunggu', title: '📥 Antrean Packing', items: [] },
      'Dikerjakan': { id: 'Dikerjakan', title: '📦 Sedang Dipacking', items: [] },
      'Kendala': { id: 'Kendala', title: '⚠️ Kendala Packing', items: [] },
    };
    const sorted = [...workOrders].sort((a, b) => new Date(a.order_date) - new Date(b.order_date));
    sorted.forEach(wo => {
      const colId = newCols[wo.status] ? wo.status : 'Menunggu';
      newCols[colId].items.push(wo);
    });
    return newCols;
  };

  useEffect(() => {
    fetchWorkOrders()
      .then(data => setColumns(processColumns(data)))
      .catch(err => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const loadData = () => {
    setIsLoading(true);
    fetchWorkOrders()
      .then(data => setColumns(processColumns(data)))
      .catch(err => toast.error(err.message))
      .finally(() => setIsLoading(false));
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];
    
    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.status = destination.droppableId;
    destItems.splice(destination.index, 0, movedItem);

    setColumns({ ...columns, [source.droppableId]: { ...sourceCol, items: sourceItems }, [destination.droppableId]: { ...destCol, items: destItems } });

    setIsUpdating(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId: movedItem.id, newStatus: destination.droppableId, newStage: 'Operator Packaging' })
      });
      if (!res.ok) throw new Error("Gagal sinkronisasi");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan posisi kartu");
      loadData(); 
    } finally {
      setIsUpdating(false);
    }
  };

  const executeAccPacking = async () => {
    if (!cekKualitas || !cekJumlah) return toast.warning("Mohon centang verifikasi barang terlebih dahulu!");
    setIsUpdating(true);
    try {
      await fetch('/api/work-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId: accModalData.id, newStatus: 'Dikerjakan', newStage: 'Operator Packaging' })
      });
      toast.success("Barang di-ACC. Siap dipacking!");
      setAccModalData(null);
      setCekKualitas(false); setCekJumlah(false);
      loadData();
      setActiveTab('Dikerjakan');
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsUpdating(false);
    }
  };

  // Kirim ke Kasir
  const executeKirimKasir = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workOrderId: selesaiModalData.id, 
          newStatus: 'Siap Diambil', // <-- UBAH BAGIAN INI
          newStage: 'Kasir' 
        })
      });
      if(res.ok) {
        toast.success("Packing Selesai! Pesanan diserahkan ke Kasir.");
        setSelesaiModalData(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* Backdrop Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation (Terang / Putih) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Package className="text-amber-600" size={22} />
            <span className="font-bold text-lg text-slate-800 tracking-wide">SIMKEMAS</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button onClick={() => { setIsSidebarOpen(false); navigate('/packaging'); }} className="w-full flex items-center gap-3 px-3 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-sm transition-colors cursor-pointer">
            <LayoutDashboard size={18} /> Ruang Packing
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/packaging/riwayat'); }} className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-md font-medium text-sm transition-colors cursor-pointer">
            <History size={18} /> Riwayat Packing
          </button>
          <button onClick={() => toast.info("Modul Stock Opname Kardus/Lakban segera hadir!")} className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-md font-medium text-sm transition-colors cursor-pointer">
            <Box size={18} /> Stock Opname Barang
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={logout} className="w-full h-12 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 justify-start gap-2 cursor-pointer shadow-sm">
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 bg-slate-50/50">
        
        {/* Header Area */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500 hover:bg-slate-100 cursor-pointer border border-slate-200">
              <Menu size={20} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">Divisi Packaging</h1>
            {isUpdating && <Loader2 size={14} className="animate-spin text-amber-500 ml-2" />}
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">👋 {user?.username}</span>
        </header>

        {/* Tab Navigasi Mobile */}
        <div className="flex lg:hidden bg-white border-b border-slate-200 p-2 sm:p-3 gap-2 w-full shrink-0 shadow-sm z-10">
          {Object.keys(columns).map(colId => (
            <button
              key={colId}
              onClick={() => setActiveTab(colId)}
              className={`flex-1 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer
                ${activeTab === colId ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-1">
                <span>{columns[colId].title.split(' ')[0]}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === colId ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {columns[colId].items.length}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-tight uppercase opacity-90 truncate max-w-full">
                {columns[colId].title.replace(/.*? /,"")}
              </span>
            </button>
          ))}
        </div>

        {/* Kanban Board Area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto lg:overflow-x-auto overflow-x-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-amber-500" /></div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full items-start w-full lg:min-w-max">
                {Object.entries(columns).map(([columnId, column]) => (
                  <div key={columnId} className={`w-full max-w-full lg:w-[360px] flex-col h-full max-h-full ${activeTab === columnId ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* Header Kolom (Desktop Only) */}
                    <div className={`hidden lg:flex mb-4 p-3 rounded-xl border border-slate-200 shadow-sm items-center justify-between shrink-0 bg-white
                      ${columnId === 'Dikerjakan' ? 'border-t-4 border-t-amber-500' : columnId === 'Kendala' ? 'border-t-4 border-t-red-500' : 'border-t-4 border-t-slate-400'}`}>
                      <h2 className="font-bold text-slate-700 tracking-wide">{column.title}</h2>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border border-slate-200">{column.items.length}</Badge>
                    </div>

                    <Droppable droppableId={String(columnId)}>
                      {(provided, snapshot) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 overflow-y-auto space-y-3 sm:space-y-4 pb-12 w-full max-w-full lg:p-1 lg:rounded-xl ${snapshot.isDraggingOver ? 'bg-amber-50/50 rounded-xl border border-dashed border-amber-200' : ''}`}>
                          {column.items.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-300 rounded-xl bg-white/50">
                              Tidak ada antrean di kategori ini.
                            </div>
                          ) : (
                            column.items.map((item, index) => {
                              const deadlineInfo = getDeadlineStatus(item.deadline);

                              return (
                                <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                                  {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                      className={`relative group bg-white border border-slate-200 rounded-xl p-3.5 sm:p-5 shadow-sm select-none transition-all duration-200 w-full max-w-full box-border
                                        ${snapshot.isDragging ? 'shadow-2xl shadow-amber-900/20 border-amber-400 z-50 scale-105 ring-2 ring-amber-400/20' : 'hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5'}`}
                                    >
                                      <div className="space-y-3 w-full">
                                        <div className="flex justify-between items-start w-full">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 font-mono text-[10px]">#{index + 1}</Badge>
                                            <Badge variant="outline" className={`text-[10px] font-bold border px-2 py-0.5 ${deadlineInfo.border} ${deadlineInfo.color}`}>
                                              <Clock size={10} className="mr-1.5 inline" /> {deadlineInfo.label}
                                            </Badge>
                                          </div>
                                          <a href={`/kasir/spk/${item.invoice_no}`} target="_blank" rel="noreferrer" className="bg-slate-50 p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer shrink-0" onPointerDown={e => e.stopPropagation()}>
                                            <ExternalLink size={16} />
                                          </a>
                                        </div>

                                        <div>
                                          <h3 className="font-black text-lg sm:text-xl text-slate-800 mb-0.5 leading-tight break-words">{item.umkm_name}</h3>
                                          <p className="font-mono text-xs text-slate-500">{item.invoice_no}</p>
                                        </div>

                                        <div className="space-y-1.5 mt-2 bg-slate-50 rounded-lg p-2 border border-slate-100 w-full">
                                          {item.items?.map(pkg => (
                                            <div key={pkg.id} className="text-xs sm:text-sm text-slate-600 flex justify-between items-center bg-white p-2 rounded-md border border-slate-200 w-full shadow-sm">
                                              <span className="truncate font-semibold pr-2">{pkg.nama_kemasan}</span>
                                              <Badge className="bg-slate-100 text-amber-700 border-amber-200 font-bold px-2 py-0.5 shrink-0">{pkg.qty} Pcs</Badge>
                                            </div>
                                          ))}
                                        </div>

                                        <div className="pt-2 w-full">
                                          {columnId === 'Menunggu' && (
                                            <Button size="lg" className="h-11 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm shadow-md cursor-pointer" onClick={() => setAccModalData(item)} onPointerDown={e => e.stopPropagation()}>
                                              <FileCheck2 size={16} className="mr-2 shrink-0" /> Terima dari Mesin
                                            </Button>
                                          )}
                                          {columnId === 'Dikerjakan' && (
                                            <Button size="lg" className="h-11 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer" onClick={() => setSelesaiModalData(item)} onPointerDown={e => e.stopPropagation()}>
                                              <CheckCircle2 size={16} className="mr-2 shrink-0" /> Packing Selesai
                                            </Button>
                                          )}
                                        </div>

                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          )}
        </main>
      </div>

      {/* MODAL: ACC TERIMA BARANG DARI MESIN */}
      <Dialog open={!!accModalData} onOpenChange={(open) => !open && setAccModalData(null)}>
        <DialogContent className="w-[92%] max-w-md bg-white border border-slate-200 text-slate-800 shadow-2xl p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-slate-800 text-lg sm:text-xl font-bold"><FileCheck2 size={22} className="text-amber-500" /> Cek Barang Masuk</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs sm:text-sm mt-1">
              Verifikasi hasil cetak untuk SPK <b className="text-slate-700">{accModalData?.invoice_no}</b> sebelum dipacking:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <label className={`flex items-center gap-3.5 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${cekKualitas ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
              <Checkbox checked={cekKualitas} onCheckedChange={setCekKualitas} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Kualitas Cetak OK</p>
                <p className="text-[11px] text-slate-500">Warna jelas, potongan rapi, tidak cacat.</p>
              </div>
            </label>

            <label className={`flex items-center gap-3.5 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${cekJumlah ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}>
              <Checkbox checked={cekJumlah} onCheckedChange={setCekJumlah} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-slate-300 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800">Jumlah Kemasan Pas</p>
                <p className="text-[11px] text-slate-500">Kuantitas sesuai pesanan SPK.</p>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-2.5 mt-1">
            <Button size="lg" className="h-11 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer text-sm shadow-md" onClick={executeAccPacking} disabled={isUpdating || !cekKualitas || !cekJumlah}>
              {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Konfirmasi & Mulai Packing'}
            </Button>
            <Button size="lg" variant="outline" className="h-11 w-full text-slate-500 hover:text-slate-700 cursor-pointer text-sm bg-white" onClick={() => setAccModalData(null)} disabled={isUpdating}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: SELESAI PACKING -> LEMPAR KE KASIR */}
      <Dialog open={!!selesaiModalData} onOpenChange={(open) => !open && setSelesaiModalData(null)}>
        <DialogContent className="w-[92%] max-w-md bg-white border border-slate-200 text-slate-800 p-4 sm:p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-emerald-600 text-lg sm:text-xl font-bold"><CheckCircle2 size={22} /> Packing Selesai</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs sm:text-sm mt-1">
              Serahkan pesanan <b className="text-slate-700">{selesaiModalData?.umkm_name}</b> ke <b>Kasir</b> agar status berubah menjadi Siap Diambil?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2.5 mt-5">
            <Button size="lg" className="h-11 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20 cursor-pointer text-sm" onClick={executeKirimKasir} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Kirim Ke Etalase Kasir'}
            </Button>
            <Button size="lg" variant="outline" className="h-11 w-full text-slate-500 hover:text-slate-700 cursor-pointer text-sm bg-white" onClick={() => setSelesaiModalData(null)} disabled={isUpdating}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}