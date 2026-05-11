import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

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
  const [submitted, setSubmitted] = useState(false);

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
    setSubmitted(true);
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
            {submitted ? (
              <div className="bg-bg-dark text-white p-8 rounded-lg">
                <h3 className="font-raleway font-bold text-2xl mb-4">
                  Teklif Talebiniz Alındı!
                </h3>
                <p className="font-raleway text-white/70 leading-relaxed">
                  Kontratörler 24 saat içinde iletişime geçecek. Yeni bir tadilat
                  başlatmak için aşağıdaki butonu kullanabilirsiniz.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
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
            ) : (
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
                    required
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
                    <p className="font-raleway text-white">+90 212 555 00 00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Mail className="text-accent-blue mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-raleway text-sm text-white/60">E-posta</p>
                    <p className="font-raleway text-white">info@recabemobilya.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="text-accent-blue mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-raleway text-sm text-white/60">Adres</p>
                    <p className="font-raleway text-white">
                      Levent Mah. Büyükdere Cad. No:123
                      <br />
                      Şişli / İstanbul
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock className="text-accent-blue mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-raleway text-sm text-white/60">Çalışma Saatleri</p>
                    <p className="font-raleway text-white">
                      Pazartesi - Cuma: 09:00 - 18:00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
