import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Printer, LogOut, Clock, ExternalLink, Loader2, CheckCircle2, 
  History, Settings, Wrench, FileCheck2, Menu, X, LayoutDashboard 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const getDeadlineStatus = (deadlineStr) => {
  const diffDays = Math.ceil((new Date(deadlineStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Terlewat', color: 'text-red-600 bg-red-100', border: 'border-red-400' };
  if (diffDays <= 2) return { label: `${diffDays} Hari Lagi`, color: 'text-orange-600 bg-orange-100', border: 'border-orange-400' };
  return { label: `${diffDays} Hari Lagi`, color: 'text-cyan-600 bg-cyan-100', border: 'border-cyan-200' };
};

export default function KanbanMesin() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Menunggu'); // State Tab khusus Mobile
  
  const [columns, setColumns] = useState({
    'Menunggu': { id: 'Menunggu', title: '📥 Antrean Cetak', items: [] },
    'Dikerjakan': { id: 'Dikerjakan', title: '⚙️ Sedang Diproses', items: [] },
    'Kendala': { id: 'Kendala', title: '⚠️ Kendala', items: [] },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [accModalData, setAccModalData] = useState(null);
  const [selesaiModalData, setSelesaiModalData] = useState(null);
  const [cekDesain, setCekDesain] = useState(false);
  const [cekBahan, setCekBahan] = useState(false);

  const fetchWorkOrders = async () => {
    const res = await fetch('/api/work-orders?stage=Operator Mesin');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error);
    return result.data.workOrders;
  };

  const processColumns = (workOrders) => {
    const newCols = {
      'Menunggu': { id: 'Menunggu', title: '📥 Antrean Cetak', items: [] },
      'Dikerjakan': { id: 'Dikerjakan', title: '⚙️ Sedang Diproses', items: [] },
      'Kendala': { id: 'Kendala', title: '⚠️ Kendala', items: [] },
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
        body: JSON.stringify({ workOrderId: movedItem.id, newStatus: destination.droppableId, newStage: 'Operator Mesin' })
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

  const executeAccCetak = async () => {
    if (!cekDesain || !cekBahan) return toast.warning("Mohon centang semua verifikasi pra-cetak!");
    setIsUpdating(true);
    try {
      await fetch('/api/work-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId: accModalData.id, newStatus: 'Dikerjakan', newStage: 'Operator Mesin' })
      });
      toast.success("File di-ACC. Siap masuk mesin cetak!");
      setAccModalData(null);
      setCekDesain(false); setCekBahan(false);
      loadData();
      setActiveTab('Dikerjakan');
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsUpdating(false);
    }
  };

  const executeKirimPackaging = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrderId: selesaiModalData.id, newStatus: 'Menunggu', newStage: 'Operator Packaging' })
      });
      if(res.ok) {
        toast.success("Produksi Selesai! Diteruskan ke Packaging.");
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
    <div className="h-screen flex bg-[#0f172a] font-sans text-slate-100 overflow-hidden relative">
      
      {/* Background Industrial Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900 pointer-events-none"></div>

      {/* Backdrop Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-cyan-900/30 text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="text-cyan-400" size={20} />
            <span className="font-bold text-lg tracking-wide">SIMKEMAS</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X size={20} />
          </Button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          <button onClick={() => { setIsSidebarOpen(false); navigate('/mesin'); }} className="w-full flex items-center gap-3 px-3 py-3 bg-cyan-800/80 text-white rounded-md font-medium text-sm transition-colors cursor-pointer border border-cyan-700">
            <LayoutDashboard size={18} /> Ruang Mesin
          </button>
          <button onClick={() => { setIsSidebarOpen(false); navigate('/mesin/riwayat'); }} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <History size={18} /> Riwayat Cetak
          </button>
          <button onClick={() => toast.info("Segera hadir!")} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <Settings size={18} /> Part Mesin
          </button>
          <button onClick={() => toast.info("Segera hadir!")} className="w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-pointer">
            <Wrench size={18} /> Maintenance
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button variant="outline" onClick={logout} className="w-full h-12 border-slate-700 bg-slate-800/50 text-red-400 hover:bg-red-950/50 hover:text-red-300 justify-start gap-2 cursor-pointer">
            <LogOut size={16} /> Keluar Akun
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Header Area */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-cyan-900/50 bg-slate-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-300 hover:bg-slate-800 cursor-pointer">
              <Menu size={22} />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-200 truncate">Panel Operator Mesin</h1>
            {isUpdating && <Loader2 size={14} className="animate-spin text-cyan-500 ml-2" />}
          </div>
          <span className="hidden sm:inline text-sm font-semibold text-slate-400">👋 {user?.username}</span>
        </header>

        {/* Tab Navigasi Mobile Pas 100% Lebar Layar HP */}
        <div className="flex lg:hidden bg-slate-900 border-b border-slate-800 p-2 sm:p-3 gap-2 w-full shrink-0">
          {Object.keys(columns).map(colId => (
            <button
              key={colId}
              onClick={() => setActiveTab(colId)}
              className={`flex-1 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center gap-1 border cursor-pointer
                ${activeTab === colId ? 'bg-cyan-900/80 text-cyan-50 border-cyan-500 shadow-md' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
            >
              <div className="flex items-center gap-1">
                <span>{columns[colId].title.split(' ')[0]}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === colId ? 'bg-cyan-500 text-white' : 'bg-slate-900 text-slate-300'}`}>
                  {columns[colId].items.length}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-tight uppercase opacity-90 truncate max-w-full">
                {columns[colId].title.replace(/.*? /,"")}
              </span>
            </button>
          ))}
        </div>

        {/* Main Content: Card-Card SPK Pas 100% Lebar HP */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto lg:overflow-x-auto overflow-x-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-cyan-600" /></div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full items-start w-full lg:min-w-max">
                {Object.entries(columns).map(([columnId, column]) => (
                  <div key={columnId} className={`w-full max-w-full lg:w-[360px] flex-col h-full max-h-full ${activeTab === columnId ? 'flex' : 'hidden lg:flex'}`}>
                    
                    {/* Header Kolom (Desktop Only) */}
                    <div className={`hidden lg:flex mb-4 p-3 rounded-lg border-l-4 shadow-lg items-center justify-between shrink-0 bg-slate-800/80 backdrop-blur-sm
                      ${columnId === 'Dikerjakan' ? 'border-l-cyan-500' : columnId === 'Kendala' ? 'border-l-amber-500' : 'border-l-slate-500'}`}>
                      <h2 className="font-bold text-slate-200 tracking-wide">{column.title}</h2>
                      <Badge variant="secondary" className="bg-slate-900 text-cyan-400 border border-cyan-900">{column.items.length}</Badge>
                    </div>

                    <Droppable droppableId={String(columnId)}>
                      {(provided, snapshot) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 overflow-y-auto space-y-3 sm:space-y-4 pb-12 w-full max-w-full lg:p-2 lg:rounded-xl ${snapshot.isDraggingOver ? 'bg-slate-800/50' : ''}`}>
                          {column.items.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                              Tidak ada antrean di kategori ini.
                            </div>
                          ) : (
                            column.items.map((item, index) => {
                              const deadlineInfo = getDeadlineStatus(item.deadline);

                              return (
                                <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                                  {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                      className={`relative group bg-slate-900 border rounded-xl p-3.5 sm:p-5 shadow-lg select-none transition-all duration-200 w-full max-w-full box-border
                                        ${snapshot.isDragging ? 'shadow-2xl shadow-cyan-900/50 border-cyan-500 z-50 scale-105' : 'border-slate-700 hover:border-cyan-700'}`}
                                    >
                                      <div className="space-y-3 w-full">
                                        <div className="flex justify-between items-start w-full">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-600 font-mono text-[10px]">#{index + 1}</Badge>
                                            <Badge variant="outline" className={`text-[10px] font-bold border px-2 py-0.5 ${deadlineInfo.border} ${deadlineInfo.color}`}>
                                              <Clock size={10} className="mr-1 inline" /> {deadlineInfo.label}
                                            </Badge>
                                          </div>
                                          <a href={`/kasir/spk/${item.invoice_no}`} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors cursor-pointer shrink-0" onPointerDown={e => e.stopPropagation()}>
                                            <ExternalLink size={16} />
                                          </a>
                                        </div>

                                        <div>
                                          <h3 className="font-black text-lg sm:text-xl text-slate-100 mb-0.5 leading-tight break-words">{item.umkm_name}</h3>
                                          <p className="font-mono text-xs text-cyan-500">{item.invoice_no}</p>
                                        </div>

                                        <div className="space-y-1.5 mt-2 bg-slate-950/50 rounded-lg p-2 border border-slate-800/50 w-full">
                                          {item.items?.map(pkg => (
                                            <div key={pkg.id} className="text-xs sm:text-sm text-slate-300 flex justify-between items-center bg-slate-800/60 p-2 rounded-md border border-slate-700/50 w-full">
                                              <span className="truncate font-medium pr-2">{pkg.nama_kemasan}</span>
                                              <Badge className="bg-slate-700 text-cyan-300 font-bold px-2 py-0.5 shrink-0">{pkg.qty} Pcs</Badge>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Tombol Aksi Sentuh Besar Fit Lebar Layar */}
                                        <div className="pt-2 w-full">
                                          {columnId === 'Menunggu' && (
                                            <Button size="lg" className="h-12 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-cyan-900/50 cursor-pointer" onClick={() => setAccModalData(item)} onPointerDown={e => e.stopPropagation()}>
                                              <FileCheck2 size={18} className="mr-2 shrink-0" /> ACC & Mulai Proses
                                            </Button>
                                          )}
                                          {columnId === 'Dikerjakan' && (
                                            <Button size="lg" className="h-12 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/50 cursor-pointer" onClick={() => setSelesaiModalData(item)} onPointerDown={e => e.stopPropagation()}>
                                              <CheckCircle2 size={18} className="mr-2 shrink-0" /> Cetak Selesai
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

      {/* MODAL: ACC FILE PRA-CETAK (Mobile Optimized) */}
      <Dialog open={!!accModalData} onOpenChange={(open) => !open && setAccModalData(null)}>
        <DialogContent className="w-[92%] max-w-md bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl shadow-cyan-900/20 p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-cyan-400 text-lg sm:text-xl font-bold"><FileCheck2 size={22} /> Verifikasi ACC Cetak</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs sm:text-sm mt-1">
              Pastikan <b className="text-white">{accModalData?.invoice_no}</b> siap cetak:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <label className={`flex items-center gap-3.5 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${cekDesain ? 'border-cyan-500 bg-cyan-950/40' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}>
              <Checkbox checked={cekDesain} onCheckedChange={setCekDesain} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-slate-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-100">File Desain & Plat OK</p>
                <p className="text-[11px] text-slate-400">File final sesuai standar ukuran mesin.</p>
              </div>
            </label>

            <label className={`flex items-center gap-3.5 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${cekBahan ? 'border-cyan-500 bg-cyan-950/40' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'}`}>
              <Checkbox checked={cekBahan} onCheckedChange={setCekBahan} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md border-2 border-slate-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-100">Bahan Baku Ready</p>
                <p className="text-[11px] text-slate-400">Plastik/kertas dan tinta siap digunakan.</p>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-2.5 mt-1">
            <Button size="lg" className="h-12 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer text-sm" onClick={executeAccCetak} disabled={isUpdating || !cekDesain || !cekBahan}>
              {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Konfirmasi & Masuk Mesin'}
            </Button>
            <Button size="lg" variant="ghost" className="h-11 w-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer text-sm" onClick={() => setAccModalData(null)} disabled={isUpdating}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: SELESAI CETAK (Mobile Optimized) */}
      <Dialog open={!!selesaiModalData} onOpenChange={(open) => !open && setSelesaiModalData(null)}>
        <DialogContent className="w-[92%] max-w-md bg-slate-900 border border-slate-700 text-slate-100 p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-emerald-400 text-lg sm:text-xl font-bold"><CheckCircle2 size={22} /> Cetak Selesai</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs sm:text-sm mt-1">
              Kirim pesanan <b className="text-white">{selesaiModalData?.umkm_name}</b> ke divisi <b>Packaging</b>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2.5 mt-5">
            <Button size="lg" className="h-12 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/30 cursor-pointer text-sm" onClick={executeKirimPackaging} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" size={20} /> : 'Ya, Kirim ke Packaging'}
            </Button>
            <Button size="lg" variant="ghost" className="h-11 w-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer text-sm" onClick={() => setSelesaiModalData(null)} disabled={isUpdating}>
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}