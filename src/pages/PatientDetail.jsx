// src/pages/PatientDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Calendar, Edit,
  AlertCircle, TrendingUp, MessageSquare, Brain, PhoneCall, Heart
} from 'lucide-react';
import Badge from '../components/shared/Badge';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import CallSimulationModal from '../components/dashboard/CallSimulationModal';
import { getCheckups } from '../services/firebaseService';  // ✅ renamed
import { db } from '../config/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

// ─── Hooks ───────────────────────────────────────────────────

function useWhatsAppLogs(userId) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'whatsapp_conversations'),  // ✅ correct collection name
          where('userId', '==', userId),             // ✅ changed patientId → userId
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('WhatsApp logs error:', e); }
      setLoading(false);
    })();
  }, [userId]);

  return { logs, loading };
}

function useCallLogs(userId) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'callLogs'),          // ✅ correct collection name
          where('userId', '==', userId),       // ✅ changed patientId → userId
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('Call logs error:', e); }
      setLoading(false);
    })();
  }, [userId]);

  return { logs, loading };
}

function useMLPredictions(userId) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'ml_predictions'),
          where('userId', '==', userId),       // ✅ changed patientId → userId
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        setPredictions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error('ML predictions error:', e); }
      setLoading(false);
    })();
  }, [userId]);

  return { predictions, loading };
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit'
  });
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-10 text-charcoal/50">
      <Icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ─── Tab: WhatsApp ────────────────────────────────────────────

function WhatsAppTab({ userId }) {
  const { logs, loading } = useWhatsAppLogs(userId);

  if (loading) return <p className="text-center py-8 text-charcoal/50 text-sm">Loading messages...</p>;
  if (!logs.length) return <EmptyState icon={MessageSquare} text="No WhatsApp messages yet" />;

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="border border-cream-dark rounded-gentle p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              log.direction === 'inbound'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {log.direction === 'inbound' ? '📥 User sent' : '📤 System sent'}
            </span>
            <span className="text-xs text-charcoal/50">{formatTime(log.timestamp)}</span>
          </div>

          {log.direction === 'outbound' ? (
            <p className="text-sm text-charcoal whitespace-pre-line">{log.message}</p>
          ) : (
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-500 font-medium mb-1">User:</p>
                <p className="text-sm text-charcoal">{log.message}</p>
              </div>
              {log.response && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium mb-1">AI Response:</p>
                  <p className="text-sm text-charcoal whitespace-pre-line">{log.response}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 flex gap-3 text-xs text-charcoal/40">
            {log.messageType && <span>Type: {log.messageType}</span>}
            {log.type && <span>• {log.type.replace(/_/g, ' ')}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Calls ───────────────────────────────────────────────

function CallsTab({ userId }) {
  const { logs, loading } = useCallLogs(userId);

  if (loading) return <p className="text-center py-8 text-charcoal/50 text-sm">Loading calls...</p>;
  if (!logs.length) return <EmptyState icon={PhoneCall} text="No calls recorded yet" />;

  const statusColor = {
    completed:   'bg-green-100 text-green-700',
    initiated:   'bg-blue-100 text-blue-700',
    failed:      'bg-red-100 text-red-700',
    'no-answer': 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-3">
      {logs.map(log => (
        <div key={log.id} className="border border-cream-dark rounded-gentle p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-sage" />
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal">
                {/* ✅ show week for maternity, cycle for pcos */}
                {log.healthType === 'pcos'
                  ? `PCOS tips — ${log.language || 'hindi'}`
                  : `Week ${log.pregnancyWeek || '?'} — ${log.language || 'hindi'}`
                }
              </p>
              <p className="text-xs text-charcoal/50">{formatTime(log.timestamp)}</p>
              <p className="text-xs text-charcoal/40 mt-0.5">{log.type?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              statusColor[log.status] || 'bg-gray-100 text-gray-600'
            }`}>
              {log.status || 'unknown'}
            </span>
            {log.duration > 0 && (
              <p className="text-xs text-charcoal/50 mt-1">{log.duration}s</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: AI Assessment ───────────────────────────────────────

function AIAssessmentTab({ userId, user, navigate }) {
  const { predictions, loading } = useMLPredictions(userId);

  const riskColor = {
    'low risk':  { bg: 'bg-green-50',  badge: 'bg-green-100 text-green-700',   bar: 'bg-green-500'  },
    'mid risk':  { bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500' },
    'high risk': { bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700',       bar: 'bg-red-500'    },
  };

  // ✅ Route to correct ML form by healthType
  const mlRoute = user.healthType === 'pcos'
    ? `/dashboard/ml-pcos?userId=${userId}&name=${encodeURIComponent(user.name)}`
    : `/dashboard/ml-maternal?userId=${userId}&name=${encodeURIComponent(user.name)}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => navigate(mlRoute)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-gentle flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          Run New Assessment
        </button>
      </div>

      {loading && <p className="text-center py-8 text-charcoal/50 text-sm">Loading assessments...</p>}
      {!loading && !predictions.length && (
        <EmptyState icon={Brain} text="No AI assessments yet — click 'Run New Assessment'" />
      )}

      {predictions.map(pred => {
        const risk  = pred.result?.riskLevel || 'unknown';
        const theme = riskColor[risk] || { bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400' };
        const probs = pred.result?.probabilities || {};

        return (
          <div key={pred.id} className={`rounded-gentle border border-cream-dark p-4 ${theme.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-charcoal capitalize">
                  {pred.type} assessment
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                  {risk}
                </span>
              </div>
              <span className="text-xs text-charcoal/50">{formatTime(pred.timestamp)}</span>
            </div>

            <p className="text-sm text-charcoal/70 mb-3">
              Confidence:{' '}
              <span className="font-semibold text-charcoal">{pred.result?.confidence}%</span>
            </p>

            {Object.keys(probs).length > 0 && (
              <div className="space-y-2">
                {Object.entries(probs).map(([label, pct]) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-charcoal/60 mb-1">
                      <span className="capitalize">{label}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${theme.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pred.inputData && (
              <details className="mt-3">
                <summary className="text-xs text-charcoal/50 cursor-pointer hover:text-charcoal">
                  View input data ▾
                </summary>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(pred.inputData).map(([k, v]) => (
                    <div key={k} className="bg-white rounded p-2 text-center">
                      <p className="text-xs text-charcoal/50 capitalize">
                        {k.replace(/([A-Z])/g, ' $1')}
                      </p>
                      <p className="text-sm font-semibold text-charcoal">{v}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Maternity Overview ───────────────────────────────────────

function MaternityOverview({ user, checkups, loading, onSelectUser, navigate }) {
  const chartData = checkups.slice(0, 6).reverse().map(c => ({
    date: c.date,
    bp: parseInt(c.bp?.split('/')[0]) || 0,
    hemoglobin: c.hemoglobin,
  }));

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="card">
          <h3 className="text-lg font-serif text-charcoal mb-4">Personal Information</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Age',          value: `${user.age} years` },
              { label: 'Language',     value: user.language, className: 'capitalize' },
              { label: 'LMP',          value: user.lmp || 'N/A' },
              { label: 'Due Date',     value: user.dueDate || 'N/A' },
              { label: 'Last Visit',   value: user.lastVisit || 'Not recorded' },
            ].map(({ label, value, className }) => (
              <div key={label}>
                <p className="text-charcoal/60">{label}</p>
                <p className={`text-charcoal font-medium ${className || ''}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vitals */}
        <div className="card">
          <h3 className="text-lg font-serif text-charcoal mb-4">Current Vitals</h3>
          <div className="space-y-3">
            {[
              { label: 'Blood Pressure', value: user.vitals?.bp || 'Not recorded' },
              { label: 'Hemoglobin',     value: user.vitals?.hemoglobin ? `${user.vitals.hemoglobin} g/dL` : 'Not recorded' },
              { label: 'Weight',         value: user.vitals?.weight ? `${user.vitals.weight} kg` : 'Not recorded' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-cream-dark rounded-gentle">
                <span className="text-sm text-charcoal/60">{label}</span>
                <span className="text-lg font-semibold text-charcoal">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div className="card">
          <h3 className="text-lg font-serif text-charcoal mb-4">Emergency Contact</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Contact Number', value: user.emergencyContact || 'Not provided' },
              { label: 'Relation',       value: user.emergencyRelation || 'Not provided', className: 'capitalize' },
              { label: 'Next Checkup',   value: user.nextCheckup || 'Not scheduled' },
            ].map(({ label, value, className }) => (
              <div key={label}>
                <p className="text-charcoal/60">{label}</p>
                <p className={`text-charcoal font-medium ${className || ''}`}>{value}</p>
              </div>
            ))}
            <button
              onClick={() => alert(
                `🚨 Emergency SOS Triggered!\n\n✅ Ambulance dispatched\n✅ Family notified\n✅ PHC alerted\n\nLocation: ${user.location}`
              )}
              className="w-full mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-gentle transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Emergency SOS
            </button>
          </div>
        </div>
      </div>

      {/* Vital Trends */}
      {checkups.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif text-charcoal">Vital Trends</h3>
            <span className="text-sm text-charcoal/60">Last {checkups.length} checkups</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE2" />
              <XAxis dataKey="date" stroke="#3D3B37" tick={{ fill: '#3D3B37', fontSize: 12 }} />
              <YAxis stroke="#3D3B37" tick={{ fill: '#3D3B37', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#F8F5F0', border: '1px solid #F0EAE2', borderRadius: '8px', fontSize: '14px' }} />
              <Legend />
              <Line type="monotone" dataKey="bp" stroke="#E08F7E" strokeWidth={2} name="Systolic BP" dot={{ fill: '#E08F7E', r: 4 }} />
              <Line type="monotone" dataKey="hemoglobin" stroke="#A4B494" strokeWidth={2} name="Hemoglobin (g/dL)" dot={{ fill: '#A4B494', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Checkup History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif text-charcoal">Checkup History</h3>
          <button onClick={() => onSelectUser(user)} className="btn-primary text-sm">
            + Add Checkup
          </button>
        </div>
        {loading ? (
          <p className="text-center py-8 text-charcoal/60">Loading checkups...</p>
        ) : checkups.length === 0 ? (
          <p className="text-center py-8 text-charcoal/60">No checkups recorded yet</p>
        ) : (
          <div className="space-y-4">
            {checkups.map(checkup => (
              <div key={checkup.id} className="p-4 border border-cream-dark rounded-gentle hover:border-sage transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-charcoal">{checkup.date}</p>
                    <p className="text-sm text-charcoal/60">{checkup.remarks || 'No remarks'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-charcoal/60">
                    <TrendingUp className="w-4 h-4" />
                    <span>Recorded</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><p className="text-charcoal/60">BP</p><p className="font-semibold text-charcoal">{checkup.bp}</p></div>
                  <div><p className="text-charcoal/60">Hemoglobin</p><p className="font-semibold text-charcoal">{checkup.hemoglobin} g/dL</p></div>
                  <div><p className="text-charcoal/60">Weight</p><p className="font-semibold text-charcoal">{checkup.weight} kg</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── PCOS Overview ────────────────────────────────────────────

function PCOSOverview({ user, onSelectUser }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* PCOS Details */}
      <div className="card">
        <h3 className="text-lg font-serif text-charcoal mb-4">🌸 PCOS Details</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Age',           value: `${user.age} years` },
            { label: 'Language',      value: user.language, className: 'capitalize' },
            { label: 'Cycle Length',  value: user.cycleLength ? `${user.cycleLength} days` : 'N/A' },
            { label: 'Diagnosed',     value: user.diagnosedDate || 'Not provided' },
            { label: 'Last Visit',    value: user.lastVisit || 'Not recorded' },
          ].map(({ label, value, className }) => (
            <div key={label}>
              <p className="text-charcoal/60">{label}</p>
              <p className={`text-charcoal font-medium ${className || ''}`}>{value}</p>
            </div>
          ))}

          {/* Cycle status */}
          {user.cycleLength && (
            <div className={`p-3 rounded-gentle ${
              user.cycleLength > 35 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
            }`}>
              <p className={`text-sm font-medium ${user.cycleLength > 35 ? 'text-orange-700' : 'text-green-700'}`}>
                {user.cycleLength > 35 ? '⚠️ Irregular cycle — monitoring needed' : '✅ Cycle within normal range'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Symptoms */}
      <div className="card">
        <h3 className="text-lg font-serif text-charcoal mb-4">Reported Symptoms</h3>
        {user.symptoms?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.symptoms.map(s => (
              <span
                key={s}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-sm capitalize"
              >
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-charcoal/60 text-sm">No symptoms reported</p>
        )}

        {/* Emergency Contact */}
        <div className="mt-6 pt-4 border-t border-cream-dark">
          <h4 className="text-sm font-semibold text-charcoal/60 mb-3">EMERGENCY CONTACT</h4>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-charcoal/60">Contact Number</p>
              <p className="text-charcoal font-medium">{user.emergencyContact || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-charcoal/60">Relation</p>
              <p className="text-charcoal font-medium capitalize">{user.emergencyRelation || 'Not provided'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectUser(user)}
          className="w-full mt-4 btn-primary text-sm"
        >
          + Add Checkup / Update Symptoms
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function UserDetail({ users = [], onSelectUser }) {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [userCheckups, setUserCheckups]       = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [activeTab, setActiveTab]             = useState('overview');

  const user = users.find(u => u.id === id);  // ✅ changed patients → users

  useEffect(() => {
    if (user?.id) loadCheckups();
  }, [user]);

  const loadCheckups = async () => {
    setLoading(true);
    try {
      const result = await getCheckups(user.id);  // ✅ renamed function
      if (result.success) setUserCheckups(result.data);
      else toast.error('Failed to load checkups');
    } catch (error) {
      console.error('Error loading checkups:', error);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
        <h3 className="text-xl font-serif text-charcoal mb-2">User Not Found</h3>
        <p className="text-charcoal/60 mb-4">This user doesn't exist in the database</p>
        <button onClick={() => navigate('/dashboard/users')} className="btn-primary">
          ← Back to Users
        </button>
      </div>
    );
  }

  const isPCOS = user.healthType === 'pcos';

  const tabs = [
    { key: 'overview',       label: '📋 Overview'       },
    { key: 'communications', label: '💬 Communications' },
    { key: 'ai',             label: '🤖 AI Assessment'  },
  ];

  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sage hover:text-sage-dark transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Users
      </button>

      {/* ── User Header ── */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">

            {/* Avatar */}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-serif text-3xl shadow-lg bg-gradient-to-br ${
              isPCOS ? 'from-purple-400 to-purple-600' : 'from-terracotta to-terracotta-dark'
            }`}>
              {user.name?.split(' ').map(n => n[0]).join('')}
            </div>

            <div>
              <div className="flex items-center flex-wrap gap-3 mb-2">
                <h1 className="text-3xl font-serif text-charcoal">{user.name}</h1>

                {/* Health type pill */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isPCOS ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'
                }`}>
                  {isPCOS ? '🌸 PCOS' : '🤰 Maternity'}
                </span>

                {/* Risk badge maternity only */}
                {!isPCOS && <Badge risk={user.riskScore} />}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-charcoal/70">
                {!isPCOS && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Week {user.pregnancyWeek || user.currentWeek || '?'}
                  </span>
                )}
                {isPCOS && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-purple-500" />
                    Cycle: {user.cycleLength || '?'} days
                  </span>
                )}
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
              </div>
              <div className="mt-2 text-xs text-charcoal/50">User ID: {user.id}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white hover:bg-cream border border-cream-dark text-charcoal font-medium rounded-gentle transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setIsCallModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call User
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-cream-dark p-1 rounded-gentle w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-gentle text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-charcoal/60 hover:text-charcoal'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        isPCOS
          ? <PCOSOverview user={user} onSelectUser={onSelectUser} />
          : <MaternityOverview
              user={user}
              checkups={userCheckups}
              loading={loading}
              onSelectUser={onSelectUser}
              navigate={navigate}
            />
      )}

      {/* ── Communications Tab ── */}
      {activeTab === 'communications' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-serif text-charcoal mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              WhatsApp Messages
            </h3>
            <WhatsAppTab userId={user.id} />
          </div>
          <div className="card">
            <h3 className="text-lg font-serif text-charcoal mb-4 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-sage" />
              Call History
            </h3>
            <CallsTab userId={user.id} />
          </div>
        </div>
      )}

      {/* ── AI Assessment Tab ── */}
      {activeTab === 'ai' && (
        <div className="card">
          <h3 className="text-lg font-serif text-charcoal mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Risk Assessments
          </h3>
          <AIAssessmentTab userId={user.id} user={user} navigate={navigate} />
        </div>
      )}

      <CallSimulationModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        user={user}                      // ✅ changed patient → user
      />
    </div>
  );
}
