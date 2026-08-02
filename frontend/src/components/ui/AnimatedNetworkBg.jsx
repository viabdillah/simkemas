import { useEffect, useRef } from 'react';

export default function AnimatedNetworkBg() {
  const canvasRef = useRef(null);
  
  // 🛡️ Gunakan useRef untuk menyimpan posisi mouse agar tidak memicu re-render
  // default: null (mouse dianggap di luar layar)
  const mouseRef = useRef({ x: null, y: null, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    // --- Konfigurasi Fisika ---
    const config = {
      particleColor: 'rgba(255, 255, 255, 0.7)',
      lineColor: 'rgba(255, 255, 255,', // Transparansi diatur dinamis nanti
      particleBaseRadius: 1.5,
      connectionDist: 150, // Jarak maksimal garis antar titik
      mouseDist: 200,      // Jarak maksimal mouse mempengaruhi titik
      mouseGravity: 0.05,  // Kekuatan tarikan mouse (semakin besar semakin kuat)
      baseSpeed: 0.8,     // Kecepatan gerak dasar (saat tidak ada mouse)
      friction: 0.99,      // Gesekan untuk memperlambat tarikan mouse kembali ke normal
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 9000); 
      for (let i = 0; i < numParticles; i++) {
        const radius = Math.random() * 2 + config.particleBaseRadius;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // Kecepatan awal (base movement)
          vx: (Math.random() - 0.5) * config.baseSpeed, 
          vy: (Math.random() - 0.5) * config.baseSpeed, 
          originalVx: (Math.random() - 0.5) * config.baseSpeed, // Simpan kecepatan asli
          originalVy: (Math.random() - 0.5) * config.baseSpeed,
          radius: radius,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 🧠 1. Perhitungan Interaksi Mouse (Smooth Following)
        if (mouse.active && mouse.x !== null) {
          const dxMouse = p.x - mouse.x;
          const dyMouse = p.y - mouse.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

          // Jika titik berada di dalam radius pengaruh mouse
          if (distMouse < config.mouseDist) {
            // Hitung kekuatan tarikan (semakin dekat semakin kuat, tapi smooth)
            const force = (config.mouseDist - distMouse) / config.mouseDist;
            
            // Ubah kecepatan titik perlahan ke arah mouse
            p.vx -= (dxMouse / distMouse) * force * config.mouseGravity;
            p.vy -= (dyMouse / distMouse) * force * config.mouseGravity;
          }
        }

        // 🌿 2. Kembalikan kecepatan ke Normal perlahan (Friction/Damping)
        // Ini memastikan titik terus bergerak walau mouse diam/pergi
        p.vx = p.vx * config.friction + p.originalVx * (1 - config.friction);
        p.vy = p.vy * config.friction + p.originalVy * (1 - config.friction);

        // 🚀 3. Update Posisi berdasarkan Kecepatan Baru
        p.x += p.vx;
        p.y += p.vy;

        // Pantulkan jika menyentuh ujung layar
        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -1; p.originalVx *= -1;
        }
        if (p.y < 0 || p.y > canvas.height) {
          p.vy *= -1; p.originalVy *= -1;
        }

        // 🎨 4. Gambar Titik
        ctx.fillStyle = config.particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // 📏 5. Gambar Garis (Jaring-jaring)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < config.connectionDist) {
            ctx.beginPath();
            // Opacity garis memudar sesuai jarak
            const opacity = 1 - (distance / config.connectionDist);
            ctx.strokeStyle = `${config.lineColor} ${opacity * 0.3})`; 
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        
        // ⚡ OPTIONAL: Gambar garis dari mouse ke titik terdekat (memperkuat efek following)
        if (mouse.active && mouse.x !== null) {
            const dxM = p.x - mouse.x;
            const dyM = p.y - mouse.y;
            const distM = Math.sqrt(dxM * dxM + dyM * dyM);
            if (distM < config.mouseDist) {
                ctx.beginPath();
                const opacityM = 1 - (distM / config.mouseDist);
                ctx.strokeStyle = `${config.lineColor} ${opacityM * 0.15})`; // Garis ke mouse lebih tipis
                ctx.lineWidth = 0.5;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    // --- Event Listeners Mouse ---
    const handleMouseMove = (e) => {
      // Update posisi mouse di ref (tidak mentrigger re-render)
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      // Tandai mouse keluar layar
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', resizeCanvas);
    // Tempelkan listener ke window agar deteksi mouse lebih luas
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    resizeCanvas();
    draw();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}