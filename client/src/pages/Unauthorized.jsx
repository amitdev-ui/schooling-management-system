import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-500">
          <Icon name="lock" className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-ink-900">Access restricted</h1>
        <p className="text-ink-500 mt-2 text-sm">You don't have permission to view this page. This area is limited to administrators.</p>
        <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
      </div>
    </div>
  );
}
