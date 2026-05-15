import { useState, useCallback, useRef } from 'react';
import {
  X, ImagePlus, Sparkles, ChevronRight, RefreshCw, Check,
  AlertCircle, MapPin, Phone
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface Props { isOpen: boolean; onClose: () => void; }

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

// Gorseli sirastir + hem base64 onizleme hem Blob uret
async function compressImage(file: File): Promise<{ dataUrl: string; blob: Blob }> {
  const blob = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.7 });
  const dataUrl = await imageCompression.getDataUrlFromFile(blob);
  return { dataUrl, blob };
}

// FormData ile dosya gonder (binary, base64 degil)
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
  // Akış adımları: upload → command → analyzing → result
  const [step, setStep] = useState<'upload' | 'command' | 'analyzing' | 'result'>('upload');

  const [photoPreview, setPhotoPreview] = useState('');
  const [imageFile, setImageFile] = useState<Blob | null>(null);
  const [command, setCommand] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const ilceRef = useRef<HTMLDivElement>(null);
  const mahalleRef = useRef<HTMLDivElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const { dataUrl, blob } = await compressImage(file);
      setPhotoPreview(dataUrl);
      setImageFile(blob);
      setStep('command');
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

    const timer = setInterval(() => setElapsedTime(t => t + 1), 1000);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 1000);

    try {
      const result = await callRenovateAPI(imageFile, command);
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

      {/* İlerleme çubuğu */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-white/5 z-40">
        <div className="h-full bg-accent-blue transition-all" style={{
          width: step === 'upload' ? '25%' : step === 'command' ? '50%' : step === 'analyzing' ? `${progress}%` : '100%'
        }} />
      </div>

      <div className="min-h-screen flex items-center justify-center pt-10">
        <div className="w-full max-w-lg mx-auto">

          {/* ═══ ADIM 1: GÖRSEL YÜKLE ═══ */}
          {step === 'upload' && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto mb-4">
                <ImagePlus size={24} className="text-accent-blue" />
              </div>
              <h2 className="font-raleway font-bold text-white text-2xl mb-2">Mekanınızı Fotoğraflayın</h2>
              <p className="font-raleway text-white/40 text-sm mb-8">Tadilat yapılacak alanın fotoğrafını yükleyin</p>

              <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-accent-blue/40 rounded-2xl p-14 text-center cursor-pointer transition-all bg-white/[0.01]">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                <ImagePlus size={48} className="mx-auto mb-4 text-white/20" />
                <p className="font-raleway text-white/60 text-sm mb-2">Sürükleyip bırakın veya tıklayın</p>
                <p className="font-raleway text-white/25 text-xs">JPG, PNG</p>
              </div>
            </div>
          )}

          {/* ═══ ADIM 2: KOMUT YAZ ═══ */}
          {step === 'command' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('upload')} className="text-white/30 hover:text-white/60 text-xs font-raleway">
                  <ChevronRight size={12} className="rotate-180 inline" /> Geri
                </button>
              </div>

              {photoPreview && (
                <div className="relative mb-6 rounded-xl overflow-hidden border border-white/10 max-w-sm mx-auto">
                  <img src={photoPreview} alt="" className="w-full h-48 object-cover" />
                </div>
              )}

              <h2 className="font-raleway font-bold text-white text-xl mb-4 text-center">Tadilat Talebinizi Yazın</h2>

              <div className="mb-4">
                <textarea
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  placeholder="Örn: Kulübeyi tamamen ahşap kaplama yap, büyük cam ekle, içi modern olsun..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 font-raleway text-white text-sm placeholder-white/20 outline-none focus:border-accent-blue/50 transition-colors resize-none"
                  rows={4}
                />
              </div>

              <button onClick={() => command.trim() ? startAnalysis() : null}
                className={`w-full py-4 rounded-xl font-raleway font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${command.trim() ? 'bg-accent-blue text-bg-dark hover:bg-white' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                <Sparkles size={16} /> YZ Tadilat Oluştur
              </button>
            </div>
          )}

          {/* ═══ ADIM 3: AI LOADING ═══ */}
          {step === 'analyzing' && (
            <div className="text-center py-12">
              {photoPreview && (
                <div className="relative mx-auto mb-8 rounded-xl overflow-hidden border border-white/10 max-w-md">
                  <img src={photoPreview} alt="" className="w-full h-56 object-cover blur-xl opacity-40 animate-pulse" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-bg-dark/80 rounded-full border border-accent-blue/30">
                    <span className="font-raleway text-accent-blue text-xs font-medium animate-pulse">YZ İşliyor...</span>
                  </div>
                </div>
              )}

              <h3 className="font-raleway font-bold text-white text-lg mb-2">Tadilat Tasarımı Oluşturuluyor</h3>
              <p className="font-raleway text-white/30 text-xs mb-4">{formatTime(elapsedTime)} geçti • Tahmini: 30-60 sn</p>

              <div className="max-w-xs mx-auto">
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-blue rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="font-raleway text-white/20 text-xs mt-2 text-right">%{progress}</p>
              </div>
            </div>
          )}

          {/* ═══ ADIM 4: SONUÇ ═══ */}
          {step === 'result' && (
            <div>
              {/* HATA */}
              {error && (
                <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle size={14} className="text-red-400" />
                  <p className="font-raleway text-red-300 text-xs">{error}</p>
                  <button onClick={startAnalysis} className="ml-auto text-accent-blue text-xs font-raleway hover:underline">Tekrar Dene</button>
                </div>
              )}

              {/* ÖNCESİ/SONRASI SLIDER */}
              {generatedImage && (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-bg-dark/80 rounded-full font-raleway text-white/60 text-xs">Öncesi</span>
                    <div className="flex-1" />
                    <span className="px-3 py-1 bg-accent-blue/90 rounded-full font-raleway text-bg-dark text-xs font-semibold">YZ Sonrası</span>
                  </div>

                  <div className="relative mb-6 rounded-xl overflow-hidden border border-white/10 select-none">
                    <div className="relative h-64 md:h-80">
                      <img src={generatedImage} alt="YZ Sonrası" className="absolute inset-0 w-full h-full object-cover" onError={() => setError('Görsel yüklenemedi')} />
                      {photoPreview && (
                        <>
                          <div className="absolute inset-0 overflow-hidden" style={{ width: `${beforeAfterPos}%` }}>
                            <img src={photoPreview} alt="Öncesi" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (beforeAfterPos / 100)}%` }} />
                          </div>
                          <div className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-10" style={{ left: `${beforeAfterPos}%` }}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center">
                              <div className="flex gap-0.5"><ChevronRight size={10} className="text-bg-dark rotate-180" /><ChevronRight size={10} className="text-bg-dark" /></div>
                            </div>
                          </div>
                          <input type="range" min={0} max={100} value={beforeAfterPos} onChange={e => setBeforeAfterPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* İLÇE/MAHALLE SEÇİMİ (FİYAT İÇİN) */}
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 mb-4">
                    <h3 className="font-raleway font-semibold text-white text-sm mb-4">Proje Lokasyonu (Fiyat Tahmini İçin)</h3>

                    <div className="mb-3">
                      <label className="font-raleway text-xs text-white/40 block mb-1">İl</label>
                      <input type="text" value="Hatay" disabled className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 font-raleway text-white/50 text-sm cursor-not-allowed" />
                    </div>

                    <div className="mb-3" ref={ilceRef}>
                      <label className="font-raleway text-xs text-white/40 block mb-1">İlçe *</label>
                      <button onClick={() => setShowIlceDropdown(!showIlceDropdown)} className={`w-full text-left bg-white/5 border rounded-lg px-3 py-2.5 font-raleway text-sm transition-colors ${ilce ? 'border-accent-blue/30 text-white' : 'border-white/10 text-white/30'}`}>
                        {ilce || 'İlçe seçin...'}
                      </button>
                      {showIlceDropdown && (
                        <div className="mt-1 w-full max-h-40 overflow-y-auto bg-[#111] border border-white/10 rounded-lg shadow-2xl custom-scrollbar z-30 relative">
                          {Object.keys(hatayIlceler).map(i => (
                            <button key={i} onClick={() => { setIlce(i); setMahalle(''); setShowIlceDropdown(false); }} className={`w-full text-left px-3 py-2 font-raleway text-sm transition-colors ${ilce === i ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>{i}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-3" ref={mahalleRef}>
                      <label className="font-raleway text-xs text-white/40 block mb-1">Mahalle *</label>
                      <button onClick={() => ilce ? setShowMahalleDropdown(!showMahalleDropdown) : null} className={`w-full text-left bg-white/5 border rounded-lg px-3 py-2.5 font-raleway text-sm transition-colors ${!ilce ? 'border-white/5 text-white/20 cursor-not-allowed' : mahalle ? 'border-accent-blue/30 text-white' : 'border-white/10 text-white/30'}`}>
                        {mahalle || (ilce ? 'Mahalle seçin...' : 'Önce ilçe seçin')}
                      </button>
                      {showMahalleDropdown && (
                        <div className="mt-1 w-full max-h-40 overflow-y-auto bg-[#111] border border-white/10 rounded-lg shadow-2xl custom-scrollbar z-30 relative">
                          {(hatayIlceler[ilce] || []).map(m => (
                            <button key={m} onClick={() => { setMahalle(m); setShowMahalleDropdown(false); }} className={`w-full text-left px-3 py-2 font-raleway text-sm transition-colors ${mahalle === m ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>{m}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-raleway text-xs text-white/40">Metrekare</label>
                        <span className="font-raleway font-bold text-accent-blue text-sm">{metrekare}m²</span>
                      </div>
                      <input type="range" min={10} max={200} step={5} value={metrekare} onChange={e => setMetrekare(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full accent-accent-blue" />
                    </div>

                    {/* FİYAT */}
                    {ilce && mahalle && (
                      <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-center mb-4">
                        <p className="font-raleway text-xs text-white/40 uppercase tracking-widest mb-1">Tahmini Fiyat (Hatay / {ilce})</p>
                        <p className="font-raleway font-black text-white text-2xl">{priceRange}</p>
                        <p className="font-raleway text-white/25 text-xs mt-1">{metrekare}m² bazlı hesaplanmıştır</p>
                      </div>
                    )}

                    {/* WHATSAPP CTA */}
                    {ilce && mahalle && (
                      <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                        className="block w-full py-4 bg-[#25D366] rounded-lg font-raleway font-bold text-sm tracking-widest uppercase text-white hover:bg-[#22bf5b] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(37,211,102,0.15)]">
                        <Phone size={16} /> Keşif Randevusu Al
                      </a>
                    )}
                  </div>

                  {/* YENİDEN OLUŞTUR */}
                  <button onClick={() => { setGeneratedImage(''); setStep('command'); setError(''); }}
                    className="w-full py-3 rounded-lg font-raleway font-bold text-xs tracking-widest uppercase bg-white/5 border border-white/10 text-white hover:border-accent-blue hover:text-accent-blue transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={14} /> Yeniden Oluştur
                  </button>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
