import React from 'react';

const riskColors = {
  'low risk':  { bg: 'bg-green-50',  border: 'border-green-400', text: 'text-green-700',  badge: 'bg-green-100' },
  'mid risk':  { bg: 'bg-yellow-50', border: 'border-yellow-400',text: 'text-yellow-700', badge: 'bg-yellow-100' },
  'high risk': { bg: 'bg-red-50',    border: 'border-red-400',   text: 'text-red-700',    badge: 'bg-red-100' },
};

export default function RiskResult({ result }) {
  if (!result) return null;

  // ── MATERNAL ──
  if (result.type === 'maternal') {
    const colors = riskColors[result.riskLevel] || riskColors['mid risk'];
    return (
      <div className={`mt-6 p-4 rounded-xl border-2 ${colors.bg} ${colors.border}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-lg font-bold ${colors.text}`}>
            {result.riskLevel === 'low risk'  && '✅ Low Risk'}
            {result.riskLevel === 'mid risk'  && '⚠️ Moderate Risk'}
            {result.riskLevel === 'high risk' && '🚨 High Risk'}
          </h3>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${colors.badge} ${colors.text}`}>
            {result.confidence}% confident
          </span>
        </div>

        {result.probabilities && (
          <div className="space-y-2">
            {Object.entries(result.probabilities).map(([level, prob]) => (
              <div key={level}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="capitalize">{level}</span>
                  <span>{prob}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      level === 'low risk'  ? 'bg-green-500'  :
                      level === 'mid risk'  ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${prob}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── PCOS ──
  if (result.type === 'pcos') {
    const hasPCOS = result.hasPCOS;
    return (
      <div className={`mt-6 p-4 rounded-xl border-2 ${
        hasPCOS ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-lg font-bold ${hasPCOS ? 'text-red-700' : 'text-green-700'}`}>
            {hasPCOS ? '⚠️ PCOS Detected' : '✅ No PCOS Detected'}
          </h3>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            hasPCOS ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {result.confidence}% confident
          </span>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>PCOS Probability</span>
            <span>{result.probability}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${hasPCOS ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${result.probability}%` }}
            />
          </div>
        </div>

        {hasPCOS && (
          <p className="mt-3 text-sm text-red-600">
            Please consult a gynecologist for a full diagnosis and treatment plan.
          </p>
        )}
      </div>
    );
  }

  return null;
}
