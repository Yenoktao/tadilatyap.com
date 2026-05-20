import { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

const ustaliklar = [
  'Fayans / Seramik',
  'Boya / Badana',
  'Mutfak Dolabı',
  'Elektrik',
  'Tesisat / Su',
  'Alçıpan',
  'Zemin Döşeme',
  'Cam Balkon',
  'Isı Yalıtımı',
  'Çatı / Kaporta',
  'Ahşap / Marangoz',
  'Kaba İnşaat',
  'Duvar Yıkım',
  'Alçı / Sıva',
  'Mobilya Montaj',
];

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnerModal({ isOpen, onClose }: PartnerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  if (!isOpen) return null;

  const toggleUstalik = (u: string) => {
    setSelected((prev) =>
      prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || selected.length === 0) return;
    setSubmitting(true);
    try {
      await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          skills: selected,
        }),
      });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
      setStep('success');
    }
  };

  const reset = () => {
    setName('');
    setPhone('');
    setSelected([]);
    setStep('form');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={reset}
      />

      {/* Modal */}
      <div className="relative z-10 bg-[#0A1628] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-raleway font-bold text-white text-lg uppercase tracking-wide">
            {step === 'form' ? 'Partnerlik Başvurusu' : 'Başvurunuz Alındı'}
          </h3>
          <button
            onClick={reset}
            className="p-2 text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {step === 'form' ? (
          <div className="px-6 py-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block font-raleway text-xs text-white/50 uppercase tracking-wider mb-2">
                Ad Soyad *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white font-raleway text-sm rounded-lg outline-none focus:border-[#F36621] transition-colors placeholder:text-white/20"
                placeholder="Adınız ve soyadınız"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-raleway text-xs text-white/50 uppercase tracking-wider mb-2">
                Telefon *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white font-raleway text-sm rounded-lg outline-none focus:border-[#F36621] transition-colors placeholder:text-white/20"
                placeholder="05XX XXX XX XX"
              />
            </div>

            {/* Skills — multi select */}
            <div>
              <label className="block font-raleway text-xs text-white/50 uppercase tracking-wider mb-3">
                Ustalıklarınız * (Birden fazla seçebilirsiniz)
              </label>
              <div className="flex flex-wrap gap-2">
                {ustaliklar.map((u) => {
                  const active = selected.includes(u);
                  return (
                    <button
                      key={u}
                      onClick={() => toggleUstalik(u)}
                      className={`px-3 py-2 rounded-lg text-xs font-raleway transition-all duration-200 flex items-center gap-1.5 border ${
                        active
                          ? 'bg-[#F36621] text-white border-[#F36621]'
                          : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {active && <Check size={12} />}
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !phone.trim() || selected.length === 0 || submitting}
              className="w-full py-4 bg-[#F36621] text-white font-raleway font-bold text-sm tracking-widest uppercase rounded-lg hover:bg-[#e55a1a] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                'Başvuruyu Gönder'
              )}
            </button>
          </div>
        ) : (
          /* Success */
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F36621]/20 flex items-center justify-center mx-auto mb-5">
              <Check size={32} className="text-[#F36621]" />
            </div>
            <h4 className="font-raleway font-bold text-white text-lg mb-3">
              Başvurunuz Alındı!
            </h4>
            <p className="font-raleway text-white/50 text-sm mb-6">
              En kısa sürede size dönüş yapacağız. İlginiz için teşekkür ederiz.
            </p>
            <button
              onClick={reset}
              className="px-8 py-3 bg-white/5 border border-white/10 text-white font-raleway text-sm rounded-lg hover:bg-white/10 transition-colors"
            >
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
