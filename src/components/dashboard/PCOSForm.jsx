import React, { useState } from 'react';
import { predictPCOS } from '../../services/mlService';
import RiskResult from '../shared/RiskResult';

const initialForm = {
    age: '', bmi: '', cycleLength: '', lh: '',
    fsh: '', testosterone: '', waistHipRatio: '', insulin: ''
};

const fields = [
    { key: 'age', label: 'Age', unit: 'years', placeholder: '28' },
    { key: 'bmi', label: 'BMI', unit: 'kg/m²', placeholder: '32' },
    { key: 'cycleLength', label: 'Cycle Length', unit: 'days', placeholder: '45' },
    { key: 'lh', label: 'LH Level', unit: 'mIU/mL', placeholder: '15' },
    { key: 'fsh', label: 'FSH Level', unit: 'mIU/mL', placeholder: '5' },
    { key: 'testosterone', label: 'Testosterone', unit: 'ng/dL', placeholder: '60' },
    { key: 'waistHipRatio', label: 'Waist-Hip Ratio', unit: 'ratio', placeholder: '0.9' },
    { key: 'insulin', label: 'Insulin', unit: 'μIU/mL', placeholder: '22' },
];

export default function PCOSForm() {
    const [form, setForm] = useState(initialForm);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        const res = await predictPCOS(form);

        if (res.success) {
            setResult({ type: 'pcos', ...res });
            if (patientId) {
                await saveMLPrediction(patientId, 'pcos', form, res);
                setSaved(true);
            }
        }
    };

    return (
        <div className="p-6 bg-white rounded-2xl shadow-md max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-purple-700 mb-4">🩺 PCOS Detection</h2>

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
                            className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={loading}
                    className="col-span-2 mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                    {loading ? '⏳ Analysing...' : 'Check for PCOS'}
                </button>
            </form>

            {error && (
                <p className="mt-4 text-red-500 text-sm">⚠️ {error}</p>
            )}

            {result && <RiskResult result={result} />}
        </div>
    );
}
