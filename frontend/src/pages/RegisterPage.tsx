import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Phone, User } from 'lucide-react';
import type { Role } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('PARENT');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await register({ name, email, password, role, phone: phone || undefined });
      showToast('Account created successfully. You can now log in.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/60 via-white to-indigo-100/60" />
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <button onClick={() => navigate('/')} className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl mx-auto shadow-lg cursor-pointer">A</button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create your Auti<span className="text-purple-600">Care</span> account</h1>
          <p className="text-xs text-slate-500 font-medium">Register with your real healthcare portal account</p>
        </div>
        <div className="p-7 bg-white/90 border border-slate-100 rounded-3xl text-slate-800 shadow-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="text" placeholder="Full name" leftIcon={<User className="w-4 h-4 text-purple-500" />} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} />
            <Input type="email" placeholder="Email address" leftIcon={<Mail className="w-4 h-4 text-purple-500" />} value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input type="tel" placeholder="Phone (optional)" leftIcon={<Phone className="w-4 h-4 text-purple-500" />} value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Input type="password" placeholder="Password (at least 6 characters)" leftIcon={<Lock className="w-4 h-4 text-purple-500" />} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
            <div>
              <label htmlFor="role" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Account type</label>
              <select id="role" value={role} onChange={(event) => setRole(event.target.value as Role)} className="block w-full rounded-lg border border-slate-300 bg-white text-slate-900 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="PARENT">Parent</option>
                <option value="THERAPIST">Therapist</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl">Create Account</Button>
          </form>
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Already have an account? <button onClick={() => navigate('/login')} className="font-extrabold text-purple-600 hover:underline cursor-pointer">Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
};