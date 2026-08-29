const tones = {
  success: 'bg-emerald-100 text-emerald-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-brand-100 text-brand-700',
  neutral: 'bg-ink-100 text-ink-600',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tones[tone] || tones.neutral}`}>{children}</span>;
}
