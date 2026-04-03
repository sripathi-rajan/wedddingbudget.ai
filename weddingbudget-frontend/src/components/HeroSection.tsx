"use client";
import { useAnimation } from '../hooks/useAnimation';

export default function HeroSection() {
  const { containerRef, bgRef, midRef, particlesRef, textRef } = useAnimation();

  return (
    <section ref={containerRef} className="relative w-full h-[150vh] overflow-hidden bg-dark-900">
      {/* 1. Background Layer (Animated Gradient/Soft Light) */}
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-[120%] bg-gradient-to-br from-dark-800 via-[#1f1614] to-dark-900"
        style={{ backgroundSize: "200% 200%" }}
      >
        {/* Soft radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-champagne/10 via-transparent to-transparent opacity-60"></div>
      </div>

      {/* 2. Mid Visual Layer (Blur/Glass shapes moving slowly) */}
      <div ref={midRef} className="absolute inset-0 w-full h-full flex items-center justify-center mix-blend-screen pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-champagne/10 to-blush/10 blur-[120px] opacity-70"></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-champagne/5 blur-[100px] opacity-50"></div>
      </div>

      {/* 3. Particle Layer */}
      <div ref={particlesRef} className="absolute inset-0 w-full h-full pointer-events-none">
        {[...Array(25)].map((_, i) => {
          // pre-calculate random values for initial rendering to ease hydration
          const size = Math.random() * 4 + 2;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          return (
            <div 
              key={i} 
              className="absolute rounded-full bg-champagne/40 shadow-[0_0_10px_rgba(247,231,206,0.5)]"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${top}%`,
                left: `${left}%`,
              }}
            />
          );
        })}
      </div>

      {/* 4. Foreground UI Sticky Container (Scrolls within the 150vh area) */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center pointer-events-auto">
        <div ref={textRef} className="text-center z-10 px-4">
          <h2 className="text-champagne/80 tracking-[0.3em] uppercase text-xs md:text-sm mb-6 font-medium">A Cinematic Journey</h2>
          
          <h1 className="text-ivory font-serif text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-tight mb-8 drop-shadow-2xl">
            Where Your <br />
            <span className="italic text-champagne font-serif">Forever</span> Begins
          </h1>
          
          <p className="text-ivory/60 max-w-lg mx-auto text-sm md:text-base font-light tracking-wide mb-12">
            Experience the art of luxury wedding planning. <br/> Every detail, meticulously crafted in motion.
          </p>
          
          <button className="group relative px-8 py-4 bg-transparent border border-champagne/30 text-champagne rounded-full overflow-hidden transition-all duration-500 hover:border-champagne hover:scale-105 shadow-[0_0_0_rgba(247,231,206,0)] hover:shadow-[0_0_30px_rgba(247,231,206,0.15)]">
            <span className="relative z-10 tracking-[0.2em] text-xs uppercase font-medium">Enter Experience</span>
            <div className="absolute inset-0 bg-champagne/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
          </button>
        </div>
      </div>
    </section>
  );
}
