import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import {
  X, Camera, Sparkles, ChevronRight, RefreshCw,
  Check, AlertCircle, ImagePlus, MapPin, Phone,
  Zap, Eye, EyeOff, ChevronLeft, Home, Building, Castle, Briefcase,
  Search
} from 'lucide-react';
import { illerVeIlceler, iller, getMahalleler } from '../data/adres';

interface RenovationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MainPath = null | 'photo' | 'manual';

type Step =
  | 'welcome'
  | 'upload'
  | 'command'
  | 'manualForm'
  | 'analyzing'
  | 'result'
  | 'quiz'
  | 'address'
  | 'lockedPrice';

interface HistoryItem {
  command: string;
  image: string;
  round: number;
}

const resultImages = ['/assets/hero-1.jpg', '/assets/hero-3.jpg', '/assets/hero-4.jpg'];
const isKalemleri = ['Komple Ev', 'Mutfak', 'Banyo', 'Boya & Badana', 'Zemin Döşeme', 'Elektrik', 'Sıhhi Tesisat', 'Kapı & Pencere', 'Isıtma', 'Aydınlatma'];
const istanbulIlceler = illerVeIlceler['İstanbul'] || [];

// ─── Quiz soruları (evet/hayır + çoklu seçim) ───
const quizQuestions = [
  {
    key: 'konutTipi' as const,
    title: 'Konut tipiniz nedir?',
    subtitle: 'Tadilat projenize en uygun kategoriyi seçin',
    multi: false,
    options: [
      { icon: <Home size={24} />, label: 'Daire' },
      { icon: <Building size={24} />, label: 'Müstakil' },
      { icon: <Castle size={24} />, label: 'Villa' },
      { icon: <Briefcase size={24} />, label: 'Ofis' },
    ],
  },
  {
    key: 'metrekare' as const,
    title: 'Eviniz kaç metrekare?',
    subtitle: 'Yaklaşık alan bilgisi yeterli',
    multi: false,
    options: ['0 - 50 m²', '50 - 100 m²', '100 - 150 m²', '150 - 200 m²', '200+ m²'],
  },
  {
    key: 'kat' as const,
    title: 'Eviniz kaçıncı katta?',
    subtitle: 'Bulunduğunuz kat numarası',
    multi: false,
    options: ['Zemin / Giriş Katı', '1 - 3. Kat', '4 - 7. Kat', '8. Kat ve Üzeri'],
  },
  {
    key: 'binaYasi' as const,
    title: 'Bina kaç yıllık?',
    subtitle: 'Binanın yapım yılı hakkında bilgi',
    multi: false,
    options: ['0 - 5 Yıl (Yeni)', '5 - 15 Yıl', '15 - 30 Yıl', '30+ Yıl (Eski)'],
  },
  {
    key: 'tadilatKapsami' as const,
    title: 'Tadilat kapsamınız nedir?',
    subtitle: 'İlgilendiğiniz alanları seçin, birden fazla seçebilirsiniz',
    multi: true,
    options: ['Mutfak', 'Banyo', 'Salon', 'Yatak Odası', 'Elektrik Tesisatı', 'Sıhhi Tesisat', 'Boya & Badana', 'Zemin Döşeme', 'Kapı & Pencere', 'Isıtma Sistemi'],
  },
];

export default function RenovationModal({ isOpen, onClose }: RenovationModalProps) {
  // ─── Flow state ───
  const [step, setStep] = useState<Step>('welcome');
  const [path, setPath] = useState<MainPath>(null);

  // Photo path
  const [photoPreview, setPhotoPreview] = useState('');
  const [command, setCommand] = useState('');

  // Manual path
  const [metrekare, setMetrekare] = useState(50);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [showLocDropdown, setShowLocDropdown] = useState(false);

  // Analysis
  const [progress, setProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);

  // Result
  const [generatedImage, setGeneratedImage] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [kredi, setKredi] = useState(3);
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);

  // Quiz state
  const [quizSubStep, setQuizSubStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({
    konutTipi: '', metrekare: '', kat: '', binaYasi: '', tadilatKapsami: [],
  });

  // Address state (il / ilçe / mahalle)
  const [addr, setAddr] = useState({ il: 'İstanbul', ilce: '', mahalle: '' });
  const [ilSearch, setIlSearch] = useState('');
  const [ilceSearch, setIlceSearch] = useState('');
  const [mahalleSearch, setMahalleSearch] = useState('');
  const [showIlDropdown, setShowIlDropdown] = useState(false);
  const [showIlceDropdown, setShowIlceDropdown] = useState(false);
  const [showMahalleDropdown, setShowMahalleDropdown] = useState(false);
  const [acikAdres, setAcikAdres] = useState('');

  // Locked price
  const [showCallForm, setShowCallForm] = useState(false);
  const [callForm, setCallForm] = useState({ ad: '', telefon: '' });

  // Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ilDropdownRef = useRef<HTMLDivElement>(null);
  const ilceDropdownRef = useRef<HTMLDivElement>(null);
  const mahalleDropdownRef = useRef<HTMLDivElement>(null);

  // ─── Reset ───
  useEffect(() => {
    if (isOpen) {
      setStep('welcome'); setPath(null);
      setPhotoPreview(''); setCommand('');
      setMetrekare(50); setSelectedTags([]); setLocation('');
      setProgress(0); setScanLine(0);
      setGeneratedImage(''); setHistory([]); setKredi(3); setBeforeAfterPos(50);
      setQuizSubStep(0);
      setQuizAnswers({ konutTipi: '', metrekare: '', kat: '', binaYasi: '', tadilatKapsami: [] });
      setAddr({ il: 'İstanbul', ilce: '', mahalle: '' });
      setIlSearch('İstanbul'); setIlceSearch(''); setMahalleSearch('');
      setShowIlDropdown(false); setShowIlceDropdown(false); setShowMahalleDropdown(false);
      setAcikAdres(''); setShowCallForm(false); setCallForm({ ad: '', telefon: '' });
    }
  }, [isOpen]);

  // ─── Entrance ───
  useEffect(() => {
    if (!overlayRef.current || !isOpen) return;
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
  }, [isOpen]);

  // ─── Step transition ───
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(contentRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  }, [step, quizSubStep, showCallForm]);

  // ─── Scanner ───
  useEffect(() => {
    if (step !== 'analyzing') return;
    let frame = 0;
    const iv = setInterval(() => { frame += 1; setScanLine((frame * 2) % 100); }, 20);
    return () => clearInterval(iv);
  }, [step]);

  // ─── Outside click for dropdowns ───
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ilDropdownRef.current && !ilDropdownRef.current.contains(e.target as Node)) setShowIlDropdown(false);
      if (ilceDropdownRef.current && !ilceDropdownRef.current.contains(e.target as Node)) setShowIlceDropdown(false);
      if (mahalleDropdownRef.current && !mahalleDropdownRef.current.contains(e.target as Node)) setShowMahalleDropdown(false);
      // Location dropdown (manual form)
      const locInput = document.getElementById('loc-input');
      const locDropdown = document.getElementById('loc-dropdown');
      if (locInput && locDropdown && !locInput.contains(e.target as Node) && !locDropdown.contains(e.target as Node)) {
        setShowLocDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── File handling ───
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (e) => { setPhotoPreview(e.target?.result as string); setPath('photo'); setStep('command'); };
    reader.readAsDataURL(file);
  }, []);
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  // ─── Start AI analysis ───
  const startAnalysis = async () => {
    setStep('analyzing'); setProgress(0);
    const stages = [
      { pct: 12, delay: 400 }, { pct: 28, delay: 500 }, { pct: 42, delay: 600 },
      { pct: 58, delay: 500 }, { pct: 72, delay: 600 }, { pct: 85, delay: 500 },
      { pct: 94, delay: 400 }, { pct: 100, delay: 500 },
    ];
    for (const s of stages) { await new Promise(r => setTimeout(r, s.delay)); setProgress(s.pct); }
    const idx = history.length % resultImages.length;
    const img = resultImages[idx];
    setGeneratedImage(img);
    if (path === 'photo') setHistory(prev => [...prev, { command, image: img, round: prev.length + 1 }]);
    setStep('result');
  };

  // ─── YZ Revize ───
  const handleRevize = () => {
    if (kredi <= 0) return;
    setKredi(k => k - 1);
    const idx = (history.length) % resultImages.length;
    const img = resultImages[idx];
    setGeneratedImage(img);
    setHistory(prev => [...prev, { command: command || selectedTags.join(', '), image: img, round: prev.length + 1 }]);
  };

  // ─── Quiz navigation ───
  const goQuizNext = () => {
    if (quizSubStep < quizQuestions.length - 1) setQuizSubStep(s => s + 1);
    else setStep('address');
  };
  const goQuizBack = () => { if (quizSubStep > 0) setQuizSubStep(s => s - 1); else setStep('result'); };

  const selectQuizOption = (key: string, value: string, multi?: boolean) => {
    setQuizAnswers(prev => {
      if (multi) {
        const cur = (prev[key] as string[]) || [];
        return { ...prev, [key]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] };
      }
      return { ...prev, [key]: value };
    });
    if (!multi) setTimeout(goQuizNext, 250);
  };

  // ─── Address helpers ───
  const selectIl = (il: string) => { setAddr(p => ({ ...p, il, ilce: '', mahalle: '' })); setIlSearch(il); setIlceSearch(''); setMahalleSearch(''); setShowIlDropdown(false); };
  const selectIlce = (ilce: string) => { setAddr(p => ({ ...p, ilce, mahalle: '' })); setIlceSearch(ilce); setMahalleSearch(''); setShowIlceDropdown(false); };
  const selectMahalle = (m: string) => { setAddr(p => ({ ...p, mahalle: m })); setMahalleSearch(m); setShowMahalleDropdown(false); };

  const ilcelerForIl = addr.il ? (illerVeIlceler[addr.il] || []) : [];
  const mahallelerForIlce = addr.ilce ? getMahalleler(addr.ilce) : [];
  const canProceedAddress = addr.il && addr.ilce && addr.mahalle;

  // ─── WhatsApp link ───
  const getWhatsAppLink = () => {
    const tel = '905551234567';
    const loc = addr.mahalle ? `${addr.il}/${addr.ilce}/${addr.mahalle}` : (location || 'Belirtilmemiş');
    const works = quizAnswers.tadilatKapsami?.length > 0 ? quizAnswers.tadilatKapsami.join(', ') : (command || selectedTags.join(', ') || 'Genel tadilat');
    const code = Math.floor(100 + Math.random() * 900);
    const msg = `Merhaba, ${loc} bölgesindeki ${works} tadilatı için akıllı analizi tamamladım. Sistem bana açılışa özel #TY-${code}-INDRM referans kodunu tanımladı. Bu indirim hakkımla beraber detaylı fiyat teklifimi ve ücretsiz keşif randevumu alabilir miyim?`;
    return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
  };

  const toggleTag = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  if (!isOpen) return null;

  const currentQ = quizQuestions[quizSubStep];

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
      <button onClick={onClose} className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-300">
        <X size={18} />
      </button>

      {step !== 'welcome' && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-white/5 z-40">
          <div className="h-full bg-accent-blue transition-all duration-700 ease-out"
            style={{ width: step === 'analyzing' ? `${progress}%` : step === 'result' ? '40%' : step === 'quiz' ? `${40 + ((quizSubStep + 1) / quizQuestions.length) * 30}%` : step === 'address' ? '80%' : step === 'lockedPrice' ? '100%' : '10%' }} />
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
        <div ref={contentRef} className="w-full max-w-2xl mx-auto">

          {/* ══════ ADIM 0: KARŞILAMA ══════ */}
          {step === 'welcome' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles size={28} className="text-accent-blue" />
              </div>
              <h2 className="font-raleway font-bold text-white text-3xl md:text-4xl tracking-tight mb-3">Tadilatınızı Başlatın</h2>
              <p className="font-raleway text-white/40 text-sm mb-10 max-w-md mx-auto">Size en uygun yolu seçin, yapay zeka destekli sistemimiz anında analiz etsin</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => { setPath('photo'); setStep('upload'); }}
                  className="group p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-accent-blue/40 hover:bg-accent-blue/[0.03] transition-all duration-500 text-left">
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Camera size={22} className="text-accent-blue" />
                  </div>
                  <h3 className="font-raleway font-semibold text-white text-lg mb-2">Fotoğraf Yükle</h3>
                  <p className="font-raleway text-white/40 text-sm mb-4">YZ ile Anında Tasarım ve Fiyat</p>
                  <div className="flex items-center gap-2 text-accent-blue font-raleway text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"><span>BAŞLA</span><ChevronRight size={14} /></div>
                </button>
                <button onClick={() => { setPath('manual'); setStep('manualForm'); }}
                  className="group p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-accent-blue/40 hover:bg-accent-blue/[0.03] transition-all duration-500 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <Zap size={22} className="text-white/50 group-hover:text-accent-blue transition-colors" />
                  </div>
                  <h3 className="font-raleway font-semibold text-white text-lg mb-2">Ölçüleri Biliyorum</h3>
                  <p className="font-raleway text-white/40 text-sm mb-4">Hızlı Fiyat Al</p>
                  <div className="flex items-center gap-2 text-accent-blue font-raleway text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"><span>BAŞLA</span><ChevronRight size={14} /></div>
                </button>
              </div>
            </div>
          )}

          {/* ══════ ADIM 1A: FOTOĞRAF YÜKLE ══════ */}
          {step === 'upload' && (
            <div className="text-center">
              <button onClick={() => setStep('welcome')} className="font-raleway text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1 mx-auto transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Geri
              </button>
              <h2 className="font-raleway font-bold text-white text-2xl md:text-3xl tracking-tight mb-2">Mekanınızı Yükleyin</h2>
              <p className="font-raleway text-white/40 text-sm mb-8">Tadilat yapılacak alanın fotoğrafını yükleyin</p>
              <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-white/10 hover:border-accent-blue/40 rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 bg-white/[0.01]">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                <ImagePlus size={48} className="mx-auto mb-4 text-white/20" />
                <p className="font-raleway text-white/60 text-sm mb-2">Sürükleyip bırakın veya tıklayın</p>
                <p className="font-raleway text-white/25 text-xs">JPG, PNG • Max 10MB</p>
              </div>
            </div>
          )}

          {/* ══════ ADIM 1B: KOMUT YAZ ══════ */}
          {step === 'command' && (
            <div>
              <button onClick={() => setStep('upload')} className="font-raleway text-xs text-white/30 hover:text-white/60 mb-4 flex items-center gap-1 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Geri
              </button>
              <div className="relative mb-6 rounded-xl overflow-hidden border border-white/10">
                <img src={photoPreview} alt="Yüklenen" className="w-full max-h-44 object-cover" />
                <div className="absolute top-3 left-3 bg-bg-dark/80 backdrop-blur-sm px-3 py-1 rounded-full"><span className="font-raleway text-white/60 text-xs">Orijinal</span></div>
              </div>
              <h2 className="font-raleway font-bold text-white text-2xl tracking-tight mb-2">Nasıl Bir Dönüşüm?</h2>
              <p className="font-raleway text-white/40 text-sm mb-6">Hayalinizi kısaca anlatın</p>
              <textarea value={command} onChange={e => setCommand(e.target.value)}
                placeholder="Örn: Mutfak komple yenilenmeli, modern aydınlatma, parke zemin..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 font-raleway text-white text-sm placeholder-white/20 outline-none focus:border-accent-blue/50 transition-colors duration-300 resize-none mb-4" />
              <div className="flex flex-wrap gap-2 mb-6">
                {['Mutfak yenileme', 'Banyo modernizasyonu', 'Salon dizayn', 'Parke zemin', 'Aydınlatma'].map(s => (
                  <button key={s} onClick={() => setCommand(s)} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.07] rounded-full font-raleway text-xs text-white/40 hover:border-accent-blue/30 hover:text-accent-blue transition-all duration-300">{s}</button>
                ))}
              </div>
              <button onClick={startAnalysis} disabled={!command.trim()}
                className={`w-full py-4 rounded-xl font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${command.trim() ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                <Sparkles size={16} /> Analizi Başlat
              </button>
            </div>
          )}

          {/* ══════ ADIM 1C: MANUEL FORM ══════ */}
          {step === 'manualForm' && (
            <div>
              <button onClick={() => setStep('welcome')} className="font-raleway text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Geri
              </button>
              <h2 className="font-raleway font-bold text-white text-2xl tracking-tight mb-2">Proje Detayları</h2>
              <p className="font-raleway text-white/40 text-sm mb-8">Bilgilerinizi girin, anında fiyat alın</p>

              {/* Metrekare */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="font-raleway text-xs tracking-widest uppercase text-white/40">Metrekare</label>
                  <span className="font-raleway font-bold text-accent-blue text-lg">{metrekare} m²</span>
                </div>
                <input type="range" min={10} max={150} step={5} value={metrekare} onChange={e => setMetrekare(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-blue" />
                <div className="flex justify-between mt-2"><span className="font-raleway text-xs text-white/20">10m²</span><span className="font-raleway text-xs text-white/20">150m²+</span></div>
              </div>

              {/* Tags */}
              <div className="mb-8">
                <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-4">İş Kalemleri</label>
                <div className="flex flex-wrap gap-2">
                  {isKalemleri.map(tag => {
                    const sel = selectedTags.includes(tag);
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)}
                        className={`px-4 py-2.5 rounded-lg border font-raleway text-sm transition-all duration-300 ${sel ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white'}`}>
                        {sel && <Check size={12} className="inline mr-1.5 -mt-0.5" />}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Konum */}
              <div className="relative mb-8">
                <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-3">Proje Nerede Gerçekleşecek?</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input id="loc-input" type="text" value={location} placeholder="İlçe veya mahalle ara..."
                    onChange={e => { setLocation(e.target.value); setShowLocDropdown(true); }}
                    onFocus={() => setShowLocDropdown(true)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-4 font-raleway text-white text-sm placeholder-white/20 outline-none focus:border-accent-blue/50 transition-colors duration-300" />
                  <button onClick={() => setLocation('Mevcut Konum')} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-accent-blue hover:bg-accent-blue/10 transition-all" title="Mevcut konumumu kullan">
                    <MapPin size={14} />
                  </button>
                </div>
                {showLocDropdown && location.length > 0 && (
                  <div id="loc-dropdown" className="absolute z-20 top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-[#111] border border-white/10 rounded-xl shadow-2xl custom-scrollbar">
                    {istanbulIlceler.filter(il => il.toLowerCase().includes(location.toLowerCase())).map(il => (
                      <button key={il} onClick={() => { setLocation(il); setShowLocDropdown(false); }} className="w-full text-left px-4 py-3 font-raleway text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">{il}</button>
                    ))}
                  </div>
                )}
                <p className="font-raleway text-white/15 text-xs mt-2">Lojistik ve bölgesel işçilik maliyetlerini milimetrik hesaplayabilmemiz için.</p>
              </div>

              <button onClick={startAnalysis} disabled={selectedTags.length === 0 || !location}
                className={`w-full py-4 rounded-xl font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${selectedTags.length > 0 && location ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                <Sparkles size={16} /> Analizi Başlat
              </button>
            </div>
          )}

          {/* ══════ ADIM 2: YZ ANALİZ ══════ */}
          {step === 'analyzing' && (
            <div className="text-center py-8">
              {path === 'photo' && photoPreview && (
                <div className="relative mx-auto mb-8 rounded-xl overflow-hidden border border-white/10 max-w-md">
                  <img src={photoPreview} alt="Analiz" className="w-full h-56 object-cover" />
                  <div className="absolute left-0 right-0 h-0.5 bg-accent-blue shadow-[0_0_20px_rgba(116,185,255,0.6)] transition-none" style={{ top: `${scanLine}%` }} />
                  {progress > 30 && (
                    <div className="absolute top-[20%] left-[15%] w-[30%] h-[25%] border border-accent-blue/50 rounded-sm animate-pulse">
                      <span className="absolute -top-5 left-0 font-raleway text-[10px] text-accent-blue bg-bg-dark/80 px-1.5 py-0.5 rounded">Mekan algılanıyor</span>
                    </div>
                  )}
                  {progress > 55 && (
                    <div className="absolute top-[45%] right-[10%] w-[35%] h-[30%] border border-accent-blue/40 rounded-sm animate-pulse" style={{ animationDelay: '0.5s' }}>
                      <span className="absolute -top-5 right-0 font-raleway text-[10px] text-accent-blue bg-bg-dark/80 px-1.5 py-0.5 rounded">Malzeme analizi</span>
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                </div>
              )}
              {path === 'manual' && (
                <div className="mb-8 text-left max-w-md mx-auto space-y-2">
                  {[
                    { t: 10, text: `Metrekare bazlı güncel işçilik maliyetleri çekiliyor...` },
                    { t: 25, text: `${metrekare}m² için özel fiyatlandırma oluşturuluyor...` },
                    { t: 40, text: `${location} lojistik endeksi hesaplanıyor...` },
                    { t: 60, text: `${selectedTags.join(', ')} iş kalemleri eşleştiriliyor...` },
                    { t: 78, text: 'Bölgesel malzeme fiyatları güncelleniyor...' },
                    { t: 92, text: 'Son optimizasyonlar yapılıyor...' },
                  ].map(item => (
                    <p key={item.t} className={`font-raleway text-sm transition-all duration-500 ${progress >= item.t ? 'text-white/60' : 'text-white/10'}`}>
                      {progress >= item.t && <Check size={12} className="inline mr-2 text-accent-blue" />}{item.text}
                    </p>
                  ))}
                </div>
              )}
              <h3 className="font-raleway font-bold text-white text-xl mb-2">YZ Analiz Ediyor</h3>
              <p className="font-raleway text-white/30 text-sm mb-6">{path === 'photo' ? 'Mekan derinliği algılanıyor... Doğru malzemeler eşleştiriliyor...' : 'Verileriniz işleniyor...'}</p>
              <div className="max-w-xs mx-auto">
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-blue rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="font-raleway text-white/20 text-xs mt-3 text-right">%{progress}</p>
              </div>
            </div>
          )}

          {/* ══════ ADIM 3: FREEMIUM SONUÇ ══════ */}
          {step === 'result' && generatedImage && (
            <div>
              <h2 className="font-raleway font-bold text-white text-2xl tracking-tight mb-1 text-center">YZ Tasarım Sonucu</h2>
              <p className="font-raleway text-white/40 text-sm mb-6 text-center">{path === 'photo' ? command : selectedTags.join(', ')}</p>

              {/* Before/After */}
              <div className="relative mb-8 rounded-xl overflow-hidden border border-white/10 select-none">
                <div className="relative h-64 md:h-80">
                  <img src={generatedImage} alt="Sonrası" className="absolute inset-0 w-full h-full object-cover" />
                  {photoPreview && (
                    <>
                      <div className="absolute inset-0 overflow-hidden" style={{ width: `${beforeAfterPos}%` }}>
                        <img src={photoPreview} alt="Öncesi" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: `${100 / (beforeAfterPos / 100)}%` }} />
                      </div>
                      <div className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-10" style={{ left: `${beforeAfterPos}%` }}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                          <div className="flex gap-0.5"><ChevronRight size={10} className="text-bg-dark rotate-180" /><ChevronRight size={10} className="text-bg-dark" /></div>
                        </div>
                      </div>
                      <input type="range" min={0} max={100} value={beforeAfterPos} onChange={e => setBeforeAfterPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
                    </>
                  )}
                </div>
                <div className="absolute top-3 left-3 bg-bg-dark/80 px-3 py-1 rounded-full z-10"><span className="font-raleway text-white/60 text-xs">{photoPreview ? 'Öncesi' : 'Referans'}</span></div>
                <div className="absolute top-3 right-3 bg-accent-blue/90 px-3 py-1 rounded-full z-10"><span className="font-raleway text-bg-dark text-xs font-semibold">YZ Sonrası</span></div>
              </div>

              {/* AI Credit Panel */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-raleway text-xs tracking-widest uppercase text-white/40">YZ Kredileri</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(k => (
                      <div key={k} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${k <= kredi ? 'bg-accent-blue shadow-[0_0_8px_rgba(116,185,255,0.5)]' : 'bg-white/10'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleRevize} disabled={kredi <= 0}
                    className={`flex-1 py-3.5 rounded-lg font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${kredi > 0 ? 'bg-white/5 border border-white/10 text-white hover:border-accent-blue hover:text-accent-blue cursor-pointer' : 'bg-white/[0.02] border border-white/5 text-white/20 cursor-not-allowed'}`}>
                    <RefreshCw size={15} /> Farklı Tarz Üret {kredi > 0 && `(${kredi})`}
                  </button>
                  <button onClick={() => { setStep('quiz'); setQuizSubStep(0); }}
                    className="flex-1 py-3.5 bg-accent-blue rounded-lg font-raleway font-bold text-sm tracking-widest uppercase text-bg-dark hover:bg-white transition-all duration-300 flex items-center justify-center gap-2">
                    <ChevronRight size={15} /> Devam Et
                  </button>
                </div>
                {kredi === 0 && (
                  <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                    <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
                    <p className="font-raleway text-amber-300/80 text-xs">Günlük ücretsiz YZ limitiniz doldu. Bu tasarımı gerçeğe dönüştürmek için fiyatı görün.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════ ADIM 4: QUIZ (çoktan seçmeli) ══════ */}
          {step === 'quiz' && (
            <div>
              {/* Quiz header */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-raleway text-xs text-white/30 uppercase tracking-widest">Soru {quizSubStep + 1} / {quizQuestions.length}</span>
                <button onClick={goQuizBack} className="text-white/40 hover:text-white transition-colors flex items-center gap-1 font-raleway text-xs">
                  <ChevronLeft size={14} /> {quizSubStep === 0 ? 'Tasarıma Dön' : 'Geri'}
                </button>
              </div>
              <div className="h-0.5 bg-white/5 rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-accent-blue rounded-full transition-all duration-500" style={{ width: `${((quizSubStep + 1) / quizQuestions.length) * 100}%` }} />
              </div>

              <h2 className="font-raleway font-bold text-white text-2xl md:text-3xl uppercase tracking-tight mb-2">{currentQ.title}</h2>
              <p className="font-raleway text-white/40 text-sm mb-8">{currentQ.subtitle}</p>

              {/* konutTipi */}
              {currentQ.key === 'konutTipi' && (
                <div className="grid grid-cols-2 gap-4">
                  {currentQ.options.map((opt: any) => (
                    <button key={opt.label} onClick={() => selectQuizOption('konutTipi', opt.label)}
                      className={`flex flex-col items-center gap-3 py-6 px-4 rounded-xl border transition-all duration-300 ${quizAnswers.konutTipi === opt.label ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:text-white'}`}>
                      {opt.icon}<span className="font-raleway text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* metrekare / kat / binaYasi */}
              {(currentQ.key === 'metrekare' || currentQ.key === 'kat' || currentQ.key === 'binaYasi') && (
                <div className={currentQ.key === 'kat' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
                  {(currentQ.options as string[]).map(opt => (
                    <button key={opt} onClick={() => selectQuizOption(currentQ.key, opt)}
                      className={`w-full text-left rounded-lg border font-raleway text-sm transition-all duration-300 ${currentQ.key === 'kat' ? 'py-3 px-4' : 'py-4 px-6'} ${quizAnswers[currentQ.key] === opt ? 'border-accent-blue bg-accent-blue/15 text-accent-blue font-semibold' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {/* tadilatKapsami multi */}
              {currentQ.key === 'tadilatKapsami' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {(currentQ.options as string[]).map(item => {
                      const selected = (quizAnswers.tadilatKapsami as string[]).includes(item);
                      return (
                        <button key={item} onClick={() => selectQuizOption('tadilatKapsami', item, true)}
                          className={`py-3 px-4 rounded-lg border font-raleway text-sm transition-all duration-300 text-left flex items-center gap-3 ${selected ? 'border-accent-blue bg-accent-blue/15 text-accent-blue' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'}`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 ${selected ? 'bg-accent-blue border-accent-blue' : 'border-white/30'}`}>
                            {selected && <Check size={10} className="text-bg-dark" />}
                          </div>
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => (quizAnswers.tadilatKapsami as string[]).length > 0 ? goQuizNext() : null}
                    className={`w-full mt-6 py-4 rounded-lg font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${(quizAnswers.tadilatKapsami as string[]).length > 0 ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                    Devam Et <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}

          {/* ══════ ADIM 5: ADRES (İl / İlçe / Mahalle) ══════ */}
          {step === 'address' && (
            <div>
              <button onClick={() => setStep('quiz')} className="font-raleway text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Geri
              </button>
              <h2 className="font-raleway font-bold text-white text-2xl md:text-3xl uppercase tracking-tight mb-2">Adres Bilgileriniz</h2>
              <p className="font-raleway text-white/40 text-sm mb-8">Tadilat yapılacak adresi seçin</p>

              <div className="space-y-5">
                {/* İl */}
                <div ref={ilDropdownRef} className="relative">
                  <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">İl</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="text" placeholder="İl ara..." value={ilSearch}
                      onFocus={() => setShowIlDropdown(true)} onChange={e => { setIlSearch(e.target.value); setShowIlDropdown(true); }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 font-raleway text-white text-sm placeholder-white/25 outline-none focus:border-accent-blue/50 transition-colors" />
                  </div>
                  {showIlDropdown && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-44 overflow-y-auto bg-[#111] border border-white/10 rounded-xl shadow-2xl custom-scrollbar">
                      {iller.filter(i => i.toLowerCase().includes(ilSearch.toLowerCase())).map(il => (
                        <button key={il} onClick={() => selectIl(il)}
                          className={`w-full text-left px-4 py-2.5 font-raleway text-sm transition-colors ${addr.il === il ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>{il}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* İlçe */}
                <div ref={ilceDropdownRef} className="relative">
                  <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">İlçe</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="text" placeholder={addr.il ? "İlçe ara..." : "Önce il seçin"} value={ilceSearch}
                      disabled={!addr.il} onFocus={() => addr.il && setShowIlceDropdown(true)} onChange={e => { setIlceSearch(e.target.value); setShowIlceDropdown(true); }}
                      className={`w-full rounded-xl pl-10 pr-4 py-3.5 font-raleway text-sm outline-none transition-colors ${addr.il ? 'bg-white/5 border border-white/10 text-white placeholder-white/25 focus:border-accent-blue/50' : 'bg-white/[0.02] border border-white/5 text-white/20 placeholder-white/10 cursor-not-allowed'}`} />
                  </div>
                  {showIlceDropdown && addr.il && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-44 overflow-y-auto bg-[#111] border border-white/10 rounded-xl shadow-2xl custom-scrollbar">
                      {ilcelerForIl.filter(i => i.toLowerCase().includes(ilceSearch.toLowerCase())).map(ilce => (
                        <button key={ilce} onClick={() => selectIlce(ilce)}
                          className={`w-full text-left px-4 py-2.5 font-raleway text-sm transition-colors ${addr.ilce === ilce ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>{ilce}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mahalle */}
                <div ref={mahalleDropdownRef} className="relative">
                  <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">Mahalle</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="text" placeholder={addr.ilce ? "Mahalle ara..." : "Önce ilçe seçin"} value={mahalleSearch}
                      disabled={!addr.ilce} onFocus={() => addr.ilce && setShowMahalleDropdown(true)} onChange={e => { setMahalleSearch(e.target.value); setShowMahalleDropdown(true); }}
                      className={`w-full rounded-xl pl-10 pr-4 py-3.5 font-raleway text-sm outline-none transition-colors ${addr.ilce ? 'bg-white/5 border border-white/10 text-white placeholder-white/25 focus:border-accent-blue/50' : 'bg-white/[0.02] border border-white/5 text-white/20 placeholder-white/10 cursor-not-allowed'}`} />
                  </div>
                  {showMahalleDropdown && addr.ilce && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-44 overflow-y-auto bg-[#111] border border-white/10 rounded-xl shadow-2xl custom-scrollbar">
                      {mahallelerForIlce.filter(m => m.toLowerCase().includes(mahalleSearch.toLowerCase())).map(m => (
                        <button key={m} onClick={() => selectMahalle(m)}
                          className={`w-full text-left px-4 py-2.5 font-raleway text-sm transition-colors ${addr.mahalle === m ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>{m}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Açık Adres */}
                <div>
                  <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">Açık Adres</label>
                  <textarea placeholder="Sokak, Bina No, Daire No" rows={2} value={acikAdres}
                    onChange={e => setAcikAdres(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 font-raleway text-white text-sm placeholder-white/25 outline-none focus:border-accent-blue/50 transition-colors resize-none" />
                </div>
              </div>

              <button onClick={() => canProceedAddress ? setStep('lockedPrice') : null}
                className={`w-full mt-8 py-4 rounded-xl font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${canProceedAddress ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                <Eye size={16} /> Fiyatı Gör
              </button>
            </div>
          )}

          {/* ══════ ADIM 6: KİLİTLİ FİYAT + WHATSAPP ══════ */}
          {step === 'lockedPrice' && (
            <div className="text-center">
              {/* Pulse badge */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 animate-pulse">
                  <Sparkles size={14} className="text-accent-blue" />
                  <span className="font-raleway text-accent-blue text-sm font-medium">Tebrikler! Bölgenize ve açılışa özel %15 indirim hakkı kazandınız</span>
                </div>
              </div>

              {/* Blurred price */}
              <div className="relative mb-8 bg-white/[0.02] border border-white/10 rounded-2xl p-8 overflow-hidden">
                <div className="blur-xl opacity-30 select-none pointer-events-none">
                  <p className="font-raleway text-white/20 text-xs uppercase tracking-widest mb-2">Tahmini Maliyet Aralığı</p>
                  <p className="font-raleway font-black text-white text-5xl">₺125.000 - ₺185.000</p>
                  <p className="font-raleway text-white/20 text-sm mt-2">{quizAnswers.metrekare || metrekare + 'm²'} • {(quizAnswers.tadilatKapsami as string[]).join(', ') || selectedTags.join(', ') || command}</p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <EyeOff size={24} className="text-white/30" />
                  </div>
                  <p className="font-raleway text-white/40 text-sm">Fiyatı görmek için WhatsApp'tan ulaşın</p>
                </div>
              </div>

              {/* Ref code */}
              <div className="mb-6">
                <p className="font-raleway text-white/25 text-xs uppercase tracking-widest mb-1">Referans Kodunuz</p>
                <p className="font-raleway font-bold text-accent-blue/60 text-lg tracking-widest">#TY-{Math.floor(100 + Math.random() * 900)}-INDRM</p>
              </div>

              {/* WhatsApp */}
              <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                className="block w-full py-5 bg-[#25D366] rounded-xl font-raleway font-bold text-sm tracking-widest uppercase text-white hover:bg-[#22bf5b] transition-all duration-300 flex items-center justify-center gap-3 mb-4 shadow-[0_0_40px_rgba(37,211,102,0.15)]">
                <Phone size={18} /> Teklifin Kilidini WhatsApp'ta Aç
              </a>

              <button onClick={() => setShowCallForm(!showCallForm)} className="font-raleway text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-4">
                WhatsApp kullanmıyorum, beni arayın
              </button>

              {showCallForm && (
                <div className="mt-6 bg-white/[0.02] border border-white/10 rounded-xl p-6 text-left">
                  <div className="space-y-4">
                    <div>
                      <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">Adınız</label>
                      <input type="text" value={callForm.ad} onChange={e => setCallForm(p => ({ ...p, ad: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-raleway text-white text-sm placeholder-white/20 outline-none focus:border-accent-blue/50 transition-colors" placeholder="Adınız" />
                    </div>
                    <div>
                      <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">Telefon</label>
                      <input type="tel" value={callForm.telefon} onChange={e => setCallForm(p => ({ ...p, telefon: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-raleway text-white text-sm placeholder-white/20 outline-none focus:border-accent-blue/50 transition-colors" placeholder="0555 000 00 00" />
                    </div>
                    <button disabled={!callForm.ad || !callForm.telefon}
                      className={`w-full py-3.5 rounded-lg font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 ${callForm.ad && callForm.telefon ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                      Beni Arayın
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => setStep('address')} className="mt-6 font-raleway text-xs text-white/20 hover:text-white/40 transition-colors flex items-center gap-1 mx-auto">
                <ChevronRight size={12} className="rotate-180" /> Adrese Geri Dön
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
