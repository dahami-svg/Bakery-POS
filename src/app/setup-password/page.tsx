'use client';

import Link from 'next/link';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

function SetupPasswordScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('This setup link is missing a token.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/setup-password?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (data.success) {
          setValid(true);
          setName(data.data.name);
          setEmail(data.data.email);
        } else {
          setError(data.message || 'This setup link is invalid or expired.');
        }
      } catch {
        setError('Could not validate this setup link.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || 'Password created successfully.');
        setValid(false);
      } else {
        setError(data.message || 'Could not create your password.');
      }
    } catch {
      setError('Network error while creating your password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-outline-variant bg-surface-container p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3 text-primary">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Tenant Onboarding</p>
            <h1 className="text-3xl font-black tracking-tight text-on-surface">Create your password</h1>
          </div>
        </div>

        {loading && <p className="text-sm text-on-surface-variant">Checking your setup link...</p>}

        {!loading && error && !valid && !success && (
          <div className="space-y-4">
            <p className="text-sm text-error">{error}</p>
            <Link href="/login" className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary">
              Back to login
            </Link>
          </div>
        )}

        {!loading && valid && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-4">
              <p className="text-sm font-bold text-on-surface">{name}</p>
              <p className="text-xs text-on-surface-variant">{email}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-3 pr-10 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype your password"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low p-3 pr-10 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-error">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary py-3 text-sm font-black uppercase tracking-widest text-on-primary disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Create password'}
            </button>
          </form>
        )}

        {!loading && success && (
          <div className="space-y-4">
            <p className="text-sm text-on-surface">{success}</p>
            <Link href="/login" className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary">
              Continue to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <SetupPasswordScreen />
    </Suspense>
  );
}
