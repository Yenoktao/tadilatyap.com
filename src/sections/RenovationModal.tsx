import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import {
  X, Camera, Sparkles, ChevronRight, RefreshCw, Check, AlertCircle,
  ImagePlus, MapPin, Phone, Zap, Eye, EyeOff, ChevronLeft, Home,
  Building, Castle, Briefcase, Search, Send
} from 'lucide-react';
import { trpc } from '@/providers/trpc';
import imageCompression from 'browser-image-compression';

interface RenovationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Step type ───
type Step =
  | 'welcome'
  | 'locationScope'   // Konum + Tadilat Alanı
  | 'styleSelect'     // Stil seçimi
  | 'upload'          // Fotoğraf yükleme
  | 'analyzing'       // AI loading
  | 'result'          // Before/After + Fiyat
  | 'lockedPrice';    // WhatsApp

// ─── Stil seçenekleri ───
const styleOptions = [
  { label: 'Modern', icon: Zap, desc: 'Sade çizgiler, ferah alanlar' },
  { label: 'Minimalist', icon: Eye, desc: 'Az ama öz, zen estetiği' },
  { label: 'Lüks', icon: Castle, desc: 'Premium malzemeler, gösterişli' },
  { label: 'Rustik', icon: Home, desc: 'Doğal dokular, sıcak tonlar' },
  { label: 'Endüstriyel', icon: Building, desc: 'Beton, çelik, ham estetik' },
  { label: 'Akdeniz', icon: Sparkles, desc: 'Beyaz-mavi, serin ve ferah' },
];

// ─── Tadilat alanları ───
const tadilatAlanlari = ['Komple Ev', 'Mutfak', 'Banyo', 'Salon', 'Yatak Odası', 'Balkon/Teras'];

// ─── Cloudinary upload ───
async function uploadToCloudinary(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/jpeg',
  });
  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', 'tadilatyap_upload');
  const res = await fetch('https://api.cloudinary.com/v1_1/drqmyuwsg/image/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Upload failed');
  return data.secure_url;
}

// ─── Fiyat formülü ───
function calculatePrice(metrekare: number, ilce: string, style: string): string {
  const ilceMultiplier: Record<string, number> = {
    'Beşiktaş': 1.8, 'Kadıköy': 1.7, 'Şişli': 1.6, 'Bakırköy': 1.5,
    'Sarıyer': 1.9, 'Beykoz': 1.4, 'Üsküdar': 1.5, 'Ataşehir': 1.3,
    'Maltepe': 1.1, 'Kartal': 1.1, 'Pendik': 1.0, 'Başakşehir': 1.0,
    'Beylikdüzü': 0.95, 'Esenyurt': 0.85, 'Fatih': 1.2, 'Beyoğlu': 1.4,
  };
  const styleMultiplier: Record<string, number> = {
    'Modern': 1.3, 'Minimalist': 1.0, 'Lüks': 2.0, 'Rustik': 1.1,
    'Endüstriyel': 1.2, 'Akdeniz': 1.0,
  };
  const base = metrekare * 2500; // base TL per m2
  const ilcMul = ilceMultiplier[ilce] || 1.0;
  const stlMul = styleMultiplier[style] || 1.0;
  const min = Math.round(base * ilcMul * stlMul * 0.85);
  const max = Math.round(base * ilcMul * stlMul * 1.15);
  return `₺${(min / 1000).toFixed(0)}.000 - ₺${(max / 1000).toFixed(0)}.000`;
}

export default function RenovationModal({ isOpen, onClose }: RenovationModalProps) {
  const [step, setStep] = useState<Step>('welcome');

  // Step 1: Konum + Tadilat Alanı
  const [ilce, setIlce] = useState('');
  const [tadilatAlani, setTadilatAlani] = useState('');
  const [metrekare, setMetrekare] = useState(50);
  const [showIlceDropdown, setShowIlceDropdown] = useState(false);
  const [ilceSearch, setIlceSearch] = useState('');

  // Step 2: Stil
  const [selectedStyle, setSelectedStyle] = useState('');

  // Step 3: Fotoğraf
  const [photoPreview, setPhotoPreview] = useState('');
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');

  // Step 4: AI
  const [progress, setProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);

  // Step 5: Sonuç
  const [generatedImage, setGeneratedImage] = useState('');
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);
  const [kredi, setKredi] = useState(3);
  const [callForm, setCallForm] = useState({ ad: '', telefon: '' });
  const [showCallForm, setShowCallForm] = useState(false);

  // İlçe listesi
  const istanbulIlceler = [
    'Adalar','Arnavutköy','Ataşehir','Avcılar','Bağcılar','Bahçelievler','Bakırköy',
    'Başakşehir','Bayrampaşa','Beşiktaş','Beykoz','Beylikdüzü','Beyoğlu','Büyükçekmece',
    'Çatalca','Çekmeköy','Esenler','Esenyurt','Eyüpsultan','Fatih','Gaziosmanpaşa',
    'Güngören','Kadıköy','Kağıthane','Kartal','Küçükçekmece','Maltepe','Pendik',
    'Sancaktepe','Sarıyer','Silivri','Sultanbeyli','Sultangazi','Şile','Şişli',
    'Tuzla','Ümraniye','Üsküdar','Zeytinburnu'
  ];

  // tRPC mutations
  const generateMutation = trpc.renovate.generate.useMutation();
  const generatePromptMutation = trpc.renovate.generateFromPrompt.useMutation();

  // Refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ilceRef = useRef<HTMLDivElement>(null);

  // ─── Reset ───
  useEffect(() => {
    if (!isOpen) return;
    setStep('welcome');
    setIlce(''); setTadilatAlani(''); setMetrekare(50);
    setSelectedStyle('');
    setPhotoPreview(''); setCloudinaryUrl('');
    setProgress(0); setScanLine(0);
    setGeneratedImage(''); setBeforeAfterPos(50);
    setKredi(3);
    setCallForm({ ad: '', telefon: '' }); setShowCallForm(false);
    setIlceSearch(''); setShowIlceDropdown(false);
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
  }, [step, showCallForm]);

  // ─── Scanner animation ───
  useEffect(() => {
    if (step !== 'analyzing') return;
    let frame = 0;
    const iv = setInterval(() => { frame += 1; setScanLine((frame * 2) % 100); }, 20);
    return () => clearInterval(iv);
  }, [step]);

  // ─── Outside click ───
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ilceRef.current && !ilceRef.current.contains(e.target as Node)) setShowIlceDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── File handling with compression ───
  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
      // Auto start analysis after showing preview briefly
      setTimeout(() => startAnalysis(file), 800);
    };
    reader.readAsDataURL(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  // ─── Start AI analysis ───
  const startAnalysis = async (file?: File) => {
    setStep('analyzing'); setProgress(0);

    try {
      setProgress(8);

      let imgFile = file;
      if (!imgFile && photoPreview) {
        const res = await fetch(photoPreview);
        const blob = await res.blob();
        imgFile = new File([blob], 'renovation.jpg', { type: 'image/jpeg' });
      }

      if (!imgFile) {
        setStep('upload'); return;
      }

      // Step 1: Compress & upload to Cloudinary
      setProgress(15);
      const uploadedUrl = await uploadToCloudinary(imgFile);
      setCloudinaryUrl(uploadedUrl);

      setProgress(35);

      // Step 2: Call AI via tRPC
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 2, 85));
      }, 600);

      const result = await generateMutation.mutateAsync({
        imageUrl: uploadedUrl,
        command: `${selectedStyle} ${tadilatAlani} interior renovation`,
      });
      clearInterval(progressInterval);

      setProgress(95);
      if (result.success && result.resultUrl) {
        setGeneratedImage(result.resultUrl);
      } else {
        // Fallback
        setGeneratedImage('/assets/hero-1.jpg');
      }

      await new Promise(r => setTimeout(r, 300));
      setProgress(100);
      setStep('result');
    } catch (err) {
      console.error('AI error:', err);
      setGeneratedImage('/assets/hero-1.jpg');
      setProgress(100);
      setStep('result');
    }
  };

  // ─── Revize ───
  const handleRevize = async () => {
    if (kredi <= 0 || !cloudinaryUrl) return;
    setKredi(k => k - 1);
    try {
      const result = await generateMutation.mutateAsync({
        imageUrl: cloudinaryUrl,
        command: `${selectedStyle} ${tadilatAlani} interior renovation (alternative)`,
      });
      if (result.success && result.resultUrl) setGeneratedImage(result.resultUrl);
    } catch { /* keep current */ }
  };

  // ─── WhatsApp link ───
  const getWhatsAppLink = () => {
    const code = Math.floor(100 + Math.random() * 900);
    const msg = `Merhaba, ${ilce} projem için #TY-${code}-INDRM kodlu açılış indirimimle keşif randevusu istiyorum. Tasarım: ${generatedImage}`;
    return `https://wa.me/905425062816?text=${encodeURIComponent(msg)}`;
  };

  if (!isOpen) return null;

  const filteredIlceler = istanbulIlceler.filter(i => i.toLowerCase().includes(ilceSearch.toLowerCase()));
  const priceRange = calculatePrice(metrekare, ilce, selectedStyle);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] bg-[#0a0a0a] overflow-y-auto custom-scrollbar">
      <button onClick={onClose} className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"><X size={18} /></button>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-white/5 z-40">
        <div className="h-full bg-accent-blue transition-all duration-700"
          style={{ width: step === 'welcome' ? '5%' : step === 'locationScope' ? '15%' : step === 'styleSelect' ? '30%' : step === 'upload' ? '40%' : step === 'analyzing' ? `${progress}%` : step === 'result' ? '85%' : '100%' }} />
      </div>

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
                <button onClick={() => setStep('locationScope')}
                  className="group p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-accent-blue/40 hover:bg-accent-blue/[0.03] transition-all duration-500 text-left">
                  <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Camera size={22} className="text-accent-blue" />
                  </div>
                  <h3 className="font-raleway font-semibold text-white text-lg mb-2">Fotoğraf Yükle</h3>
                  <p className="font-raleway text-white/40 text-sm mb-4">YZ ile Anında Tasarım ve Fiyat</p>
                  <div className="flex items-center gap-2 text-accent-blue font-raleway text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"><span>BAŞLA</span><ChevronRight size={14} /></div>
                </button>
                <button onClick={() => setStep('locationScope')}
                  className="group p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-accent-blue/40 hover:bg-accent-blue/[0.03] transition-all duration-500 text-left">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Zap size={22} className="text-white/50 group-hover:text-accent-blue transition-colors" />
                  </div>
                  <h3 className="font-raleway font-semibold text-white text-lg mb-2">Ölçüleri Biliyorum</h3>
                  <p className="font-raleway text-white/40 text-sm mb-4">Hızlı Fiyat Al</p>
                  <div className="flex items-center gap-2 text-accent-blue font-raleway text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"><span>BAŞLA</span><ChevronRight size={14} /></div>
                </button>
              </div>
            </div>
          )}

          {/* ══════ ADIM 1: KONUM + TADİLAT ALANI ══════ */}
          {step === 'locationScope' && (
            <div>
              <button onClick={() => setStep('welcome')} className="font-raleway text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Geri
              </button>
              <h2 className="font-raleway font-bold text-white text-2xl tracking-tight mb-6">Proje Detayları</h2>

              {/* İlçe */}
              <div className="mb-6" ref={ilceRef}>
                <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-3">Proje Hangi İlçede?</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input type="text" placeholder="İlçe ara..." value={ilceSearch}
                    onFocus={() => setShowIlceDropdown(true)}
                    onChange={e => { setIlceSearch(e.target.value); setShowIlceDropdown(true); }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-4 font-raleway text-white text-sm placeholder-white/20 outline-none focus:border-accent-blue/50 transition-colors" />
                </div>
                {showIlceDropdown && (
                  <div className="absolute z-20 mt-1 w-full max-h-44 overflow-y-auto bg-[#111] border border-white/10 rounded-xl shadow-2xl custom-scrollbar">
                    {filteredIlceler.map(i => (
                      <button key={i} onClick={() => { setIlce(i); setIlceSearch(i); setShowIlceDropdown(false); }}
                        className={`w-full text-left px-4 py-3 font-raleway text-sm transition-colors ${ilce === i ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>{i}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrekare */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-raleway text-xs tracking-widest uppercase text-white/40">Metrekare</label>
                  <span className="font-raleway font-bold text-accent-blue text-lg">{metrekare} m²</span>
                </div>
                <input type="range" min={10} max={150} step={5} value={metrekare}
                  onChange={e => setMetrekare(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-blue" />
                <div className="flex justify-between mt-2"><span className="font-raleway text-xs text-white/20">10m²</span><span className="font-raleway text-xs text-white/20">150m²+</span></div>
              </div>

              {/* Tadilat Alanı */}
              <div className="mb-8">
                <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-4">Tadilat Alanı</label>
                <div className="flex flex-wrap gap-2">
                  {tadilatAlanlari.map(tag => {
                    const sel = tadilatAlani === tag;
                    return (
                      <button key={tag} onClick={() => setTadilatAlani(tag)}
                        className={`px-4 py-2.5 rounded-lg border font-raleway text-sm transition-all duration-300 ${sel ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/25 hover:text-white'}`}>
                        {sel && <Check size={12} className="inline mr-1.5 -mt-0.5" />}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={() => ilce && tadilatAlani ? setStep('styleSelect') : null}
                className={`w-full py-4 rounded-xl font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${ilce && tadilatAlani ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                <Sparkles size={16} /> Devam Et
              </button>
            </div>
          )}

          {/* ══════ ADIM 2: STİL SEÇİMİ ══════ */}
          {step === 'styleSelect' && (
            <div>
              <button onClick={() => setStep('locationScope')} className="font-raleway text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1 transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Geri
              </button>
              <h2 className="font-raleway font-bold text-white text-2xl tracking-tight mb-2">Stil Seçin</h2>
              <p className="font-raleway text-white/40 text-sm mb-8">Tadilatınızda hangi tarzı hayal ediyorsunuz?</p>

              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map(s => {
                  const Icon = s.icon;
                  const sel = selectedStyle === s.label;
                  return (
                    <button key={s.label} onClick={() => setSelectedStyle(s.label)}
                      className={`p-5 rounded-xl border transition-all duration-300 text-left ${sel ? 'border-accent-blue bg-accent-blue/10' : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${sel ? 'bg-accent-blue/20' : 'bg-white/5'}`}>
                        <Icon size={20} className={sel ? 'text-accent-blue' : 'text-white/40'} />
                      </div>
                      <p className={`font-raleway font-semibold text-sm mb-1 ${sel ? 'text-accent-blue' : 'text-white'}`}>{s.label}</p>
                      <p className="font-raleway text-white/30 text-xs">{s.desc}</p>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => selectedStyle ? setStep('upload') : null}
                className={`w-full mt-6 py-4 rounded-xl font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${selectedStyle ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                <Camera size={16} /> Fotoğraf Yükle
              </button>
            </div>
          )}

          {/* ══════ ADIM 3: FOTOĞRAF YÜKLE ══════ */}
          {step === 'upload' && (
            <div className="text-center">
              <button onClick={() => setStep('styleSelect')} className="font-raleway text-xs text-white/30 hover:text-white/60 mb-6 flex items-center gap-1 mx-auto transition-colors">
                <ChevronRight size={12} className="rotate-180" /> Geri
              </button>
              <h2 className="font-raleway font-bold text-white text-2xl md:text-3xl tracking-tight mb-2">Mekanınızı Yükleyin</h2>
              <p className="font-raleway text-white/40 text-sm mb-8">{ilce} • {metrekare}m² • {tadilatAlani} • {selectedStyle}</p>

              <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-white/10 hover:border-accent-blue/40 rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 bg-white/[0.01]">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                <ImagePlus size={48} className="mx-auto mb-4 text-white/20" />
                <p className="font-raleway text-white/60 text-sm mb-2">Sürükleyip bırakın veya tıklayın</p>
                <p className="font-raleway text-white/25 text-xs">Otomatik 1024px sıkıştırma • JPG/PNG</p>
              </div>
            </div>
          )}

          {/* ══════ ADIM 4: AI ANALİZ ══════ */}
          {step === 'analyzing' && (
            <div className="text-center py-8">
              {photoPreview && (
                <div className="relative mx-auto mb-8 rounded-xl overflow-hidden border border-white/10 max-w-md">
                  <img src={photoPreview} alt="Analiz" className="w-full h-56 object-cover" />
                  <div className="absolute left-0 right-0 h-0.5 bg-accent-blue shadow-[0_0_20px_rgba(116,185,255,0.6)] transition-none" style={{ top: `${scanLine}%` }} />
                  {progress > 25 && (
                    <div className="absolute top-[20%] left-[15%] w-[30%] h-[25%] border border-accent-blue/50 rounded-sm animate-pulse">
                      <span className="absolute -top-5 left-0 font-raleway text-[10px] text-accent-blue bg-bg-dark/80 px-1.5 py-0.5 rounded">Mekan iskeleti analiz ediliyor...</span>
                    </div>
                  )}
                  {progress > 55 && (
                    <div className="absolute top-[45%] right-[10%] w-[35%] h-[30%] border border-accent-blue/40 rounded-sm animate-pulse" style={{ animationDelay: '0.5s' }}>
                      <span className="absolute -top-5 right-0 font-raleway text-[10px] text-accent-blue bg-bg-dark/80 px-1.5 py-0.5 rounded">Malzeme dokuları işleniyor...</span>
                    </div>
                  )}
                  {progress > 80 && (
                    <div className="absolute bottom-[15%] left-[30%] w-[40%] h-[20%] border border-accent-blue/30 rounded-sm animate-pulse" style={{ animationDelay: '1s' }}>
                      <span className="absolute -top-5 left-0 font-raleway text-[10px] text-accent-blue bg-bg-dark/80 px-1.5 py-0.5 rounded">Bölgesel maliyetler hesaplanıyor...</span>
                    </div>
                  )}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                </div>
              )}

              <h3 className="font-raleway font-bold text-white text-xl mb-2">YZ Analiz Ediyor</h3>
              <p className="font-raleway text-white/30 text-sm mb-6">{selectedStyle} {tadilatAlani} dönüşümü işleniyor...</p>

              {/* Cinematic text flow */}
              <div className="mb-6 text-left max-w-sm mx-auto space-y-2">
                {[
                  { t: 12, text: 'Mekan iskeleti analiz ediliyor...' },
                  { t: 28, text: 'Malzeme dokuları işleniyor...' },
                  { t: 42, text: `${ilce} lojistik endeksi hesaplanıyor...` },
                  { t: 58, text: `${selectedStyle} stil eşleştirmesi yapılıyor...` },
                  { t: 72, text: `${metrekare}m² için özel fiyatlandırma...` },
                  { t: 88, text: 'Son dokunuşlar ve render...' },
                ].map(item => (
                  <p key={item.t} className={`font-raleway text-sm transition-all duration-500 ${progress >= item.t ? 'text-white/60' : 'text-white/10'}`}>
                    {progress >= item.t && <Check size={12} className="inline mr-2 text-accent-blue" />}{item.text}
                  </p>
                ))}
              </div>

              <div className="max-w-xs mx-auto">
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-blue rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="font-raleway text-white/20 text-xs mt-3 text-right">%{progress}</p>
              </div>
            </div>
          )}

          {/* ══════ ADIM 5: SONUÇ — Before/After + Fiyat ══════ */}
          {step === 'result' && generatedImage && (
            <div>
              <h2 className="font-raleway font-bold text-white text-2xl tracking-tight mb-1 text-center">YZ Tasarım Sonucu</h2>
              <p className="font-raleway text-white/40 text-sm mb-2 text-center">{ilce} • {metrekare}m² • {tadilatAlani} • {selectedStyle}</p>

              {/* Trust message */}
              <div className="flex items-center gap-2 justify-center mb-6">
                <Check size={14} className="text-emerald-400" />
                <p className="font-raleway text-emerald-400/80 text-xs">Bu, yapay zekanın hızlı analizidir. Detaylı teklif için mimarımızla görüşün.</p>
              </div>

              {/* Before/After */}
              <div className="relative mb-6 rounded-xl overflow-hidden border border-white/10 select-none">
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
                <div className="absolute top-3 left-3 bg-bg-dark/80 px-3 py-1 rounded-full z-10"><span className="font-raleway text-white/60 text-xs">Öncesi</span></div>
                <div className="absolute top-3 right-3 bg-accent-blue/90 px-3 py-1 rounded-full z-10"><span className="font-raleway text-bg-dark text-xs font-semibold">YZ Sonrası</span></div>
              </div>

              {/* Price (unlocked - visible) */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 mb-6 text-center">
                <p className="font-raleway text-xs text-white/40 uppercase tracking-widest mb-2">Tahmini Fiyat Aralığı ({ilce} • {metrekare}m² • {selectedStyle})</p>
                <p className="font-raleway font-black text-white text-3xl">{priceRange}</p>
                <p className="font-raleway text-white/25 text-xs mt-2">M² bazlı, stil ve lokasyona göre hesaplanmıştır.</p>
              </div>

              {/* AI Credits + Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button onClick={handleRevize} disabled={kredi <= 0}
                  className={`flex-1 py-3.5 rounded-lg font-raleway font-bold text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${kredi > 0 ? 'bg-white/5 border border-white/10 text-white hover:border-accent-blue hover:text-accent-blue cursor-pointer' : 'bg-white/[0.02] border border-white/5 text-white/20 cursor-not-allowed'}`}>
                  <RefreshCw size={15} /> Farklı Tarz Üret {kredi > 0 && `(${kredi})`}
                </button>
                <button onClick={() => setStep('lockedPrice')}
                  className="flex-1 py-3.5 bg-accent-blue rounded-lg font-raleway font-bold text-sm tracking-widest uppercase text-bg-dark hover:bg-white transition-all duration-300 flex items-center justify-center gap-2">
                  <Sparkles size={15} /> Fiyatı Netleştir
                </button>
              </div>

              {kredi === 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
                  <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
                  <p className="font-raleway text-amber-300/80 text-xs">Günlük ücretsiz YZ limitiniz doldu. Fiyatı netleştirmek için devam edin.</p>
                </div>
              )}
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
                  <p className="font-raleway text-white/20 text-xs uppercase tracking-widest mb-2">Net Fiyat ({ilce} • {metrekare}m² • {selectedStyle})</p>
                  <p className="font-raleway font-black text-white text-5xl">{priceRange}</p>
                  <p className="font-raleway text-white/20 text-sm mt-2">{tadilatAlani}</p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                    <EyeOff size={24} className="text-white/30" />
                  </div>
                  <p className="font-raleway text-white/40 text-sm">Net fiyatı görmek için iletişime geçin</p>
                </div>
              </div>

              {/* Reference code */}
              <div className="mb-6">
                <p className="font-raleway text-white/25 text-xs uppercase tracking-widest mb-1">Referans Kodunuz</p>
                <p className="font-raleway font-bold text-accent-blue/60 text-lg tracking-widest">#TY-{Math.floor(100 + Math.random() * 900)}-INDRM</p>
              </div>

              {/* WhatsApp Button */}
              <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                className="block w-full py-5 bg-[#25D366] rounded-xl font-raleway font-bold text-sm tracking-widest uppercase text-white hover:bg-[#22bf5b] transition-all duration-300 flex items-center justify-center gap-3 mb-4 shadow-[0_0_40px_rgba(37,211,102,0.15)]">
                <Phone size={18} /> Keşif Randevusu Al ve Fiyatı Netleştir
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

              <button onClick={() => setStep('result')} className="mt-6 font-raleway text-xs text-white/20 hover:text-white/40 transition-colors flex items-center gap-1 mx-auto">
                <ChevronRight size={12} className="rotate-180" /> Tasarıma Geri Dön
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
