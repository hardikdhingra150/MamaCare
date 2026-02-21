import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from "../config/firebase";

export default function TestML() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testPrediction = async () => {
    setLoading(true);
    try {
      const predictRisk = httpsCallable(functions, 'predictMaternalRisk');
      const response = await predictRisk({
        age: 28,
        systolicBP: 140,
        diastolicBP: 90,
        bloodSugar: 8.5,
        bodyTemp: 98.6,
        heartRate: 85
      });
      setResult(response.data);
      console.log('Result:', response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🤖 Test ML Prediction</h1>
      
      <button
        onClick={testPrediction}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded font-bold hover:bg-blue-600"
      >
        {loading ? '⏳ Predicting...' : '🧪 Test Prediction'}
      </button>

      {result && (
        <div className="mt-6 bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4">Result:</h2>
          <div className={`p-4 rounded text-center text-2xl font-bold ${
            result.riskLevel === 'high risk' ? 'bg-red-100 text-red-700' :
            result.riskLevel === 'mid risk' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {result.riskLevel?.toUpperCase()}
          </div>
          <p className="text-center mt-2">Confidence: {result.confidence}%</p>
          <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
