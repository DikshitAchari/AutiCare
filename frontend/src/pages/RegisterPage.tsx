import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Lock, Mail, Phone, User, Baby, School } from 'lucide-react';
import type { Role } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  // Parent fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('PARENT');

  // Child fields (for Parent registration)
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('2020-01-01');
  const [childGender, setChildGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [childSchool, setChildSchool] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [childNotes, setChildNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (role === 'PARENT') {
      if (!childName.trim()) {
        showToast('Child name is required', 'error');
        return;
      }
      if (!childDob) {
        showToast('Child date of birth is required', 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: phone.trim() || undefined,
        child:
          role === 'PARENT'
            ? {
                name: childName.trim(),
                dob: childDob,
                gender: childGender,
                school: childSchool.trim() || undefined,
                grade: childGrade.trim() || undefined,
                parent_notes: childNotes.trim() || undefined
              }
            : undefined
      });
      showToast('Account and child profile created successfully! You can now log in.', 'success');
      navigate('/login');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-100/60 via-white to-indigo-100/60 pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg my-8 space-y-6">
        <div className="text-center space-y-2">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl mx-auto shadow-lg cursor-pointer flex items-center justify-center"
          >
            A
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Create your Auti<span className="text-purple-600">Care</span> account
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Register with your real healthcare portal account
          </p>
        </div>

        <div className="p-6 sm:p-8 bg-white/95 border border-slate-100 rounded-3xl text-slate-800 shadow-xl space-y-5 backdrop-blur-xs">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Type Selection */}
            <div>
              <label htmlFor="role" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Type
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as Role)}
                className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm py-2.5 px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="PARENT">Parent</option>
                <option value="THERAPIST">Therapist</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Parent / User Details Section */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4 text-purple-600" />
                <span>{role === 'PARENT' ? 'Parent Registration' : 'Account Details'}</span>
              </div>

              <Input
                type="text"
                placeholder={role === 'PARENT' ? 'Parent Full Name *' : 'Full Name *'}
                leftIcon={<User className="w-4 h-4 text-purple-500" />}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
              />

              <Input
                type="email"
                placeholder="Email address *"
                leftIcon={<Mail className="w-4 h-4 text-purple-500" />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <Input
                type="tel"
                placeholder="Phone number (optional)"
                leftIcon={<Phone className="w-4 h-4 text-purple-500" />}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="password"
                  placeholder="Password *"
                  leftIcon={<Lock className="w-4 h-4 text-purple-500" />}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
                <Input
                  type="password"
                  placeholder="Confirm Password *"
                  leftIcon={<Lock className="w-4 h-4 text-purple-500" />}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Child Details Section (Visible only when role is PARENT) */}
            {role === 'PARENT' && (
              <div className="space-y-3.5 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Baby className="w-4 h-4 text-purple-600" />
                    <span>Child Details</span>
                  </div>
                  <span className="text-[11px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    Required for Parent
                  </span>
                </div>

                <Input
                  type="text"
                  placeholder="Child Full Name *"
                  leftIcon={<Baby className="w-4 h-4 text-purple-500" />}
                  value={childName}
                  onChange={(event) => setChildName(event.target.value)}
                  required
                  minLength={2}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={childDob}
                        onChange={(event) => setChildDob(event.target.value)}
                        required
                        className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Gender *
                    </label>
                    <select
                      value={childGender}
                      onChange={(event) => setChildGender(event.target.value as 'Male' | 'Female' | 'Other')}
                      className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="School Name (optional)"
                    leftIcon={<School className="w-4 h-4 text-purple-500" />}
                    value={childSchool}
                    onChange={(event) => setChildSchool(event.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Class / Grade (optional)"
                    leftIcon={<School className="w-4 h-4 text-purple-500" />}
                    value={childGrade}
                    onChange={(event) => setChildGrade(event.target.value)}
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Parent observations, sensory preferences, or special notes (optional)..."
                    value={childNotes}
                    onChange={(event) => setChildNotes(event.target.value)}
                    rows={2}
                    className="block w-full rounded-xl border border-slate-300 bg-white text-slate-900 text-xs p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/25 transition-all text-sm cursor-pointer"
            >
              {role === 'PARENT' ? 'Register Parent & Child' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-extrabold text-purple-600 hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};