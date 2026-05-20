import { useEffect, useState, useRef } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';

const sections = [
  { id: 'hero', label: 'Ana Sayfa' },
  { id: 'philosophy', label: 'Hakkımızda' },
  { id: 'services', label: 'Hizmetler' },
  { id: 'ai-assistant', label: 'AI Asistan' },
  { id: 'showcase', label: 'Projeler' },
  { id: 'sustainability', label: 'Sürdürülebilirlik' },
  { id: 'contact', label: 'İletişim' },
];

interface NavigationProps {
  onOpenRenovation?: () => void;
}

export default function Navigation({ onOpenRenovation }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);

      // Determine active section
      let current = 'hero';
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            current = section.id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-bg-concrete/90 backdrop-blur-md py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => scrollToSection('hero')}>
          <Logo />
        </button>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`font-raleway text-xs tracking-widest uppercase transition-colors duration-300 ${
                activeSection === s.id
                  ? 'text-accent-blue'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
          {onOpenRenovation && (
            <button
              onClick={() => { onOpenRenovation(); setMobileOpen(false); }}
              className="font-raleway text-xs tracking-widest uppercase text-accent-blue hover:text-white transition-colors duration-300 flex items-center gap-1.5"
            >
              <Sparkles size={12} />
              Simülasyon
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-text-inverse"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-bg-concrete/95 backdrop-blur-md py-6 px-6 flex flex-col gap-4">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`font-raleway text-sm tracking-widest uppercase text-left transition-colors duration-300 ${
                activeSection === s.id
                  ? 'text-accent-blue'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
          {onOpenRenovation && (
            <button
              onClick={() => { onOpenRenovation(); setMobileOpen(false); }}
              className="font-raleway text-sm tracking-widest uppercase text-left text-accent-blue hover:text-white transition-colors duration-300 flex items-center gap-2"
            >
              <Sparkles size={14} />
              Tadilat Simülasyonu
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
