import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/Spinner';
import Icon from '../components/Icon';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back! Signed in as ' + (user.role === 'admin' ? 'Administrator' : 'Teacher'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function quickFill(em, pw) {
    setEmail(em);
    setPassword(pw);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-ink-50">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-600 text-white">
            <Icon name="graduation" className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-ink-900">EduCore</span>
        </div>

        <div className="rounded-lg glass-strong bg-white/75 p-6 sm:p-7">
          <h1 className="text-lg font-bold text-ink-900">Sign in to your account</h1>
          <p className="text-[13px] text-ink-500 mt-1 mb-6">School Management System</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><Spinner size="sm" light /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-ink-100">
            <p className="text-xs font-semibold text-ink-400 mb-2">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => quickFill('admin@school.com', 'admin123')} className="btn-secondary text-xs justify-center">
                <Icon name="user" className="h-3.5 w-3.5" /> Admin
              </button>
              <button onClick={() => quickFill('ayesha.khan@school.com', 'teacher123')} className="btn-secondary text-xs justify-center">
                <Icon name="graduation" className="h-3.5 w-3.5" /> Teacher
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-ink-400 text-xs mt-6">EduCore © {new Date().getFullYear()} · All rights reserved</p>
      </div>
    </div>
  );
}
