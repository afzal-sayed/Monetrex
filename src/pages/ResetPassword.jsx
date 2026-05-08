import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Lock, Wallet, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);

  // Invalid / missing token — show early
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors duration-500 relative overflow-hidden p-6">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="w-full max-w-md space-y-7 animate-fade-up relative z-10">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center mx-auto shadow-xl">
              <Wallet className="text-white" size={26} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">Reset Password</h1>
          </div>
          <Card glass className="shadow-2xl border-white/30 dark:border-white/[0.07]">
            <CardContent className="p-6">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium text-center">
                Invalid or missing reset token.
              </div>
              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                <Link to="/auth" className="font-semibold text-primary hover:text-primary-end transition-colors">
                  Back to login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword)                         { setError('New password is required'); return; }
    if (newPassword.length < 8)               { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword)      { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res  = await apiFetch('/auth/reset-password', {
        method:  'POST',
        body:    JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password. The link may have expired.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark transition-colors duration-500 relative overflow-hidden p-6">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="w-full max-w-md space-y-7 animate-fade-up relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center mx-auto glow-pulse shadow-xl">
            <Wallet className="text-white" size={26} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
            {success ? 'All done!' : 'Set new password'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {success
              ? 'Your password has been updated.'
              : 'Choose a strong password for your account.'}
          </p>
        </div>

        {/* Card */}
        <Card glass className="shadow-2xl border-white/30 dark:border-white/[0.07]">
          <CardContent className="p-6">
            {success ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 size={48} className="text-secondary" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-sm">
                  Password reset successfully. You can now log in.
                </p>
                <Link
                  to="/auth"
                  className="inline-block w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors flex items-center justify-center"
                >
                  Go to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium animate-fade-up">
                    {error}
                  </div>
                )}

                <Input
                  label="New Password"
                  icon={Lock}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  autoFocus
                />

                <Input
                  label="Confirm Password"
                  icon={Lock}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                />

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full h-11 text-sm mt-1 gradient-shift-bg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Resetting…
                    </span>
                  ) : (
                    'Reset password'
                  )}
                </Button>
              </form>
            )}

            {!success && (
              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                Remember your password?{' '}
                <Link
                  to="/auth"
                  className="font-semibold text-primary hover:text-primary-end transition-colors"
                >
                  Log in
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Security note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={13} className="text-secondary" />
          Passwords are hashed with bcrypt · JWT-secured sessions
        </div>
      </div>
    </div>
  );
};
