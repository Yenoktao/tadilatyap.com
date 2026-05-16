import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    const image = imageRef.current;
    const grid = gridRef.current;
    const heading = headingRef.current;
    const body = bodyRef.current;

    if (!section || !text || !image || !grid || !heading || !body) return;

    // Create context for cleanup
    const ctx = gsap.context(() => {
      // Parallax effect - multiplane
      gsap.to(text, {
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to(image, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to(grid, {
        y: -120,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });

      // Diagonal clip-path animation
      gsap.fromTo(
        image,
        { clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)' },
        {
          clipPath: 'polygon(0% 0, 100% 0, 100% 100%, 0% 100%)',
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            end: 'center center',
            scrub: 1,
          },
        }
      );

      // Text reveal
      gsap.fromTo(
        heading,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        body,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="philosophy"
      ref={sectionRef}
      className="relative w-full py-[15vh] bg-bg-primary overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-[70vh]">
          {/* Text Block */}
          <div ref={textRef} className="relative z-10 lg:pr-12">
            <h2
              ref={headingRef}
              className="font-raleway font-bold text-text-primary text-4xl md:text-5xl lg:text-[5.2rem] leading-[1.1] uppercase opacity-0"
            >
              Mimari
              <br />
              Tadilatın
              <br />
              Yeni
              <br />
              Standardı
            </h2>
            <p
              ref={bodyRef}
              className="font-raleway text-text-primary/80 text-base md:text-lg mt-8 max-w-md leading-relaxed opacity-0"
            >
              Yapısal bütünlüğü estetik mükemmelle buluşturan bir süreç. Tüm
              projelerimizde malzeme bilimi, statik hesaplama ve 3B modelleme
              teknolojilerini bir araya getiriyoruz.
            </p>
          </div>

          {/* Image Block with Diagonal Clip */}
          <div className="relative">
            <div
              ref={imageRef}
              className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden"
              style={{
                clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0% 100%)',
              }}
            >
              <img
                src="/assets/philosophy.jpg"
                alt="Mimari iç mekan tasarımı"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Blueprint Grid Overlay */}
            <div
              ref={gridRef}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
