// src/components/userdashboard/PCOSDashboard.jsx
import { useState, useEffect }         from 'react';
import { PainChart }                   from './VitalsChart';
import { httpsCallable }               from 'firebase/functions';  // ✅ add this
import { functions }                   from '../../config/firebase'; // ✅ add this
import SymptomCalendar                 from './SymptomCalendar';
import { useConfetti }                 from '../../hooks/useConfetti';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc,
} from 'firebase/firestore';
import { db }                          from '../../config/firebase';
import {
  Plus, X, Droplets, Activity, Smile,
  Phone, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ✅ These must be AFTER imports — not before
const predictPCOS       = httpsCallable(functions, 'predictPCOS');
const makeHealthTipCall = httpsCallable(functions, 'makeHealthTipCall');


const WHATSAPP_NUMBER = '+14155238886';

// ── Constants ────────────────────────────────────────────────
const PCOS_TIPS = [
  { icon: '🥗', tip: 'Low-carb diet helps regulate insulin and hormones'       },
  { icon: '🏃', tip: '30 mins of exercise daily can regulate your cycle'        },
  { icon: '😴', tip: 'Sleep 7–8 hours — poor sleep worsens hormonal imbalance' },
  { icon: '🧘', tip: 'Stress worsens PCOS — try meditation or light yoga'      },
  { icon: '💊', tip: 'Track your symptoms daily to notice patterns'            },
  { icon: '🚫', tip: 'Avoid processed sugar — it spikes insulin levels'        },
];

const SYMPTOM_OPTIONS = [
  'irregular_periods', 'weight_gain', 'acne',    'facial_hair',
  'hair_loss',         'mood_swings', 'fatigue',  'pelvic_pain',
  'nausea',            'bloating',
];

const SYMPTOM_EMOJIS = {
  irregular_periods: '🔴', weight_gain: '⚖️',  acne:        '😤',
  facial_hair:       '🪒', hair_loss:   '💇',  mood_swings: '😤',
  fatigue:           '😴', pelvic_pain: '💢',  nausea:      '🤢',
  bloating:          '🫧',
};

// ── Quick WhatsApp symptom chips ─────────────────────────────
const PCOS_WA_CHIPS = [
  '😣 Severe cramps',
  '🩸 Heavy bleeding',
  '😔 Mood swings today',
  '💊 Took my medicine',
  '⚖️ Weight gain concern',
  '😴 Extreme fatigue',
  '🥗 What diet should I follow?',
  '🏃 Best exercise for PCOS?',
  '💊 What supplements help?',
  '🌡️ Fever / unusual pain',
];


// ─────────────────────────────────────────────────────────────
// ✅ SYMPTOM LOG MODAL — select symptoms → save + open WhatsApp
// ─────────────────────────────────────────────────────────────
function SymptomWAModal({ onClose, profile, userId }) {
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
      for (const symptom of all) {
        await addDoc(collection(db, 'symptom_logs'), {
          userId,
          userName:   profile?.name    || 'Unknown',
          healthType: 'pcos',
          symptom,
          cycleLength: profile?.cycleLength || 28,
          riskScore:   profile?.riskScore   || 'LOW',
          source:      'dashboard_symptom_modal',
          timestamp:   serverTimestamp(),
        });
      }

      const waText =
        `pcos\n\nHi MamaCare, I am ${profile?.name || 'a patient'}. ` +
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
            Select your symptoms — saved to your health record and sent to MamaCare bot on WhatsApp
          </p>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PCOS_WA_CHIPS.map(s => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  selected.includes(s)
                    ? 'bg-purple-500 border-purple-500 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-purple-300'
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
            <div className="bg-purple-50 rounded-2xl p-3 mb-4">
              <p className="text-xs font-bold text-purple-600 mb-2">Selected:</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.map(s => (
                  <span key={s} className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleLog}
            disabled={saving || (selected.length === 0 && !custom.trim())}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
// ── LOG MODAL (existing — unchanged)
// ─────────────────────────────────────────────────────────────
function LogModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({
    type:      'period_start',
    date:      new Date().toISOString().split('T')[0],
    painLevel: 3,
    flow:      'medium',
    symptoms:  [],
    notes:     '',
  });

  const toggleSymptom = (s) => setForm(prev => ({
    ...prev,
    symptoms: prev.symptoms.includes(s)
      ? prev.symptoms.filter(x => x !== s)
      : [...prev.symptoms, s],
  }));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-bold text-gray-900">🌸 Log Today</h3>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'period_start', label: '🔴 Period Start' },
                { v: 'period_end',   label: '🟢 Period End'   },
                { v: 'symptom_log',  label: '📋 Symptoms'     },
              ].map(opt => (
                <button key={opt.v} type="button"
                  onClick={() => setForm({ ...form, type: opt.v })}
                  className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                    form.type === opt.v
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-50 text-gray-600 border border-gray-200'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
              <input type="date" className="input-field text-sm"
                value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pain Level</label>
                <span className={`text-lg font-bold ${
                  form.painLevel >= 8 ? 'text-red-500' : form.painLevel >= 5 ? 'text-orange-500' : 'text-green-500'
                }`}>
                  {form.painLevel}/10
                </span>
              </div>
              <input type="range" min="1" max="10" value={form.painLevel}
                onChange={e => setForm({ ...form, painLevel: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none accent-purple-500 bg-gradient-to-r from-green-300 via-orange-300 to-red-400" />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>No pain</span><span>Moderate</span><span>Severe</span>
              </div>
            </div>

            {form.type === 'period_start' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Flow</label>
                <div className="flex gap-2">
                  {['light', 'medium', 'heavy'].map(f => (
                    <button key={f} type="button"
                      onClick={() => setForm({ ...form, flow: f })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        form.flow === f ? 'bg-pink-500 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                      {f === 'light' ? '💧' : f === 'medium' ? '💧💧' : '💧💧💧'} {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSymptom(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                      form.symptoms.includes(s)
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-purple-300'
                    }`}>
                    {SYMPTOM_EMOJIS[s]} {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
              <textarea className="input-field resize-none text-sm" rows={2}
                placeholder="Any observations..."
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <button onClick={() => onSave(form)} disabled={loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : '💾 Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ── CYCLE RING
// ─────────────────────────────────────────────────────────────
function CycleRing({ cycleLength, daysUntil }) {
  const total   = cycleLength || 28;
  const elapsed = total - (daysUntil ?? total);
  const pct     = Math.max(0, Math.min(elapsed / total, 1));
  const r       = 54;
  const circ    = 2 * Math.PI * r;
  const dash    = pct * circ;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <defs>
          <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle cx="72" cy="72" r={r} fill="none" stroke="#ffffff20" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none"
          stroke="url(#purpleGrad)" strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" />
      </svg>
      <div className="text-center z-10">
        <p className="text-3xl font-bold text-white">{total}</p>
        <p className="text-xs text-purple-200 font-medium">days</p>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// ── MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function PCOSDashboard({ profile, userId }) {

  const [logs,         setLogs]         = useState([]);
  const [showModal,    setShowModal]     = useState(false);
  const [showSymptom,  setShowSymptom]   = useState(false);
  const [saving,       setSaving]        = useState(false);
  const [activeTab,    setActiveTab]     = useState('overview');
  const [mlData,       setMlData]        = useState(null);
  const [calling,      setCalling]       = useState(false);
  const [callStatus,   setCallStatus]    = useState(null); // 'calling' | 'success' | 'error'

  const cycleLength = profile?.cycleLength || 28;
  const periodLogs  = logs.filter(l => l.type === 'period_start');
  const lastPeriod  = periodLogs[0];
  const nextPeriod  = lastPeriod
    ? (() => { const d = new Date(lastPeriod.date); d.setDate(d.getDate() + cycleLength); return d; })()
    : null;
  const daysUntil   = nextPeriod
    ? Math.ceil((nextPeriod - new Date()) / 86400000)
    : null;
  const isIrregular = cycleLength > 35;

  const allSymptoms   = logs.flatMap(l => l.symptoms || []);
  const symptomCounts = allSymptoms.reduce((a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }), {});
  const topSymptoms   = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const avgPain       = logs.length
    ? (logs.reduce((s, l) => s + (l.painLevel || 0), 0) / logs.length).toFixed(1)
    : null;

  const { celebrate } = useConfetti();

  useEffect(() => {
    if (logs.length === 1) celebrate();
  }, [logs.length]);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'cycle_logs'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q,
      snap => setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err  => { if (err.code !== 'failed-precondition') console.error(err); }
    );
    return () => unsub();
  }, [userId]);

  // ─────────────────────────────────────────────────────────
  // ✅ CALL ME NOW
  // ─────────────────────────────────────────────────────────
  const handleCallMe = async () => {
    if (!profile?.phone) {
      toast.error('No phone number found. Please update your profile settings.');
      return;
    }
  
    setCalling(true);
    setCallStatus('calling');
  
    try {
      console.log('📞 Calling with:', {
        patientId:   userId,
        patientName: profile.name  || 'Patient',
        phone:       profile.phone,
        week:        0,
        language:    profile.language || 'hindi',
      });
  
      const result = await makeHealthTipCall({
        patientId:   userId          || '',
        patientName: profile.name    || 'Patient',
        phone:       profile.phone,
        week:        0,
        language:    profile.language || 'hindi',
      });
  
      console.log('✅ Call result:', result.data);
  
      if (result?.data?.success) {
        setCallStatus('success');
        toast.success('📞 Calling you now! Pick up in a few seconds.', { duration: 6000 });
        await addDoc(collection(db, 'call_logs'), {
          userId,
          type:      'user_requested_pcos',
          callSid:   result.data.callSid,
          timestamp: serverTimestamp(),
          status:    'initiated',
        });
      }
    } catch (err) {
      console.error('❌ Full error:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error details:', err.details);
      setCallStatus('error');
  
      // ✅ Show the actual error from backend
      const msg = err.details || err.message || 'Unknown error';
      toast.error('Call failed: ' + msg);
    }
  
    setCalling(false);
    setTimeout(() => setCallStatus(null), 8000);
  };
  

  // ─────────────────────────────────────────────────────────
  // ✅ SAVE LOG — auto-call + WhatsApp on HIGH risk
  // ─────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    setSaving(true);
    try {
      const symptoms = form.symptoms || [];

      let riskScore = 'LOW';
      if      (parseInt(form.painLevel) >= 8 || symptoms.length >= 4) riskScore = 'HIGH';
      else if (parseInt(form.painLevel) >= 5 || symptoms.length >= 2) riskScore = 'MODERATE';

      try {
        const result = await predictPCOS({
          irregular_cycles: isIrregular ? 1 : 0,
          weight_gain:      symptoms.includes('weight_gain') ? 1 : 0,
          acne:             symptoms.includes('acne')        ? 1 : 0,
          hair_loss:        symptoms.includes('hair_loss')   ? 1 : 0,
          hirsutism:        symptoms.includes('facial_hair') ? 1 : 0,
          follicle_count:   profile?.follicleCount           || 0,
          amh:              profile?.amh                     || 0,
          lh_fsh_ratio:     profile?.lhFshRatio              || 0,
          bmi:              profile?.bmi                     || 0,
        });
        if (result?.data?.risk) {
          riskScore = result.data.risk;
          setMlData(result.data);
        }
      } catch (mlErr) {
        console.warn('⚠️ PCOS ML fallback:', mlErr.message);
      }

      await addDoc(collection(db, 'cycle_logs'), {
        userId,
        ...form,
        painLevel:  parseInt(form.painLevel),
        riskScore,
        healthType: 'pcos',
        createdAt:  serverTimestamp(),
      });

      await updateDoc(doc(db, 'users', userId), {
        riskScore,
        updatedAt: new Date().toISOString(),
      });

      // ── ✅ HIGH RISK → WhatsApp + Auto Call simultaneously ──
      if (riskScore === 'HIGH') {
        toast.error('🚨 High risk detected! Sending alert and calling you...', { duration: 7000 });

        if (profile?.phone) {
          try {
            await makeHealthTipCall({
              patientId:   userId,
              patientName: profile.name     || 'Patient',
              phone:       profile.phone,
              week:        0,
              language:    profile.language || 'hindi',
            });
            toast('📞 MamaCare is calling you now!', { icon: '📞', duration: 5000 });
          } catch (callErr) {
            console.warn('Auto-call failed:', callErr.message);
          }
        }

        // Open WhatsApp alert as backup
        const waAlert =
          `🚨 PCOS HIGH RISK ALERT\n\n` +
          `Hi ${profile?.name || 'there'}, your logged symptoms show HIGH risk indicators.\n\n` +
          `Pain Level: ${form.painLevel}/10\n` +
          `Symptoms: ${symptoms.join(', ') || 'none'}\n\n` +
          `Please consult your doctor immediately or call 104.`;
        setTimeout(() => {
          window.open(
            `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(waAlert)}`,
            '_blank'
          );
        }, 1500);

      } else if (parseInt(form.painLevel) >= 8) {
        toast.error("⚠️ High pain logged — we'll send support tips to your WhatsApp", { duration: 5000 });
      } else if (riskScore === 'MODERATE') {
        toast('⚠️ Moderate symptoms. Monitor closely.', { icon: '⚠️', duration: 4000 });
      } else {
        toast.success('✅ Log saved!');
      }

      setShowModal(false);
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5 pb-10">

      {/* ── Hero card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 text-white shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-300/20 rounded-full blur-xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
              isIrregular ? 'bg-orange-400/30 text-orange-100' : 'bg-green-400/30 text-green-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isIrregular ? 'bg-orange-300' : 'bg-green-300'}`} />
              {isIrregular ? 'Irregular Cycle' : 'Regular Cycle'}
            </div>
            <h2 className="text-4xl font-bold mb-1">
              {daysUntil !== null
                ? daysUntil <= 0 ? 'Period Due' : `${daysUntil} days`
                : 'Log first period'}
            </h2>
            <p className="text-purple-200 text-sm">
              {daysUntil !== null && daysUntil > 0
                ? `until next period · ${nextPeriod?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : daysUntil !== null ? 'Your period may have started'
                : 'to see predictions'}
            </p>
            {avgPain && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <div className="px-2.5 py-1 bg-white/15 rounded-full text-xs font-medium">
                  Avg pain: {avgPain}/10
                </div>
                <div className="px-2.5 py-1 bg-white/15 rounded-full text-xs font-medium">
                  {logs.length} logs total
                </div>
              </div>
            )}
          </div>
          <CycleRing cycleLength={cycleLength} daysUntil={daysUntil} />
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Droplets className="w-5 h-5" />, label: 'Cycle',     value: `${cycleLength}d`,               bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
          { icon: <Activity  className="w-5 h-5" />, label: 'Logs',     value: logs.length,                     bg: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-100'   },
          { icon: <Smile     className="w-5 h-5" />, label: 'Avg Pain', value: avgPain ? `${avgPain}/10` : '—', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-3.5 flex flex-col gap-1`}>
            <div className={s.text}>{s.icon}</div>
            <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────
          ✅ ACTION BUTTONS — Log + Symptoms + Call Me
      ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3">

        {/* Log Period / Symptoms */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-base"
        >
          <Plus className="w-5 h-5" />
          Log Period / Symptoms Today
        </button>

        {/* Bottom two buttons */}
        <div className="grid grid-cols-2 gap-3">

          {/* Log Symptoms → WhatsApp */}
          <button
            onClick={() => setShowSymptom(true)}
            className="py-3.5 bg-white border-2 border-purple-200 text-purple-600 font-bold rounded-2xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2 text-sm"
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
            {callStatus === 'success' ? 'Calling... 📞' : callStatus === 'error' ? 'Try Again' : 'Call Me Now'}
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
          { id: 'history',  label: '📅 History'  },
          { id: 'tips',     label: '💡 Tips'     },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

          {mlData && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl">🤖</div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">AI PCOS Assessment</p>
                    <p className={`font-bold text-sm ${
                      mlData.risk === 'HIGH' ? 'text-red-600' : mlData.risk === 'MODERATE' ? 'text-orange-600' : 'text-green-600'
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

          {profile?.symptoms?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">🏷️ My PCOS Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {profile.symptoms.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-sm font-medium capitalize">
                    {SYMPTOM_EMOJIS[s]} {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topSymptoms.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">📈 Symptom Patterns</h3>
              <div className="space-y-3">
                {topSymptoms.map(([symptom, count]) => {
                  const pct = Math.round((count / logs.length) * 100);
                  return (
                    <div key={symptom}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {SYMPTOM_EMOJIS[symptom]} {symptom.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{count}x · {pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {logs.length > 0 && <SymptomCalendar logs={logs} />}

          {logs.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="text-5xl mb-3">🌸</div>
              <p className="font-semibold text-gray-700 mb-1">No logs yet</p>
              <p className="text-sm text-gray-400">Log your first period to see patterns and predictions</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: History ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {logs.length >= 2 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-1">📈 Pain Level Trend</h3>
              <p className="text-xs text-gray-400 mb-3">Period pain history</p>
              <PainChart logs={logs} />
            </div>
          )}

          {periodLogs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-3">📅</div>
              <p className="font-semibold text-gray-700">No period logs yet</p>
              <p className="text-sm text-gray-400 mt-1">Tap the button above to log your first period</p>
            </div>
          ) : (
            periodLogs.map(log => (
              <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg">🔴</div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {log.flow && <p className="text-xs text-gray-400 capitalize mt-0.5">Flow: {log.flow}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      log.painLevel >= 8 ? 'bg-red-100 text-red-600' :
                      log.painLevel >= 5 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      Pain {log.painLevel}/10
                    </span>
                    {log.riskScore && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        log.riskScore === 'HIGH'     ? 'bg-red-50 text-red-500'       :
                        log.riskScore === 'MODERATE' ? 'bg-orange-50 text-orange-500' :
                        'bg-green-50 text-green-500'
                      }`}>
                        {log.riskScore}
                      </span>
                    )}
                  </div>
                </div>
                {log.symptoms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {log.symptoms.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full capitalize">
                        {SYMPTOM_EMOJIS[s]} {s.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {log.notes && <p className="text-xs text-gray-400 mt-2 italic">"{log.notes}"</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Tips ── */}
      {activeTab === 'tips' && (
        <div className="space-y-3">
          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <p className="text-sm font-bold text-purple-600">🌸 PCOS Management Tips</p>
            <p className="text-xs text-purple-400 mt-0.5">Small daily habits make the biggest difference</p>
          </div>
          {PCOS_TIPS.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {item.icon}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed pt-1">{item.tip}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <LogModal onClose={() => setShowModal(false)} onSave={handleSave} loading={saving} />
      )}
      {showSymptom && (
        <SymptomWAModal onClose={() => setShowSymptom(false)} profile={profile} userId={userId} />
      )}
    </div>
  );
}
