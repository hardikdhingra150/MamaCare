// src/pages/Onboarding.jsx
import { useState }                    from 'react';
import { useNavigate }                 from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db }                    from '../config/firebase';
import toast                           from 'react-hot-toast';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence }     from 'framer-motion';
import { useConfetti }                 from '../hooks/useConfetti';

const SYMPTOM_OPTIONS = [
  'irregular_periods','weight_gain','acne',
  'facial_hair','hair_loss','mood_swings','fatigue','pelvic_pain',
];

const SYMPTOM_EMOJIS = {
  irregular_periods: '🔴', weight_gain: '⚖️', acne: '😤',
  facial_hair: '🪒',       hair_loss: '💇',   mood_swings: '😤',
  fatigue: '😴',           pelvic_pain: '💢',
};

export default function Onboarding({ user, onComplete }) {
  const navigate        = useNavigate();
  const { burst }       = useConfetti();           // 🎉 confetti hook
  const [step,    setStep]    = useState(1);
  const [type,    setType]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);   // 1 = forward, -1 = back

  const [form, setForm] = useState({
    name:             user?.displayName || '',
    phone:            '',
    age:              '',
    language:         'hindi',
    location:         '',
    pregnancyWeek:    '',
    lmp:              '',
    emergencyContact: '',
    cycleLength:      '',
    symptoms:         [],
  });

  const update       = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const toggleSymptom = (s) => update('symptoms',
    form.symptoms.includes(s)
      ? form.symptoms.filter(x => x !== s)
      : [...form.symptoms, s]
  );

  const goStep = (n, dir = 1) => { setDirection(dir); setStep(n); };

  // ── Save profile ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.age || !form.location) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const base = {
        uid:        user.uid,
        email:      user.email,
        name:       form.name.trim(),
        phone:      form.phone.trim(),
        age:        parseInt(form.age),
        language:   form.language,
        location:   form.location.trim(),
        healthType: type,
        riskScore:  'LOW',
        isActive:   true,
        updatedAt:  serverTimestamp(),
      };

      const extra = type === 'maternity'
        ? {
            pregnancyWeek:    parseInt(form.pregnancyWeek) || 0,
            lmp:              form.lmp              || null,
            emergencyContact: form.emergencyContact || null,
            vitals:           { bp: null, hemoglobin: null, weight: null },
            nextCheckup:      null,
            lastVisit:        null,
          }
        : {
            cycleLength: parseInt(form.cycleLength) || null,
            symptoms:    form.symptoms,
            lastPeriod:  null,
            nextPeriod:  null,
          };

      const profileData = { ...base, ...extra };

      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        createdAt: serverTimestamp(),
      }, { merge: true });

      // 🎉 confetti on successful profile save
      burst();

      toast.success('🎉 Profile saved! Welcome to MamaCare');
      onComplete({ id: user.uid, ...profileData });
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding save error:', err);
      toast.error('Failed to save profile: ' + err.message);
    }
    setLoading(false);
  };

  const progress = step === 1 ? 40 : 92;

  // ── Slide animation variants ─────────────────────────────────
  const variants = {
    enter:   (dir) => ({ opacity: 0, x: dir > 0 ?  60 : -60 }),
    center:  { opacity: 1, x: 0 },
    exit:    (dir) => ({ opacity: 0, x: dir > 0 ? -60 :  60 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30
                    flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* ── Animated progress bar ── */}
        <div className="h-1.5 bg-gray-100">
          <motion.div
            className={`h-full rounded-full ${
              type === 'pcos'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-gradient-to-r from-pink-500 to-rose-400'
            }`}
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* ── Step dots ── */}
        <div className="flex items-center justify-between px-8 pt-5 pb-0">
          <motion.span
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-bold text-gray-400 uppercase tracking-widest"
          >
            Step {step} of 2
          </motion.span>

          <div className="flex items-center gap-2">
            {[1, 2].map(s => (
              <motion.div
                key={s}
                animate={{
                  width:           s === step ? 24 : 8,
                  backgroundColor: s === step ? '#a855f7' : s < step ? '#d8b4fe' : '#e5e7eb',
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* ── Animated step content ── */}
        <div className="px-8 pb-8 pt-5 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeInOut' }}
            >

              {/* ── STEP 1: Choose type ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                      className="text-5xl mb-3"
                    >
                      👋
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                      Hi {user?.displayName?.split(' ')[0] || 'there'}!
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                      Tell us what you need support with — we'll set up your personal dashboard
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Maternity card */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setType('maternity'); goStep(2, 1); }}
                      className="group w-full p-5 border-2 border-pink-100 hover:border-pink-400
                                 rounded-2xl text-left bg-gradient-to-r from-pink-50 to-white
                                 hover:shadow-lg transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-pink-100 group-hover:bg-pink-200
                                        rounded-2xl flex items-center justify-center
                                        text-3xl transition-colors flex-shrink-0">
                          🤰
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">I'm Pregnant</p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            Week-by-week tracker, vitals monitoring, risk alerts
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-pink-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.button>

                    {/* PCOS card */}
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setType('pcos'); goStep(2, 1); }}
                      className="group w-full p-5 border-2 border-purple-100 hover:border-purple-400
                                 rounded-2xl text-left bg-gradient-to-r from-purple-50 to-white
                                 hover:shadow-lg transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-100 group-hover:bg-purple-200
                                        rounded-2xl flex items-center justify-center
                                        text-3xl transition-colors flex-shrink-0">
                          🌸
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-lg">I Have PCOS</p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            Cycle predictor, symptom tracker, management tips
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.button>
                  </div>

                  <p className="text-xs text-center text-gray-300">
                    🔒 Your data is private — only you can see it
                  </p>
                </div>
              )}

              {/* ── STEP 2: Profile form ── */}
              {step === 2 && (
                <>
                  {/* Back + header */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => goStep(1, -1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full
                                 bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </motion.button>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {type === 'maternity' ? '🤰 Pregnancy Profile' : '🌸 PCOS Profile'}
                      </h1>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Fill this once — we'll remember everything
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name + Age */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Full Name *
                        </label>
                        <input type="text" className="input-field" placeholder="Your name"
                          value={form.name} onChange={e => update('name', e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Age *
                        </label>
                        <input type="number" className="input-field" placeholder="e.g. 24"
                          value={form.age} onChange={e => update('age', e.target.value)}
                          min="10" max="60" required />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                        WhatsApp Number *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">📱</span>
                        <input type="tel" className="input-field pl-9" placeholder="+91XXXXXXXXXX"
                          value={form.phone} onChange={e => update('phone', e.target.value)} required />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Health tips and risk alerts will be sent here
                      </p>
                    </div>

                    {/* Location + Language */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Location *
                        </label>
                        <input type="text" className="input-field" placeholder="Village / City"
                          value={form.location} onChange={e => update('location', e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                          Language
                        </label>
                        <select className="input-field" value={form.language}
                          onChange={e => update('language', e.target.value)}>
                          <option value="hindi">हिंदी</option>
                          <option value="punjabi">ਪੰਜਾਬੀ</option>
                          <option value="english">English</option>
                        </select>
                      </div>
                    </div>

                    {/* ── Maternity fields ── */}
                    {type === 'maternity' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-3 border-t border-gray-100"
                      >
                        <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">
                          🤰 Pregnancy Details
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                              Current Week *
                            </label>
                            <input type="number" className="input-field" placeholder="e.g. 12"
                              value={form.pregnancyWeek}
                              onChange={e => update('pregnancyWeek', e.target.value)}
                              min="1" max="42" required />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                              Last Period (LMP)
                            </label>
                            <input type="date" className="input-field"
                              value={form.lmp} onChange={e => update('lmp', e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            Emergency Contact
                          </label>
                          <input type="tel" className="input-field"
                            placeholder="Family member's number"
                            value={form.emergencyContact}
                            onChange={e => update('emergencyContact', e.target.value)} />
                        </div>
                      </motion.div>
                    )}

                    {/* ── PCOS fields ── */}
                    {type === 'pcos' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pt-3 border-t border-gray-100"
                      >
                        <p className="text-xs font-bold text-purple-500 uppercase tracking-widest">
                          🌸 PCOS Details
                        </p>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            Cycle Length (days)
                            <span className="text-gray-300 font-normal ml-1">Normal: 21–35</span>
                          </label>
                          <input type="number" className="input-field" placeholder="e.g. 35"
                            value={form.cycleLength}
                            onChange={e => update('cycleLength', e.target.value)}
                            min="15" max="120" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Your Symptoms
                            <span className="text-gray-300 font-normal ml-1">(select all that apply)</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {SYMPTOM_OPTIONS.map(s => (
                              <motion.button
                                key={s}
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() => toggleSymptom(s)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                                  form.symptoms.includes(s)
                                    ? 'bg-purple-500 text-white shadow-md'
                                    : 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100'
                                }`}
                              >
                                {SYMPTOM_EMOJIS[s]} {s.replace(/_/g, ' ')}
                              </motion.button>
                            ))}
                          </div>
                          {form.symptoms.length > 0 && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-purple-500 mt-2 font-semibold"
                            >
                              ✅ {form.symptoms.length} symptom{form.symptoms.length > 1 ? 's' : ''} selected
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={!loading ? { y: -2, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } : {}}
                      whileTap={!loading ? { scale: 0.98 } : {}}
                      className={`w-full py-4 text-white font-bold rounded-2xl transition-colors
                                  disabled:opacity-50 flex items-center justify-center gap-2 mt-2 ${
                        type === 'maternity'
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                          : 'bg-gradient-to-r from-purple-500 to-violet-500'
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving your profile...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Go to My Dashboard 🚀
                        </>
                      )}
                    </motion.button>

                  </form>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
