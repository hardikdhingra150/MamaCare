// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { Toaster } from 'react-hot-toast';

import LandingPage    from './pages/LandingPage';
import Onboarding     from './pages/Onboarding';
import UserDashboard  from './pages/UserDashboard';

function PrivateRoute({ children, user, loading }) {
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-sage border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-charcoal/60 text-sm">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/" replace />;
}

export default function App() {
  const [user,        setUser]        = useState(null);
  const [profile,     setProfile]     = useState(null); // Firestore user doc
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load her profile from Firestore
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setProfile({ id: snap.id, ...snap.data() });
          } else {
            setProfile(null); // New user — needs onboarding
          }
        } catch (e) {
          console.error(e);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>

        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Onboarding — logged in but no profile yet */}
        <Route
          path="/onboarding"
          element={
            <PrivateRoute user={user} loading={loading}>
              <Onboarding
                user={user}
                onComplete={(newProfile) => setProfile(newProfile)}
              />
            </PrivateRoute>
          }
        />

        {/* Her personal dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute user={user} loading={loading}>
              {profile
                ? <UserDashboard user={user} profile={profile} setProfile={setProfile} />
                : <Navigate to="/onboarding" replace />
              }
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
