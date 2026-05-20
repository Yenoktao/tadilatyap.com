import { useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Navigation from './sections/Navigation';
import Hero from './sections/Hero';
import Philosophy from './sections/Philosophy';
import Services from './sections/Services';
import AIHizmet from './sections/AIHizmet';
import Showcase from './sections/Showcase';
import Sustainability from './sections/Sustainability';
import Contact from './sections/Contact';
import Footer from './sections/Footer';
import RenovationModal from './sections/RenovationModal';

// gsap.registerPlugin(ScrollTrigger); // DEBUG disabled

function App() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [renovationOpen, setRenovationOpen] = useState(false);

  return (
    <div ref={mainRef} className="relative">
      <Navigation onOpenRenovation={() => setRenovationOpen(true)} />
      <Hero onOpenRenovation={() => setRenovationOpen(true)} />
      <Philosophy />
      <Services />
      <AIHizmet />
      <Showcase />
      <Sustainability />
      <Contact />
      <Footer />
      <RenovationModal isOpen={renovationOpen} onClose={() => setRenovationOpen(false)} />
    </div>
  );
}

export default App;
