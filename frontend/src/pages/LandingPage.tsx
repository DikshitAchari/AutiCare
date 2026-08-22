import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import {
  BrainCircuit,
  Users,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-purple-500 selection:text-white">
      {/* 1. PUBLIC MARKETING NAVBAR (Clean White) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-md shadow-purple-500/20">
              A
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Auti<span className="text-purple-600">Care</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#home" className="text-purple-600 font-bold transition-colors">Home</a>
            <a href="#about" className="hover:text-purple-600 transition-colors">About</a>
            <a href="#how-it-works" className="hover:text-purple-600 transition-colors">How It Works</a>
            <a href="#therapists" className="hover:text-purple-600 transition-colors">Therapists</a>
            <a href="#contact" className="hover:text-purple-600 transition-colors">Contact</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                onClick={() => navigate(`/${user.role.toLowerCase()}/dashboard`)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-purple-600/20"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                My Dashboard ({user.role})
              </Button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-all cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-600/25 transition-all cursor-pointer"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="home" className="pt-12 pb-20 bg-gradient-to-b from-purple-50/50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-100/70 text-purple-800 border border-purple-200">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Next-Gen Child Development & AI Screening</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Early Detection,<br />
              <span className="text-purple-600">Better Tomorrow</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
              AI powered autism screening and connect with trusted therapists near you. Empowering parents and clinicians with data-driven early intervention care.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 text-sm font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-2xl shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#about"
                className="px-8 py-3.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all shadow-xs cursor-pointer"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right Hero Visual Illustration */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-purple-200/40 to-indigo-100/40 rounded-3xl blur-2xl -z-10" />
            
            <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-purple-100 shadow-xl flex flex-col items-center">
              <svg viewBox="0 0 500 380" className="w-full h-auto drop-shadow-md">
                <defs>
                  <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f3e8ff" />
                    <stop offset="100%" stopColor="#e0e7ff" />
                  </linearGradient>
                  <linearGradient id="puzzleHeart" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>

                <circle cx="250" cy="190" r="160" fill="url(#bgGlow)" opacity="0.7" />

                <path d="M 330 110 C 330 80 370 80 385 105 C 400 80 440 80 440 110 C 440 145 385 185 385 185 C 385 185 330 145 330 110 Z" fill="url(#puzzleHeart)" opacity="0.3" />

                <circle cx="210" cy="115" r="28" fill="#334155" />
                <path d="M 195 100 Q 210 80 230 100 Q 220 120 195 100" fill="#1e293b" />
                
                <path d="M 170 170 Q 210 145 250 170 L 260 260 L 160 260 Z" fill="#f472b6" />

                <circle cx="280" cy="180" r="22" fill="#475569" />
                <path d="M 255 220 Q 280 200 305 220 L 310 280 L 250 280 Z" fill="#60a5fa" />

                <rect x="220" y="270" width="30" height="30" rx="6" fill="#f59e0b" />
                <rect x="255" y="270" width="30" height="30" rx="6" fill="#10b981" />
                <rect x="238" y="238" width="30" height="30" rx="6" fill="#6366f1" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE CARDS */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 hover:shadow-lg hover:border-purple-200 transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">AI Screening</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">Scientific assessment using AI</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 hover:shadow-lg hover:border-purple-200 transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">Expert Therapists</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">Connect with verified specialists</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 hover:shadow-lg hover:border-purple-200 transition-all flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <LineChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 mb-1">Track Progress</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">Monitor child's development</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ABOUT AUTICARE */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">About AutiCare</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2 mb-4">
              Empowering Families with Early Autism Interventions
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              AutiCare is designed by pediatric care experts and clinical engineers to bridge the gap between early parental observation and professional intervention. Our system provides objective screening scores, video behavior uploads, and direct consultation scheduling.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Validated clinical screening framework across 4 core domains</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Synchronized therapist booking with zero double-booking risk</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Quarterly clinical progress reports and video behavior analysis</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center">
              <p className="text-3xl font-black text-purple-600">98%</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Screening Accuracy</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center">
              <p className="text-3xl font-black text-purple-600">120+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Verified Specialists</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center">
              <p className="text-3xl font-black text-purple-600">5,000+</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Children Supported</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm text-center">
              <p className="text-3xl font-black text-purple-600">24/7</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Messaging Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">Simple Process</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2 mb-12">
            How AutiCare Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '1', title: 'Add Child', desc: 'Register child profile details' },
              { step: '2', title: 'Complete Screening', desc: 'Answer guided behavioral questions' },
              { step: '3', title: 'Review Insights', desc: 'Receive AI domain risk breakdown' },
              { step: '4', title: 'Connect Therapist', desc: 'Book verified consultation slots' },
              { step: '5', title: 'Track Progress', desc: 'View quarterly therapy reports' }
            ].map((item) => (
              <div key={item.step} className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 text-center relative">
                <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-[11px] text-slate-500 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRUSTED THERAPISTS SHOWCASE */}
      <section id="therapists" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">Verified Clinical Care</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
              Connect with Trusted Specialists
            </h2>
            <p className="text-xs text-slate-500 mt-2">Licensed pediatric therapists and clinical psychologists ready to support your journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Dr. Anjali Sharma',
                role: 'Child Psychologist',
                exp: '8 yrs Exp',
                rating: '4.8 (124)',
                loc: 'Bangalore',
                img: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?w=150'
              },
              {
                name: 'Dr. Rohan Verma',
                role: 'Behavior Therapist',
                exp: '6 yrs Exp',
                rating: '4.7 (89)',
                loc: 'Bangalore',
                img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'
              },
              {
                name: 'Dr. Meera Iyer',
                role: 'Occupational Therapist',
                exp: '10 yrs Exp',
                rating: '4.9 (150)',
                loc: 'Bangalore',
                img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'
              }
            ].map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <img src={t.img} alt={t.name} className="w-20 h-20 rounded-full object-cover border-2 border-purple-200 mb-3" />
                <h3 className="text-sm font-extrabold text-slate-900">{t.name}</h3>
                <p className="text-xs text-purple-600 font-semibold mb-1">{t.role}</p>
                <p className="text-[11px] text-slate-400 mb-4">{t.exp} • ⭐ {t.rating} • {t.loc}</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  Book Consultation
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION BANNER */}
      <section id="contact" className="py-16 bg-purple-600 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Start Your Child's Journey Today
          </h2>
          <p className="text-sm sm:text-base text-purple-100 max-w-xl mx-auto">
            Early screening leads to optimal developmental support. Begin your child's assessment in less than 5 minutes.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 text-sm font-extrabold text-purple-700 bg-white hover:bg-purple-50 rounded-2xl shadow-xl transition-all cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black">A</div>
              <span className="text-base font-black text-white">AutiCare</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Empowering child development with AI behavioral screening and synchronized clinical therapy.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-white mb-3 uppercase tracking-wider text-[11px]">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#therapists" className="hover:text-white transition-colors">Find Therapists</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white mb-3 uppercase tracking-wider text-[11px]">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Clinical Disclaimer</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white mb-3 uppercase tracking-wider text-[11px]">Contact</h4>
            <p className="text-slate-400 mb-2">support@auticare.health</p>
            <p className="text-slate-400">+1 (800) 288-4227</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          AutiCare Clinical Autism Platform • Production-Quality Frontend
        </div>
      </footer>
    </div>
  );
};
