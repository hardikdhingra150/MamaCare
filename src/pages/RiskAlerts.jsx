// src/pages/RiskAlerts.jsx
import { useState } from 'react';
import { AlertTriangle, Phone, Calendar, MapPin, TrendingUp, Heart } from 'lucide-react';
import Badge from '../components/shared/Badge';
import CallSimulationModal from '../components/dashboard/CallSimulationModal';

export default function RiskAlerts({ users = [], onSelectUser }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Counts ──────────────────────────────────────────────────
  const riskCount = {
    high:          users.filter(u => u.riskScore === 'HIGH').length,
    moderate:      users.filter(u => u.riskScore === 'MODERATE').length,
    irregularPcos: users.filter(u => u.healthType === 'pcos' && u.cycleLength > 35).length,
  };

  // ── Filter logic ────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    if (activeFilter === 'all') {
      // Show maternity high/moderate + PCOS irregular
      return (
        u.riskScore === 'HIGH' ||
        u.riskScore === 'MODERATE' ||
        (u.healthType === 'pcos' && u.cycleLength > 35)
      );
    }
    if (activeFilter === 'HIGH')     return u.riskScore === 'HIGH';
    if (activeFilter === 'MODERATE') return u.riskScore === 'MODERATE';
    if (activeFilter === 'PCOS')     return u.healthType === 'pcos' && u.cycleLength > 35;
    return false;
  });

  const handleCallClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setCallModalOpen(true);
  };

  // ── Risk reasons for maternity ──────────────────────────────
  const getMaternityRiskReasons = (user) => {
    const reasons = [];
    if (!user.vitals) return reasons;
    const systolic = parseInt(user.vitals.bp?.split('/')[0]);
    if (systolic > 140) reasons.push(`High blood pressure (${user.vitals.bp})`);
    if (user.vitals.hemoglobin < 10)
      reasons.push(`Low hemoglobin (${user.vitals.hemoglobin} g/dL) — Anemia risk`);
    if (user.vitals.hemoglobin >= 10 && user.vitals.hemoglobin < 11)
      reasons.push(`Borderline hemoglobin (${user.vitals.hemoglobin} g/dL)`);
    return reasons;
  };

  // ── PCOS risk reasons ───────────────────────────────────────
  const getPCOSRiskReasons = (user) => {
    const reasons = [];
    if (user.cycleLength > 35)
      reasons.push(`Irregular cycle length (${user.cycleLength} days — normal is ≤35)`);
    if (user.symptoms?.includes('weight_gain'))
      reasons.push('Weight gain reported — insulin resistance risk');
    if (user.symptoms?.includes('facial_hair'))
      reasons.push('Facial hair — elevated androgen levels possible');
    return reasons;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-serif text-charcoal mb-2">Risk Alerts</h1>
        <p className="text-charcoal/60">
          Monitor high-risk pregnancies and PCOS users needing attention
        </p>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-cream-dark">

        <button
          onClick={() => setActiveFilter('all')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeFilter === 'all'
              ? 'text-sage border-b-2 border-sage'
              : 'text-charcoal/60 hover:text-charcoal'
          }`}
        >
          All Alerts
          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-charcoal/10">
            {riskCount.high + riskCount.moderate + riskCount.irregularPcos}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('HIGH')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeFilter === 'HIGH'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-charcoal/60 hover:text-charcoal'
          }`}
        >
          🔴 High Risk
          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">
            {riskCount.high}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('MODERATE')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeFilter === 'MODERATE'
              ? 'text-yellow-600 border-b-2 border-yellow-600'
              : 'text-charcoal/60 hover:text-charcoal'
          }`}
        >
          🟡 Moderate Risk
          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">
            {riskCount.moderate}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('PCOS')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeFilter === 'PCOS'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-charcoal/60 hover:text-charcoal'
          }`}
        >
          🌸 PCOS Irregular
          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-600">
            {riskCount.irregularPcos}
          </span>
        </button>
      </div>

      {/* ── Alerts List ── */}
      {filteredUsers.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-serif text-charcoal mb-2">No alerts</h3>
          <p className="text-charcoal/60">All users are stable at the moment 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map(user => {
            const isPCOS      = user.healthType === 'pcos';
            const isHighRisk  = user.riskScore === 'HIGH';
            const riskReasons = isPCOS
              ? getPCOSRiskReasons(user)
              : getMaternityRiskReasons(user);

            return (
              <div
                key={user.id}
                className={`card border-l-4 hover:shadow-lg transition-all duration-300 ${
                  isPCOS
                    ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-white'
                    : isHighRisk
                    ? 'border-red-500 bg-gradient-to-r from-red-50 to-white'
                    : 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                  {/* User Info */}
                  <div className="flex items-start gap-4 flex-1">

                    {/* Avatar */}
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-serif text-xl ${
                      isPCOS ? 'bg-purple-500' : isHighRisk ? 'bg-red-500' : 'bg-yellow-500'
                    }`}>
                      {user.name?.split(' ').map(n => n[0]).join('')}
                    </div>

                    <div className="flex-1">
                      {/* Name + badges */}
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <h3 className="text-xl font-serif text-charcoal">{user.name}</h3>

                        {/* Health type pill */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isPCOS
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {isPCOS ? '🌸 PCOS' : '🤰 Maternity'}
                        </span>

                        {/* Risk badge (maternity only) */}
                        {!isPCOS && <Badge risk={user.riskScore} />}

                        {/* PCOS irregular badge */}
                        {isPCOS && user.cycleLength > 35 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                            ⚠️ Irregular Cycle
                          </span>
                        )}
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-charcoal/70">
                          <Phone className="w-4 h-4" />
                          <span>{user.phone}</span>
                        </div>

                        {/* Maternity-specific */}
                        {!isPCOS && (
                          <>
                            <div className="flex items-center gap-2 text-charcoal/70">
                              <Calendar className="w-4 h-4" />
                              <span>Week {user.pregnancyWeek || user.currentWeek || 'N/A'}</span>
                            </div>
                            {user.vitals && (
                              <>
                                <div className="flex items-center gap-2 text-charcoal/70">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>BP: {user.vitals.bp || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-charcoal/70">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>Hb: {user.vitals.hemoglobin || 'N/A'} g/dL</span>
                                </div>
                              </>
                            )}
                            {user.location && (
                              <div className="flex items-center gap-2 text-charcoal/70">
                                <MapPin className="w-4 h-4" />
                                <span>{user.location}</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* PCOS-specific */}
                        {isPCOS && (
                          <>
                            <div className="flex items-center gap-2 text-charcoal/70">
                              <Calendar className="w-4 h-4" />
                              <span>Cycle: {user.cycleLength} days</span>
                            </div>
                            <div className="flex items-center gap-2 text-charcoal/70">
                              <Heart className="w-4 h-4 text-purple-500" />
                              <span>Age: {user.age}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* PCOS symptoms */}
                      {isPCOS && user.symptoms?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.symptoms.map(s => (
                            <span
                              key={s}
                              className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full capitalize"
                            >
                              {s.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-charcoal/50 mt-2">
                        Last visit: {user.lastVisit || 'Not recorded'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleCallClick(e, user)}
                      className={`px-4 py-2 text-white font-medium rounded-gentle transition-colors flex items-center gap-2 ${
                        isPCOS
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-sage hover:bg-sage-dark'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </button>
                    <button
                      onClick={() => onSelectUser(user)}
                      className="px-4 py-2 bg-white hover:bg-cream border border-cream-dark text-charcoal font-medium rounded-gentle transition-colors"
                    >
                      Add Checkup
                    </button>
                  </div>
                </div>

                {/* Risk reasons box */}
                {riskReasons.length > 0 && (
                  <div className={`mt-4 p-3 rounded-gentle border ${
                    isPCOS
                      ? 'bg-purple-100 border-purple-200'
                      : 'bg-red-100 border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isPCOS ? 'text-purple-600' : 'text-red-600'
                      }`} />
                      <div className={`text-sm ${isPCOS ? 'text-purple-800' : 'text-red-800'}`}>
                        <p className="font-semibold mb-1">Risk Factors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {riskReasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Call Modal */}
      <CallSimulationModal
        isOpen={callModalOpen}
        onClose={() => {
          setCallModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
}
