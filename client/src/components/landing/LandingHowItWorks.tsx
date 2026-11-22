import { useI18n } from '../../i18n/I18n';

const STEPS = [
  { num: '01', title: 'landing_how_1_title', text: 'landing_how_1_text' },
  { num: '02', title: 'landing_how_2_title', text: 'landing_how_2_text' },
  { num: '03', title: 'landing_how_3_title', text: 'landing_how_3_text' },
] as const;

export default function LandingHowItWorks() {
  const { t } = useI18n();
  return (
    <section id="how-it-works" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-12">
      <h2 className="mb-6 text-2xl font-extrabold text-[#1E1B4B]">{t('landing_how_title')}</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.num} className="soft-brutal-card rounded-2xl bg-white p-5">
            <span className="tabular text-3xl font-extrabold text-[#F59E0B]">{s.num}</span>
            <h3 className="mt-2 text-lg font-bold text-[#1E1B4B]">{t(s.title)}</h3>
            <p className="mt-1 text-sm text-[#475569]">{t(s.text)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

