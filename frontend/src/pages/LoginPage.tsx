import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const session = await login({ email, password });
      showToast(`Welcome back, ${session.name}!`, 'success');
      navigate(`/${session.role.toLowerCase()}/dashboard`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 selection:bg-purple-500 selection:text-white bg-slate-50 overflow-hidden">
      {/* 1. Heavily Blurred Landing Page Background Illustration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft background color blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-200/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-200/50 blur-[120px]" />
        <div className="absolute top-[30%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-pink-100/60 blur-[100px]" />

        {/* Blurred SVG Illustration representation of Landing Hero */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 filter blur-xl scale-110">
          <svg viewBox="0 0 1000 700" className="w-full h-full object-cover">
            <circle cx="200" cy="300" r="180" fill="#e0e7ff" />
            <circle cx="800" cy="400" r="220" fill="#f3e8ff" />
            <path d="M 150 500 Q 400 300 850 500 L 850 700 L 150 700 Z" fill="#ede9fe" />
          </svg>
        </div>

        {/* Soft Light Overlay */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />
      </div>

      {/* 2. Foreground Light Login Card Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-purple-500/25 cursor-pointer hover:scale-105 transition-transform"
          >
            A
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-1">
            Auti<span className="text-purple-600">Care</span>
          </h1>
          <h2 className="text-lg font-bold text-slate-800">Welcome Back</h2>
          <p className="text-xs text-slate-500 font-medium">Sign in to access your healthcare portal</p>
        </div>

        {/* Clean Light White Form Card */}
        <div className="p-7 bg-white/90 border border-slate-100 rounded-3xl text-slate-800 shadow-xl shadow-purple-900/5 backdrop-blur-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email / Username
              </label>
              <Input
                type="email"
                placeholder="enter your email"
                leftIcon={<Mail className="w-4 h-4 text-purple-500" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-600 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4 text-purple-500" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-600 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => showToast('Please contact support to reset your password.', 'info')}
                className="font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all cursor-pointer text-sm disabled:opacity-60"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-extrabold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 font-semibold">
          AutiCare Healthcare SaaS Platform • Child Development AI
        </p>
      </div>
    </div>
  );
};
