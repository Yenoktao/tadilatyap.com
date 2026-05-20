import { useState } from 'react';
import { ArrowRight, Users } from 'lucide-react';
import PartnerModal from './PartnerModal';

export default function PartnerSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section
        id="cozum-ortagi"
        className="relative w-full bg-[#1a1a2e] overflow-hidden"
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
            {/* Left — Image */}
            <div className="relative h-[300px] lg:h-auto">
              <img
                src="/assets/partner-tools.jpg"
                alt="Mimari alet detayi"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a1a2e]/90 lg:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] to-transparent lg:hidden" />
            </div>

            {/* Right — Text */}
            <div className="flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F36621]/15 border border-[#F36621]/30 rounded-full mb-6 w-fit">
                <Users size={16} className="text-[#F36621]" />
                <span className="font-raleway text-xs tracking-[0.2em] uppercase text-[#F36621]">
                  Usta & Ekip
                </span>
              </div>

              <h2 className="font-raleway font-bold text-white text-2xl md:text-4xl uppercase tracking-tight mb-5">
                Çözüm Ortaklarımız Olun
              </h2>

              <p className="font-raleway text-white/60 text-sm md:text-base leading-relaxed mb-4 max-w-lg">
                Tadilat sektöründe uzman ekibimizle birlikte çalışmak isteyen
                ustalarımızı arıyoruz. Birlikte daha fazla projeye imza atalım.
              </p>

              <ul className="space-y-2 mb-8">
                {[
                  'Sürekli iş hacmi ve düzenli ödeme',
                  'Profesyonel yönetim ve şeffaf süreç',
                  'Bölgenize yakın projelerden haberdar olun',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#F36621] mt-1">•</span>
                    <span className="font-raleway text-sm text-white/50">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#F36621] text-white font-raleway font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-[#e55a1a] transition-all duration-300 shadow-lg shadow-[#F36621]/20 w-fit"
              >
                Partnerlik Başvurusu Yap
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <PartnerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
