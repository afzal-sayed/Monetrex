import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Wallet, User as UserIcon, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';

export const Auth = () => {
  const navigate = useNavigate();
  const { login, signup } = useAppContext();

  const [view,     setView]     = useState('login'); // login | signup | forgot
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const resetForm = () => { setError(''); setPassword(''); };
  const switchView = (v) => { resetForm(); setView(v); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (view === 'forgot') {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));
      setLoading(false);
      switchView('login');
      return;
    }

    // Inline validation
    if (view === 'signup' && !name.trim()) { setError('Please enter your full name'); return; }
    if (!email.trim())    { setError('Email is required');    return; }
    if (!password)        { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    const result = view === 'login'
      ? await login(email.trim(), password)
      : await signup(name.trim(), email.trim(), password);
    setLoading(false);

    if (result.success) navigate('/dashboard');
    else setError(result.error);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-bg-light dark:bg-bg-dark transition-colors duration-500 relative overflow-hidden">

      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Left: Form ── */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 relative z-10">
        {view === 'forgot' && (
          <button
            onClick={() => switchView('login')}
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to login
          </button>
        )}

        <div className="w-full max-w-md space-y-7 animate-fade-up" key={view}>
          {/* Brand */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center mx-auto glow-pulse shadow-xl">
              <Wallet className="text-white" size={26} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-2">
              {view === 'login'  ? 'Welcome back'       :
               view === 'signup' ? 'Create account'     :
                                   'Reset password'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {view === 'login'  ? 'Sign in to your Monetrex dashboard.'          :
               view === 'signup' ? 'Join Monetrex and take control of your money.' :
                                   'Enter your email to receive a reset link.'}
            </p>
          </div>

          {/* Card */}
          <Card glass className="shadow-2xl border-white/30 dark:border-white/[0.07]">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm font-medium animate-fade-up">
                    {error}
                  </div>
                )}

                {view === 'signup' && (
                  <Input
                    label="Full Name" icon={UserIcon} type="text"
                    value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Doe" autoFocus
                  />
                )}

                <Input
                  label="Email" icon={Mail} type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@monetrex.io"
                  autoFocus={view !== 'signup'}
                />

                {view !== 'forgot' && (
                  <Input
                    label="Password" icon={Lock} type="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" minLength={6}
                  />
                )}

                {view === 'login' && (
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => switchView('forgot')}
                      className="text-xs text-primary hover:text-primary-end font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit" variant="primary" disabled={loading}
                  className="w-full h-11 text-sm mt-1 gradient-shift-bg"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Processing…
                    </span>
                  ) : (
                    view === 'login'  ? 'Sign in'         :
                    view === 'signup' ? 'Create account'  :
                                       'Send reset link'
                  )}
                </Button>
              </form>

              {view !== 'forgot' && (
                <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                  {view === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => switchView(view === 'login' ? 'signup' : 'login')}
                    className="font-semibold text-primary hover:text-primary-end transition-colors"
                  >
                    {view === 'login' ? 'Sign up free' : 'Log in'}
                  </button>
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

      {/* ── Right: Illustration ── */}
      <div className="hidden lg:flex relative flex-col justify-center items-center p-12 m-4 rounded-3xl overflow-hidden glass-panel border border-white/20 dark:border-white/[0.07]">
        {/* Floating cards */}
        <div className="w-72 h-96 rounded-[36px] border border-white/40 dark:border-white/15 bg-white/20 dark:bg-white/[0.04] backdrop-blur-md shadow-2xl absolute rotate-12 float-animation-slow" />
        <div className="w-60 h-80 rounded-[28px] border border-primary/25 bg-primary/8 backdrop-blur-xl shadow-[0_0_50px_rgba(79,70,229,0.15)] absolute -rotate-6 float-animation-alt" />
        <div className="w-48 h-28 rounded-2xl border border-secondary/25 bg-secondary/8 backdrop-blur-lg absolute top-24 right-16 rotate-3 float-animation" />

        <div className="relative z-10 text-center max-w-xs mt-40">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            <span className="gradient-text">The Future</span> of Finance.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
            Smart insights, beautiful analytics, and effortless expense tracking — secured and private by design.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8">
            {[
              { label: 'Secure', icon: '🔐' },
              { label: 'Private', icon: '🛡️' },
              { label: 'Insights', icon: '✨' },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <div className="text-2xl mb-1">{f.icon}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
