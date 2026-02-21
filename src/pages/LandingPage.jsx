// src/pages/LandingPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,              // ✅ back to popup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import toast from 'react-hot-toast';

import Header        from '../components/landing/Header';
import Hero          from '../components/landing/Hero';
import Features      from '../components/landing/Features';
import Statistics    from '../components/landing/Statistics';
import ImpactMetrics from '../components/landing/ImpactMetrics';
import Partners      from '../components/landing/Partners';
import CallToAction  from '../components/landing/CallToAction';
import Footer        from '../components/landing/Footer';
import ForMothers    from '../components/landing/ForMothers';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3-11.3-7.4l-6.5 5C9.6 39.5 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUp,    setIsSignUp]    = useState(false);
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [googleLoad,  setGoogleLoad]  = useState(false);

  // ── Route after login ────────────────────────────────────────
  const routeAfterLogin = async (uid, displayName) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists() && snap.data().healthType) {
      toast.success(`Welcome back, ${snap.data().name || displayName}! 👋`);
      navigate('/dashboard');
    } else {
      toast.success('Welcome! Let\'s set up your profile 🌸');
      navigate('/onboarding');
    }
  };

  // ── Email auth ───────────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created! 🎉');
        setIsLoginOpen(false);
        navigate('/onboarding');
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setIsLoginOpen(false);
        await routeAfterLogin(cred.user.uid, cred.user.displayName);
      }
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential'   ? 'Invalid email or password'                  :
        err.code === 'auth/user-not-found'        ? 'No account found — please sign up'          :
        err.code === 'auth/email-already-in-use'  ? 'Email already registered — sign in instead' :
        err.code === 'auth/wrong-password'        ? 'Incorrect password'                         :
        err.code === 'auth/weak-password'         ? 'Password must be at least 6 characters'     :
        err.code === 'auth/too-many-requests'     ? 'Too many attempts — try again later'        :
        err.message.replace('Firebase: ', '')
      );
    }
    setLoading(false);
  };

  // ── Google Sign-In (popup) ───────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoad(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, displayName, email, photoURL } = result.user;

      const snap = await getDoc(doc(db, 'users', uid));

      if (snap.exists() && snap.data().healthType) {
        // Returning user with complete profile
        toast.success(`Welcome back, ${snap.data().name || displayName}! 👋`);
        setIsLoginOpen(false);
        navigate('/dashboard');
      } else {
        // New Google user — save partial doc, go to onboarding
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          googleDisplayName: displayName,
          photoURL:          photoURL || null,
          isActive:          true,
          createdAt:         serverTimestamp(),
        }, { merge: true });

        toast.success(`Hi ${displayName}! Let's set up your profile 🌸`);
        setIsLoginOpen(false);
        navigate('/onboarding');
      }
    } catch (err) {
      // Ignore user closing popup
      if (err.code !== 'auth/popup-closed-by-user' &&
          err.code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in failed — please try again');
        console.error('Google sign-in error:', err);
      }
    }
    setGoogleLoad(false);
  };

  const handleClose = () => {
    setIsLoginOpen(false);
    setError('');
    setEmail('');
    setPassword('');
    setShowPass(false);
    setIsSignUp(false);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openLogin  = () => { setIsSignUp(false); setIsLoginOpen(true); };
  const openSignUp = () => { setIsSignUp(true);  setIsLoginOpen(true); };

  return (
    <div>
      <Header
        onOpenLogin={openLogin}
        onOpenSignUp={openSignUp}
        onScrollTo={scrollTo}
      />

      <section id="hero">
        <Hero onOpenLogin={openLogin} onOpenSignUp={openSignUp} />
      </section>
      <section id="features"><Features /></section>
      <section id="statistics"><Statistics /></section>
      <section id="for-mothers"><ForMothers /></section>
      <section id="impact"><ImpactMetrics /></section>
      <section id="partners"><Partners /></section>
      <CallToAction onOpenLogin={openLogin} onOpenSignUp={openSignUp} />
      <Footer onScrollTo={scrollTo} />

      {/* ── Auth Modal ── */}
      {isLoginOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">

            <div className={`h-1.5 w-full ${
              isSignUp
                ? 'bg-gradient-to-r from-purple-400 to-pink-500'
                : 'bg-gradient-to-r from-sage to-teal-400'
            }`} />

            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-4xl mb-2">{isSignUp ? '🌸' : '👋'}</div>
                  <h2 className="text-2xl font-serif text-charcoal font-bold">
                    {isSignUp ? 'Join MamaCare' : 'Welcome Back'}
                  </h2>
                  <p className="text-charcoal/50 text-sm mt-1">
                    {isSignUp
                      ? 'Your personal health companion — free forever'
                      : 'Sign in to your MamaCare dashboard'}
                  </p>
                </div>
                <button onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream text-charcoal/40 hover:text-charcoal transition-all text-lg">
                  ✕
                </button>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoad || loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-2xl font-semibold text-charcoal transition-all disabled:opacity-60 mb-5 group"
              >
                {googleLoad
                  ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : <GoogleIcon />
                }
                <span className="text-sm">
                  {googleLoad ? 'Opening Google...' : 'Continue with Google'}
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-charcoal/30 font-medium">or use email</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Form */}
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
                    Email
                  </label>
                  <input type="email"
                    className="w-full px-4 py-3 bg-cream border border-transparent rounded-xl focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all text-sm"
                    placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    required autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal/50 uppercase tracking-wide mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="w-full px-4 py-3 bg-cream border border-transparent rounded-xl focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all text-sm pr-12"
                      placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      required minLength={6}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal text-sm">
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="text-xs text-charcoal/40 mt-1">Minimum 6 characters</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex gap-2">
                    ❌ {error}
                  </div>
                )}

                <button type="submit" disabled={loading || googleLoad}
                  className={`w-full py-3.5 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    isSignUp
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gradient-to-r from-sage to-teal-500 hover:from-sage-dark hover:to-teal-600'
                  }`}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Please wait...</>
                    : isSignUp ? '🚀 Create Account' : '🔑 Sign In'
                  }
                </button>
              </form>

              <p className="text-center text-sm text-charcoal/50 mt-5">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="text-sage hover:text-sage-dark font-bold">
                  {isSignUp ? 'Sign In' : 'Sign Up Free'}
                </button>
              </p>

              {isSignUp && (
                <div className="mt-5 p-4 bg-gradient-to-br from-sage/5 to-purple-50 rounded-2xl border border-sage/10">
                  <p className="text-xs font-bold text-charcoal mb-2">✨ What you get with MamaCare:</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-charcoal/60">
                    <span>🤰 Pregnancy week tracker</span>
                    <span>🌸 PCOS cycle predictor</span>
                    <span>📱 WhatsApp health tips</span>
                    <span>⚠️ Risk alerts & calls</span>
                    <span>📊 Personal dashboard</span>
                    <span>🔒 Private & secure</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
