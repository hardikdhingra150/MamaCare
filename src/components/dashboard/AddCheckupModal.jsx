// src/components/dashboard/AddCheckupModal.jsx - REPLACE ENTIRE FILE
import { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export default function AddCheckupModal({ isOpen, onClose, patient, onAddCheckup }) {
  const [formData, setFormData] = useState({
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
    hemoglobin: '',
    remarks: '',
    symptoms: []
  });

  const [predictedRisk, setPredictedRisk] = useState(null);

  const symptomsList = [
    'Headache',
    'Swelling (Edema)',
    'Blurred Vision',
    'Abdominal Pain',
    'Nausea/Vomiting',
    'Dizziness',
    'Shortness of Breath',
  ];

  useEffect(() => {
    if (formData.bpSystolic && formData.hemoglobin) {
      calculateRisk();
    }
  }, [formData.bpSystolic, formData.bpDiastolic, formData.hemoglobin]);

  const calculateRisk = () => {
    const systolic = parseInt(formData.bpSystolic);
    const hb = parseFloat(formData.hemoglobin);
    
    let risk = 'LOW';
    if (systolic > 140 || hb < 10) {
      risk = 'HIGH';
    } else if (systolic > 130 || hb < 11) {
      risk = 'MODERATE';
    }
    
    setPredictedRisk(risk);
  };

  if (!isOpen || !patient) return null;

  const handleSymptomToggle = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const checkup = {
      id: Date.now().toString(),
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      weight: parseFloat(formData.weight),
      bp: `${formData.bpSystolic}/${formData.bpDiastolic}`,
      hemoglobin: parseFloat(formData.hemoglobin),
      remarks: formData.remarks,
      symptoms: formData.symptoms
    };
    
    onAddCheckup(checkup);
    
    // Reset form
    setFormData({
      weight: '',
      bpSystolic: '',
      bpDiastolic: '',
      hemoglobin: '',
      remarks: '',
      symptoms: []
    });
    setPredictedRisk(null);
    onClose();
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MODERATE': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return '';
    }
  };

  const getBPColor = () => {
    const systolic = parseInt(formData.bpSystolic);
    if (!systolic) return 'text-charcoal/40';
    if (systolic > 140) return 'text-red-600';
    if (systolic > 130) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getHbColor = () => {
    const hb = parseFloat(formData.hemoglobin);
    if (!hb) return 'text-charcoal/40';
    if (hb < 10) return 'text-red-600';
    if (hb < 11) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-soft p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-charcoal/40 hover:text-charcoal transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-terracotta" />
          </div>
          <div>
            <h2 className="text-3xl font-serif text-charcoal">Add Checkup</h2>
            <p className="text-sm text-charcoal/60">For {patient.name} - Week {patient.currentWeek}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vital Signs Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">
                Weight (kg) *
              </label>
              <input 
                type="number" 
                step="0.1"
                className="input-field"
                placeholder="62.5"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                required
              />
            </div>

            {/* Blood Pressure */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-charcoal mb-2">
                Blood Pressure (mmHg) *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input 
                    type="number" 
                    className="input-field"
                    placeholder="Systolic (120)"
                    value={formData.bpSystolic}
                    onChange={(e) => setFormData({...formData, bpSystolic: e.target.value})}
                    required
                  />
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${getBPColor()}`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <input 
                  type="number" 
                  className="input-field"
                  placeholder="Diastolic (80)"
                  value={formData.bpDiastolic}
                  onChange={(e) => setFormData({...formData, bpDiastolic: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          {/* Hemoglobin with Visual Indicator */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">
              Hemoglobin (g/dL) *
            </label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1"
                className="input-field"
                placeholder="11.2"
                value={formData.hemoglobin}
                onChange={(e) => setFormData({...formData, hemoglobin: e.target.value})}
                required
              />
              <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${getHbColor()}`}>
                <Activity className="w-5 h-5" />
              </div>
            </div>
            {formData.hemoglobin && (
              <div className="mt-2">
                <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      parseFloat(formData.hemoglobin) < 10 ? 'bg-red-500' :
                      parseFloat(formData.hemoglobin) < 11 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((parseFloat(formData.hemoglobin) / 14) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-charcoal/60 mt-1">
                  Normal range: 11-14 g/dL
                </p>
              </div>
            )}
          </div>

          {/* Risk Prediction */}
          {predictedRisk && (
            <div className={`p-4 rounded-gentle border-2 ${getRiskColor(predictedRisk)}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Predicted Risk Level: {predictedRisk}</p>
                  <p className="text-sm opacity-80">
                    {predictedRisk === 'HIGH' && 'Immediate attention required. Alert will be sent to family.'}
                    {predictedRisk === 'MODERATE' && 'Monitor closely. Schedule follow-up within a week.'}
                    {predictedRisk === 'LOW' && 'Patient vitals are within normal range.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Symptoms Checklist */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-3">
              Symptoms Reported (if any)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {symptomsList.map(symptom => (
                <label 
                  key={symptom}
                  className="flex items-center gap-2 p-3 rounded-gentle border border-cream-dark hover:border-sage cursor-pointer transition-colors"
                >
                  <input 
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleSymptomToggle(symptom)}
                    className="w-4 h-4 text-sage focus:ring-sage rounded"
                  />
                  <span className="text-sm text-charcoal">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-semibold text-charcoal mb-2">
              Remarks / Observations
            </label>
            <textarea 
              className="input-field resize-none"
              rows="3"
              placeholder="Any additional observations or recommendations..."
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
            />
          </div>

          {/* Comparison with Last Checkup */}
          {patient.vitals.bp !== 'Pending' && (
            <div className="bg-cream-dark p-4 rounded-gentle">
              <p className="text-sm font-semibold text-charcoal mb-2">Last Checkup Comparison</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-charcoal/60">Previous BP</p>
                  <p className="text-charcoal font-medium">{patient.vitals.bp}</p>
                </div>
                <div>
                  <p className="text-charcoal/60">Previous Hb</p>
                  <p className="text-charcoal font-medium">{patient.vitals.hemoglobin} g/dL</p>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              type="submit"
              className="btn-primary flex-1"
            >
              Save Checkup
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 bg-charcoal/10 hover:bg-charcoal/20 text-charcoal font-semibold rounded-soft transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
