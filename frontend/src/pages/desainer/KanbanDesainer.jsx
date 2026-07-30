import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, LogOut, Clock, ExternalLink, Loader2, CheckCircle2, History, Send } from 'lucide-react';

const getDeadlineStatus = (deadlineStr) => {
  const today = new Date();
  const deadline = new Date(deadlineStr);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: 'Terlewat', color: 'text-red-600 bg-red-100', border: 'border-red-400' };
  if (diffDays <= 2) return { label: `${diffDays} Hari Lagi`, color: 'text-orange-600 bg-orange-100', border: 'border-orange-400' };
  return { label: `${diffDays} Hari Lagi`, color: 'text-emerald-600 bg-emerald-100', border: 'border-emerald-200' };
};

export default function KanbanDesainer() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const initialColumns = {
    'Menunggu': { id: 'Menunggu', title: '⏳ Menunggu Digarap', items: [] },
    'Dikerjakan': { id: 'Dikerjakan', title: '🎨 Sedang Didesain', items: [] },
    'Revisi': { id: 'Revisi', title: '✍️ Dalam Revisi', items: [] },
  };

  const [columns, setColumns] = useState(initialColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State untuk Modal Konfirmasi Selesai Desain
  const [confirmModalData, setConfirmModalData] = useState(null);

  const fetchWorkOrders = async () => {
    const res = await fetch('/api/work-orders?stage=Desainer');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat Kanban Board");
    return result.data.workOrders;
  };

  const processColumns = (workOrders) => {
    const newCols = {
      'Menunggu': { id: 'Menunggu', title: '⏳ Menunggu Digarap', items: [] },
      'Dikerjakan': { id: 'Dikerjakan', title: '🎨 Sedang Didesain', items: [] },
      'Revisi': { id: 'Revisi', title: '✍️ Dalam Revisi', items: [] },
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

    setColumns({
      ...columns,
      [source.droppableId]: { ...sourceCol, items: sourceItems },
      [destination.droppableId]: { ...destCol, items: destItems }
    });

    setIsUpdating(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workOrderId: movedItem.id, 
          newStatus: destination.droppableId,
          newStage: 'Desainer' 
        })
      });
      if (!res.ok) throw new Error("Gagal sinkronisasi dengan server");
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan posisi kartu");
      loadData(); 
    } finally {
      setIsUpdating(false);
    }
  };

  // Fungsi Eksekusi Pengiriman SPK dari Modal
  const executeSelesaiDesain = async () => {
    if (!confirmModalData) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          workOrderId: confirmModalData.id, 
          newStatus: 'Menunggu', 
          newStage: 'Operator Mesin' 
        })
      });
      
      const result = await res.json();
      if(res.ok && result.ok) {
        toast.success("Hore! SPK berhasil diteruskan ke Divisi Mesin!");
        setConfirmModalData(null); // Tutup Modal
        loadData(); // Refresh Data
      } else {
        toast.error(result.error || "Gagal meneruskan SPK");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan server");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f172a] bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 font-sans text-slate-100 overflow-hidden relative">
      
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header Studio */}
      <header className="relative z-10 h-16 px-6 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-lg shadow-lg shadow-purple-500/20">
            <Palette size={20} className="text-white" />
          </div>
          <span className="font-bold tracking-wide text-lg text-white">STUDIO DESAIN</span>
          {isUpdating && <Loader2 size={14} className="animate-spin text-purple-400 ml-2" />}
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/desainer/riwayat')} 
            className="border-white/20 text-slate-200 hover:bg-white/10 gap-1.5 cursor-pointer"
          >
            <History size={16} /> Riwayat Desain
          </Button>
          <span className="text-sm font-semibold text-slate-300 hidden sm:inline">👋 {user?.username}</span>
          <Button variant="ghost" size="sm" onClick={logout} className="hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer">
            <LogOut size={16} className="mr-1 sm:mr-2" /> <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      {/* Main Container - Kanban Board */}
      <main className="relative z-10 flex-1 p-6 overflow-x-auto h-[calc(100vh-4rem)]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin w-12 h-12 text-purple-500" />
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full items-start min-w-max">
              
              {Object.entries(columns).map(([columnId, column]) => (
                <div key={columnId} className="w-[360px] flex flex-col h-full max-h-full">
                  
                  {/* Header Kolom */}
                  <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-between shrink-0">
                    <h2 className="font-bold text-white tracking-wide">{column.title}</h2>
                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">{column.items.length}</Badge>
                  </div>

                  {/* Area Drop Kartu (Scrollable Internal) */}
                  <Droppable droppableId={String(columnId)}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 overflow-y-auto space-y-4 p-2 rounded-xl transition-colors duration-300 ${
                          snapshot.isDraggingOver ? 'bg-white/5' : 'bg-transparent'
                        }`}
                      >
                        {column.items.map((item, index) => {
                          const deadlineInfo = getDeadlineStatus(item.deadline);

                          return (
                            <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`
                                    relative group bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-lg 
                                    transition-all duration-300 ease-out select-none
                                    ${snapshot.isDragging ? 'shadow-2xl shadow-purple-500/20 scale-105 rotate-2 ring-1 ring-purple-400 z-50' : 'hover:-translate-y-1 hover:shadow-xl hover:border-purple-400/50'}
                                  `}
                                >
                                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${deadlineInfo.color.split(' ')[0].replace('text-', 'bg-')}`}></div>

                                  <div className="pl-2 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-purple-950/60 text-purple-300 border-purple-800/60 font-mono text-[10px]">
                                          #{index + 1}
                                        </Badge>
                                        <Badge variant="outline" className={`text-[10px] font-bold border ${deadlineInfo.border} ${deadlineInfo.color}`}>
                                          <Clock size={10} className="mr-1 inline" /> {deadlineInfo.label}
                                        </Badge>
                                      </div>
                                      
                                      <a 
                                        href={`/kasir/spk/${item.invoice_no}`} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-slate-400 hover:text-white transition-colors cursor-pointer" 
                                        title="Lihat Detail SPK"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink size={14} />
                                      </a>
                                    </div>

                                    <div>
                                      <h3 className="font-black text-lg text-white leading-tight mb-1">{item.umkm_name}</h3>
                                      <p className="font-mono text-xs text-purple-300">{item.invoice_no}</p>
                                    </div>

                                    <div className="space-y-1.5 mt-2">
                                      {item.items?.map((pkg) => (
                                        <div key={pkg.id} className="text-xs bg-black/30 p-2 rounded border border-white/5 group-hover:border-white/10 transition-colors">
                                          <div className="font-semibold text-slate-200">{pkg.nama_kemasan}</div>
                                          <div className="text-slate-400 flex justify-between mt-1">
                                            <span>{pkg.jenis_kemasan}</span>
                                            <span className="text-emerald-400 font-bold">{pkg.qty} Pcs</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Tombol yang memicu Custom Modal */}
                                    {columnId !== 'Menunggu' && (
                                      <div className="pt-3 flex justify-end">
                                        <Button 
                                          size="sm" 
                                          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold w-full shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                                          onClick={() => setConfirmModalData(item)}
                                          onPointerDown={(e) => e.stopPropagation()}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          <Send size={14} className="mr-1.5" /> Kirim Desain ke Mesin
                                        </Button>
                                      </div>
                                    )}

                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
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

      {/* POPUP KONFIRMASI CUSTOM YANG MENARIK (DARK THEME) */}
      <Dialog open={!!confirmModalData} onOpenChange={(open) => !open && setConfirmModalData(null)}>
        <DialogContent className="sm:max-w-md bg-slate-900 border border-white/10 text-slate-100 shadow-2xl shadow-emerald-900/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400 text-xl">
              <Send size={22} /> Konfirmasi Pengiriman Desain
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm pt-2">
              Apakah Anda yakin desain kemasan untuk UMKM <b className="text-white text-base">{confirmModalData?.umkm_name}</b> sudah 100% final dan siap cetak?
              <br/><br/>
              <span className="bg-amber-900/40 text-amber-300 p-2 rounded-md block border border-amber-900/50">
                ⚠️ Pastikan semua file mentah (Corel/AI/PDF) telah disimpan atau diunggah ke folder cetak bersama!
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 w-full sm:w-auto" 
              onClick={() => setConfirmModalData(null)} 
              disabled={isUpdating}
            >
              Batal & Cek Ulang
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 font-bold w-full sm:w-auto gap-2" 
              onClick={executeSelesaiDesain} 
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Ya, Kirim ke Operator Mesin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}