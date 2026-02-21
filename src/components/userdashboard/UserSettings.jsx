// src/components/userdashboard/UserSettings.jsx
import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { Save, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function UserSettings({ userId, profile }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name:             profile?.name             || '',
    phone:            profile?.phone            || '',
    language:         profile?.language         || 'hindi',
    location:         profile?.location         || '',
    emergencyContact: profile?.emergencyContact || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      await updateProfile(auth.currentUser, { displayName: form.name });
      toast.success('✅ Profile updated!');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-serif text-charcoal">⚙️ My Settings</h2>
        <p className="text-charcoal/60 text-sm mt-1">Update your health profile</p>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1">Name</label>
            <input type="text" className="input-field"
              value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-1">Phone</label>
            <input type="tel" className="input-field"
              value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Language</label>
          <select className="input-field" value={form.language}
            onChange={e => setForm({...form, language: e.target.value})}>
            <option value="hindi">हिंदी (Hindi)</option>
            <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="english">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Location</label>
          <input type="text" className="input-field"
            value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-charcoal mb-1">Emergency Contact</label>
          <input type="tel" className="input-field" placeholder="+91XXXXXXXXXX"
            value={form.emergencyContact}
            onChange={e => setForm({...form, emergencyContact: e.target.value})} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-sage hover:bg-sage-dark text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Sign out */}
      <button onClick={handleSignOut}
        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}
