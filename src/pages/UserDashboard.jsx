// src/pages/UserDashboard.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  doc, onSnapshot, collection, query,
  where, orderBy, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { LogOut, Bell, MessageCircle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import MaternityDashboard from '../components/userdashboard/MaternityDashboard';
import PCOSDashboard from '../components/userdashboard/PCOSDashboard';
import UserSettings from '../components/userdashboard/UserSettings';

// ── Twilio sandbox number ─────────────────────────────────────
const WHATSAPP_NUMBER = '+14155238886';

// ── Quick symptom chips shown in the chat launcher ───────────
const MATERNITY_CHIPS = [
  '🤢 Feeling nauseous',
  '😵 Headache',
  '🦵 Leg swelling',
  '💊 Took my medicine',
  '🩸 Spotting',
  '👶 Baby not moving',
  '🍽️ What should I eat today?',
  '💧 How much water to drink?',
];

const PCOS_CHIPS = [
  '😣 Severe cramps',
  '🩸 Heavy bleeding',
  '😔 Mood swings',
  '💊 Took my medicine',
  '⚖️ Weight gain',
  '😴 Feeling tired',
  '🥗 What diet should I follow?',
  '🏃 Best exercise for PCOS?',
];

export default function UserDashboard({ user, profile: initialProfile, setProfile }) {
  const navigate = useNavigate();
  const [profile, setLocalProfile] = useState(initialProfile);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // ── WhatsApp bot launcher state ──────────────────────────────
  const [showBotLauncher, setShowBotLauncher] = useState(false);
  const [botInput, setBotInput] = useState('');
  const [botMessages, setBotMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: null, // set dynamically after profile loads
    },
  ]);
  const [botLoading, setBotLoading] = useState(false);

  // ── Real-time profile listener ───────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setLocalProfile(data);
        setProfile(data);

        if (data.riskScore === 'HIGH') {
          setNotifications(prev => {
            if (prev.find(n => n.type === 'high_risk')) return prev;
            return [{
              id: Date.now(),
              type: 'high_risk',
              message: '⚠️ Your health needs attention. Please contact your doctor.',
              time: 'Just now',
              read: false,
            }, ...prev];
          });
        }

        if (data.healthType === 'pcos' && data.cycleLength > 35) {
          setNotifications(prev => {
            if (prev.find(n => n.type === 'irregular_cycle')) return prev;
            return [{
              id: Date.now(),
              type: 'irregular_cycle',
              message: "🌸 Your cycle appears irregular. We've sent you tips on WhatsApp.",
              time: 'Just now',
              read: false,
            }, ...prev];
          });
        }
      }
    });
    return () => unsub();
  }, [user?.uid]);

  // ── Set bot greeting once profile loads ─────────────────────
  useEffect(() => {
    if (!profile) return;
    const isPCOS = profile.healthType === 'pcos';
    setBotMessages([{
      id: 1,
      from: 'bot',
      text: isPCOS
        ? `💜 Namaste ${profile.name || 'there'}! I'm your MamaCare AI assistant.\n\nYou can log your symptoms here and I'll give you exact health advice. Pick a symptom below or type anything!`
        : `💚 Namaste ${profile.name || 'there'}! I'm your MamaCare AI assistant.\n\nYou are ${profile.pregnancyWeek ? `${profile.pregnancyWeek} weeks pregnant` : 'pregnant'}. Log your symptoms or ask anything — I'll save it and track your health!`,
    }]);
  }, [profile?.uid]);

  const handleSignOut = async () => {
    await signOut(auth);
    toast.success('Signed out 👋');
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const isPCOS = profile?.healthType === 'pcos';
  const chips = isPCOS ? PCOS_CHIPS : MATERNITY_CHIPS;

  // ── Send message to bot (saves to Firestore + calls backend) ─
  const sendBotMessage = async (text) => {
    if (!text.trim() || botLoading) return;
    const userText = text.trim();
    setBotInput('');

    // Add user bubble immediately
    const userMsg = { id: Date.now(), from: 'user', text: userText };
    setBotMessages(prev => [...prev, userMsg]);
    setBotLoading(true);

    try {
      // ── 1. Save symptom log to Firestore for tracking ──────
      const isSymptom =
        userText.toLowerCase().includes('pain') ||
        userText.toLowerCase().includes('cramp') ||
        userText.toLowerCase().includes('bleed') ||
        userText.toLowerCase().includes('nausea') ||
        userText.toLowerCase().includes('headache') ||
        userText.toLowerCase().includes('swelling') ||
        userText.toLowerCase().includes('dard') ||
        userText.toLowerCase().includes('khoon') ||
        userText.toLowerCase().includes('took') ||
        userText.toLowerCase().includes('medicine') ||
        userText.toLowerCase().includes('tired') ||
        userText.toLowerCase().includes('mood');

      if (isSymptom) {
        await addDoc(collection(db, 'symptom_logs'), {
          userId: user.uid,
          userName: profile?.name || 'Unknown',
          healthType: profile?.healthType || 'unknown',
          symptom: userText,
          pregnancyWeek: profile?.pregnancyWeek || null,
          source: 'whatsapp_bot_dashboard',
          timestamp: serverTimestamp(),
        });
      }

      // ── 2. Call backend WhatsApp bot webhook ──────────────
      const res = await fetch(
        'https://us-central1-maternity-76579.cloudfunctions.net/whatsappBot',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            Body: userText,
            From: `whatsapp:${profile?.phone || ''}`,
            ProfileName: profile?.name || 'User',
          }),
        }
      );

      // ── 3. Parse TwiML response → extract text ────────────
      const xml = await res.text();
      const match = xml.match(/<Message>([\s\S]*?)<\/Message>/);
      const botReply = match
        ? match[1].trim()
        : isPCOS
          ? "I've noted your symptoms and they're being tracked. 💜"
          : "I've noted your symptoms and they're being tracked. 💚";

      // ── 4. Save full chat log ─────────────────────────────
      await addDoc(collection(db, 'bot_chat_logs'), {
        userId: user.uid,
        userName: profile?.name || 'Unknown',
        healthType: profile?.healthType || 'unknown',
        userMessage: userText,
        botResponse: botReply,
        pregnancyWeek: profile?.pregnancyWeek || null,
        source: 'dashboard_bot',
        timestamp: serverTimestamp(),
      });

      setBotMessages(prev => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', text: botReply },
      ]);

    } catch (err) {
      console.error('Bot error:', err);
      setBotMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text: "Sorry, I'm having trouble connecting right now. Your symptom has been saved. 🙏",
        },
      ]);
    } finally {
      setBotLoading(false);
    }
  };

  const navItems = [
    { to: '/dashboard', label: isPCOS ? '🌸 My Health' : '🤰 My Pregnancy', end: true },
    { to: '/dashboard/messages', label: '💬 Messages' },
    { to: '/dashboard/settings', label: '⚙️ Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Nav ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* Logo + name */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPCOS ? 'bg-purple-100' : 'bg-pink-100'
              }`}>
              <span className="text-lg">{isPCOS ? '🌸' : '🤰'}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">
                {profile?.name || 'My Dashboard'}
              </p>
              <p className={`text-xs font-medium ${isPCOS ? 'text-purple-500' : 'text-pink-500'
                }`}>
                {isPCOS ? 'PCOS Tracking' : `Week ${profile?.pregnancyWeek || '?'}`}
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                    ? isPCOS
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-pink-100 text-pink-700'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: bell + WhatsApp button + sign out */}
          <div className="flex items-center gap-1">

            {/* ── WhatsApp Bot Button ── */}
            <button
              onClick={() => setShowBotLauncher(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95 ${isPCOS
                ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat AI</span>
            </button>

            {/* Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifs(!showNotifs);
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="font-bold text-gray-800 text-sm">Notifications</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      No notifications yet 🔔
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                      {notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                          <p className="text-sm text-gray-700">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex border-t border-gray-100">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${isActive
                  ? isPCOS
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                    : 'text-pink-600 border-b-2 border-pink-500 bg-pink-50/50'
                  : 'text-gray-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* ── Risk banner ── */}
      {profile?.riskScore === 'HIGH' && (
        <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-center py-2.5 px-4 text-sm font-semibold">
          🚨 High risk detected — we've alerted your emergency contact and will call you shortly
        </div>
      )}

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              isPCOS
                ? <PCOSDashboard profile={profile} userId={user.uid} />
                : <MaternityDashboard profile={profile} userId={user.uid} />
            }
          />
          <Route
            path="/messages"
            element={<MessagesPage userId={user.uid} isPCOS={isPCOS} profile={profile} onOpenBot={() => setShowBotLauncher(true)} />}
          />
          <Route
            path="/settings"
            element={<UserSettings userId={user.uid} profile={profile} />}
          />
        </Routes>
      </main>

      {/* ─────────────────────────────────────────────────────────
          ✅ WHATSAPP BOT CHAT LAUNCHER (floating modal)
      ───────────────────────────────────────────────────────── */}
      {showBotLauncher && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowBotLauncher(false)}
          />

          {/* Chat window */}
          <div className={`relative w-full sm:w-[420px] h-[90vh] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden`}>

            {/* Header */}
            <div className={`px-4 py-4 flex items-center justify-between ${isPCOS
              ? 'bg-gradient-to-r from-purple-500 to-violet-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                  {isPCOS ? '🌸' : '🤰'}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">MamaCare AI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-white/80 text-xs">Online — Log symptoms here</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBotLauncher(false)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Also open in WhatsApp link */}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(
                profile?.healthType === 'pcos' ? 'pcos' : 'maternity'
              )
                }`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold border-b border-gray-100 transition-colors ${isPCOS
                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
            >
              <span className="text-base">📱</span>
              Open MamaCare on WhatsApp →
            </a>



            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {botMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.from === 'bot' && (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 ${isPCOS ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                      {isPCOS ? '🌸' : '🤰'}
                    </div>
                  )}
                  <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed shadow-sm ${msg.from === 'user'
                    ? isPCOS
                      ? 'bg-purple-500 text-white rounded-br-sm'
                      : 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {botLoading && (
                <div className="flex justify-start items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${isPCOS ? 'bg-purple-100' : 'bg-green-100'
                    }`}>
                    {isPCOS ? '🌸' : '🤰'}
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick symptom chips */}
            <div className="px-3 py-2 border-t border-gray-100 bg-white">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {chips.map((chip) => (
                  <a
                    key={chip}
                    href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(chip)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:scale-105 active:scale-95 ${isPCOS
                        ? 'border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100'
                        : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                  >
                    {chip}
                  </a>
                ))}
              </div>
            </div>


           {/* Input bar */}
<div className="px-3 py-3 bg-white border-t border-gray-100">
  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
    <input
      type="text"
      value={botInput}
      onChange={(e) => setBotInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && botInput.trim()) {
          window.open(
            `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(botInput.trim())}`,
            '_blank'
          );
          setBotInput('');
        }
      }}
      placeholder="Type a symptom — opens WhatsApp..."
      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
    />
    <a
      href={botInput.trim()
        ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(botInput.trim())}`
        : `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=hi`
      }
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setBotInput('')}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
        isPCOS
          ? 'bg-purple-500 text-white'
          : 'bg-green-500 text-white'
      }`}
    >
      <Send className="w-3.5 h-3.5" />
    </a>
  </div>
  <p className="text-center text-xs text-gray-400 mt-2">
    Tap any symptom or type below → opens WhatsApp 📱
  </p>
</div>

          </div>
        </div>
      )
      }

      {/* ── Floating WhatsApp FAB (always visible) ── */}
      <button
        onClick={() => setShowBotLauncher(true)}
        className={`fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 ${isPCOS
          ? 'bg-gradient-to-br from-purple-500 to-violet-600'
          : 'bg-gradient-to-br from-green-500 to-emerald-600'
          }`}
        title="Chat with MamaCare AI"
      >
        💬
      </button>
    </div >
  );
}


// ─────────────────────────────────────────────────────────────
// ── MESSAGES PAGE — updated with Bot CTA card
// ─────────────────────────────────────────────────────────────
function MessagesPage({ userId, isPCOS, profile, onOpenBot }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('whatsapp'); // 'whatsapp' | 'symptoms'
  const [symptoms, setSymptoms] = useState([]);

  // ── WhatsApp logs ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'whatsapp_conversations'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q,
      (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        if (err.code !== 'failed-precondition') console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId]);

  // ── Symptom logs ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'symptom_logs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q,
      (snap) => setSymptoms(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => { }
    );
    return () => unsub();
  }, [userId]);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-gray-100" />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 pb-10">

      <div>
        <h2 className="text-2xl font-bold text-gray-900">💬 My Messages</h2>
        <p className="text-gray-400 text-sm mt-1">Chat history and logged symptoms</p>
      </div>

      {/* ── Bot CTA card ─────────────────────────────────── */}
      <div className={`rounded-2xl p-4 flex items-center justify-between ${isPCOS
        ? 'bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100'
        : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
        }`}>
        <div>
          <p className={`font-bold text-sm ${isPCOS ? 'text-purple-700' : 'text-green-700'}`}>
            🤖 Chat with MamaCare AI
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Log symptoms, ask diet questions, get instant answers
          </p>
        </div>
        <button
          onClick={onOpenBot}
          className={`px-4 py-2 rounded-full text-xs font-bold text-white shadow-sm transition-all hover:scale-105 ${isPCOS
            ? 'bg-gradient-to-r from-purple-500 to-violet-500'
            : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}
        >
          Open Chat
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
        {[
          { key: 'whatsapp', label: '📱 WhatsApp Tips' },
          { key: 'symptoms', label: '🩺 Logged Symptoms' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold transition-all ${tab === t.key
              ? isPCOS
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-green-500 text-white shadow-sm'
              : 'text-gray-500'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── WhatsApp tab ─────────────────────────────────── */}
      {tab === 'whatsapp' && (
        messages.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">💬</div>
            <p className="font-semibold text-gray-700">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">
              You'll receive weekly health tips here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${msg.direction === 'inbound'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-green-50 text-green-600'
                    }`}>
                    {msg.direction === 'inbound' ? '📤 You sent' : '📥 Health tip'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {msg.timestamp?.toDate?.()?.toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    }) || '—'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {msg.message}
                </p>
                {msg.response && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-green-600 mb-1">🤖 AI Response:</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                      {msg.response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Symptoms tab ─────────────────────────────────── */}
      {tab === 'symptoms' && (
        symptoms.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">🩺</div>
            <p className="font-semibold text-gray-700">No symptoms logged yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Use the AI chat to log your symptoms
            </p>
            <button
              onClick={onOpenBot}
              className={`mt-4 px-5 py-2 rounded-full text-sm font-bold text-white ${isPCOS
                ? 'bg-purple-500'
                : 'bg-green-500'
                }`}
            >
              Log a Symptom →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {symptoms.map(s => (
              <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPCOS ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-700'
                    }`}>
                    🩺 Symptom Log
                  </span>
                  <span className="text-xs text-gray-400">
                    {s.timestamp?.toDate?.()?.toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                    }) || '—'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{s.symptom}</p>
                {s.pregnancyWeek && (
                  <p className="text-xs text-gray-400 mt-1">Week {s.pregnancyWeek}</p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
