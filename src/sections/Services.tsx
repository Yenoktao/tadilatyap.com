import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Hammer, Ruler, LayoutGrid, Zap, Paintbrush } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const services = [
  { icon: Hammer, label: 'Yıkım & Hazırlık' },
  { icon: Ruler, label: 'Temel & Strüktür' },
  { icon: LayoutGrid, label: 'Çatı & Karkas' },
  { icon: Zap, label: 'Elektrik & Tesisat' },
  { icon: Paintbrush, label: 'Son Katman & Boya' },
];

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const iconsContainer = iconsRef.current;

    if (!section || !heading || !iconsContainer) return;

    const ctx = gsap.context(() => {
      // Kinetic text expansion - letter-spacing animation
      gsap.fromTo(
        heading,
        { letterSpacing: '-0.2em', opacity: 0.3 },
        {
          letterSpacing: '0.05em',
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'center center',
            scrub: 1.5,
          },
        }
      );

      // Icon stagger reveal
      const iconItems = iconsContainer.querySelectorAll('.service-icon');
      gsap.fromTo(
        iconItems,
        { opacity: 0, y: 40, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative w-full py-[15vh] bg-bg-dark overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Giant Typography */}
        <h2
          ref={headingRef}
          className="font-raleway font-black text-white uppercase text-[12vw] leading-[0.9] tracking-tight whitespace-nowrap"
          style={{ letterSpacing: '-0.2em' }}
        >
          HİZMETLERİMİZ
        </h2>

        {/* Service Icons Row */}
        <div
          ref={iconsRef}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16 md:mt-24"
        >
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={i}
                className="service-icon flex flex-col items-center gap-4 group cursor-default"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-white/20 flex items-center justify-center transition-all duration-500 group-hover:border-accent-blue group-hover:bg-accent-blue/10">
                  <Icon
                    size={28}
                    className="text-white/70 group-hover:text-accent-blue transition-colors duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="font-raleway text-white/60 text-xs tracking-widest uppercase group-hover:text-white transition-colors duration-500">
                  {service.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
