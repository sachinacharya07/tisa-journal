import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  PenLine, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Quote
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side: Branding & Inspiration */}
      <div className="flex-1 bg-sage-dark p-12 flex flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 800 800">
            <circle cx="400" cy="400" r="300" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="400" cy="400" r="200" stroke="white" strokeWidth="1" fill="none" />
            <path d="M100 100 L700 700" stroke="white" strokeWidth="1" />
            <path d="M700 100 L100 700" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <PenLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">TISA Journal</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-50">Track · Improve · Study · Ace</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          <div className="space-y-4">
            <Quote className="w-12 h-12 opacity-20" />
            <p className="text-4xl font-serif italic leading-tight">
              "Fill your paper with the breathings of your heart."
            </p>
            <p className="text-sm uppercase tracking-widest opacity-50">— William Wordsworth</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 pt-12 border-t border-white/10">
            <div>
              <h3 className="font-bold text-sm mb-2">Private Space</h3>
              <p className="text-xs opacity-50 leading-relaxed">A sanctuary for your most honest thoughts and reflections.</p>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-2">Shared Growth</h3>
              <p className="text-xs opacity-50 leading-relaxed">Connect with loved ones and grow together through shared words.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-[10px] uppercase tracking-widest opacity-30">
          © 2026 Sachin Bhattacharya · All rights reserved
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full md:w-[500px] bg-sand p-12 flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-serif font-bold">{isLogin ? 'Welcome Back' : 'Join TISA'}</h2>
            <p className="text-sm text-ink/40">
              {isLogin ? 'Sign in to continue your journey.' : 'Start your journaling practice today.'}
            </p>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 bg-paper border border-ink/5 rounded-2xl shadow-sm flex items-center justify-center gap-3 hover:bg-sand-dark transition-all group"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
            <span className="text-sm font-bold">Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 text-ink/10">
            <div className="flex-1 h-px bg-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-current" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 ml-1">Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-4 pr-4 py-3.5 bg-paper border border-ink/5 rounded-2xl outline-none focus:border-sage/30 transition-all text-sm"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-paper border border-ink/5 rounded-2xl outline-none focus:border-sage/30 transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-ink/40 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-paper border border-ink/5 rounded-2xl outline-none focus:border-sage/30 transition-all text-sm"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-medium ml-1">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-sage-dark text-white rounded-2xl font-bold shadow-lg shadow-sage-dark/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-xs text-ink/40">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-sage-dark font-bold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
