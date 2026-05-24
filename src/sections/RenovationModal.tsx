import { useState, useCallback, useRef, useEffect } from 'react';
import {
  X, ImagePlus, Sparkles, ChevronRight, RefreshCw, Check,
  AlertCircle, MapPin, Phone, Home, Paintbrush, Sofa, TreePine, Building, Camera,
  Lightbulb, XCircle
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface Props { isOpen: boolean; onClose: () => void; }

// Seçim verileri
const ALANLAR = [
  { key: 'mutfak', label: 'Mutfak', icon: Home },
  { key: 'banyo', label: 'Banyo', icon: Home },
  { key: 'salon', label: 'Oda', icon: Sofa },
  { key: 'discephe', label: 'Dış Cephe', icon: Building },
  { key: 'bahce', label: 'Bahçe', icon: TreePine },
  { key: 'diger', label: 'Diğer', icon: Home },
];

const ISLEMLER = [
  { key: 'boya', label: 'Boya' },
  { key: 'fayans', label: 'Fayans' },
  { key: 'kaplama', label: 'Kaplama' },
  { key: 'dolap', label: 'Dolap' },
  { key: 'pencere', label: 'Pencere' },
  { key: 'cati', label: 'Çatı' },
  { key: 'diger', label: 'Diğer' },
];

// Hatay ilçeleri ve mahalleleri
const hatayIlceler: Record<string, string[]> = {
  'Antakya': ['Çekmece', 'Sarılar', 'Üçgüllük', 'Aksaray', 'Atatürk', 'Cumhuriyet', 'Demirköprü', 'Esentepe', 'Gazi', 'Harbiye', 'Hürriyet', 'İstiklal', 'Karaali', 'Küçükdalyan', 'Sakarya', 'Serinyol', 'Subaşı'],
  'Defne': ['Armutlu', 'Bahçeköy', 'Balıklıdere', 'Çekmece', 'Dursunlu', 'Gümüşgöze', 'Harbiye', 'Karaali', 'Subaşı', 'Yenişehir'],
  'İskenderun': ['Akarca', 'Barbaros', 'Cumhuriyet', 'Denizciler', 'Gülcihan', 'Gültepe', 'Hürriyet', 'Kurtuluş', 'Merkez', 'Süleymaniye', 'Yenişehir'],
  'Kırıkhan': ['Akasya', 'Akçalı', 'Bahçelievler', 'Cumhuriyet', 'Gazi', 'Hürriyet', 'Kurtuluş', 'Namık Kemal', 'Özgürlüğü'],
  'Arsuz': ['Arpaderesi', 'Bakırlı', 'Conk', 'Denizci', 'Hacıahmet', 'Işıklı', 'Karaağaç', 'Madenli', 'Sarımandıra', 'Taşkapı'],
  'Hassa': ['Akbez', 'Aktepe', 'Ardıçlı', 'Bademli', 'Çamlıtepe', 'Çevre', 'Gülpınar', 'Hürriyet', 'Kayaalan', 'Yeşilova'],
  'Dörtyol': ['Alparslan', 'Bahçelievler', 'Cumhuriyet', 'Gazi', 'Hürriyet', 'Kuzuculu', 'Namık Kemal', 'Sahil', 'Serinyol'],
  'Samandağ': ['Aknehir', 'Ataköy', 'Cumhuriyet', 'Çamlıyayla', 'Değirmen', 'Hürriyet', 'Kapısuyu', 'Sahil', 'Tabiat', 'Yaylıca'],
  'Altınözü': ['Akamber', 'Belen', 'Cumhuriyet', 'Demirköprü', 'Hacıpaşa', 'Kozkalesi', 'Sarımazı', 'Yenişehir'],
  'Belen': ['Akbaba', 'Belen', 'Çamlıbel', 'Fatih', 'Güzelyayla', 'Kozluca', 'Meydan', 'Narlıca', 'Yeni'],
  'Erzin': ['Aşkale', 'Bahçelievler', 'Cumhuriyet', 'Gazi', 'Hürriyet', 'Kumbaşı', 'Sağlık', 'Yeni'],
  'Kumlu': ['Akçalı', 'Atatürk', 'Bahçelievler', 'Cumhuriyet', 'Gazi', 'Hürriyet', 'Namık Kemal', 'Yenişehir'],
  'Payas': ['Akçalı', 'Cumhuriyet', 'Fatih', 'Hürriyet', 'Kozlu', 'Namık Kemal', 'Sahil', 'Yenimahalle'],
  'Yayladağı': ['Arpalı', 'Bademli', 'Bozca', 'Çemenli', 'Karaca', 'Nardüzü', 'Serinyol', 'Yenice', 'Yeşilova'],
};

function calculatePrice(metrekare: number, ilce: string): string {
  const mul: Record<string, number> = {
    'Antakya': 1.0, 'Defne': 1.05, 'İskenderun': 1.1, 'Kırıkhan': 0.8,
    'Arsuz': 0.95, 'Hassa': 0.75, 'Altınözü': 0.7, 'Dörtyol': 0.85,
    'Samandağ': 0.9, 'Belen': 0.78, 'Erzin': 0.82, 'Kumlu': 0.72,
    'Payas': 0.88, 'Yayladağı': 0.65,
  };
  const base = metrekare * 2200;
  const m = mul[ilce] || 1.0;
  const min = Math.round(base * m * 0.85);
  const max = Math.round(base * m * 1.15);
  return `₺${(min / 1000).toFixed(0)}.000 - ₺${(max / 1000).toFixed(0)}.000`;
}

// Prompt oluşturucu - seçimlerden AI promptu üret
function buildPrompt(userCommand: string, alan: string, islem: string): string {
  const parts: string[] = [];
  if (alan && alan !== 'diger') parts.push(`${ALANLAR.find(a => a.key === alan)?.label || alan} tadilatı`);
  if (islem && islem !== 'diger') parts.push(`${ISLEMLER.find(i => i.key === islem)?.label || islem} işlemi`);
  parts.push(`Kullanıcı isteği: ${userCommand}`);
  // Yapısal bütünlük ve ölçek sabitlemesi
  parts.push('Mevcut duvar, pencere, kapı ve açıklık konumlarını aynen koru, yapısal düzeni değiştirme');
  parts.push('Gerçekçi ölçekte üret, perspektifi ve derinlik oranını koru, mevcut alana sığmayacak fazla eşya ekleme');
  return parts.join(', ');
}

async function compressImage(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  const blob = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.7 });
  const dataUrl = await imageCompression.getDataUrlFromFile(blob);
  return { dataUrl, blob };
}

async function callRenovateAPI(imageBlob: Blob, command: string) {
  const form = new FormData();
  form.append('image', imageBlob, 'input.jpg');
  form.append('command', command);
  form.append('strength', '0.75');

  const res = await fetch('/api/renovate', {
    method: 'POST',
    body: form,
  });
  const text = await res.text();
  if (!text) throw new Error('Empty response');
  const data = JSON.parse(text);
  if (!data.success) throw new Error(data.error || 'AI failed');
  return data;
}

export default function RenovationModal({ isOpen, onClose }: Props) {
  // Akış adımları: upload → selection → guide → command → analyzing → result
  const [step, setStep] = useState<'upload' | 'selection' | 'guide' | 'command' | 'analyzing' | 'result'>('upload');

  // Seçim state'leri
  const [selectedAlan, setSelectedAlan] = useState('');
  const [selectedIslem, setSelectedIslem] = useState('');

  const [photoPreview, setPhotoPreview] = useState('');
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [command, setCommand] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [revizeCommand, setRevizeCommand] = useState('');
  const [showRevize, setShowRevize] = useState(false);
  const [revizeUsed, setRevizeUsed] = useState(false);
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState('');

  // İlçe/mahalle (sonuç ekranında)
  const [ilce, setIlce] = useState('');
  const [mahalle, setMahalle] = useState('');
  const [metrekare, setMetrekare] = useState(50);
  const [showIlceDropdown, setShowIlceDropdown] = useState(false);
  const [showMahalleDropdown, setShowMahalleDropdown] = useState(false);

  // Kamera ref ve state'leri
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const ilceRef = useRef<HTMLDivElement>(null);
  const mahalleRef = useRef<HTMLDivElement>(null);

  // cameraActive true oldugunda video'ya stream bagla
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Kamera baslat - async icinde video.play() await ile
  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      // Onceden acik stream varsa kapat
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      let constraints: MediaStreamConstraints = { video: true, audio: false };
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices.length > 1) {
          constraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
        }
      } catch { /* ignore */ }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // loadedmetadata beklemeden direkt play
        await videoRef.current.play().catch(() => {
          // play hatasi olursa loadedmetadata'da tekrar dene
        });
      }
      setCameraActive(true);
    } catch {
      setCameraError('Kameraya erişilemedi. Lütfen kamera izni verin veya galeriden fotoğraf seçin.');
    }
  }, []);

  // Kamera durdur
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraError('');
  }, []);

  // Fotograf cek
  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Video oynuyor mu kontrol et
    if (video.readyState < 2) {
      setCameraError('Kamera henüz hazır değil. Lütfen bekleyin.');
      return;
    }

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      await handleFile(file);
      stopCamera();
    }, 'image/jpeg', 0.85);
  }, [stopCamera]);

  // Video loadedmetadata handler
  const handleVideoLoaded = useCallback(async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
      } catch (err) {
        console.log('Video play error:', err);
      }
    }
  }, []);

  // Modal kapandiginda kamerasi kapat
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const { dataUrl, blob } = await compressImage(file);
      setPhotoPreview(dataUrl);
      setImageFile(blob);
      setStep('selection');
      setError('');
    } catch { setError('Fotoğraf okunamadı'); }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) handleFile(f);
  };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const startAnalysis = async () => {
    if (!imageFile || !command.trim()) return;
    setStep('analyzing'); setProgress(0); setError(''); setElapsedTime(0);

    // Seçimlerden prompt oluştur
    const fullCommand = buildPrompt(command.trim(), selectedAlan, selectedIslem);

    const timer = setInterval(() => setElapsedTime(t => t + 1), 1000);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 1000);

    try {
      const result = await callRenovateAPI(imageFile, fullCommand);
      clearInterval(progressInterval);
      if (result.success && result.resultUrl) {
        setGeneratedImage(result.resultUrl);
      } else { setError('AI sonuç üretemedi'); }
      setProgress(100);
      setStep('result');
    } catch (err: any) {
      clearInterval(progressInterval);
      setError('AI hatası: ' + (err.message || 'Tekrar dene'));
      setProgress(100);
      setStep('result');
    } finally {
      clearInterval(timer);
    }
  };

  const doRevizeAnalysis = async (cmd: string) => {
    if (!imageFile || !cmd.trim() || !generatedImage) return;
    setRevizeUsed(true);
    setShowRevize(false);
    setStep('analyzing'); setProgress(0); setError(''); setElapsedTime(0);

    const timer = setInterval(() => setElapsedTime(t => t + 1), 1000);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 1000);

    try {
      // /api/revize endpoint'i - orijinal foto + AI sonucu + yeni komut
      const form = new FormData();
      form.append('image', imageFile);
      form.append('command', cmd.trim());
      form.append('prevResultUrl', generatedImage);

      const res = await fetch('/api/revize', { method: 'POST', body: form });
      const text = await res.text();
      if (!text) throw new Error('Empty response');
      const result = JSON.parse(text);

      clearInterval(progressInterval);
      if (result.success && result.resultUrl) {
        setGeneratedImage(result.resultUrl);
      } else { setError('AI sonuç üretemedi'); }
      setProgress(100);
      setStep('result');
    } catch (err: any) {
      clearInterval(progressInterval);
      setError('AI hatası: ' + (err.message || 'Tekrar dene'));
      setProgress(100);
      setStep('result');
    } finally {
      clearInterval(timer);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const getWhatsAppLink = () => {
    const code = Math.floor(100 + Math.random() * 900);
    const msg = `Merhaba, Hatay/${ilce}/${mahalle} projem için #TY-${code}-INDRM kodlu açılış indirimimle keşif randevusu istiyorum. Talebim: ${command}`;
    return `https://wa.me/905425062816?text=${encodeURIComponent(msg)}`;
  };

  const priceRange = ilce ? calculatePrice(metrekare, ilce) : '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] overflow-y-auto p-4">
      <button onClick={onClose} className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
        <X size={18} />
      </button>

      <div className="max-w-lg mx-auto pt-12 pb-20">

        {/* === 1. FOTOĞRAF YÜKLEME / KAMERA === */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Fotoğraf Yükle</h2>
              <p className="text-white/60 text-sm">Tadilat yapılacak alanın fotoğrafını yükleyin veya kamerayla çekin</p>
            </div>

            {/* Kamera aktifse video goster */}
            {cameraActive ? (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={handleVideoLoaded}
                    className="w-full h-64 object-cover"
                    style={{ background: '#000', minHeight: '256px' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-3">
                  <button onClick={stopCamera} className="flex-1 py-3 bg-white/5 border border-white/10 text-white/70 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium">
                    İptal
                  </button>
                  <button onClick={capturePhoto} className="flex-1 py-3 bg-white text-[#0a0a0a] font-bold rounded-xl hover:bg-white/90 transition-colors text-sm flex items-center justify-center gap-2">
                    <Camera size={16} /> Çek
                  </button>
                </div>
              </div>
            ) : (
              /* Kamera kapaliysa iki buton goster */
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={e => e.preventDefault()}
                  className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 bg-[#1a1a1a] flex flex-col items-center justify-center cursor-pointer hover:border-white/30 hover:bg-[#222] transition-all"
                >
                  <ImagePlus size={48} className="text-white/30 mb-4" />
                  <p className="text-white/60 text-sm font-medium">Galeriden Fotoğraf Seç</p>
                  <p className="text-white/30 text-xs mt-1">Tıklayın veya sürükleyin</p>
                </div>

                <button
                  onClick={startCamera}
                  className="w-full py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl text-white font-medium flex items-center justify-center gap-3 hover:border-white/30 hover:bg-[#222] transition-all"
                >
                  <Camera size={24} className="text-white/40" />
                  <span>Kamerayı Aç</span>
                </button>

                {cameraError && (
                  <p className="text-red-400 text-sm text-center">{cameraError}</p>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>
            )}
          </div>
        )}

        {/* === 2. SEÇİM EKRANI === */}
        {step === 'selection' && photoPreview && (
          <div className="space-y-8">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Tadilat Detayları</h2>
              <p className="text-white/60 text-sm">Seçimleriniz AI'ın daha doğru sonuç üretmesine yardımcı olur</p>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src={photoPreview} alt="Önizleme" className="w-full max-h-48 object-cover" />
            </div>

            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Home size={16} className="text-white/40" /> Hangi Alan?
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {ALANLAR.map(a => {
                  const Icon = a.icon;
                  const isActive = selectedAlan === a.key;
                  return (
                    <button
                      key={a.key}
                      onClick={() => setSelectedAlan(isActive ? '' : a.key)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1 ${
                        isActive ? 'bg-white text-[#0a0a0a] border-white' : 'bg-[#1a1a1a] text-white/70 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <Icon size={18} />
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Paintbrush size={16} className="text-white/40" /> Ne Yapılsın?
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {ISLEMLER.map(i => {
                  const isActive = selectedIslem === i.key;
                  return (
                    <button
                      key={i.key}
                      onClick={() => setSelectedIslem(isActive ? '' : i.key)}
                      className={`py-2.5 px-2 rounded-xl text-sm font-medium border transition-all ${
                        isActive ? 'bg-white text-[#0a0a0a] border-white' : 'bg-[#1a1a1a] text-white/70 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(selectedAlan || selectedIslem) && (
              <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                <p className="text-white/40 text-xs mb-1">AI'ın göreceği komut:</p>
                <p className="text-white/80 text-sm font-medium">
                  {buildPrompt('...', selectedAlan, selectedIslem).replace(', Kullanıcı isteği: ...', '')}
                </p>
              </div>
            )}

            <button
              onClick={() => setStep('guide')}
              className="w-full py-4 bg-white text-[#0a0a0a] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
            >
              Devam Et <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* === 3. KOMUT REHBERİ (ZORUNLU POPUP) === */}
        {step === 'guide' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F36621]/15 border border-[#F36621]/30 rounded-full mb-4">
                <Lightbulb size={16} className="text-[#F36621]" />
                <span className="font-raleway text-xs tracking-[0.2em] uppercase text-[#F36621]">
                  Önemli Bilgi
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Komut Nasıl Yazılır?</h2>
              <p className="text-white/60 text-sm">Daha iyi sonuçlar için bu rehberi okuyun</p>
            </div>

            <div className="bg-[#002D72]/20 border border-[#019FDF]/20 rounded-xl p-5 space-y-4">
              {/* Yanlış Örnek */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={16} className="text-red-400" />
                  <span className="font-raleway text-xs font-bold uppercase tracking-wider text-red-400">
                    Yanlış Komut
                  </span>
                </div>
                <p className="font-raleway text-sm text-white/40 line-through">
                  boya badana yap
                </p>
                <p className="font-raleway text-[10px] text-white/30 mt-1">
                  Genel ve belirsiz — AI detayları tahmin etmek zorunda kalır
                </p>
              </div>

              {/* Doğru Örnek */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-green-400" />
                  <span className="font-raleway text-xs font-bold uppercase tracking-wider text-green-400">
                    Doğru Komut
                  </span>
                </div>
                <p className="font-raleway text-sm text-white/80">
                  duvarlara açık bej mat boya, yerlere koyu ceviz laminant parke, büyük sürgülü cam balkon ekle
                </p>
                <p className="font-raleway text-[10px] text-white/30 mt-1">
                  Renk, malzeme, detaylar net belirtilmiş — AI doğru sonuç üretir
                </p>
              </div>

              {/* İpuçları */}
              <div className="border-t border-white/10 pt-4">
                <p className="font-raleway text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                  Detaylı Komut Yazma İpuçları
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Renk', ex: 'açık bej, antrasit, beyaz' },
                    { label: 'Malzeme', ex: 'parke, seramik, mermer' },
                    { label: 'Dokulu', ex: 'mat, parlak, ahşap desenli' },
                    { label: 'Ölçü', ex: 'geniş, yerden tavana, büyük cam' },
                    { label: 'Stil', ex: 'modern, rustik, minimalist' },
                    { label: 'Aksesuar', ex: 'LED şerit, süspot, pirinç kulplar' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 rounded-lg p-3">
                      <p className="font-raleway text-xs font-semibold text-[#019FDF]">{item.label}</p>
                      <p className="font-raleway text-[10px] text-white/40 mt-0.5">{item.ex}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('command')}
              className="w-full py-4 bg-[#F36621] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#e55a1a] transition-colors"
            >
              <Check size={18} /> Anladım, Komut Yazmaya Geç
            </button>
          </div>
        )}

        {/* === 3. KOMUT YAZMA === */}
        {step === 'command' && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Tadilat Komutunuz</h2>
              <p className="text-white/60 text-sm">Ne istediğinizi detaylı yazın</p>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 mb-4">
              <img src={photoPreview} alt="Önizleme" className="w-full max-h-32 object-cover" />
            </div>

            {(selectedAlan || selectedIslem) && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedAlan && <span className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs">{ALANLAR.find(a => a.key === selectedAlan)?.label}</span>}
                {selectedIslem && <span className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs">{ISLEMLER.find(i => i.key === selectedIslem)?.label}</span>}
              </div>
            )}

            <textarea
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="Örn: Duvarları açık bej mat boya, yerlere koyu ceviz laminant parke, büyük sürgülü cam balkon ekle..."
              className="w-full h-40 p-5 bg-[#1a1a1a] border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none text-lg"
            />

            <button
              onClick={startAnalysis}
              className="w-full py-4 bg-white text-[#0a0a0a] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
            >
              <Sparkles size={18} /> YZ Tadilat Oluştur
            </button>
            <button onClick={() => setStep('selection')} className="w-full py-3 text-white/40 text-sm hover:text-white transition-colors">
              ← Geri Dön
            </button>
          </div>
        )}

        {/* === 5. ANALYZING === */}
        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="w-20 h-20 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">AI Analiz Ediyor</h3>
              <p className="text-white/50 text-sm">Yapay zeka fotoğrafınızı ve komutunuzu işliyor...</p>
              <p className="text-white/30 text-xs font-mono">{formatTime(elapsedTime)} • %{progress}</p>
            </div>
            <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-1000 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* === 6. SONUÇ === */}
        {step === 'result' && (
          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div><p className="text-red-400 font-medium">{error}</p>
                  <button onClick={() => setStep('command')} className="text-white/50 text-sm mt-2 hover:text-white">← Tekrar Dene</button>
                </div>
              </div>
            )}

            {generatedImage && (
              <>
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold text-white mb-1">Tadilat Önizlemesi</h2>
                  <p className="text-white/60 text-sm">Yapay zeka tarafından oluşturuldu</p>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square"
                  onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setBeforeAfterPos(((e.clientX - r.left) / r.width) * 100); }}
                  onTouchMove={e => { const r = e.currentTarget.getBoundingClientRect(); const t = e.touches[0]; setBeforeAfterPos(((t.clientX - r.left) / r.width) * 100); }}
                >
                  <img src={generatedImage} alt="Sonrası" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - beforeAfterPos}% 0 0)` }}>
                    <img src={photoPreview} alt="Öncesi" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize" style={{ left: `${beforeAfterPos}%` }}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="flex gap-0.5"><div className="w-0.5 h-3 bg-[#0a0a0a] rounded-full" /><div className="w-0.5 h-3 bg-[#0a0a0a] rounded-full" /></div>
                    </div>
                  </div>
                  <span className="absolute top-4 left-4 px-2 py-1 bg-black/60 rounded text-white text-xs font-medium">ÖNCESİ</span>
                  <span className="absolute top-4 right-4 px-2 py-1 bg-white/90 rounded text-[#0a0a0a] text-xs font-medium">SONRASI</span>
                </div>

                <div className="space-y-4 bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
                  <h3 className="text-white font-medium flex items-center gap-2"><MapPin size={16} className="text-white/40" /> Proje Lokasyonu</h3>
                  <div className="grid grid-cols-2 gap-3 relative">
                    <div ref={ilceRef}>
                      <label className="text-white/40 text-xs mb-1 block">İlçe</label>
                      <button onClick={() => setShowIlceDropdown(!showIlceDropdown)} className="w-full p-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-left text-white flex items-center justify-between">
                        {ilce || 'İlçe Seçin'} <ChevronRight size={14} className="text-white/30" />
                      </button>
                      {showIlceDropdown && (
                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl custom-scrollbar" style={{ width: ilceRef.current?.offsetWidth }}>
                          {Object.keys(hatayIlceler).map(i => (
                            <button key={i} onClick={() => { setIlce(i); setMahalle(''); setShowIlceDropdown(false); }} className="w-full px-4 py-2.5 text-left text-white/70 hover:bg-white/5 text-sm">{i}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div ref={mahalleRef}>
                      <label className="text-white/40 text-xs mb-1 block">Mahalle</label>
                      <button onClick={() => ilce && setShowMahalleDropdown(!showMahalleDropdown)} className={`w-full p-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-left flex items-center justify-between ${ilce ? 'text-white' : 'text-white/30'}`}>
                        {mahalle || 'Mahalle'} <ChevronRight size={14} className="text-white/30" />
                      </button>
                      {showMahalleDropdown && ilce && (
                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-xl custom-scrollbar" style={{ width: mahalleRef.current?.offsetWidth }}>
                          {hatayIlceler[ilce].map(m => (
                            <button key={m} onClick={() => { setMahalle(m); setShowMahalleDropdown(false); }} className="w-full px-4 py-2.5 text-left text-white/70 hover:bg-white/5 text-sm">{m}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs mb-1 block">m²: {metrekare}</label>
                    <input type="range" min="10" max="500" value={metrekare} onChange={e => setMetrekare(parseInt(e.target.value))} className="w-full accent-white" />
                  </div>
                  {priceRange && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-white/40 text-xs">Tahmini Maliyet Aralığı</p>
                      <p className="text-xl font-bold text-white">{priceRange}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-white/40 text-xs text-center">Bu fikir mi? Hemen keşif randevusu alın.</p>
                  <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-colors">
                    <Phone size={20} /> WhatsApp'tan Keşif Randevusu Al
                  </a>

                  {/* REVIZE ET BOLUMU - Sadece 1 kez */}
                  {!revizeUsed && !showRevize && (
                    <button onClick={() => setShowRevize(true)} className="flex items-center justify-center gap-2 w-full py-3 border border-[#F36621]/30 text-[#F36621] rounded-xl hover:border-[#F36621] hover:bg-[#F36621]/10 transition-all">
                      <RefreshCw size={16} /> Revize Et — Yeni İstek Yaz (1 Hak)
                    </button>
                  )}
                  {!revizeUsed && showRevize && (
                    <div className="space-y-3 bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                      <p className="text-white/40 text-xs">Aynı fotoğraf üzerinden yeni bir istekte bulunun:</p>
                      <textarea
                        value={revizeCommand}
                        onChange={e => setRevizeCommand(e.target.value)}
                        placeholder="Örn: Kapıyı beyaz yap, çatıyı kırmızı kiremit yap..."
                        className="w-full h-24 p-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#F36621] resize-none text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowRevize(false)}
                          className="flex-1 py-2.5 border border-white/10 text-white/60 rounded-lg text-sm hover:border-white/30 transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          onClick={async () => {
                            if (!revizeCommand.trim()) return;
                            setShowRevize(false);
                            setCommand(revizeCommand);
                            await doRevizeAnalysis(revizeCommand);
                          }}
                          disabled={!revizeCommand.trim()}
                          className="flex-1 py-2.5 bg-[#F36621] text-white font-bold rounded-lg text-sm hover:bg-[#e55a1a] transition-colors disabled:opacity-40"
                        >
                          Revize Gönder
                        </button>
                      </div>
                    </div>
                  )}

                  <button onClick={() => setStep('command')} className="flex items-center justify-center gap-2 w-full py-3 border border-white/10 text-white/40 rounded-xl hover:border-white/30 hover:text-white/60 transition-all text-sm">
                    ← Komut Ekranına Dön
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
