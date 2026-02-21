import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { predictMaternalRisk, saveMLPrediction } from '../../services/mlService';
import RiskResult from '../shared/RiskResult';

const initialForm = {
  age: '', systolicBP: '', diastolicBP: '',
  bloodSugar: '', bodyTemp: '', heartRate: ''
};

const fields = [
  { key: 'age',         label: 'Age',         unit: 'years',  placeholder: '24' },
  { key: 'systolicBP',  label: 'Systolic BP',  unit: 'mmHg',   placeholder: '110' },
  { key: 'diastolicBP', label: 'Diastolic BP', unit: 'mmHg',   placeholder: '75' },
  { key: 'bloodSugar',  label: 'Blood Sugar',  unit: 'mmol/L', placeholder: '6.2' },
  { key: 'bodyTemp',    label: 'Body Temp',    unit: '°F',     placeholder: '98.0' },
  { key: 'heartRate',   label: 'Heart Rate',   unit: 'bpm',    placeholder: '72' },
];

export default function MaternalRiskForm({ patients = [] }) {
  // ✅ ALL hooks at top level, no conditions before them
  const [searchParams] = useSearchParams();
  const [form, setForm]           = useState(initialForm);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [saved, setSaved]         = useState(false);
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    const res = await predictMaternalRisk(form);

    if (res.success) {
      setResult({ type: 'maternal', ...res });
      if (patientId) {
        await saveMLPrediction(patientId, 'maternal', form, res);
        setSaved(true);
      }
    } else {
      setError(res.error || 'Prediction failed');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-pink-700 mb-4">🤰 Maternal Risk Assessment</h2>

      {patients.length > 0 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-600">
            Link to Patient <span className="text-gray-400 text-xs">(optional — saves result)</span>
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="">— Select patient —</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {fields.map(({ key, label, unit, placeholder }) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-medium text-gray-600">
              {label} <span className="text-gray-400 text-xs">({unit})</span>
            </label>
            <input
              type="number"
              name={key}
              value={form[key]}
              onChange={handleChange}
              placeholder={placeholder}
              required
              step="any"
              className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="col-span-2 mt-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? '⏳ Analysing...' : 'Predict Risk'}
        </button>
      </form>

      {error  && <p className="mt-4 text-red-500 text-sm">⚠️ {error}</p>}
      {saved  && <p className="mt-2 text-green-600 text-sm">✅ Result saved to patient record</p>}
      {result && <RiskResult result={result} />}
    </div>
  );
}
