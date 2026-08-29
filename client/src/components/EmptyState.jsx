import Icon from './Icon';

export default function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
        <Icon name="inbox" className="h-6 w-6" />
      </span>
      <h3 className="mt-3 font-semibold text-ink-800">{title || 'Nothing here yet'}</h3>
      <p className="text-sm text-ink-500 mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
