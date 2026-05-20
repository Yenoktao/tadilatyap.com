import { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';

const images = [
  '/assets/hero-1.jpg',
  '/assets/hero-2.jpg',
  '/assets/hero-3.jpg',
  '/assets/hero-4.jpg',
];

interface HeroProps {
  onOpenRenovation: () => void;
}

export default function Hero({ onOpenRenovation }: HeroProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const velocityRef = useRef(0.6);
  const targetVelocityRef = useRef(0.6);
  const positionRef = useRef(0);
  const rafRef = useRef<number>(0);
  const scrollBufferRef = useRef(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    let loaded = 0;
    const total = images.length;
    images.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === total) setImagesLoaded(true);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === total) setImagesLoaded(true);
      };
      img.src = src;
    });
  }, []);

  // Entrance animations
  useEffect(() => {
    if (!imagesLoaded) return;

    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(
      headlineRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    )
      .fromTo(
        subRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      )
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      );

    return () => { tl.kill(); };
  }, [imagesLoaded]);

  // Infinite scroll animation
  const animate = useCallback(() => {
    if (!stripRef.current) return;

    // Lerp velocity toward target
    velocityRef.current += (targetVelocityRef.current - velocityRef.current) * 0.04;

    positionRef.current -= velocityRef.current;

    // Get strip width for seamless looping
    const strip = stripRef.current;
    const stripWidth = strip.scrollWidth / 2;

    // Reset position for seamless loop
    if (Math.abs(positionRef.current) >= stripWidth) {
      positionRef.current = positionRef.current % stripWidth;
    }

    strip.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Scroll hijacking - map wheel delta to filmstrip velocity
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      // Map scroll delta to velocity (max 8px/frame)
      const delta = Math.abs(e.deltaY);
      const speedBoost = Math.min(delta * 0.15, 8);
      targetVelocityRef.current = 0.6 + speedBoost;

      // Scroll buffer before allowing page scroll
      scrollBufferRef.current += delta;

      // Decelerate back to base speed
      setTimeout(() => {
        targetVelocityRef.current = 0.6;
      }, 120);

      // Only scroll page after buffer threshold
      if (scrollBufferRef.current > 150) {
        window.scrollBy(0, e.deltaY * 0.5);
      }
    };

    const heroEl = document.getElementById('hero');
    if (heroEl) {
      heroEl.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (heroEl) {
        heroEl.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative w-full h-screen overflow-hidden bg-bg-dark"
    >
      {/* Filmstrip */}
      <div
        ref={stripRef}
        className="absolute top-0 left-0 flex h-full will-change-transform"
        style={{ width: 'max-content' }}
      >
        {/* Double the images for seamless loop */}
        {[...images, ...images].map((src, i) => (
          <div
            key={i}
            className="h-full flex-shrink-0"
            style={{ width: '50vw', minWidth: '600px' }}
          >
            <img
              src={src}
              alt={`Mimari tadilat ${(i % images.length) + 1}`}
              className="w-full h-full object-cover"
              loading={i < images.length ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Left gradient overlay for text legibility */}
      <div
        className="absolute top-0 left-0 h-full w-[65%] z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, transparent 100%)',
        }}
      />

      {/* Edge masks to hide the seam */}
      <div
        className="absolute top-0 left-0 h-full w-16 z-20 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, #111111, transparent)',
        }}
      />
      <div
        className="absolute top-0 right-0 h-full w-16 z-20 pointer-events-none"
        style={{
          background:
            'linear-gradient(to left, #111111, transparent)',
        }}
      />

      {/* Content */}
      <div className="absolute top-0 left-0 h-full w-full z-30 flex flex-col justify-center px-6 md:px-12 lg:px-20">
        <div className="max-w-3xl">
          <h1
            ref={headlineRef}
            className="font-raleway font-bold text-white uppercase text-5xl md:text-7xl lg:text-[8vw] leading-[1.1] tracking-tight opacity-0"
          >
            Yapıdan
            <br />
            Tasarıma
          </h1>
          <p
            ref={subRef}
            className="font-raleway text-white/80 text-base md:text-lg mt-6 max-w-xl leading-relaxed opacity-0"
          >
            Mimari tadilat ve iç mekan dönüşümünde 15 yıllık uzmanlık. Yapay
            zeka destekli analiz ve ustalıkla işleyen çözümler.
          </p>
          <button
            ref={ctaRef}
            onClick={onOpenRenovation}
            className="mt-8 px-8 py-4 bg-accent-blue text-bg-dark font-raleway font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-white transition-colors duration-300 opacity-0"
          >
            Tadilata Başla
          </button>
        </div>
      </div>
    </section>
  );
}
