'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      window.location.href = callbackUrl;
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const quickFill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="h-full w-full flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Sparkles size={20} />
              <span className="text-[10px] font-black uppercase tracking-wider">Universal POS</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Welcome back</h1>
            <p className="text-on-surface-variant text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-3 pr-10 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-error font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-black text-sm uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-surface-container-lowest items-center justify-center p-12 border-l border-outline-variant/20">
        <div className="max-w-sm space-y-6">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-on-surface">Multi-Tenant POS Platform</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Manage multiple shops, restaurants, and stores from a single dashboard. 
            Each tenant has isolated data, users, and modules.
          </p>
          <div className="space-y-3">
            {[
              { role: 'Super Admin', desc: 'Manage all tenants, users, and system settings' },
              { role: 'Tenant Admin', desc: 'Manage your shop\'s products, orders, and staff' },
              { role: 'Staff', desc: 'Process orders and manage daily operations' },
            ].map((item) => (
              <div key={item.role} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container/50 border border-outline-variant/20">
                <div className="size-2 rounded-full bg-primary" />
                <div>
                  <p className="text-xs font-bold text-on-surface">{item.role}</p>
                  <p className="text-[10px] text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="h-screen w-full bg-surface overflow-hidden">
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
