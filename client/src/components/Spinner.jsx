export function Spinner({ size = 'md', light = false }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]' };
  return (
    <span className={`inline-block animate-spin rounded-full border-transparent ${light ? 'border-white' : 'border-brand-600'} border-t-current ${sizes[size]} ${light ? 'text-white' : 'text-brand-600'}`} />
  );
}

export function PageLoader({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-ink-400">
      <Spinner size="lg" />
      <p className="text-sm font-medium">{label || 'Loading…'}</p>
    </div>
  );
}

export function ButtonLoader() {
  return <Spinner size="sm" light />;
}

export default Spinner;
