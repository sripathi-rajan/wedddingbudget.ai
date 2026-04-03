import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const useAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Initial Timeline (Cinematic entrance)
      const tl = gsap.timeline();
      
      tl.from(bgRef.current, { autoAlpha: 0, scale: 1.1, duration: 2, ease: "power3.out" })
        .from(midRef.current, { autoAlpha: 0, scale: 1.05, duration: 2, ease: "power3.out" }, "-=1.5")
        .from(textRef.current?.children || [], { 
          y: 40, 
          autoAlpha: 0, 
          duration: 1.5, 
          stagger: 0.2, 
          ease: "expo.out" 
        }, "-=1")
        .from(particlesRef.current, { autoAlpha: 0, duration: 2 }, "-=1");

      // 2. Continuous Motion System (yoyo loops)
      gsap.to(bgRef.current, {
        backgroundPosition: "100% 100%",
        duration: 25,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(midRef.current, {
        y: "-20px",
        x: "15px",
        rotation: 2,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      if (particlesRef.current) {
        Array.from(particlesRef.current.children).forEach((particle: Element) => {
          gsap.to(particle, {
            y: `-${Math.random() * 40 + 20}px`,
            x: `${Math.random() * 20 - 10}px`,
            rotation: Math.random() * 45,
            duration: Math.random() * 4 + 4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: Math.random() * 2
          });
        });
      }

      // 3. ScrollTrigger Parallax
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        }
      });

      scrollTl.to(bgRef.current, { y: "15%", ease: "none" }, 0)
              .to(midRef.current, { y: "30%", scale: 1.1, opacity: 0.4, ease: "none" }, 0)
              .to(textRef.current, { y: "50%", scale: 0.95, opacity: 0, ease: "none" }, 0)
              .to(particlesRef.current, { y: "-20%", ease: "none" }, 0); // particles float up faster relative to scroll

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return { containerRef, bgRef, midRef, particlesRef, textRef };
};
