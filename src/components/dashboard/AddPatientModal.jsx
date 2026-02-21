// src/components/dashboard/AddPatientModal.jsx
import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, User, Heart, Phone as PhoneIcon, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddUserModal({ isOpen, onClose, onAddUser }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    phone: '',
    age: '',
    language: 'hindi',
    healthType: '',         // 'maternity' | 'pcos'

    // Maternity fields
    lmp: '',
    location: '',
    hasComplications: false,
    complications: '',

    // PCOS fields
    cycleLength: '',
    symptoms: [],
    diagnosedDate: '',

    // Emergency contact
    emergencyContact: '',
    emergencyRelation: '',
  });

  const [errors, setErrors] = useState({});

  const totalSteps = 4; // 1: Basic → 2: Health Type → 3: Health Details → 4: Emergency

  const PCOS_SYMPTOMS = [
    'irregular_periods',
    'acne',
    'weight_gain',
    'hair_loss',
    'mood_swings',
    'facial_hair',
    'fatigue',
  ];

  const toggleSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  if (!isOpen) return null;

  // ── Validation ──────────────────────────────────────────────
  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim())
        newErrors.name = 'Name is required';
      if (!formData.phone.trim())
        newErrors.phone = 'Phone number is required';
      else if (!/^\+91\d{10}$/.test(formData.phone))
        newErrors.phone = 'Invalid format — use +91XXXXXXXXXX';
      if (!formData.age)
        newErrors.age = 'Age is required';
      else if (formData.age < 15 || formData.age > 55)
        newErrors.age = 'Age must be between 15–55';
    }

    if (currentStep === 2) {
      if (!formData.healthType)
        newErrors.healthType = 'Please select a health type';
    }

    if (currentStep === 3) {
      if (formData.healthType === 'maternity') {
        if (!formData.lmp)
          newErrors.lmp = 'LMP date is required';
        if (!formData.location.trim())
          newErrors.location = 'Location is required';
      }
      if (formData.healthType === 'pcos') {
        if (!formData.cycleLength)
          newErrors.cycleLength = 'Cycle length is required';
        else if (formData.cycleLength < 15 || formData.cycleLength > 90)
          newErrors.cycleLength = 'Cycle length must be between 15–90 days';
      }
    }

    if (currentStep === 4) {
      if (!formData.emergencyContact.trim())
        newErrors.emergencyContact = 'Emergency contact is required';
      if (!formData.emergencyRelation.trim())
        newErrors.emergencyRelation = 'Relation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    let userData = {
      name: formData.name,
      phone: formData.phone,
      age: parseInt(formData.age),
      language: formData.language,
      healthType: formData.healthType,
      emergencyContact: formData.emergencyContact,
      emergencyRelation: formData.emergencyRelation,
      riskScore: 'LOW',
      isActive: true,
    };

    // Maternity-specific fields
    if (formData.healthType === 'maternity') {
      const lmpDate = new Date(formData.lmp);
      const today = new Date();
      const diffDays = Math.floor((today - lmpDate) / (1000 * 60 * 60 * 24));
      const pregnancyWeek = Math.floor(diffDays / 7);

      if (pregnancyWeek < 0 || pregnancyWeek > 42) {
        toast.error('Invalid LMP date — week must be between 0–42');
        return;
      }

      userData = {
        ...userData,
        lmp: formData.lmp,
        pregnancyWeek,
        location: formData.location,
        hasComplications: formData.hasComplications,
        complications: formData.complications,
        dueDate: new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
        nextCheckup: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0],
        lastVisit: null,
        vitals: { bp: null, hemoglobin: null, weight: null },
      };
    }

    // PCOS-specific fields
    if (formData.healthType === 'pcos') {
      userData = {
        ...userData,
        cycleLength: parseInt(formData.cycleLength),
        symptoms: formData.symptoms,
        diagnosedDate: formData.diagnosedDate || null,
      };
    }

    onAddUser(userData);

    // Reset form
    setFormData({
      name: '', phone: '', age: '', language: 'hindi', healthType: '',
      lmp: '', location: '', hasComplications: false, complications: '',
      cycleLength: '', symptoms: [], diagnosedDate: '',
      emergencyContact: '', emergencyRelation: '',
    });
    setStep(1);
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-soft p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-charcoal/40 hover:text-charcoal transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-serif text-charcoal">Register New User</h2>
            <span className="text-sm text-charcoal/60">Step {step} of {totalSteps}</span>
          </div>
          <div className="w-full h-2 bg-cream-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sage to-sage-dark transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
          {/* Step labels */}
          <div className="flex justify-between mt-2 text-xs text-charcoal/40">
            <span className={step >= 1 ? 'text-sage font-medium' : ''}>Basic Info</span>
            <span className={step >= 2 ? 'text-sage font-medium' : ''}>Health Type</span>
            <span className={step >= 3 ? 'text-sage font-medium' : ''}>Health Details</span>
            <span className={step >= 4 ? 'text-sage font-medium' : ''}>Emergency</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-sage" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-charcoal">Personal Information</h3>
                  <p className="text-sm text-charcoal/60">Basic details about the user</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Full Name *</label>
                <input
                  type="text"
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+91XXXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Age *</label>
                  <input
                    type="number"
                    className={`input-field ${errors.age ? 'border-red-500' : ''}`}
                    placeholder="Age in years"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    min="15" max="55"
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">Preferred Language</label>
                <select
                  className="input-field"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                >
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
          )}

          {/* ── Step 2: Health Type ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-charcoal">Health Type *</h3>
                  <p className="text-sm text-charcoal/60">What brings this user to the platform?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, healthType: 'maternity' })}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    formData.healthType === 'maternity'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <div className="text-3xl mb-2">🤰</div>
                  <p className="font-semibold text-charcoal">Maternity</p>
                  <p className="text-xs text-charcoal/60 mt-1">
                    Pregnancy tracking, week-by-week tips, risk monitoring
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, healthType: 'pcos' })}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    formData.healthType === 'pcos'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200'
                  }`}
                >
                  <div className="text-3xl mb-2">🌸</div>
                  <p className="font-semibold text-charcoal">PCOS</p>
                  <p className="text-xs text-charcoal/60 mt-1">
                    Cycle tracking, symptom management, hormone tips
                  </p>
                </button>
              </div>

              {errors.healthType && (
                <p className="text-red-500 text-xs mt-1">{errors.healthType}</p>
              )}
            </div>
          )}

          {/* ── Step 3: Health Details (conditional) ── */}
          {step === 3 && formData.healthType === 'maternity' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-charcoal">🤰 Pregnancy Details</h3>
                  <p className="text-sm text-charcoal/60">Maternity-specific information</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Last Menstrual Period (LMP) *
                </label>
                <input
                  type="date"
                  className={`input-field ${errors.lmp ? 'border-red-500' : ''}`}
                  value={formData.lmp}
                  onChange={(e) => setFormData({ ...formData, lmp: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.lmp && <p className="text-red-500 text-xs mt-1">{errors.lmp}</p>}
                {formData.lmp && (
                  <p className="text-xs text-sage mt-1">
                    ≈ Week {Math.floor((new Date() - new Date(formData.lmp)) / (1000 * 60 * 60 * 24 * 7))} of pregnancy
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Address / Village *
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.location ? 'border-red-500' : ''}`}
                  placeholder="Village / area name"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasComplications}
                    onChange={(e) => setFormData({ ...formData, hasComplications: e.target.checked })}
                    className="w-4 h-4 text-sage focus:ring-sage rounded"
                  />
                  <span className="text-sm font-medium text-charcoal">
                    Previous pregnancy complications
                  </span>
                </label>
              </div>

              {formData.hasComplications && (
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Describe Complications
                  </label>
                  <textarea
                    className="input-field resize-none"
                    rows="3"
                    placeholder="e.g., Gestational diabetes, Pre-eclampsia..."
                    value={formData.complications}
                    onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {step === 3 && formData.healthType === 'pcos' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-charcoal">🌸 PCOS Details</h3>
                  <p className="text-sm text-charcoal/60">Hormonal and cycle information</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Average Cycle Length (days) *
                </label>
                <input
                  type="number"
                  className={`input-field ${errors.cycleLength ? 'border-red-500' : ''}`}
                  placeholder="e.g., 35"
                  value={formData.cycleLength}
                  onChange={(e) => setFormData({ ...formData, cycleLength: e.target.value })}
                  min="15" max="90"
                />
                {errors.cycleLength && (
                  <p className="text-red-500 text-xs mt-1">{errors.cycleLength}</p>
                )}
                {formData.cycleLength && (
                  <p className={`text-xs mt-1 ${
                    formData.cycleLength > 35 ? 'text-orange-500' : 'text-sage'
                  }`}>
                    {formData.cycleLength > 35
                      ? '⚠️ Irregular cycle — will be monitored closely'
                      : '✅ Within normal range'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">
                  Current Symptoms (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PCOS_SYMPTOMS.map(symptom => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all capitalize ${
                        formData.symptoms.includes(symptom)
                          ? 'bg-purple-500 text-white border-purple-500'
                          : 'bg-white text-charcoal/70 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {symptom.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Date of PCOS Diagnosis (optional)
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.diagnosedDate}
                  onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Emergency Contact ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <PhoneIcon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-charcoal">Emergency Contact</h3>
                  <p className="text-sm text-charcoal/60">Family member for alerts</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Emergency Contact Number *
                </label>
                <input
                  type="tel"
                  className={`input-field ${errors.emergencyContact ? 'border-red-500' : ''}`}
                  placeholder="+91XXXXXXXXXX"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                />
                {errors.emergencyContact && (
                  <p className="text-red-500 text-xs mt-1">{errors.emergencyContact}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Relationship *
                </label>
                <select
                  className={`input-field ${errors.emergencyRelation ? 'border-red-500' : ''}`}
                  value={formData.emergencyRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                >
                  <option value="">Select relationship</option>
                  <option value="husband">Husband</option>
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="sister">Sister</option>
                  <option value="mother-in-law">Mother-in-law</option>
                  <option value="other">Other</option>
                </select>
                {errors.emergencyRelation && (
                  <p className="text-red-500 text-xs mt-1">{errors.emergencyRelation}</p>
                )}
              </div>

              {/* Summary card */}
              <div className="bg-sage/5 border border-sage/20 rounded-gentle p-4">
                <p className="text-sm font-semibold text-charcoal mb-2">📋 Registration Summary</p>
                <div className="text-sm text-charcoal/70 space-y-1">
                  <p>👤 Name: <strong>{formData.name}</strong></p>
                  <p>📱 Phone: <strong>{formData.phone}</strong></p>
                  <p>
                    {formData.healthType === 'maternity' ? '🤰' : '🌸'} Type:{' '}
                    <strong className="capitalize">{formData.healthType}</strong>
                  </p>
                  {formData.healthType === 'maternity' && (
                    <p>📅 Week:{' '}
                      <strong>
                        {Math.floor((new Date() - new Date(formData.lmp)) / (1000 * 60 * 60 * 24 * 7))}
                      </strong>
                    </p>
                  )}
                  {formData.healthType === 'pcos' && (
                    <p>🗓️ Cycle: <strong>{formData.cycleLength} days</strong></p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-cream-dark">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-charcoal/10 hover:bg-charcoal/20 text-charcoal font-semibold rounded-soft transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" className="btn-primary flex-1">
                ✅ Register User
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
