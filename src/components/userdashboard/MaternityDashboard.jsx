// src/components/userdashboard/MaternityDashboard.jsx
import { useState, useEffect }         from 'react';
import { BPChart, HbChart }            from './VitalsChart';
import DueDateCountdown                from './DueDateCountdown';
import { useConfetti }                 from '../../hooks/useConfetti';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc,
} from 'firebase/firestore';
import { db }                          from '../../config/firebase';
import {
  Plus, X, Heart, TrendingUp, Calendar,
  Shield, AlertCircle, Phone, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const functions           = getFunctions();
const predictMaternalRisk = httpsCallable(functions, 'predictMaternalRisk');
const makeHealthTipCall   = httpsCallable(functions, 'makeHealthTipCall');

const WHATSAPP_NUMBER = '+14155238886';

// ── Constants ────────────────────────────────────────────────
const TRIMESTER_DATA = {
  first:  { label: '1st Trimester', weeks: '1–12',  color: 'pink',   gradient: 'from-pink-500 to-rose-400',     bg: 'bg-pink-50',   text: 'text-pink-600'   },
  second: { label: '2nd Trimester', weeks: '13–28', color: 'orange', gradient: 'from-orange-500 to-amber-400',  bg: 'bg-orange-50', text: 'text-orange-600' },
  third:  { label: '3rd Trimester', weeks: '29–42', color: 'purple', gradient: 'from-violet-500 to-purple-400', bg: 'bg-violet-50', text: 'text-violet-600' },
};

const TIPS_BY_TRIMESTER = {
  first: [
    { icon: '💊', tip: 'Take folic acid daily — it prevents birth defects'    },
    { icon: '🥦', tip: 'Eat iron-rich foods: spinach, lentils, eggs'          },
    { icon: '💧', tip: 'Drink 8–10 glasses of water daily'                    },
    { icon: '😴', tip: 'Rest as much as you can — fatigue is very normal'     },
    { icon: '🚫', tip: 'Avoid alcohol, smoking, and raw fish'                 },
  ],
  second: [
    { icon: '🏃', tip: 'Light walking 20 mins daily is very beneficial'       },
    { icon: '🥛', tip: 'Increase calcium intake — milk, yogurt, cheese'       },
    { icon: '📅', tip: 'Schedule your anomaly scan (18–20 weeks)'             },
    { icon: '💃', tip: 'Gentle yoga helps with back pain'                     },
    { icon: '🩺', tip: 'Monitor your blood pressure regularly'                },
  ],
  third: [
    { icon: '🏥', tip: "Pack your hospital bag — you're almost there!"        },
    { icon: '🛏️', tip: 'Sleep on your left side for better blood flow'       },
    { icon: '🫁', tip: 'Practice breathing exercises for labour'              },
    { icon: '📞', tip: 'Keep emergency numbers handy at all times'            },
    { icon: '⚖️', tip: 'Monitor baby movements every day'                    },
  ],
};

const BABY_SIZE = {
  4:  '🫐 Blueberry',    6:  '🫘 Lentil',        8:  '🫒 Raspberry',
  10: '🍓 Strawberry',   12: '🍋 Lime',           14: '🍑 Peach',
  16: '🥑 Avocado',      18: '🍠 Sweet potato',   20: '🍌 Banana',
  22: '🌽 Corn',         24: '🥭 Mango',          26: '🥬 Lettuce',
  28: '🍆 Eggplant',     30: '🥥 Coconut',        32: '🎃 Squash',
  34: '🍈 Melon',        36: '🥗 Honeydew',       38: '🎃 Pumpkin',
  40: '🍉 Watermelon',
};

const getBabySize     = (w) => {
  const keys  = Object.keys(BABY_SIZE).map(Number).sort((a, b) => a - b);
  const match = keys.filter(k => k <= w).pop();
  return BABY_SIZE[match] || '🫘 Tiny seed';
};
const getTrimester    = (w) => w <= 12 ? TRIMESTER_DATA.first  : w <= 28 ? TRIMESTER_DATA.second : TRIMESTER_DATA.third;
const getTrimesterKey = (w) => w <= 12 ? 'first' : w <= 28 ? 'second' : 'third';


// ─────────────────────────────────────────────────────────────
// ✅ SYMPTOM LOG MODAL — user logs symptoms → saved + WhatsApp
// ─────────────────────────────────────────────────────────────
const QUICK_SYMPTOMS = [
  '🤢 Nausea / vomiting',
  '😵 Severe headache',
  '🦵 Leg / face swelling',
  '👁️ Blurred vision',
  '🩸 Spotting / bleeding',
  '👶 Baby not moving',
  '💊 Took my medicine',
  '🔥 Fever',
  '😰 Feeling very weak',
  '💧 Reduced urine',
];

function SymptomModal({ onClose, profile, userId }) {
  const [selected, setSelected] = useState([]);
  const [custom,   setCustom]   = useState('');
  const [saving,   setSaving]   = useState(false);

  const toggle = (s) =>
    setSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

  const handleLog = async () => {
    const all = [...selected, ...(custom.trim() ? [custom.trim()] : [])];
    if (all.length === 0) { toast.error('Pick or type at least one symptom'); return; }
    setSaving(true);

    try {
      // ── 1. Save each symptom to Firestore ──────────────────
      for (const symptom of all) {
        await addDoc(collection(db, 'symptom_logs'), {
          userId,
          userName:      profile?.name      || 'Unknown',
          healthType:    'maternity',
          symptom,
          pregnancyWeek: profile?.pregnancyWeek || null,
          riskScore:     profile?.riskScore     || 'LOW',
          source:        'dashboard_symptom_modal',
          timestamp:     serverTimestamp(),
        });
      }

      // ── 2. Open WhatsApp with symptoms pre-filled ──────────
      const waText =
        `maternity\n\nHi MamaCare, I am ${profile?.name || 'a patient'} ` +
        `(Week ${profile?.pregnancyWeek || '?'}). ` +
        `I want to log these symptoms:\n` +
        all.map(s => `• ${s}`).join('\n');

      window.open(
        `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(waText)}`,
        '_blank'
      );

      toast.success('✅ Symptoms saved & opened in WhatsApp!');
      onClose();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">🩺 Log Symptoms</h3>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            Select your symptoms — they'll be saved and sent to your MamaCare bot on WhatsApp
          </p>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_SYMPTOMS.map(s => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  selected.includes(s)
                    ? 'bg-pink-500 border-pink-500 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-pink-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <input
            type="text"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Type any other symptom..."
            className="input-field text-sm mb-5"
          />

          {/* Selected preview */}
          {selected.length > 0 && (
            <div className="bg-pink-50 rounded-2xl p-3 mb-4">
              <p className="text-xs font-bold text-pink-600 mb-2">Selected symptoms:</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.map(s => (
                  <span key={s} className="text-xs bg-white border border-pink-200 text-pink-700 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleLog}
            disabled={saving || (selected.length === 0 && !custom.trim())}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><MessageCircle className="w-4 h-4" /> Save & Open WhatsApp</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ── VITALS MODAL
// ─────────────────────────────────────────────────────────────
function VitalsModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({
    bp: '', hemoglobin: '', weight: '',
    swelling: false, headache: false, vision: false, notes: '',
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-gray-900">📋 Log Vitals</h3>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Blood Pressure
                </label>
                <input type="text" className="input-field text-sm" placeholder="120/80"
                  value={form.bp} onChange={e => setForm({ ...form, bp: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Hemoglobin (g/dL)
                </label>
                <input type="number" className="input-field text-sm" placeholder="11.5"
                  value={form.hemoglobin}
                  onChange={e => setForm({ ...form, hemoglobin: e.target.value })}
                  step="0.1" min="5" max="20" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Weight (kg)
              </label>
              <input type="number" className="input-field text-sm" placeholder="65"
                value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Any of these today?
              </label>
              <div className="space-y-2">
                {[
                  { key: 'swelling', label: '🦵 Unusual swelling in hands/face' },
                  { key: 'headache', label: '🤕 Severe headache'                },
                  { key: 'vision',   label: '👁️ Blurred vision'                },
                ].map(item => (
                  <label key={item.key}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                      form[item.key] ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                    }`}>
                    <input type="checkbox" checked={form[item.key]}
                      onChange={e => setForm({ ...form, [item.key]: e.target.checked })}
                      className="w-4 h-4 accent-red-500 rounded" />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Notes
              </label>
              <textarea className="input-field resize-none text-sm" rows={2}
                placeholder="Any symptoms or concerns..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <button onClick={() => onSave(form)} disabled={loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '💾 Save Vitals'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ── WEEK ARC
// ─────────────────────────────────────────────────────────────
function WeekArc({ week, trimester }) {
  const pct    = Math.min(week / 40, 1);
  const r      = 60;
  const circ   = Math.PI * r;
  const dash   = pct * circ;
  const gradId = `grad-${trimester.color}`;

  const colors = {
    pink:   ['#f472b6', '#fb7185'],
    orange: ['#f97316', '#f59e0b'],
    purple: ['#8b5cf6', '#a78bfa'],
  };
  const [c1, c2] = colors[trimester.color] || colors.pink;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="160" height="90" viewBox="0 0 160 90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <path d="M 10 80 A 70 70 0 0 1 150 80"
          fill="none" stroke="#ffffff30" strokeWidth="12" strokeLinecap="round" />
        <path d="M 10 80 A 70 70 0 0 1 150 80"
          fill="none" stroke={`url(#${gradId})`} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`} />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className="text-4xl font-bold text-white">{week}</p>
        <p className="text-xs text-white/60 font-medium">of 40 weeks</p>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ── MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function MaternityDashboard({ profile, userId }) {

  const [checkups,      setCheckups]      = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [showSymptom,   setShowSymptom]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState('overview');
  const [mlData,        setMlData]        = useState(null);
  const [calling,       setCalling]       = useState(false);
  const [callStatus,    setCallStatus]    = useState(null); // 'calling' | 'success' | 'error'

  const week      = profile?.pregnancyWeek || 0;
  const trimester = getTrimester(week);
  const trimKey   = getTrimesterKey(week);
  const tips      = TIPS_BY_TRIMESTER[trimKey];
  const babySize  = getBabySize(week);
  const weeksLeft = 40 - week;
  const latest    = checkups[0];

  const { hearts } = useConfetti();

  useEffect(() => {
    if (week === 12 || week === 20 || week === 28) {
      setTimeout(() => hearts(), 600);
    }
  }, [week]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'checkups'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q,
      snap => setCheckups(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err  => { if (err.code !== 'failed-precondition') console.error(err); }
    );
    return () => unsub();
  }, [userId]);

  // ─────────────────────────────────────────────────────────
  // ✅ CALL ME NOW — triggers Twilio call via Cloud Function
  // ─────────────────────────────────────────────────────────
  const handleCallMe = async () => {
    if (!profile?.phone) {
      toast.error('No phone number found in your profile. Please update settings.');
      return;
    }
    setCalling(true);
    setCallStatus('calling');
    try {
      const result = await makeHealthTipCall({
        patientId:   userId,
        patientName: profile.name     || 'Patient',
        phone:       profile.phone,
        week:        week,
        language:    profile.language || 'hindi',
      });

      if (result?.data?.success) {
        setCallStatus('success');
        toast.success('📞 Calling you now! Pick up in a few seconds.', { duration: 6000 });

        // Log call request
        await addDoc(collection(db, 'call_logs'), {
          userId,
          type:      'user_requested',
          callSid:   result.data.callSid,
          timestamp: serverTimestamp(),
          status:    'initiated',
        });
      }
    } catch (err) {
      setCallStatus('error');
      toast.error('Call failed: ' + err.message);
    }
    setCalling(false);
    setTimeout(() => setCallStatus(null), 8000);
  };

  // ─────────────────────────────────────────────────────────
  // ✅ SAVE VITALS — triggers WhatsApp + Call if HIGH risk
  // ─────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    if (!form.bp && !form.hemoglobin && !form.weight) {
      toast.error('Please fill at least one vital'); return;
    }
    setSaving(true);
    try {
      const sys          = parseInt(form.bp?.split('/')[0])  || 0;
      const dia          = parseInt(form.bp?.split('/')[1])  || 0;
      const hb           = parseFloat(form.hemoglobin)       || 0;
      const wt           = parseFloat(form.weight)           || 0;
      const warnSymptoms = [form.swelling, form.headache, form.vision].filter(Boolean).length;

      let riskScore = 'LOW';
      if      (sys > 140 || hb < 8  || warnSymptoms >= 2) riskScore = 'HIGH';
      else if (sys > 130 || hb < 10 || warnSymptoms >= 1) riskScore = 'MODERATE';

      try {
        const result = await predictMaternalRisk({
          age:         profile?.age        || 25,
          systolicBP:  sys                 || 120,
          diastolicBP: dia                 || 80,
          bloodSugar:  profile?.bloodSugar || 90,
          bodyTemp:    98.6,
          heartRate:   profile?.heartRate  || 72,
        });
        if (result?.data?.risk) {
          riskScore = result.data.risk;
          setMlData(result.data);
        }
      } catch (mlErr) {
        console.warn('⚠️ ML fallback:', mlErr.message);
      }

      // ── Save checkup ────────────────────────────────────────
      await addDoc(collection(db, 'checkups'), {
        userId,
        bp:         form.bp   || null,
        hemoglobin: hb        || null,
        weight:     wt        || null,
        warnings:   { swelling: form.swelling, headache: form.headache, vision: form.vision },
        notes:      form.notes || '',
        riskScore,
        healthType: 'maternity',
        date:       new Date().toLocaleDateString('en-IN'),
        createdAt:  serverTimestamp(),
      });

      const nextCheckup = new Date();
      nextCheckup.setDate(nextCheckup.getDate() + 28);
      await updateDoc(doc(db, 'users', userId), {
        nextCheckup: nextCheckup.toISOString(),
        lastVisit:   new Date().toISOString(),
      });

      // ── ✅ HIGH RISK → WhatsApp + Auto Call simultaneously ──
      if (riskScore === 'HIGH') {
        toast.error('🚨 High risk! Sending alert and calling you now...', { duration: 7000 });

        // Auto-trigger call immediately
        if (profile?.phone) {
          try {
            await makeHealthTipCall({
              patientId:   userId,
              patientName: profile.name     || 'Patient',
              phone:       profile.phone,
              week:        week,
              language:    profile.language || 'hindi',
            });
            toast('📞 MamaCare is calling you now!', { icon: '📞', duration: 5000 });
          } catch (callErr) {
            console.warn('Auto-call failed:', callErr.message);
          }
        }

        // WhatsApp is handled by onCheckupCreated Cloud Function automatically
        // But also open WhatsApp from browser as backup
        const waAlert =
          `🚨 HIGH RISK ALERT\n\n` +
          `Hi ${profile?.name || 'there'}, your vitals show HIGH risk.\n\n` +
          `BP: ${form.bp || '—'} | Hb: ${hb || '—'} g/dL\n\n` +
          `Please visit your nearest health center immediately or call 102.`;
        setTimeout(() => {
          window.open(
            `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(waAlert)}`,
            '_blank'
          );
        }, 1500);

      } else if (riskScore === 'MODERATE') {
        toast('⚠️ Moderate risk. Monitor closely.', { icon: '⚠️', duration: 5000 });
      } else {
        toast.success('✅ Vitals saved! Everything looks good. 💚');
      }

      setShowModal(false);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
    setSaving(false);
  };

  // ── Helpers ───────────────────────────────────────────────
  const getBPStatus = (bp) => {
    if (!bp) return null;
    const s = parseInt(bp.split('/')[0]);
    return s > 140 ? 'danger' : s > 130 ? 'warn' : 'good';
  };
  const getHbStatus = (hb) => {
    if (!hb) return null;
    return hb < 8 ? 'danger' : hb < 10 ? 'warn' : 'good';
  };

  const statusColors = {
    good:   { bg: 'bg-green-50',  border: 'border-green-100',  text: 'text-green-600',  badge: 'bg-green-100 text-green-700'   },
    warn:   { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
    danger: { bg: 'bg-red-50',    border: 'border-red-100',    text: 'text-red-600',    badge: 'bg-red-100 text-red-700'       },
    null:   { bg: 'bg-gray-50',   border: 'border-gray-100',   text: 'text-gray-400',   badge: 'bg-gray-100 text-gray-500'     },
  };

  const bpStatus = getBPStatus(latest?.bp || profile?.vitals?.bp);
  const hbStatus = getHbStatus(latest?.hemoglobin || profile?.vitals?.hemoglobin);

  return (
    <div className="space-y-5 pb-10">

      <DueDateCountdown pregnancyWeek={week} lmp={profile?.lmp} />

      {/* ── Hero card ── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${trimester.gradient} p-6 text-white shadow-xl`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-3">
              ✨ {trimester.label} · Weeks {trimester.weeks}
            </div>
            <h2 className="text-3xl font-bold mb-1">Week {week}</h2>
            <p className="text-white/80 text-sm mb-3">
              {weeksLeft > 0 ? `${weeksLeft} weeks until your due date 🎉` : 'Your due date is here! 🌟'}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-xl text-sm font-medium">
              Baby is about {babySize} this week
            </div>
          </div>
          <WeekArc week={week} trimester={trimester} />
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-white/70 mb-1.5">
            <span>Week 1</span>
            <span className="font-semibold text-white">{Math.round((week / 40) * 100)}% complete</span>
            <span>Week 40</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full">
            <div className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${Math.min((week / 40) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ── HIGH Risk banner ── */}
      {profile?.riskScore === 'HIGH' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-700 text-sm">High Risk Alert</p>
            <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
              Your recent vitals show high risk indicators. We've notified your emergency contact.
              Please visit your nearest health center immediately.
            </p>
          </div>
        </div>
      )}

      {/* ── Vitals row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Blood Pressure', value: latest?.bp         || profile?.vitals?.bp         || '—', icon: <Heart     className="w-5 h-5" />, status: bpStatus                        },
          { label: 'Hemoglobin',     value: latest?.hemoglobin ? `${latest.hemoglobin} g/dL`  : '—', icon: <TrendingUp className="w-5 h-5" />, status: hbStatus                        },
          { label: 'Weight',         value: latest?.weight     ? `${latest.weight} kg`        : '—', icon: <Shield     className="w-5 h-5" />, status: latest?.weight ? 'good' : null },
        ].map(v => {
          const c = statusColors[v.status] || statusColors[null];
          return (
            <div key={v.label} className={`${c.bg} border ${c.border} rounded-2xl p-3.5`}>
              <div className={`${c.text} mb-2`}>{v.icon}</div>
              <p className={`text-lg font-bold ${c.text}`}>{v.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{v.label}</p>
              {v.status && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${c.badge}`}>
                  {v.status === 'good' ? '✓ Normal' : v.status === 'warn' ? '⚠ Watch' : '⛔ High'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────
          ✅ ACTION BUTTONS — Log Vitals + Symptoms + Call Me
      ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3">

        {/* Log Vitals */}
        <button
          onClick={() => setShowModal(true)}
          className={`w-full py-4 bg-gradient-to-r ${trimester.gradient} text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2`}
        >
          <Plus className="w-5 h-5" />
          Log Today's Vitals
        </button>

        {/* Bottom two buttons */}
        <div className="grid grid-cols-2 gap-3">

          {/* Log Symptoms → WhatsApp */}
          <button
            onClick={() => setShowSymptom(true)}
            className="py-3.5 bg-white border-2 border-pink-200 text-pink-600 font-bold rounded-2xl hover:bg-pink-50 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Log Symptoms
          </button>

          {/* Call Me Now */}
          <button
            onClick={handleCallMe}
            disabled={calling}
            className={`py-3.5 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 ${
              callStatus === 'success'
                ? 'bg-green-500'
                : callStatus === 'error'
                ? 'bg-red-400'
                : 'bg-gradient-to-r from-violet-500 to-purple-500'
            }`}
          >
            {calling
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Phone className="w-4 h-4" />
            }
            {callStatus === 'success'
              ? 'Calling... 📞'
              : callStatus === 'error'
              ? 'Try Again'
              : 'Call Me Now'
            }
          </button>
        </div>
      </div>

      {/* Call status banner */}
      {callStatus === 'calling' && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Phone className="w-4 h-4 text-purple-600 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-700">MamaCare is calling you!</p>
            <p className="text-xs text-purple-500">Pick up in a few seconds — our AI health assistant will speak with you</p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'history',  label: '📋 History'  },
          { id: 'tips',     label: '💡 Tips'     },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Calendar className="w-5 h-5 text-pink-400 mb-2" />
              <p className="text-xs text-gray-500 font-medium">Next Checkup</p>
              <p className="font-bold text-gray-800 text-sm mt-1">
                {profile?.nextCheckup
                  ? new Date(profile.nextCheckup).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
                  : 'Not scheduled'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Shield className="w-5 h-5 text-pink-400 mb-2" />
              <p className="text-xs text-gray-500 font-medium">Risk Status</p>
              <p className={`font-bold text-sm mt-1 ${
                profile?.riskScore === 'HIGH'     ? 'text-red-600'    :
                profile?.riskScore === 'MODERATE' ? 'text-orange-600' : 'text-green-600'
              }`}>
                {profile?.riskScore === 'HIGH'     ? '🔴 High Risk' :
                 profile?.riskScore === 'MODERATE' ? '🟡 Moderate'  : '🟢 Low Risk'}
              </p>
            </div>
          </div>

          {/* ML badge */}
          {mlData && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl">🤖</div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">AI Risk Assessment</p>
                    <p className={`font-bold text-sm ${
                      mlData.risk === 'HIGH'     ? 'text-red-600'    :
                      mlData.risk === 'MODERATE' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {mlData.risk === 'HIGH' ? '🔴 High Risk' : mlData.risk === 'MODERATE' ? '🟡 Moderate' : '🟢 Low Risk'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Confidence</p>
                  <p className="text-lg font-bold text-purple-600">{Math.round(mlData.confidence * 100)}%</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${
                    mlData.risk === 'HIGH' ? 'bg-red-400' : mlData.risk === 'MODERATE' ? 'bg-orange-400' : 'bg-green-400'
                  }`} style={{ width: `${Math.round(mlData.confidence * 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Based on {mlData.score} risk indicator{mlData.score !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          )}

          {checkups.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-3">🤰</div>
              <p className="font-semibold text-gray-700">No vitals logged yet</p>
              <p className="text-sm text-gray-400 mt-1">Log your first vitals to track your health</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: History ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {checkups.length >= 2 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-1">📈 Blood Pressure Trend</h3>
              <p className="text-xs text-gray-400 mb-3">Last 10 readings</p>
              <BPChart checkups={checkups} />
            </div>
          )}
          {checkups.length >= 2 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-1">📈 Hemoglobin Trend</h3>
              <p className="text-xs text-gray-400 mb-3">Last 10 readings</p>
              <HbChart checkups={checkups} />
            </div>
          )}
          {checkups.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-gray-700">No checkups logged yet</p>
              <p className="text-sm text-gray-400 mt-1">Your vitals history will appear here</p>
            </div>
          ) : (
            checkups.map(c => {
              const rs = c.riskScore;
              return (
                <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">{c.date}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      rs === 'HIGH'     ? 'bg-red-100 text-red-600'       :
                      rs === 'MODERATE' ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {rs || 'LOW'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'BP',     value: c.bp              || '—' },
                      { label: 'Hb',     value: c.hemoglobin  ? `${c.hemoglobin} g/dL` : '—' },
                      { label: 'Weight', value: c.weight      ? `${c.weight} kg`       : '—' },
                    ].map(v => (
                      <div key={v.label} className="bg-gray-50 rounded-xl p-2">
                        <p className="text-xs text-gray-400">{v.label}</p>
                        <p className="text-sm font-bold text-gray-700">{v.value}</p>
                      </div>
                    ))}
                  </div>
                  {(c.warnings?.swelling || c.warnings?.headache || c.warnings?.vision) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {c.warnings.swelling && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">🦵 Swelling</span>}
                      {c.warnings.headache && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">🤕 Headache</span>}
                      {c.warnings.vision   && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">👁️ Vision</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Tab: Tips ── */}
      {activeTab === 'tips' && (
        <div className="space-y-3">
          <div className={`${trimester.bg} rounded-2xl p-4`}>
            <p className={`text-sm font-bold ${trimester.text}`}>
              Tips for {trimester.label} · Weeks {trimester.weeks}
            </p>
          </div>
          {tips.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-11 h-11 bg-pink-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {item.icon}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed pt-1">{item.tip}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <VitalsModal onClose={() => setShowModal(false)} onSave={handleSave} loading={saving} />
      )}
      {showSymptom && (
        <SymptomModal onClose={() => setShowSymptom(false)} profile={profile} userId={userId} />
      )}
    </div>
  );
}
