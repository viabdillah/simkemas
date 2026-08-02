import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import AnimatedNetworkBg from "@/components/ui/AnimatedNetworkBg";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  // State lokal untuk form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Ambil state dan action dari Zustand
  const { login, isLoading, error } = useAuthStore();

  // Handler saat form disubmit
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!username || !password) return; 
    
    await login(username, password);
  };

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-900 bg-[url('/bg-login.png')] bg-cover bg-center bg-no-repeat"
    >
      {/* Lapisan Filter Gelap + Blur Ringan pada Background Gambar */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] z-0" />

      {/* Animasi Jaring Network */}
      <AnimatedNetworkBg />

      {/* Layer Utama Form & Footer */}
      <div className="relative group w-full max-w-md p-4 z-10 flex flex-col items-center">
        
        {/* Layer Gradient Glow di Belakang Card */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 group-hover:opacity-50 blur-lg transition-opacity duration-500 animate-gradient bg-[length:200%_200%] -z-10 m-3" />

        {/* Card Login Transparan (Glassmorphism) */}
        <Card className="w-full bg-white/50 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl">
          <CardHeader className="text-center space-y-2 pb-6 pt-8">
            <CardTitle className="text-4xl font-black text-slate-800 tracking-tight">SIMKEMAS</CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Sistem Informasi Manajemen Kemasan
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pb-8">
              <div className="space-y-1">
                <Input 
                  type="text" 
                  placeholder="Username" 
                  className="bg-white/60 border-slate-300/70 focus-visible:ring-blue-500 h-11 text-slate-800 placeholder:text-slate-400 font-medium"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="relative space-y-1">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Kata Sandi" 
                  className="bg-white/60 border-slate-300/70 pr-10 focus-visible:ring-blue-500 h-11 text-slate-800 placeholder:text-slate-400 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none disabled:opacity-50 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-md">
                  <p className="text-sm text-red-600 text-center font-medium">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-500/25 active:scale-[0.99]"
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk Sistem"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* Footer Copyright & Developer Identity */}
        <footer className="mt-6 text-center text-xs text-slate-300/80 space-y-1">
          <p>© {new Date().getFullYear()} SIMKEMAS. All rights reserved.</p>
          <p className="font-medium text-slate-200/90">
            Dev by: <span className="text-blue-400 font-bold">xvbdllh💔</span>
          </p>
        </footer>

      </div>
    </div>
  );
}