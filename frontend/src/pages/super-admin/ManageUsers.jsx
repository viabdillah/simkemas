import { useState, useEffect } from 'react';
import { VALID_ROLES } from '@simkemas/shared';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, Loader2, RefreshCw, ShieldCheck, Eye, EyeOff, Edit, Trash2,
} from 'lucide-react';

export default function ManageUsers() {
  const { user: currentUser } = useAuthStore(); 
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [deleteUser, setDeleteUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsersFromAPI = async () => {
    const res = await fetch('/api/users');
    const result = await res.json();
    if (!res.ok || !result.ok) throw new Error(result.error || "Gagal memuat daftar pengguna");
    return result.data.users;
  };

  useEffect(() => {
    fetchUsersFromAPI()
      .then((data) => setUsers(data))
      .catch((err) => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchUsersFromAPI()
      .then((data) => setUsers(data))
      .catch((err) => {
        console.error(err);
        toast.error(err.message);
      })
      .finally(() => setIsLoading(false));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!username || !password || !role) return toast.warning("Mohon lengkapi form");

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(result.data.message);
        setUsername(''); setPassword(''); setRole(''); setShowPassword(false);
        setIsDialogOpen(false);
        handleRefresh(); 
      } else {
        toast.error("Gagal mendaftarkan", { description: result.error });
      }
    } catch (err) {
      console.error("Create User Error:", err);
      toast.error("Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(result.data.message);
        setEditUser(null);
        handleRefresh();
      } else {
        toast.error("Gagal mengubah role", { description: result.error });
      }
    } catch (err) {
      console.error("Edit Role Error:", err);
      toast.error("Terjadi kesalahan pada server");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSoftDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, { method: 'DELETE' });
      const result = await res.json();

      if (res.ok && result.ok) {
        toast.success(result.data.message);
        setDeleteUser(null);
        handleRefresh();
      } else {
        toast.error("Gagal menghapus pengguna", { description: result.error });
      }
    } catch (err) {
      console.error("Delete User Error:", err);
      toast.error("Terjadi kesalahan pada server");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (roleName) => {
    switch (roleName) {
      case 'Super Administrasi': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Manajer': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Kasir': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Desainer': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'Operator Mesin': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Operator Packaging': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800 relative">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Page Content: Manage Users */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="text-primary" size={28} /> Manajemen Pengguna
                </h1>
                <p className="text-slate-500 text-sm mt-1">Daftarkan dan atur hak akses akun karyawan.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="cursor-pointer">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                </Button>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="cursor-pointer gap-2"><UserPlus size={18} /> Tambah Pengguna</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                      <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                      <DialogDescription>Isi data kredensial dan pilih role akun karyawan.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Username</label>
                        <Input placeholder="Contoh: kasir_budi" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isSubmitting} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Kata Sandi Awal</label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            tabIndex="-1"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Role Akses</label>
                        <Select value={role} onValueChange={setRole} disabled={isSubmitting}>
                          <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                          <SelectContent className="bg-white z-50">
                            {VALID_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting} className="cursor-pointer">Batal</Button>
                        <Button type="submit" disabled={isSubmitting || !username || !password || !role} className="cursor-pointer">
                          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Daftarkan Account"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-800">Daftar Akun Teraktif</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">Belum ada data pengguna.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/80">
                        <TableRow>
                          <TableHead className="w-[80px]">No</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Role / Peran</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u, idx) => (
                          <TableRow key={u.id} className="hover:bg-slate-50/50">
                            <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>
                            <TableCell className="font-bold text-slate-800">{u.username}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`font-semibold border ${getRoleBadgeVariant(u.role)}`}>{u.role}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" size="sm" className="hover:bg-blue-50 cursor-pointer"
                                  onClick={() => { setEditUser(u); setEditRole(u.role); }}
                                  disabled={u.id === currentUser?.id}
                                  title={u.id === currentUser?.id ? "Tidak bisa mengubah role sendiri" : "Ubah Role"}
                                >
                                  <Edit size={14} className={u.id === currentUser?.id ? "text-slate-300" : "text-blue-600"} />
                                </Button>
                                <Button 
                                  variant="outline" size="sm" className="hover:bg-red-50 border-red-100 cursor-pointer"
                                  onClick={() => setDeleteUser(u)}
                                  disabled={u.id === currentUser?.id}
                                  title={u.id === currentUser?.id ? "Tidak bisa menghapus akun sendiri" : "Nonaktifkan Akun"}
                                >
                                  <Trash2 size={14} className={u.id === currentUser?.id ? "text-slate-300" : "text-red-600"} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal Edit Role */}
            <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
              <DialogContent className="sm:max-w-sm bg-white">
                <DialogHeader>
                  <DialogTitle>Ubah Role Pengguna</DialogTitle>
                  <DialogDescription>Ganti hak akses untuk pengguna <b>{editUser?.username}</b>.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                  <Select value={editRole} onValueChange={setEditRole} disabled={isEditing}>
                    <SelectTrigger className="w-full bg-white"><SelectValue placeholder="Pilih Role" /></SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {VALID_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditUser(null)} disabled={isEditing} className="cursor-pointer">Batal</Button>
                    <Button type="submit" disabled={isEditing || editRole === editUser?.role} className="cursor-pointer">
                      {isEditing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Menyimpan</> : "Simpan Perubahan"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Soft Delete */}
            <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
              <DialogContent className="sm:max-w-sm bg-white border-red-100">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2">
                    <Trash2 size={20} /> Konfirmasi Hapus
                  </DialogTitle>
                  <DialogDescription className="pt-2 text-slate-600">
                    Apakah Anda yakin ingin menonaktifkan pengguna <b>{deleteUser?.username}</b>? 
                    Mereka tidak akan bisa lagi login ke dalam sistem.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setDeleteUser(null)} disabled={isDeleting} className="cursor-pointer">Batal</Button>
                  <Button type="button" variant="destructive" onClick={handleSoftDelete} disabled={isDeleting} className="cursor-pointer">
                    {isDeleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Memproses</> : "Ya, Nonaktifkan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </main>
      </div>
    </div>
  );
}