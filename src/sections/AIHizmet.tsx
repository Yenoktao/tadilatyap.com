import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Camera, Pencil, Brain, MessageCircle, Sliders, Eye, Phone, FolderCheck, ArrowRight, ChevronRight, Info } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const flowSteps = [
  { num: '1', title: 'FOTOĞRAF İLE BAŞLA', items: ['Fotoğraf Yükle', 'Kamerayı Aç', 'Örnek Fotoğraflar'], icon: Camera },
  { num: '2', title: 'ALAN İŞARETLEME', items: ['Çizim Aracı', 'Silgi', 'Geri Al / İleri Al', 'Sesli Anlatım', 'Açıklama Yaz'], icon: Pencil },
  { num: '3', title: 'AI ANALİZ', items: ['Alan Algılama', 'Özellik Algılama', 'Olası İşlemler', 'Risk Tespiti'], icon: Brain },
  { num: '4', title: 'AI SORULARI', items: ['Dinamik Sorular', 'Evet / Hayır', 'Seçenekler', 'Ek Fotoğraf İsteği'], icon: MessageCircle },
  { num: '5', title: 'TERCİHLER', items: ['Stil Seçimi', 'Bütçe Aralığı', 'Zamanlama'], icon: Sliders },
  { num: '6', title: 'SONUÇ', items: ['Öncesi / Sonrası', 'Tahmini Fiyat', 'İş Listesi', 'Süre Tahmini'], icon: Eye },
  { num: '7', title: 'İLETİŞİM', items: ['Telefon / WhatsApp', 'Form Bilgileri', 'Uzmanla Görüş'], icon: Phone },
  { num: '8', title: 'PROJELERİM', items: ['Kayıtlı Projeler', 'Tekliflerim', 'Süreç Takibi'], icon: FolderCheck },
];

const analizItems = [
  { label: 'Alan Tipi', value: 'Balkon', icon: 'grid' },
  { label: 'Tahmini Alan', value: '6.2 m²', icon: 'clock' },
  { label: 'Mevcut Özellikler', value: 'Cam korkuluk\nSeramik zemin', icon: 'grid' },
  { label: 'Olası İşlemler', value: '• Kapatma\n• İç mekana katma\n• Zemin yenileme\n• Isı yalıtımı', icon: 'layers' },
];

export default function AIHizmet() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        section.querySelectorAll('.animate-in'),
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 65%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="ai-hizmet"
      ref={sectionRef}
      className="relative w-full bg-[#002D72] overflow-hidden"
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 lg:px-16 py-20 md:py-28">
        {/* Header */}
        <div className="text-center mb-16 animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F36621]/15 border border-[#F36621]/30 rounded-full mb-4">
            <Brain size={16} className="text-[#F36621]" />
            <span className="font-raleway text-xs tracking-[0.2em] uppercase text-[#F36621]">
              Yapay Zeka Destekli
            </span>
          </div>
          {/* COK YAKINDA Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#019FDF]/15 border-2 border-[#019FDF]/40 rounded-full mb-6 animate-pulse">
            <span className="relative flex h-2.5 w-2.5 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#019FDF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#019FDF]"></span>
            </span>
            <span className="font-raleway text-sm font-bold tracking-[0.25em] uppercase text-[#019FDF]">
              Çok Yakında
            </span>
          </div>
          <h2 className="font-raleway font-bold text-white text-3xl md:text-5xl uppercase tracking-tight mb-5">
            AI Tadilat Analizi
          </h2>
          <p className="font-raleway text-white/60 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Fotoğraf yükleyin, yapay zeka alan algılama ve analiz ile size özel
            tahmini fiyat, süre ve malzeme önerilerini anında sunsun.
          </p>
        </div>

        {/* Demo Interface Mockup */}
        <div className="animate-in mb-16 relative">
          {/* COK YAKINDA Ribbon */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-6 py-1.5 bg-[#019FDF] rounded-full shadow-lg shadow-[#019FDF]/30">
            <span className="font-raleway text-[11px] font-bold tracking-[0.2em] uppercase text-white">
              Ön İzleme — Çok Yakında Hizmete Girecek
            </span>
          </div>
          <div className="bg-[#0A1628] rounded-xl border border-white/10 overflow-hidden shadow-2xl max-w-6xl mx-auto relative">
            {/* Mockup header bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#061020] border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#F36621]" />
                <span className="font-raleway text-xs text-white/50 tracking-wider">TADILATYAP.COM</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                <span className="font-raleway text-[10px] text-white/40">Adım 1 / 6</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left panel - Upload area */}
              <div className="lg:col-span-3 p-5 border-r border-white/5">
                <p className="font-raleway text-sm text-white mb-1">Neyi değiştirmek istiyorsunuz?</p>
                <p className="font-raleway text-[11px] text-white/40 mb-5 leading-relaxed">
                  Fotoğraf yükleyin, değiştirmek istediğiniz alanları işaretleyin veya anlatın.
                </p>

                <button className="w-full py-3 bg-[#F36621] text-white font-raleway text-xs font-bold tracking-wider rounded-lg mb-3 hover:bg-[#e55a1a] transition-colors flex items-center justify-center gap-2">
                  <Camera size={14} />
                  Fotoğraf Yükle
                </button>
                <button className="w-full py-3 bg-white/5 border border-white/10 text-white/70 font-raleway text-xs rounded-lg mb-5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                  <Camera size={14} />
                  Kamerayı Aç
                </button>

                <p className="font-raleway text-[10px] text-white/30 mb-3">Örnek Fotoğraflar</p>
                <div className="flex gap-2 mb-5">
                  <div className="w-16 h-12 bg-white/5 rounded border border-white/10" />
                  <div className="w-16 h-12 bg-white/5 rounded border border-white/10" />
                  <div className="w-16 h-12 bg-white/5 rounded border border-white/10" />
                </div>

                <div className="p-3 bg-[#019FDF]/10 border border-[#019FDF]/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info size={12} className="text-[#019FDF] mt-0.5 flex-shrink-0" />
                    <p className="font-raleway text-[10px] text-[#019FDF]/80 leading-relaxed">
                      İpucu: Daha net sonuç için birden fazla açıdan fotoğraf yükleyebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>

              {/* Center - Image preview */}
              <div className="lg:col-span-6 relative bg-[#0D1B2A] min-h-[300px] lg:min-h-[400px]">
                {/* Tooltip */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-2 bg-[#0A1628] border border-white/15 rounded-full shadow-lg flex items-center gap-2">
                    <span className="font-raleway text-[11px] text-white/70">
                      Değiştirmek istediğiniz alanı seçin, çizim yapın veya anlatın
                    </span>
                    <ChevronRight size={12} className="text-white/30" />
                  </div>
                </div>

                {/* Mock photo area with annotation lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-[85%] h-[80%] bg-gradient-to-br from-[#1a2332] to-[#0f1923] rounded-lg overflow-hidden">
                    {/* Simulated photo content */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8B7355] via-[#6B5344] to-[#4A3728] opacity-30" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#C4A882] to-transparent opacity-20" />

                    {/* Simulated annotation lines on the photo */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                      <path d="M50 200 Q100 150 200 160 Q280 170 350 140" stroke="#F36621" strokeWidth="2" fill="none" strokeDasharray="6,4" />
                      <path d="M120 220 Q160 180 240 190 Q300 200 340 180" stroke="#F36621" strokeWidth="2" fill="none" strokeDasharray="6,4" />
                      <circle cx="80" cy="180" r="4" fill="#F36621" />
                      <circle cx="320" cy="150" r="4" fill="#F36621" />
                    </svg>

                    {/* Annotation toolbar */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-[#0A1628]/90 backdrop-blur rounded-full border border-white/10">
                      <div className="w-6 h-6 rounded-full bg-[#F36621]" />
                      <Pencil size={14} className="text-white/50" />
                      <div className="w-[1px] h-4 bg-white/20" />
                      <ArrowRight size={14} className="text-white/30" />
                      <ArrowRight size={14} className="text-white/30 rotate-180" />
                      <div className="w-[1px] h-4 bg-white/20" />
                    </div>

                    {/* Voice input hint */}
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-[#0A1628]/80 rounded-full border border-white/10">
                      <span className="text-[10px] text-white/40 font-raleway">Veya sesli anlatın</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel - AI Analysis */}
              <div className="lg:col-span-3 p-5 border-l border-white/5">
                <h3 className="font-raleway text-sm text-white font-semibold mb-5 flex items-center gap-2">
                  <Brain size={14} className="text-[#019FDF]" />
                  AI Analiz Özizlemesi
                </h3>

                <div className="space-y-4">
                  {analizItems.map((item, i) => (
                    <div key={i} className="pb-4 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#019FDF]" />
                        </div>
                        <span className="font-raleway text-[11px] text-white/40">{item.label}</span>
                      </div>
                      <p className="font-raleway text-xs text-white/80 ml-6 whitespace-pre-line leading-relaxed">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-3 bg-white/3 rounded-lg border border-white/5">
                  <p className="font-raleway text-[9px] text-white/30 leading-relaxed">
                    Analiz sonuçları tahminidir. Keşif sonrası değişiklik gösterebilir.
                  </p>
                </div>

                <button className="w-full mt-4 py-3 bg-[#F36621] text-white font-raleway text-xs font-bold tracking-wider rounded-lg flex items-center justify-center gap-2 hover:bg-[#e55a1a] transition-colors">
                  Devam Et
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Flowchart */}
        <div className="animate-in">
          <h3 className="font-raleway text-xl md:text-2xl text-white text-center mb-10 tracking-tight">
            8 Adımda <span className="text-[#F36621]">AI Tadilat</span> Süreci
          </h3>

          {/* Desktop: horizontal flow */}
          <div className="hidden md:block">
            {/* Main flow line */}
            <div className="relative flex items-start justify-between gap-2 mb-8">
              {flowSteps.map((step, i) => (
                <div key={i} className="flex-1 flex flex-col items-center relative">
                  {/* Connector line */}
                  {i < flowSteps.length - 1 && (
                    <div className="absolute top-5 left-[60%] right-[-40%] h-[2px] bg-gradient-to-r from-[#F36621]/40 to-[#019FDF]/30" />
                  )}

                  {/* Step number circle */}
                  <div className="relative z-10 w-10 h-10 rounded-lg bg-[#002D72] border border-[#F36621]/50 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(243,102,33,0.15)]">
                    <span className="font-raleway text-xs font-bold text-[#F36621]">{step.num}</span>
                  </div>

                  {/* Title */}
                  <h4 className="font-raleway text-[10px] text-white/80 text-center font-semibold tracking-wide uppercase mb-2">
                    {step.title}
                  </h4>

                  {/* Items */}
                  <div className="space-y-1.5 w-full px-1">
                    {step.items.map((item, j) => (
                      <div
                        key={j}
                        className="px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded text-center"
                      >
                        <span className="font-raleway text-[9px] text-white/50 leading-tight">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical accordion */}
          <div className="md:hidden space-y-3">
            {flowSteps.map((step, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.08] rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded bg-[#002D72] border border-[#F36621]/40 flex items-center justify-center flex-shrink-0">
                    <span className="font-raleway text-[10px] font-bold text-[#F36621]">{step.num}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <step.icon size={14} className="text-[#019FDF]" />
                    <h4 className="font-raleway text-xs text-white/80 font-semibold uppercase tracking-wide">
                      {step.title}
                    </h4>
                  </div>
                </div>
                <div className="px-4 pb-3 pl-14 flex flex-wrap gap-1.5">
                  {step.items.map((item, j) => (
                    <span
                      key={j}
                      className="px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded font-raleway text-[9px] text-white/45"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <button
              onClick={() => {
                const el = document.getElementById('hero');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#F36621] text-white font-raleway font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-[#e55a1a] transition-all duration-300 shadow-lg shadow-[#F36621]/20"
            >
              Tadilata Başla
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
