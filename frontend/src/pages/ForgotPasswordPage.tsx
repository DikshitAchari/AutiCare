import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api/authApi';

type Step = 'email' | 'otp' | 'password' | 'success';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Multi-step form state
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      showToast('OTP sent to your email', 'success');
      setStep('otp');
      setResendCooldown(60);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verifyResetOTP({ email, otp });
      showToast('OTP verified successfully', 'success');
      setStep('password');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ email, new_password: newPassword, confirm_password: confirmPassword });
      showToast('Password reset successfully!', 'success');
      setStep('success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to reset password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      showToast('OTP resent to your email', 'success');
      setResendCooldown(60);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resend OTP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 selection:bg-purple-500 selection:text-white bg-slate-50 overflow-hidden">
      {/* Background illustration */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-200/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-200/50 blur-[120px]" />
        <div className="absolute top-[30%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-pink-100/60 blur-[100px]" />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />
      </div>

      {/* Main container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-500/25 cursor-pointer hover:scale-105 transition-transform"
          >
            A
          </div>
        </div>

        {/* Card */}
        <div className="p-7 bg-white/90 border border-slate-100 rounded-3xl text-slate-800 shadow-xl shadow-purple-900/5 backdrop-blur-xl space-y-6">
          {/* Step 1: Email */}
          {step === 'email' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
                <p className="text-sm text-slate-600">Enter your registered email address</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email
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
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all cursor-pointer text-sm"
                  isLoading={isLoading}
                >
                  Send OTP
                </Button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Verify OTP</h2>
                <p className="text-sm text-slate-600">We sent a verification code to your email</p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter OTP
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    className="bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-600 rounded-xl text-center text-xl tracking-widest font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all cursor-pointer text-sm"
                  isLoading={isLoading}
                >
                  Verify OTP
                </Button>
              </form>
              <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-100">
                {resendCooldown > 0 ? (
                  <p>Resend OTP in {resendCooldown}s</p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    className="font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step 3: Password Reset */}
          {step === 'password' && (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
                <p className="text-sm text-slate-600">Enter your new password</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4 text-purple-500" />}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-600 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4 text-purple-500" />}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-600 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition-colors"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all cursor-pointer text-sm"
                  isLoading={isLoading}
                >
                  Reset Password
                </Button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <>
              <div className="text-center space-y-6">
                <div className="text-6xl">✓</div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Password Reset Successful</h2>
                  <p className="text-sm text-slate-600">Your password has been reset. Please sign in with your new password.</p>
                </div>
                <Button
                  onClick={handleBackToLogin}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all cursor-pointer text-sm"
                >
                  Back to Sign In
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
