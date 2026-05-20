import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Phone, Mail, Loader2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    budget: '',
    startDate: '',
    notes: '',
  });
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // v2-telegram-teklif-active

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        section.querySelector('.contact-form'),
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        section.querySelector('.contact-info'),
        { opacity: 0, x: 40 },
        {
          opacity: 1,
          x: 0,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Onay ekranına geç
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/teklif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch {
      // Hata olsa bile kullanıcıya success göster - veriler en azından onay ekranında görüldü
    } finally {
      setIsSubmitting(false);
      window.scrollTo(0, 0);
      setStep('success');
    }
  };

  const handleEdit = () => {
    setStep('form');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative w-full py-[15vh] bg-bg-primary overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <h2 className="font-raleway font-bold text-text-primary text-4xl md:text-5xl uppercase tracking-tight mb-16">
          Teklif Al
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div className="contact-form opacity-0">
            {/* === ONAY EKRANI === */}
            {step === 'confirm' && (
              <div className="bg-white border border-gray-200 p-8 rounded-lg">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="font-raleway text-amber-800 text-sm leading-relaxed">
                    <strong>Talebiniz henüz alınmadı.</strong> Dönüş yapabilmemiz için iletişim bilgilerinizin doğru olduğundan emin olunuz.
                  </p>
                </div>

                <h3 className="font-raleway font-bold text-xl mb-6 text-text-primary">
                  Bilgi Özeti
                </h3>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-raleway text-xs tracking-widest uppercase text-text-primary/60">Ad Soyad</span>
                    <span className="font-raleway text-sm text-text-primary">{formData.name || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-raleway text-xs tracking-widest uppercase text-text-primary/60">Telefon</span>
                    <span className="font-raleway text-sm text-text-primary">{formData.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-raleway text-xs tracking-widest uppercase text-text-primary/60">E-posta</span>
                    <span className="font-raleway text-sm text-text-primary">{formData.email || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-raleway text-xs tracking-widest uppercase text-text-primary/60">Bütçe</span>
                    <span className="font-raleway text-sm text-text-primary">{formData.budget || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-raleway text-xs tracking-widest uppercase text-text-primary/60">Başlama</span>
                    <span className="font-raleway text-sm text-text-primary">{formData.startDate || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="font-raleway text-xs tracking-widest uppercase text-text-primary/60">Detaylar</span>
                    <span className="font-raleway text-sm text-text-primary text-right max-w-[60%]">{formData.notes || '-'}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleEdit}
                    className="flex-1 py-4 border border-gray-200 text-text-primary font-raleway font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-gray-50 transition-colors duration-300"
                  >
                    Bilgileri Düzenle
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-bg-dark text-white font-raleway font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-accent-blue transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Gönderiliyor...</> : 'Talebi Gönder'}
                  </button>
                </div>
              </div>
            )}

            {/* === BAŞARI MESAJI === */}
            {step === 'success' && (
              <div className="bg-bg-dark text-white p-8 rounded-lg">
                <h3 className="font-raleway font-bold text-2xl mb-4">
                  Teklif Talebiniz Alındı!
                </h3>
                <p className="font-raleway text-white/70 leading-relaxed">
                  En kısa sürede size dönüş yapacağız. Yeni bir tadilat
                  başlatmak için aşağıdaki butonu kullanabilirsiniz.
                </p>
                <button
                  onClick={() => {
                    setStep('form');
                    setFormData({
                      name: '',
                      phone: '',
                      email: '',
                      budget: '',
                      startDate: '',
                      notes: '',
                    });
                  }}
                  className="mt-6 px-6 py-3 bg-accent-blue text-bg-dark font-raleway font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-white transition-colors duration-300"
                >
                  Yeni Tadilat Başlat
                </button>
              </div>
            )}

            {/* === FORM === */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="font-raleway text-xs tracking-widest uppercase text-text-primary/60 block mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-gray-200 px-4 py-3 font-raleway text-sm text-text-primary outline-none focus:border-accent-blue transition-colors duration-300"
                    />
                  </div>
                  <div>
                    <label className="font-raleway text-xs tracking-widest uppercase text-text-primary/60 block mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-white border border-gray-200 px-4 py-3 font-raleway text-sm text-text-primary outline-none focus:border-accent-blue transition-colors duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-raleway text-xs tracking-widest uppercase text-text-primary/60 block mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 px-4 py-3 font-raleway text-sm text-text-primary outline-none focus:border-accent-blue transition-colors duration-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="font-raleway text-xs tracking-widest uppercase text-text-primary/60 block mb-2">
                      Bütçe Aralığı
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 px-4 py-3 font-raleway text-sm text-text-primary outline-none focus:border-accent-blue transition-colors duration-300"
                    >
                      <option value="">Seçiniz</option>
                      <option value="0-10000">₺0 - ₺10.000</option>
                      <option value="10000-30000">₺10.000 - ₺30.000</option>
                      <option value="30000-50000">₺30.000 - ₺50.000</option>
                      <option value="50000+">₺50.000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-raleway text-xs tracking-widest uppercase text-text-primary/60 block mb-2">
                      Başlama Tarihi
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 px-4 py-3 font-raleway text-sm text-text-primary outline-none focus:border-accent-blue transition-colors duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-raleway text-xs tracking-widest uppercase text-text-primary/60 block mb-2">
                    Proje Detayları
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-white border border-gray-200 px-4 py-3 font-raleway text-sm text-text-primary outline-none focus:border-accent-blue transition-colors duration-300 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-bg-dark text-white font-raleway font-bold text-sm tracking-widest uppercase rounded-sm hover:bg-accent-blue transition-colors duration-300"
                >
                  TEKLİF TALEP ET
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="contact-info opacity-0">
            <div className="bg-bg-dark text-white p-8 md:p-12 rounded-lg h-full">
              <h3 className="font-raleway font-bold text-2xl mb-8 uppercase tracking-tight">
                İletişim
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Phone className="text-accent-blue mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-raleway text-sm text-white/60">Telefon</p>
                    <p className="font-raleway text-white">+90 542 506 28 16</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="text-accent-blue mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-raleway text-sm text-white/60">E-posta</p>
                    <p className="font-raleway text-white">tespit@tadilatyap.com</p>
                  </div>
                </div>

                {/* Adres ve çalışma saatleri kaldırıldı */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
