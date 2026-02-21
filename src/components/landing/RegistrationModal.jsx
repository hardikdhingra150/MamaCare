// src/components/landing/RegistrationModal.jsx
import { useState } from 'react';
import { X, Heart, Flower2, ArrowLeft, CheckCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

// ── Step indicators ──────────────────────────────────────────
function StepDot({ step, current }) {
  return (
    <div className={`w-2.5 h-2.5 rounded-full transition-all ${
      step === current ? 'bg-sage scale-125' :
      step < current  ? 'bg-sage/40' : 'bg-charcoal/10'
    }`} />
  );
}

export default function RegistrationModal({ isOpen, onClose }) {
  const [step,        setStep]        = useState(1);   // 1=type, 2=form, 3=success
  const [healthType,  setHealthType]  = useState(null); // 'maternity' | 'pcos'
  const [loading,     setLoading]     = useState(false);

  // ── Maternity form ───────────────────────────────────────────
  const [maternityData, setMaternityData] = useState({
    name:             '',
    phone:            '',
    age:              '',
    language:         'hindi',
    location:         '',
    pregnancyWeek:    '',
    lmp:              '',
    emergencyContact: '',
  });

  // ── PCOS form ────────────────────────────────────────────────
  const [pcosData, setPcosData] = useState({
    name:        '',
    phone:       '',
    age:         '',
    language:    'hindi',
    location:    '',
    cycleLength: '',
    symptoms:    [],
  });

  const pcosSymptomOptions = [
    'irregular_periods',
    'weight_gain',
    'acne',
    'facial_hair',
    'hair_loss',
    'mood_swings',
    'fatigue',
    'pelvic_pain',
  ];

  const toggleSymptom = (s) => {
    setPcosData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(s)
        ? prev.symptoms.filter(x => x !== s)
        : [...prev.symptoms, s],
    }));
  };

  if (!isOpen) return null;

  // ── Check duplicate phone ────────────────────────────────────
  const checkDuplicatePhone = async (phone) => {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snap = await getDocs(q);
    return !snap.empty;
  };

  // ── Submit maternity ─────────────────────────────────────────
  const handleMaternitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const duplicate = await checkDuplicatePhone(maternityData.phone);
      if (duplicate) {
        toast.error('📱 This phone number is already registered!');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'users'), {
        ...maternityData,
        healthType:    'maternity',
        age:           parseInt(maternityData.age),
        pregnancyWeek: parseInt(maternityData.pregnancyWeek),
        riskScore:     'LOW',              // ML will update this
        vitals:        {
          bp:          null,
          hemoglobin:  null,
          weight:      null,
        },
        lastVisit:     null,
        nextCheckup:   null,
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
        isActive:      true,
      });

      toast.success('✅ Registered successfully!');
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Registration failed: ' + err.message);
    }
    setLoading(false);
  };

  // ── Submit PCOS ──────────────────────────────────────────────
  const handlePCOSSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const duplicate = await checkDuplicatePhone(pcosData.phone);
      if (duplicate) {
        toast.error('📱 This phone number is already registered!');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'users'), {
        ...pcosData,
        healthType:  'pcos',
        age:         parseInt(pcosData.age),
        cycleLength: parseInt(pcosData.cycleLength) || null,
        riskScore:   'LOW',                // ML will update this
        lastVisit:   null,
        nextCheckup: null,
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
        isActive:    true,
      });

      toast.success('✅ Registered successfully!');
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Registration failed: ' + err.message);
    }
    setLoading(false);
  };

  // ── Reset on close ───────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setHealthType(null);
    setMaternityData({
      name: '', phone: '', age: '', language: 'hindi',
      location: '', pregnancyWeek: '', lmp: '', emergencyContact: '',
    });
    setPcosData({
      name: '', phone: '', age: '', language: 'hindi',
      location: '', cycleLength: '', symptoms: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* ── Top bar ── */}
        <div className="sticky top-0 bg-white border-b border-cream-dark px-8 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="text-charcoal/40 hover:text-charcoal mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="text-sm font-semibold text-charcoal/60">
              {step === 1 ? 'Choose Health Type'
               : step === 2 ? `${healthType === 'maternity' ? '🤰 Maternity' : '🌸 PCOS'} Registration`
               : 'Registration Complete'}
            </span>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            <StepDot step={1} current={step} />
            <StepDot step={2} current={step} />
            <StepDot step={3} current={step} />
          </div>

          <button
            onClick={handleClose}
            className="text-charcoal/40 hover:text-charcoal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">

          {/* ══════════════════════════════════════
              STEP 1 — Choose health type
          ══════════════════════════════════════ */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif text-charcoal mb-2">
                  Welcome to MaterniCare
                </h2>
                <p className="text-charcoal/60">
                  Tell us about your health so we can support you better
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">

                {/* Maternity option */}
                <button
                  onClick={() => { setHealthType('maternity'); setStep(2); }}
                  className="group p-6 border-2 border-pink-100 rounded-xl hover:border-pink-400 hover:shadow-lg transition-all duration-300 text-left bg-gradient-to-r from-pink-50 to-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center group-hover:bg-pink-200 transition-colors flex-shrink-0 text-2xl">
                      🤰
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-serif text-charcoal mb-1">
                        I'm Pregnant
                      </h3>
                      <p className="text-sm text-charcoal/60 leading-relaxed">
                        Track your pregnancy week by week, get health tips, checkup reminders, and emergency support
                      </p>
                    </div>
                    <span className="text-pink-400 text-xl">→</span>
                  </div>
                </button>

                {/* PCOS option */}
                <button
                  onClick={() => { setHealthType('pcos'); setStep(2); }}
                  className="group p-6 border-2 border-purple-100 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all duration-300 text-left bg-gradient-to-r from-purple-50 to-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors flex-shrink-0 text-2xl">
                      🌸
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-serif text-charcoal mb-1">
                        I Have PCOS
                      </h3>
                      <p className="text-sm text-charcoal/60 leading-relaxed">
                        Monitor your cycle, manage symptoms, and receive personalized support for PCOS
                      </p>
                    </div>
                    <span className="text-purple-400 text-xl">→</span>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════
              STEP 2A — Maternity form
          ══════════════════════════════════════ */}
          {step === 2 && healthType === 'maternity' && (
            <>
              <h2 className="text-2xl font-serif text-charcoal mb-1">
                Your Pregnancy Profile
              </h2>
              <p className="text-sm text-charcoal/60 mb-6">
                We'll use this to track your health and send timely reminders
              </p>

              <form onSubmit={handleMaternitySubmit} className="space-y-4">

                {/* Name + Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Your name"
                      value={maternityData.name}
                      onChange={e => setMaternityData({ ...maternityData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Age"
                      value={maternityData.age}
                      onChange={e => setMaternityData({ ...maternityData, age: e.target.value })}
                      min="15" max="55"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    WhatsApp Number * <span className="text-charcoal/40 font-normal">(for health tips)</span>
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91XXXXXXXXXX"
                    value={maternityData.phone}
                    onChange={e => setMaternityData({ ...maternityData, phone: e.target.value })}
                    required
                  />
                  <p className="text-xs text-charcoal/40 mt-1">
                    📱 You'll receive health tips and alerts on this number
                  </p>
                </div>

                {/* Pregnancy week + LMP */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Pregnancy Week *
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g. 12"
                      value={maternityData.pregnancyWeek}
                      onChange={e => setMaternityData({ ...maternityData, pregnancyWeek: e.target.value })}
                      min="1" max="42"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Last Period (LMP)
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={maternityData.lmp}
                      onChange={e => setMaternityData({ ...maternityData, lmp: e.target.value })}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Village / Area *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Your village or city"
                    value={maternityData.location}
                    onChange={e => setMaternityData({ ...maternityData, location: e.target.value })}
                    required
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Preferred Language *
                  </label>
                  <select
                    className="input-field"
                    value={maternityData.language}
                    onChange={e => setMaternityData({ ...maternityData, language: e.target.value })}
                  >
                    <option value="hindi">हिंदी (Hindi)</option>
                    <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                    <option value="english">English</option>
                  </select>
                </div>

                {/* Emergency contact */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="Family member's number"
                    value={maternityData.emergencyContact}
                    onChange={e => setMaternityData({ ...maternityData, emergencyContact: e.target.value })}
                  />
                </div>

                {/* Info box */}
                <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-sm text-charcoal/70">
                  <p className="font-semibold text-charcoal mb-2">📱 What happens after registration?</p>
                  <ul className="space-y-1">
                    <li>✅ Welcome call in {maternityData.language === 'hindi' ? 'Hindi' : maternityData.language === 'punjabi' ? 'Punjabi' : 'English'}</li>
                    <li>✅ Weekly pregnancy tips on WhatsApp</li>
                    <li>✅ Checkup reminders before due dates</li>
                    <li>✅ Immediate call if your health is at risk</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : '🤰 Complete Registration'}
                </button>
              </form>
            </>
          )}

          {/* ══════════════════════════════════════
              STEP 2B — PCOS form
          ══════════════════════════════════════ */}
          {step === 2 && healthType === 'pcos' && (
            <>
              <h2 className="text-2xl font-serif text-charcoal mb-1">
                Your PCOS Profile
              </h2>
              <p className="text-sm text-charcoal/60 mb-6">
                Help us understand your health so we can support you
              </p>

              <form onSubmit={handlePCOSSubmit} className="space-y-4">

                {/* Name + Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Your name"
                      value={pcosData.name}
                      onChange={e => setPcosData({ ...pcosData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Age"
                      value={pcosData.age}
                      onChange={e => setPcosData({ ...pcosData, age: e.target.value })}
                      min="10" max="55"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    WhatsApp Number * <span className="text-charcoal/40 font-normal">(for support)</span>
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91XXXXXXXXXX"
                    value={pcosData.phone}
                    onChange={e => setPcosData({ ...pcosData, phone: e.target.value })}
                    required
                  />
                  <p className="text-xs text-charcoal/40 mt-1">
                    📱 You'll receive PCOS tips and cycle alerts on this number
                  </p>
                </div>

                {/* Cycle length */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Cycle Length (days)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="e.g. 35"
                      value={pcosData.cycleLength}
                      onChange={e => setPcosData({ ...pcosData, cycleLength: e.target.value })}
                      min="15" max="120"
                    />
                    <p className="text-xs text-charcoal/40 mt-1">Normal: 21–35 days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">
                      Language *
                    </label>
                    <select
                      className="input-field"
                      value={pcosData.language}
                      onChange={e => setPcosData({ ...pcosData, language: e.target.value })}
                    >
                      <option value="hindi">हिंदी (Hindi)</option>
                      <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                      <option value="english">English</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Village / Area *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Your village or city"
                    value={pcosData.location}
                    onChange={e => setPcosData({ ...pcosData, location: e.target.value })}
                    required
                  />
                </div>

                {/* Symptoms multi-select */}
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Symptoms <span className="text-charcoal/40 font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {pcosSymptomOptions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSymptom(s)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                          pcosData.symptoms.includes(s)
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {s.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  {pcosData.symptoms.length > 0 && (
                    <p className="text-xs text-purple-500 mt-2">
                      ✅ {pcosData.symptoms.length} symptom{pcosData.symptoms.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                {/* Info box */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-charcoal/70">
                  <p className="font-semibold text-charcoal mb-2">🌸 What happens after registration?</p>
                  <ul className="space-y-1">
                    <li>✅ Welcome message on WhatsApp</li>
                    <li>✅ PCOS management tips weekly</li>
                    <li>✅ Cycle tracking reminders</li>
                    <li>✅ AI chat support anytime</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : '🌸 Complete Registration'}
                </button>
              </form>
            </>
          )}

          {/* ══════════════════════════════════════
              STEP 3 — Success
          ══════════════════════════════════════ */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl ${
                healthType === 'maternity' ? 'bg-pink-100' : 'bg-purple-100'
              }`}>
                {healthType === 'maternity' ? '🤰' : '🌸'}
              </div>

              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />

              <h2 className="text-3xl font-serif text-charcoal mb-3">
                You're Registered!
              </h2>
              <p className="text-charcoal/60 mb-6 leading-relaxed">
                {healthType === 'maternity'
                  ? "We'll call you soon with a welcome message and begin sending weekly pregnancy tips on WhatsApp."
                  : "We'll send you PCOS management tips and cycle reminders on WhatsApp starting today."
                }
              </p>

              <div className={`rounded-xl p-4 mb-6 text-sm text-left space-y-2 ${
                healthType === 'maternity'
                  ? 'bg-pink-50 border border-pink-200'
                  : 'bg-purple-50 border border-purple-200'
              }`}>
                <p className="font-semibold text-charcoal">📋 Your registration details:</p>
                <p className="text-charcoal/70">
                  Name: <span className="font-medium text-charcoal">
                    {healthType === 'maternity' ? maternityData.name : pcosData.name}
                  </span>
                </p>
                <p className="text-charcoal/70">
                  Phone: <span className="font-medium text-charcoal">
                    {healthType === 'maternity' ? maternityData.phone : pcosData.phone}
                  </span>
                </p>
                <p className="text-charcoal/70">
                  Type: <span className="font-medium text-charcoal capitalize">
                    {healthType === 'maternity' ? '🤰 Maternity' : '🌸 PCOS'}
                  </span>
                </p>
              </div>

              <button
                onClick={handleClose}
                className={`w-full py-3 text-white font-semibold rounded-xl transition-colors ${
                  healthType === 'maternity'
                    ? 'bg-pink-500 hover:bg-pink-600'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
              >
                Done ✓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
