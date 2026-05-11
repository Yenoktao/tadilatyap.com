import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { X, ChevronRight, ChevronLeft, Home, Building, Castle, Briefcase, Check, Search } from 'lucide-react';
import { illerVeIlceler, iller } from '../data/adres';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Answer = {
  konutTipi?: string;
  metrekare?: string;
  kat?: string;
  binaYasi?: string;
  tadilatKapsami?: string[];
  il?: string;
  ilce?: string;
  acikAdres?: string;
  isim?: string;
  telefon?: string;
};

export default function WizardModal({ isOpen, onClose }: WizardModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answer>({ tadilatKapsami: [] });
  const [direction, setDirection] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [resultVisible, setResultVisible] = useState(false);

  // Address search states
  const [ilSearch, setIlSearch] = useState('');
  const [ilceSearch, setIlceSearch] = useState('');
  const [showIlDropdown, setShowIlDropdown] = useState(false);
  const [showIlceDropdown, setShowIlceDropdown] = useState(false);

  const ilDropdownRef = useRef<HTMLDivElement>(null);
  const ilceDropdownRef = useRef<HTMLDivElement>(null);

  // Reset
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setAnswers({ tadilatKapsami: [] });
      setResultVisible(false);
      setIlSearch('');
      setIlceSearch('');
      setShowIlDropdown(false);
      setShowIlceDropdown(false);
    }
  }, [isOpen]);

  // Entrance
  useEffect(() => {
    if (!overlayRef.current) return;
    if (isOpen) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  }, [isOpen]);

  // Step transition
  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(contentRef.current, { opacity: 0, x: direction * 60 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' });
  }, [step, direction]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ilDropdownRef.current && !ilDropdownRef.current.contains(e.target as Node)) setShowIlDropdown(false);
      if (ilceDropdownRef.current && !ilceDropdownRef.current.contains(e.target as Node)) setShowIlceDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(0, s - 1)); };

  const selectOption = (key: keyof Answer, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setTimeout(goNext, 300);
  };

  const toggleTadilatItem = (item: string) => {
    setAnswers((prev) => {
      const current = prev.tadilatKapsami || [];
      if (current.includes(item)) return { ...prev, tadilatKapsami: current.filter((i) => i !== item) };
      return { ...prev, tadilatKapsami: [...current, item] };
    });
  };

  const selectIl = (il: string) => {
    setAnswers((prev) => ({ ...prev, il, ilce: undefined }));
    setIlSearch(il);
    setIlceSearch('');
    setShowIlDropdown(false);
  };

  const selectIlce = (ilce: string) => {
    setAnswers((prev) => ({ ...prev, ilce }));
    setIlceSearch(ilce);
    setShowIlceDropdown(false);
  };

  const handleSubmit = () => { setResultVisible(true); };

  const totalSteps = 7;

  const filteredIller = iller.filter((il) => il.toLowerCase().includes(ilSearch.toLowerCase()));
  const ilcelerForSelectedIl = answers.il ? illerVeIlceler[answers.il] || [] : [];
  const filteredIlceler = ilcelerForSelectedIl.filter((i) => i.toLowerCase().includes(ilceSearch.toLowerCase()));

  if (!isOpen) return null;

  const canProceedAddress = answers.il && answers.ilce && answers.acikAdres && answers.acikAdres.trim().length > 5;
  const canProceedContact = answers.isim && answers.telefon;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] bg-bg-dark/95 backdrop-blur-xl flex items-center justify-center p-4">
      {/* Close */}
      <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors duration-300 z-10">
        <X size={28} />
      </button>

      {/* Progress */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <div className="h-full bg-accent-blue transition-all duration-500 ease-out" style={{ width: `${(step / (totalSteps - 1)) * 100}%` }} />
      </div>

      {/* Back */}
      {step > 0 && !resultVisible && (
        <button onClick={goBack} className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors duration-300 flex items-center gap-2 font-raleway text-xs tracking-widest uppercase">
          <ChevronLeft size={16} /> Geri
        </button>
      )}

      {/* Content */}
      <div ref={contentRef} className="w-full max-w-xl mx-auto">
        {!resultVisible ? (
          <>
            {/* 0: Konut */}
            {step === 0 && (
              <StepContent title="Konut tipiniz nedir?" subtitle="Tadilat projenize en uygun kategoriyi seçin">
                <div className="grid grid-cols-2 gap-4">
                  <OptionButton icon={<Home size={28} />} label="Daire" onClick={() => selectOption('konutTipi', 'Daire')} selected={answers.konutTipi === 'Daire'} />
                  <OptionButton icon={<Building size={28} />} label="Müstakil" onClick={() => selectOption('konutTipi', 'Müstakil')} selected={answers.konutTipi === 'Müstakil'} />
                  <OptionButton icon={<Castle size={28} />} label="Villa" onClick={() => selectOption('konutTipi', 'Villa')} selected={answers.konutTipi === 'Villa'} />
                  <OptionButton icon={<Briefcase size={28} />} label="Ofis" onClick={() => selectOption('konutTipi', 'Ofis')} selected={answers.konutTipi === 'Ofis'} />
                </div>
              </StepContent>
            )}

            {/* 1: Metrekare */}
            {step === 1 && (
              <StepContent title="Eviniz kaç metrekare?" subtitle="Yaklaşık alan bilgisi yeterli">
                <div className="space-y-3">
                  {['0 - 50 m²', '50 - 100 m²', '100 - 150 m²', '150 - 200 m²', '200+ m²'].map((opt) => (
                    <SelectionButton key={opt} label={opt} onClick={() => selectOption('metrekare', opt)} selected={answers.metrekare === opt} />
                  ))}
                </div>
              </StepContent>
            )}

            {/* 2: Kat */}
            {step === 2 && (
              <StepContent title="Eviniz kaçıncı katta?" subtitle="Bulunduğunuz kat numarası">
                <div className="grid grid-cols-2 gap-4">
                  {['Zemin / Giriş Katı', '1 - 3. Kat', '4 - 7. Kat', '8. Kat ve Üzeri'].map((opt) => (
                    <SelectionButton key={opt} label={opt} onClick={() => selectOption('kat', opt)} selected={answers.kat === opt} compact />
                  ))}
                </div>
              </StepContent>
            )}

            {/* 3: Bina Yaşı */}
            {step === 3 && (
              <StepContent title="Bina kaç yıllık?" subtitle="Binanın yapım yılı hakkında bilgi">
                <div className="space-y-3">
                  {['0 - 5 Yıl (Yeni)', '5 - 15 Yıl', '15 - 30 Yıl', '30+ Yıl (Eski)'].map((opt) => (
                    <SelectionButton key={opt} label={opt} onClick={() => selectOption('binaYasi', opt)} selected={answers.binaYasi === opt} />
                  ))}
                </div>
              </StepContent>
            )}

            {/* 4: Tadilat Kapsamı */}
            {step === 4 && (
              <StepContent title="Tadilat kapsamınız nedir?" subtitle="İlgilendiğiniz alanları seçin, birden fazla seçebilirsiniz">
                <div className="grid grid-cols-2 gap-3">
                  {['Mutfak', 'Banyo', 'Salon', 'Yatak Odası', 'Elektrik Tesisatı', 'Sıhhi Tesisat', 'Boya & Badana', 'Zemin Döşeme', 'Kapı & Pencere', 'Isıtma Sistemi'].map((item) => {
                    const selected = answers.tadilatKapsami?.includes(item);
                    return (
                      <button key={item} onClick={() => toggleTadilatItem(item)}
                        className={`py-3 px-4 rounded-lg border font-raleway text-sm transition-all duration-300 text-left flex items-center gap-3 ${selected ? 'border-accent-blue bg-accent-blue/15 text-accent-blue' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 ${selected ? 'bg-accent-blue border-accent-blue' : 'border-white/30'}`}>
                          {selected && <Check size={10} className="text-bg-dark" />}
                        </div>
                        {item}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => answers.tadilatKapsami && answers.tadilatKapsami.length > 0 ? goNext() : null}
                  className={`w-full mt-6 py-4 font-raleway font-bold text-sm tracking-widest uppercase rounded-sm transition-all duration-300 ${answers.tadilatKapsami && answers.tadilatKapsami.length > 0 ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                  Devam Et <ChevronRight size={16} className="inline ml-2" />
                </button>
              </StepContent>
            )}

            {/* 5: Adres Bilgileri */}
            {step === 5 && (
              <StepContent title="Adres bilgileriniz" subtitle="Tadilat yapılacak adres">
                <div className="space-y-5">
                  {/* İl */}
                  <div ref={ilDropdownRef} className="relative">
                    <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">İl</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input type="text" placeholder="İl ara..." value={ilSearch}
                        onFocus={() => setShowIlDropdown(true)}
                        onChange={(e) => { setIlSearch(e.target.value); setShowIlDropdown(true); }}
                        className="w-full bg-white/5 border border-white/15 rounded-lg pl-10 pr-4 py-3.5 font-raleway text-white placeholder-white/30 outline-none focus:border-accent-blue transition-colors duration-300" />
                    </div>
                    {showIlDropdown && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-bg-concrete border border-white/15 rounded-lg shadow-2xl">
                        {filteredIller.length > 0 ? filteredIller.map((il) => (
                          <button key={il} onClick={() => selectIl(il)}
                            className={`w-full text-left px-4 py-2.5 font-raleway text-sm transition-colors ${answers.il === il ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                            {il}
                          </button>
                        )) : (
                          <div className="px-4 py-3 font-raleway text-sm text-white/30">Sonuç bulunamadı</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* İlçe */}
                  <div ref={ilceDropdownRef} className="relative">
                    <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">İlçe</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input type="text" placeholder={answers.il ? "İlçe ara..." : "Önce il seçin"} value={ilceSearch}
                        disabled={!answers.il}
                        onFocus={() => answers.il && setShowIlceDropdown(true)}
                        onChange={(e) => { setIlceSearch(e.target.value); setShowIlceDropdown(true); }}
                        className={`w-full rounded-lg pl-10 pr-4 py-3.5 font-raleway outline-none transition-colors duration-300 ${answers.il ? 'bg-white/5 border border-white/15 text-white placeholder-white/30 focus:border-accent-blue' : 'bg-white/[0.02] border border-white/5 text-white/20 placeholder-white/10 cursor-not-allowed'}`} />
                    </div>
                    {showIlceDropdown && answers.il && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-bg-concrete border border-white/15 rounded-lg shadow-2xl">
                        {filteredIlceler.length > 0 ? filteredIlceler.map((ilce) => (
                          <button key={ilce} onClick={() => selectIlce(ilce)}
                            className={`w-full text-left px-4 py-2.5 font-raleway text-sm transition-colors ${answers.ilce === ilce ? 'text-accent-blue bg-accent-blue/10 font-semibold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                            {ilce}
                          </button>
                        )) : (
                          <div className="px-4 py-3 font-raleway text-sm text-white/30">Sonuç bulunamadı</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Açık Adres */}
                  <div>
                    <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">Açık Adres</label>
                    <textarea placeholder="Mahalle, Sokak, Bina No, Daire No" rows={3}
                      value={answers.acikAdres || ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, acikAdres: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3.5 font-raleway text-white placeholder-white/30 outline-none focus:border-accent-blue transition-colors duration-300 resize-none text-sm" />
                  </div>
                </div>

                <button onClick={() => canProceedAddress ? goNext() : null}
                  className={`w-full mt-8 py-4 font-raleway font-bold text-sm tracking-widest uppercase rounded-sm transition-all duration-300 ${canProceedAddress ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                  Devam Et <ChevronRight size={16} className="inline ml-2" />
                </button>
              </StepContent>
            )}

            {/* 6: İletişim */}
            {step === 6 && (
              <StepContent title="Size nasıl ulaşalım?" subtitle="Analiz sonuçlarınızı paylaşabilmemiz için">
                <div className="space-y-4">
                  <div>
                    <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">Ad Soyad</label>
                    <input type="text" value={answers.isim || ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, isim: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-5 py-3.5 font-raleway text-white placeholder-white/30 outline-none focus:border-accent-blue transition-colors duration-300" placeholder="İsminiz" />
                  </div>
                  <div>
                    <label className="font-raleway text-xs tracking-widest uppercase text-white/40 block mb-2">Telefon</label>
                    <input type="tel" value={answers.telefon || ''}
                      onChange={(e) => setAnswers((p) => ({ ...p, telefon: e.target.value }))}
                      className="w-full bg-white/5 border border-white/15 rounded-lg px-5 py-3.5 font-raleway text-white placeholder-white/30 outline-none focus:border-accent-blue transition-colors duration-300" placeholder="0555 000 00 00" />
                  </div>
                </div>
                <button onClick={() => canProceedContact ? handleSubmit() : null}
                  className={`w-full mt-8 py-4 font-raleway font-bold text-sm tracking-widest uppercase rounded-sm transition-all duration-300 ${canProceedContact ? 'bg-accent-blue text-bg-dark hover:bg-white cursor-pointer' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}>
                  Analizi Gör <ChevronRight size={16} className="inline ml-2" />
                </button>
              </StepContent>
            )}
          </>
        ) : (
          /* Result */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent-blue/15 flex items-center justify-center mx-auto mb-6">
              <Check size={32} className="text-accent-blue" />
            </div>
            <h2 className="font-raleway font-bold text-white text-3xl uppercase tracking-tight mb-2">Analiz Tamamlandı</h2>
            <p className="font-raleway text-white/50 text-sm mb-8">{answers.isim} için ön maliyet analizi</p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left space-y-4 mb-8">
              <ResultRow label="Konut" value={answers.konutTipi || ''} />
              <ResultRow label="Alan" value={answers.metrekare || ''} />
              <ResultRow label="Kat" value={answers.kat || ''} />
              <ResultRow label="Bina Yaşı" value={answers.binaYasi || ''} />
              <div>
                <span className="font-raleway text-xs text-white/40 uppercase tracking-wider">Tadilat</span>
                <p className="font-raleway text-white text-sm mt-1">{answers.tadilatKapsami?.join(', ')}</p>
              </div>
              <div>
                <span className="font-raleway text-xs text-white/40 uppercase tracking-wider">Adres</span>
                <p className="font-raleway text-white text-sm mt-1">{answers.il} / {answers.ilce}</p>
                <p className="font-raleway text-white/50 text-xs mt-0.5">{answers.acikAdres}</p>
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-raleway text-xs text-white/40 uppercase tracking-wider">Tahmini Maliyet</span>
                  <span className="font-raleway font-bold text-accent-blue text-xl">₺{estimateCost()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-raleway text-xs text-white/40 uppercase tracking-wider">Tahmini Süre</span>
                  <span className="font-raleway font-bold text-white text-lg">{estimateDuration()}</span>
                </div>
              </div>
            </div>

            <p className="font-raleway text-white/40 text-xs mb-6">Detaylı teklif için ekibimiz 24 saat içinde sizi arayacaktır.</p>
            <button onClick={onClose} className="px-10 py-4 bg-accent-blue text-bg-dark font-raleway font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-white transition-colors duration-300">Tamam</button>
          </div>
        )}
      </div>
    </div>
  );

  function estimateCost(): string {
    const mk = answers.metrekare;
    const items = answers.tadilatKapsami?.length || 1;
    let base = 5000;
    if (mk?.includes('50 - 100')) base = 15000;
    else if (mk?.includes('100 - 150')) base = 30000;
    else if (mk?.includes('150 - 200')) base = 50000;
    else if (mk?.includes('200+')) base = 75000;
    else if (mk?.includes('0 - 50')) base = 8000;
    const total = base * (items * 0.6);
    return `${(total / 1000).toFixed(0)}.000 - ${((total * 1.5) / 1000).toFixed(0)}.000`;
  }

  function estimateDuration(): string {
    const items = answers.tadilatKapsami?.length || 1;
    const weeks = Math.max(1, items * 0.8);
    return `${Math.ceil(weeks)} - ${Math.ceil(weeks * 1.8)} hafta`;
  }
}

function StepContent({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-raleway font-bold text-white text-3xl md:text-4xl uppercase tracking-tight mb-2">{title}</h2>
      <p className="font-raleway text-white/40 text-sm mb-8">{subtitle}</p>
      {children}
    </div>
  );
}

function OptionButton({ icon, label, onClick, selected }: { icon: React.ReactNode; label: string; onClick: () => void; selected: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-3 py-6 px-4 rounded-xl border transition-all duration-300 ${selected ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:text-white'}`}>
      {icon}
      <span className="font-raleway text-sm font-medium">{label}</span>
    </button>
  );
}

function SelectionButton({ label, onClick, selected, compact }: { label: string; onClick: () => void; selected: boolean; compact?: boolean }) {
  return (
    <button onClick={onClick} className={`w-full text-left rounded-lg border font-raleway text-sm transition-all duration-300 ${compact ? 'py-3 px-4' : 'py-4 px-6'} ${selected ? 'border-accent-blue bg-accent-blue/15 text-accent-blue font-semibold' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'}`}>
      {label}
    </button>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-raleway text-xs text-white/40 uppercase tracking-wider">{label}</span>
      <span className="font-raleway text-white text-sm">{value}</span>
    </div>
  );
}
