import Icon from './Icon';

const accents = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  ink: 'bg-ink-100 text-ink-500',
};

export default function StatCard({ icon, label, value, sub, accent = 'brand' }) {
  return (
    <div className="stat-card">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="mt-1 text-xl font-extrabold text-ink-900 leading-none truncate">{value}</p>
        {sub && <p className="mt-1 text-[11px] text-ink-500 font-medium">{sub}</p>}
      </div>
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-md ${accents[accent] || accents.brand}`}>
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}
