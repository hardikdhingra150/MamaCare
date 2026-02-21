// src/components/dashboard/PatientList.jsx
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Phone, Activity, Brain, Heart } from 'lucide-react';
import Badge from '../shared/Badge';
import { useState, useEffect } from 'react';
import CallSimulationModal from './CallSimulationModal';
import { db } from '../../config/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// ── ML Prediction hook ──────────────────────────────────────
function useLatestMLPrediction(userId, healthType) {
  const [mlData, setMlData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchML = async () => {
      try {
        const q = query(
          collection(db, 'ml_predictions'),
          where('userId', '==', userId),          // ✅ changed patientId → userId
          where('type', '==', healthType === 'pcos' ? 'pcos' : 'maternal'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) setMlData(snap.docs[0].data().result);
      } catch (e) {
        // silently fail — ML badge is optional
      }
    };
    fetchML();
  }, [userId, healthType]);

  return mlData;
}

// ── ML Badge ────────────────────────────────────────────────
function MLRiskBadge({ userId, healthType }) {
  const mlData = useLatestMLPrediction(userId, healthType);
  if (!mlData) return null;

  const colors = {
    'low risk':  'bg-green-100 text-green-700',
    'mid risk':  'bg-yellow-100 text-yellow-700',
    'high risk': 'bg-red-100 text-red-700',
  };

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors[mlData.riskLevel] || 'bg-gray-100 text-gray-600'}`}>
      <Brain className="w-3 h-3" />
      AI: {mlData.riskLevel} ({mlData.confidence}%)
    </span>
  );
}

// ── Maternity card details ───────────────────────────────────
function MaternityDetails({ user }) {
  return (
    <>
      <div className="flex flex-wrap gap-4 text-sm text-charcoal/70 mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Week {user.pregnancyWeek || user.currentWeek || '?'}
        </span>
        <span className="flex items-center gap-1">
          <Phone className="w-4 h-4" />
          {user.phone}
        </span>
        {user.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {user.location}
          </span>
        )}
        {user.dueDate && (
          <span className="flex items-center gap-1 text-pink-600">
            🍼 Due: {user.dueDate}
          </span>
        )}
      </div>

      {/* Vitals */}
      {user.vitals && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 bg-cream-dark rounded-full">
            BP: {user.vitals.bp || 'N/A'}
          </span>
          <span className="px-3 py-1 bg-cream-dark rounded-full">
            Hb: {user.vitals.hemoglobin || 'N/A'} g/dL
          </span>
          <span className="px-3 py-1 bg-cream-dark rounded-full">
            Weight: {user.vitals.weight || 'N/A'} kg
          </span>
        </div>
      )}
    </>
  );
}

// ── PCOS card details ────────────────────────────────────────
function PCOSDetails({ user }) {
  return (
    <>
      <div className="flex flex-wrap gap-4 text-sm text-charcoal/70 mb-3">
        <span className="flex items-center gap-1">
          <Phone className="w-4 h-4" />
          {user.phone}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Cycle: {user.cycleLength ? `${user.cycleLength} days` : 'N/A'}
          {user.cycleLength > 35 && (
            <span className="text-orange-500 text-xs ml-1">⚠️ Irregular</span>
          )}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-purple-500" />
          Age: {user.age}
        </span>
      </div>

      {/* Symptoms */}
      {user.symptoms?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.symptoms.map(s => (
            <span
              key={s}
              className="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded-full text-xs capitalize"
            >
              {s.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function UserList({ users, onSelectUser }) {
  const navigate = useNavigate();
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedUserForCall, setSelectedUserForCall] = useState(null);

  const handleCallClick = (e, user) => {
    e.stopPropagation();
    setSelectedUserForCall(user);
    setCallModalOpen(true);
  };

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-charcoal/60">
        <p>No users found matching your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => navigate(`/dashboard/users/${user.id}`)}
            className={`card hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-transparent ${
              user.healthType === 'pcos'
                ? 'hover:border-purple-400'
                : 'hover:border-sage'
            }`}
          >
            <div className="flex items-start justify-between gap-4">

              {/* User Info */}
              <div className="flex items-start gap-4 flex-1">

                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-serif text-xl shadow-md bg-gradient-to-br ${
                  user.healthType === 'pcos'
                    ? 'from-purple-400 to-purple-600'
                    : 'from-terracotta to-terracotta-dark'
                }`}>
                  {user.name?.split(' ').map(n => n[0]).join('') || '?'}
                </div>

                <div className="flex-1">
                  {/* Name + badges */}
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <h3 className="text-xl font-serif text-charcoal">{user.name}</h3>

                    {/* Health type pill */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      user.healthType === 'pcos'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-pink-100 text-pink-700'
                    }`}>
                      {user.healthType === 'pcos' ? '🌸 PCOS' : '🤰 Maternity'}
                    </span>

                    {/* Risk badge (maternity only) */}
                    {user.healthType === 'maternity' && user.riskScore && (
                      <Badge risk={user.riskScore} />
                    )}

                    {/* AI ML badge */}
                    <MLRiskBadge userId={user.id} healthType={user.healthType} />
                  </div>

                  {/* Conditional details */}
                  {user.healthType === 'maternity'
                    ? <MaternityDetails user={user} />
                    : <PCOSDetails user={user} />
                  }
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 min-w-[110px]">
                <button
                  onClick={(e) => handleCallClick(e, user)}
                  className="px-4 py-2 bg-sage hover:bg-sage-dark text-white font-medium rounded-gentle transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUser(user);
                  }}
                  className="px-4 py-2 bg-white hover:bg-cream border border-cream-dark text-charcoal font-medium rounded-gentle transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Activity className="w-4 h-4" />
                  Checkup
                </button>

                {/* AI Assess — routes to correct ML form */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const route = user.healthType === 'pcos'
                      ? `/dashboard/ml-pcos?userId=${user.id}&name=${encodeURIComponent(user.name)}`
                      : `/dashboard/ml-maternal?userId=${user.id}&name=${encodeURIComponent(user.name)}`;
                    navigate(route);
                  }}
                  className={`px-4 py-2 font-medium rounded-gentle transition-colors flex items-center gap-2 whitespace-nowrap border ${
                    user.healthType === 'pcos'
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                      : 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700'
                  }`}
                >
                  <Brain className="w-4 h-4" />
                  AI Assess
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CallSimulationModal
        isOpen={callModalOpen}
        onClose={() => {
          setCallModalOpen(false);
          setSelectedUserForCall(null);
        }}
        user={selectedUserForCall}        // ✅ renamed from patient → user
      />
    </>
  );
}
