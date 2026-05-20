import { useEffect, useRef, useCallback } from 'react';

export default function Footer() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const velocityRef = useRef(2);
  const targetVelocityRef = useRef(2);
  const positionRef = useRef(0);
  const rafRef = useRef<number>(0);

  const text = 'TASARIM + İNŞAAT + TADİLAT + YAPI + MİMARİ + ';
  const repeatedText = text.repeat(6);

  const animate = useCallback(() => {
    if (!marqueeRef.current) return;

    // Lerp velocity toward target
    velocityRef.current +=
      (targetVelocityRef.current - velocityRef.current) * 0.04;

    positionRef.current -= velocityRef.current;

    // Get width for seamless looping
    const marquee = marqueeRef.current;
    const textWidth = marquee.scrollWidth / 6;

    if (Math.abs(positionRef.current) >= textWidth) {
      positionRef.current = positionRef.current % textWidth;
    }

    marquee.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Map scroll delta to marquee velocity
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const delta = Math.abs(window.scrollY - lastScrollY);
          const speedBoost = Math.min(delta * 2, 40);
          targetVelocityRef.current = 2 + speedBoost;
          lastScrollY = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }

      // Decelerate back to base speed
      setTimeout(() => {
        targetVelocityRef.current = 2;
      }, 1000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className="relative w-full bg-bg-primary overflow-hidden">
      {/* Kinetic Typography Loop */}
      <div className="py-8 md:py-12 overflow-hidden border-t border-gray-200">
        <div
          ref={marqueeRef}
          className="whitespace-nowrap will-change-transform"
        >
          <span className="font-raleway font-black text-[15vw] md:text-[20vw] text-text-primary uppercase tracking-tight">
            {repeatedText}
          </span>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="bg-bg-dark py-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-raleway text-white/40 text-xs tracking-widest uppercase">
            © 2025 tadilatyap.com. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-8">
            <a
              href="#"
              className="font-raleway text-white/40 text-xs tracking-widest uppercase hover:text-white transition-colors duration-300"
            >
              Gizlilik
            </a>
            <a
              href="#"
              className="font-raleway text-white/40 text-xs tracking-widest uppercase hover:text-white transition-colors duration-300"
            >
              Kullanım Koşulları
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
