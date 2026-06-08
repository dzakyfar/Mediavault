import { Languages } from 'lucide-react';
import { AppLanguage, useLanguage } from '../../context/LanguageContext';

const options: Array<{
  value: AppLanguage;
  labelId: string;
  labelEn: string;
  descriptionId: string;
  descriptionEn: string;
}> = [
  {
    value: 'id',
    labelId: 'Bahasa Indonesia',
    labelEn: 'Indonesian',
    descriptionId: 'Gunakan istilah yang natural untuk workflow project lokal.',
    descriptionEn: 'Use natural Indonesian terms for local project workflows.',
  },
  {
    value: 'en',
    labelId: 'Bahasa Inggris',
    labelEn: 'English',
    descriptionId: 'Gunakan label bahasa Inggris untuk kolaborator internasional.',
    descriptionEn: 'Use English labels for international users and collaborators.',
  },
];

export default function LanguagePreferenceCard() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#F5C800]/10 text-[#F5C800] flex items-center justify-center">
          <Languages className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Bahasa Tampilan', 'Display Language')}
          </h2>
          <p className="text-sm text-[#888888]">
            {t('Pilih bahasa yang paling nyaman untuk navigasi dan teks utama aplikasi.', 'Choose the language used for primary navigation and app labels.')}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {options.map((option) => {
          const active = language === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLanguage(option.value)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                active
                  ? 'border-[#F5C800] bg-[#F5C800]/10 shadow-[0_0_24px_rgba(245,200,0,0.12)]'
                  : 'border-[#2A2A2A] bg-[#141414] hover:border-[#F5C800]/70'
              }`}
            >
              <div className={active ? 'font-bold text-[#F5C800]' : 'font-bold text-white'}>
                {t(option.labelId, option.labelEn)}
              </div>
              <p className="mt-1 text-sm text-[#888888]">{t(option.descriptionId, option.descriptionEn)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
