import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    title: 'Loft Dönüşümü',
    location: 'Bebek, İstanbul',
    image: '/assets/project-1.jpg',
    category: 'Konut',
  },
  {
    title: 'Ofis Yenileme',
    location: 'Levent, İstanbul',
    image: '/assets/project-2.jpg',
    category: 'Ticari',
  },
  {
    title: 'Villa Restorasyonu',
    location: 'Yalıkavak, Bodrum',
    image: '/assets/project-3.jpg',
    category: 'Villa',
  },
  {
    title: 'Tarihi Yapı',
    location: 'Galata, İstanbul',
    image: '/assets/project-4.jpg',
    category: 'Restorasyon',
  },
];

function ProjectCard({
  project,
}: {
  project: (typeof projects)[0];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 15, y: -x * 15 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className="project-card group relative overflow-hidden rounded-lg cursor-pointer"
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.3s ease-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isHovered ? 'scale-110 saturate-100' : 'scale-100 saturate-[0.3]'
          }`}
          loading="lazy"
        />
      </div>

      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-bg-dark/80 via-transparent to-transparent transition-opacity duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-70'
        }`}
      />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <span className="font-raleway text-accent-blue text-xs tracking-widest uppercase">
          {project.category}
        </span>
        <h3 className="font-raleway font-bold text-white text-xl md:text-2xl mt-2 uppercase tracking-tight">
          {project.title}
        </h3>
        <p className="font-raleway text-white/60 text-sm mt-1">
          {project.location}
        </p>
      </div>

      {/* Hover border glow */}
      <div
        className={`absolute inset-0 border-2 border-accent-blue/0 rounded-lg transition-all duration-500 ${
          isHovered ? 'border-accent-blue/40' : ''
        }`}
      />
    </div>
  );
}

export default function Showcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;

    if (!section || !heading) return;

    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        heading,
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

      // Cards stagger
      const cards = section.querySelectorAll('.project-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative w-full py-[15vh] bg-white overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <h2
          ref={headingRef}
          className="font-raleway font-bold text-text-primary text-4xl md:text-5xl uppercase tracking-tight mb-16 opacity-0"
        >
          Projelerimiz
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {projects.map((project, i) => (
            <ProjectCard key={i} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
