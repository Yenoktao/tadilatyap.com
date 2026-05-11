import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 78, suffix: '%', label: 'Geri Dönüştürülmüş Malzeme' },
  { value: 45, suffix: '%', label: 'Enerji Tasarrufu' },
  { value: 0, suffix: '', label: 'Atık Politikası' },
];

function SlotNumber({
  target,
  suffix,
  trigger,
}: {
  target: number;
  suffix: string;
  trigger: boolean;
}) {
  const [display, setDisplay] = useState('00');

  useEffect(() => {
    if (!trigger) {
      setDisplay('00');
      return;
    }

    let iterations = 0;
    const maxIterations = 25;
    const interval = setInterval(() => {
      if (iterations >= maxIterations) {
        setDisplay(`${target}${suffix}`);
        clearInterval(interval);
        return;
      }

      const scrambled = Math.floor(Math.random() * 100);
      setDisplay(`${scrambled}${suffix}`);
      iterations++;
    }, 40);

    return () => clearInterval(interval);
  }, [trigger, target, suffix]);

  return (
    <span className="font-raleway font-black text-5xl md:text-7xl text-accent-blue tabular-nums">
      {display}
    </span>
  );
}

function IsometricBar({
  height,
  delay,
  trigger,
}: {
  height: number;
  delay: number;
  trigger: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current || !trigger) return;

    gsap.fromTo(
      barRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 1.2,
        delay: delay,
        ease: 'elastic.out(1, 0.5)',
      }
    );
  }, [trigger, delay]);

  return (
    <div
      className="relative mx-2"
      style={{
        transform: 'rotateX(60deg) rotateZ(-45deg)',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        ref={barRef}
        className="w-12 md:w-16 bg-accent-blue origin-bottom"
        style={{
          height: `${height}px`,
          transform: 'scaleY(0)',
          boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
        }}
      />
      {/* Top face */}
      <div
        className="absolute top-0 left-0 w-full bg-white/20"
        style={{
          height: '100%',
          transform: 'translateZ(12px)',
        }}
      />
      {/* Side face */}
      <div
        className="absolute top-0 left-0 bg-white/10"
        style={{
          width: '12px',
          height: `${height}px`,
          transform: 'rotateY(90deg) translateZ(6px)',
          transformOrigin: 'left',
        }}
      />
    </div>
  );
}

export default function Sustainability() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        onEnter: () => setIsActive(true),
        onLeaveBack: () => setIsActive(false),
      });

      // Heading animation
      gsap.fromTo(
        section.querySelector('.sustain-heading'),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
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
      id="sustainability"
      ref={sectionRef}
      className="relative w-full py-[15vh] bg-bg-concrete overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <h2 className="sustain-heading font-raleway font-bold text-white text-4xl md:text-5xl uppercase tracking-tight mb-16 opacity-0">
          Sürdürülebilir Yapı
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* 3D Isometric Bar Chart */}
          <div className="flex justify-center items-end h-64 md:h-80 perspective-[800px]">
            <div className="flex items-end">
              <IsometricBar height={200} delay={0} trigger={isActive} />
              <IsometricBar height={140} delay={0.2} trigger={isActive} />
              <IsometricBar height={80} delay={0.4} trigger={isActive} />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-12">
            {stats.map((stat, i) => (
              <div key={i} className="border-l-2 border-white/10 pl-6">
                <SlotNumber
                  target={stat.value}
                  suffix={stat.suffix}
                  trigger={isActive}
                />
                <p className="font-raleway text-white/60 text-sm mt-2 uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
