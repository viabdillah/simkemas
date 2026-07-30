import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Tambah Loader2 buat animasi loading
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // State lokal untuk form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Ambil state dan action dari Zustand
  const { login, isLoading, error } = useAuthStore();

  const handleMouseMove = (e) => {
    const x = (e.clientX - window.innerWidth / 2) / 25;
    const y = (e.clientY - window.innerHeight / 2) / 25;
    setMousePos({ x, y });
  };

  // Handler saat form disubmit
  const handleSubmit = async (e) => {
    e.preventDefault(); // Cegah halaman ke-refresh murni
    if (!username || !password) return; // Cegah submit kalau kosong
    
    await login(username, password);
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-50"
      onMouseMove={handleMouseMove}
    >
      {/* Background Parallax */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-transform duration-200 ease-out"
        style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-transform duration-200 ease-out"
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      />

      <div className="relative group w-full max-w-md p-4 z-10">
        {/* Layer Gradient Border */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-75 blur-md transition-opacity duration-500 animate-gradient bg-[length:200%_200%] -z-10 m-3" />

        <Card className="w-full bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-bold text-primary tracking-tight">SIMKEMAS</CardTitle>
            <CardDescription className="text-slate-500">
              Sistem Informasi Manajemen Kemasan
            </CardDescription>
          </CardHeader>
          
          {/* Bungkus form untuk aksesibilitas (bisa tekan Enter) */}
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <Input 
                  type="text" 
                  placeholder="Username" 
                  className="bg-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="relative space-y-1">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Kata Sandi" 
                  className="bg-white pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Tampilkan pesan error jika ada */}
              {error && (
                <p className="text-sm text-red-500 text-center font-medium">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full cursor-pointer mt-4"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}