// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { User, Bell, Globe, Phone, LogOut, Shield, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  signOut, updateProfile, updateEmail,
  updatePassword, reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function Settings() {
  const navigate  = useNavigate();
  const firebaseUser = auth.currentUser;

  const [profile, setProfile] = useState({
    name:     '',
    phone:    '',
    email:    '',
    language: 'hindi',
    healthType: '',
  });

  const [notifications, setNotifications] = useState({
    highRisk:         true,
    checkupReminders: true,
    dailySummary:     false,
    weeklyReport:     true,
  });

  const [preferences, setPreferences] = useState({
    dashboardLanguage: 'english',
    ivrLanguage:       'hindi',
  });

  const [passwordForm, setPasswordForm] = useState({
    current:  '',
    newPass:  '',
    confirm:  '',
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [userStats, setUserStats] = useState({
    totalUsers:   0,
    totalCheckups: 0,
    memberSince:  '',
  });

  // ── Load real user data from Firestore ──────────────────────
  useEffect(() => {
    const loadUserData = async () => {
      if (!firebaseUser) return;

      // Pre-fill from Firebase Auth
      setProfile(prev => ({
        ...prev,
        name:  firebaseUser.displayName || '',
        email: firebaseUser.email || '',
      }));

      // Load extra data from Firestore
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(prev => ({
            ...prev,
            phone:      data.phone      || '',
            language:   data.language   || 'hindi',
            healthType: data.healthType || '',
          }));
        }

        // Member since
        const created = firebaseUser.metadata?.creationTime;
        if (created) {
          setUserStats(prev => ({
            ...prev,
            memberSince: new Date(created).toLocaleDateString('en-IN', {
              month: 'long', year: 'numeric'
            })
          }));
        }
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    };

    loadUserData();
  }, [firebaseUser]);

  // ── Save profile ────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSavingProfile(true);
    try {
      // Update Firebase Auth display name
      await updateProfile(firebaseUser, { displayName: profile.name });

      // Update Firestore user doc
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        name:     profile.name,
        phone:    profile.phone,
        language: profile.language,
      });

      toast.success('✅ Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile: ' + error.message);
    }
    setSavingProfile(false);
  };

  // ── Save notifications ──────────────────────────────────────
  const handleSaveNotifications = async () => {
    try {
      if (firebaseUser) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          notificationPrefs: notifications
        });
      }
      toast.success('✅ Notification preferences saved!');
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    }
  };

  // ── Save preferences ────────────────────────────────────────
  const handleSavePreferences = async () => {
    try {
      if (firebaseUser) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          dashboardPrefs: preferences
        });
      }
      toast.success('✅ Preferences updated!');
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
    }
  };

  // ── Change password ─────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        passwordForm.current
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, passwordForm.newPass);

      toast.success('✅ Password changed successfully!');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (error) {
      const msg = error.code === 'auth/wrong-password'
        ? 'Current password is incorrect'
        : error.message;
      toast.error('❌ ' + msg);
    }
    setSavingPassword(false);
  };

  // ── Sign out ────────────────────────────────────────────────
  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    try {
      await signOut(auth);
      toast.success('👋 Signed out successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // ── Initials for avatar ─────────────────────────────────────
  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : firebaseUser?.email?.[0].toUpperCase() || '?';

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">Settings</h1>
        <p className="text-charcoal/60">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Information */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
                <User className="w-6 h-6 text-sage" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-charcoal">Profile Information</h2>
                <p className="text-sm text-charcoal/60">Update your personal details</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Health Type
                  </label>
                  <input
                    type="text"
                    className="input-field bg-cream cursor-not-allowed capitalize"
                    value={profile.healthType || 'Not set'}
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={profile.phone}
                  onChange={e => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field bg-cream cursor-not-allowed"
                  value={profile.email}
                  disabled
                />
                <p className="text-xs text-charcoal/40 mt-1">
                  Email cannot be changed here — contact support
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Preferred Language
                </label>
                <select
                  className="input-field"
                  value={profile.language}
                  onChange={e => setProfile({ ...profile, language: e.target.value })}
                >
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="english">English</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {savingProfile
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-terracotta" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-charcoal">Notifications</h2>
                <p className="text-sm text-charcoal/60">Choose what alerts you receive</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { key: 'highRisk',         label: 'High Risk Alerts',    desc: 'Get notified when a user is marked high risk' },
                { key: 'checkupReminders', label: 'Checkup Reminders',   desc: 'Reminders for upcoming checkups' },
                { key: 'dailySummary',     label: 'Daily Summary',       desc: 'Daily summary of platform activity' },
                { key: 'weeklyReport',     label: 'Weekly Report',       desc: 'Weekly analytics and health report' },
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 p-4 rounded-gentle hover:bg-cream transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    className="mt-1 w-4 h-4 text-sage focus:ring-sage rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-charcoal">{item.label}</p>
                    <p className="text-sm text-charcoal/60">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleSaveNotifications}
              className="btn-primary mt-4 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>

          {/* Language & Preferences */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-sage" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-charcoal">Language & Preferences</h2>
                <p className="text-sm text-charcoal/60">Customize your experience</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Dashboard Language
                </label>
                <select
                  className="input-field"
                  value={preferences.dashboardLanguage}
                  onChange={e => setPreferences({ ...preferences, dashboardLanguage: e.target.value })}
                >
                  <option value="english">English</option>
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Default IVR Language
                </label>
                <select
                  className="input-field"
                  value={preferences.ivrLanguage}
                  onChange={e => setPreferences({ ...preferences, ivrLanguage: e.target.value })}
                >
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="english">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Theme <span className="text-charcoal/40 font-normal">(Coming Soon)</span>
                </label>
                <select className="input-field opacity-50 cursor-not-allowed" disabled>
                  <option>Light Mode</option>
                  <option>Dark Mode</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              className="btn-primary mt-4 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>

          {/* Change Password */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-charcoal">Change Password</h2>
                <p className="text-sm text-charcoal/60">Update your account password</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { key: 'current', label: 'Current Password',  placeholder: 'Enter current password' },
                { key: 'newPass', label: 'New Password',      placeholder: 'Min. 6 characters' },
                { key: 'confirm', label: 'Confirm Password',  placeholder: 'Repeat new password' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      className="input-field pr-10"
                      placeholder={field.placeholder}
                      value={passwordForm[field.key]}
                      onChange={e => setPasswordForm({ ...passwordForm, [field.key]: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
                    >
                      {showPasswords
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye    className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {savingPassword
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Shield className="w-4 h-4" />
                }
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">

          {/* Account Info Card */}
          <div className="card bg-gradient-to-br from-sage to-sage-dark text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-2xl font-serif">
              {initials}
            </div>
            <h3 className="text-xl font-serif text-center mb-1">
              {profile.name || 'Your Account'}
            </h3>
            <p className="text-white/70 text-center text-xs mb-1">{profile.email}</p>
            <p className="text-white/60 text-center text-xs mb-4">
              Member since {userStats.memberSince || '—'}
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-gentle p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Account Status</span>
                <span className="font-semibold text-green-300">✅ Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Health Type</span>
                <span className="font-semibold capitalize">
                  {profile.healthType === 'maternity' ? '🤰 Maternity'
                    : profile.healthType === 'pcos' ? '🌸 PCOS'
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Language</span>
                <span className="font-semibold capitalize">{profile.language}</span>
              </div>
            </div>
          </div>

          {/* Connected Phone */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-sage" />
              <h3 className="font-serif text-lg text-charcoal">Connected Phone</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-cream-dark rounded-gentle">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-charcoal">Primary Number</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    profile.phone
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {profile.phone ? 'Verified' : 'Not set'}
                  </span>
                </div>
                <p className="text-sm text-charcoal/60">
                  {profile.phone || 'Add phone number above'}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border border-red-100">
            <h3 className="font-serif text-lg text-charcoal mb-4">Account Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-soft transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <p className="text-xs text-center text-charcoal/40">
                You'll be redirected to the landing page
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
