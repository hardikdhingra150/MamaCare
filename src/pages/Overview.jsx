// src/pages/Overview.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, AlertTriangle, Calendar,
  CheckCircle, TrendingUp, Clock, Phone, Heart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import Badge from '../components/shared/Badge';
import CallSimulationModal from '../components/dashboard/CallSimulationModal';

export default function Overview({ users = [] }) {
  const navigate = useNavigate();
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Separate by healthType ──────────────────────────────────
  const maternityUsers = users.filter(u => u.healthType === 'maternity');
  const pcosUsers      = users.filter(u => u.healthType === 'pcos');

  // ── Stats ───────────────────────────────────────────────────
  const stats = {
    total:     users.length,
    maternity: maternityUsers.length,
    pcos:      pcosUsers.length,

    // Maternity risk
    highRisk:  maternityUsers.filter(u => u.riskScore === 'HIGH').length,
    moderate:  maternityUsers.filter(u => u.riskScore === 'MODERATE').length,
    low:       maternityUsers.filter(u => u.riskScore === 'LOW').length,

    // PCOS irregular cycle
    irregularCycle: pcosUsers.filter(u => u.cycleLength > 35).length,

    // Upcoming checkups (maternity only)
    dueThisWeek: maternityUsers.filter(u => {
      if (!u.nextCheckup) return false;
      const nextCheckup = new Date(u.nextCheckup);
      const today = new Date();
      const daysUntil = Math.floor((nextCheckup - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    }).length,
  };

  // ── High risk users (maternity) ─────────────────────────────
  const highRiskUsers = maternityUsers.filter(u => u.riskScore === 'HIGH');

  // ── PCOS users with irregular cycles ───────────────────────
  const irregularPCOSUsers = pcosUsers.filter(u => u.cycleLength > 35);

  // ── Chart data ──────────────────────────────────────────────

  // Pie: health type distribution
  const healthTypeData = [
    { name: '🤰 Maternity', value: stats.maternity, color: '#F472B6' },
    { name: '🌸 PCOS',      value: stats.pcos,      color: '#A78BFA' },
  ].filter(d => d.value > 0);

  // Pie: maternity risk distribution
  const riskDistributionData = [
    { name: 'High Risk', value: stats.highRisk, color: '#EF4444' },
    { name: 'Moderate',  value: stats.moderate, color: '#F59E0B' },
    { name: 'Low Risk',  value: stats.low,       color: '#10B981' },
  ].filter(d => d.value > 0);

  // Bar: maternity by trimester
  const trimesterData = [
    {
      name: '0-12 wks',
      trimester: '1st Trimester',
      count: maternityUsers.filter(u =>
        (u.pregnancyWeek || u.currentWeek || 0) >= 0 &&
        (u.pregnancyWeek || u.currentWeek || 0) <= 12
      ).length
    },
    {
      name: '13-28 wks',
      trimester: '2nd Trimester',
      count: maternityUsers.filter(u =>
        (u.pregnancyWeek || u.currentWeek || 0) >= 13 &&
        (u.pregnancyWeek || u.currentWeek || 0) <= 28
      ).length
    },
    {
      name: '29+ wks',
      trimester: '3rd Trimester',
      count: maternityUsers.filter(u =>
        (u.pregnancyWeek || u.currentWeek || 0) >= 29
      ).length
    },
  ];

  // Bar: PCOS symptoms frequency
  const allSymptoms = pcosUsers.flatMap(u => u.symptoms || []);
  const symptomCounts = allSymptoms.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const symptomsData = Object.entries(symptomCounts)
    .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const handleCallClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setCallModalOpen(true);
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#F8F5F0',
      border: '1px solid #F0EAE2',
      borderRadius: '8px',
      fontSize: '14px'
    }
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">
          Dashboard Overview
        </h1>
        <p className="text-charcoal/60">Welcome back! Here's what's happening today.</p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        {/* Total Users */}
        <div className="card group hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-charcoal/60 mb-2">Total Users</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-charcoal">{stats.total}</p>
              <p className="text-xs text-sage mt-2">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                Active women
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center group-hover:bg-sage/20 transition-colors">
              <Users className="w-6 h-6 text-sage" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Maternity */}
        <div
          onClick={() => navigate('/dashboard/users')}
          className="card group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-pink-400"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-charcoal/60 mb-2">Maternity</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-pink-600">{stats.maternity}</p>
              <p className="text-xs text-pink-500 mt-2">
                {stats.highRisk > 0 ? `⚠️ ${stats.highRisk} high risk` : '✅ All monitored'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
              <span className="text-2xl">🤰</span>
            </div>
          </div>
        </div>

        {/* PCOS */}
        <div
          onClick={() => navigate('/dashboard/users')}
          className="card group hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-purple-400"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-charcoal/60 mb-2">PCOS</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-purple-600">{stats.pcos}</p>
              <p className="text-xs text-purple-500 mt-2">
                {stats.irregularCycle > 0
                  ? `⚠️ ${stats.irregularCycle} irregular cycles`
                  : '✅ All monitored'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <span className="text-2xl">🌸</span>
            </div>
          </div>
        </div>

        {/* Due This Week */}
        <div className="card group hover:shadow-lg transition-all duration-300 border-l-4 border-terracotta">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-charcoal/60 mb-2">Due This Week</p>
              <p className="text-3xl md:text-4xl font-serif font-bold text-terracotta">{stats.dueThisWeek}</p>
              <p className="text-xs text-terracotta mt-2">Upcoming checkups</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center group-hover:bg-terracotta/20 transition-colors">
              <Calendar className="w-6 h-6 text-terracotta" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* ── High Risk Maternity Alerts ── */}
      {highRiskUsers.length > 0 && (
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="text-xl font-serif text-charcoal">⚠️ High Risk — Maternity Alerts</h3>
              <p className="text-sm text-charcoal/60">Patients requiring immediate attention</p>
            </div>
          </div>

          <div className="space-y-3">
            {highRiskUsers.slice(0, 3).map(user => (
              <div
                key={user.id}
                onClick={() => navigate(`/dashboard/users/${user.id}`)}
                className="bg-white p-4 rounded-gentle cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-serif">
                      {user.name?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-charcoal">{user.name}</p>
                        <Badge risk={user.riskScore} />
                      </div>
                      <p className="text-sm text-charcoal/60">
                        {user.phone} • Week {user.pregnancyWeek || user.currentWeek}
                      </p>
                      {user.vitals && (
                        <p className="text-xs text-red-500 mt-0.5">
                          BP: {user.vitals.bp || 'N/A'} • Hb: {user.vitals.hemoglobin || 'N/A'} g/dL
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleCallClick(e, user)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-gentle transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Phone className="w-4 h-4" />
                    Call Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {highRiskUsers.length > 3 && (
            <Link
              to="/dashboard/risk-alerts"
              className="text-sm text-red-600 hover:text-red-700 font-medium mt-4 inline-block"
            >
              View All {highRiskUsers.length} High Risk Users →
            </Link>
          )}
        </div>
      )}

      {/* ── PCOS Irregular Cycle Alerts ── */}
      {irregularPCOSUsers.length > 0 && (
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
          <div className="flex items-start gap-3 mb-4">
            <Heart className="w-6 h-6 text-purple-600 flex-shrink-0" strokeWidth={1.5} />
            <div>
              <h3 className="text-xl font-serif text-charcoal">🌸 PCOS — Irregular Cycle Alerts</h3>
              <p className="text-sm text-charcoal/60">Users with cycle length over 35 days</p>
            </div>
          </div>

          <div className="space-y-3">
            {irregularPCOSUsers.slice(0, 3).map(user => (
              <div
                key={user.id}
                onClick={() => navigate(`/dashboard/users/${user.id}`)}
                className="bg-white p-4 rounded-gentle cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-serif">
                      {user.name?.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal">{user.name}</p>
                      <p className="text-sm text-charcoal/60">
                        {user.phone} • Cycle: {user.cycleLength} days
                      </p>
                      {user.symptoms?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {user.symptoms.slice(0, 3).map(s => (
                            <span key={s} className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full capitalize">
                              {s.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleCallClick(e, user)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-gentle transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Phone className="w-4 h-4" />
                    Call Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Summary ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Maternity summary */}
        <div className="card">
          <h3 className="text-xl font-serif text-charcoal mb-4">🤰 Maternity Summary</h3>
          {stats.maternity === 0 ? (
            <div className="text-center py-8 text-charcoal/60">
              <p>No maternity users yet</p>
            </div>
          ) : stats.highRisk > 0 ? (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 rounded-gentle border-l-4 border-red-500">
                <p className="text-sm font-medium text-charcoal mb-1">
                  {stats.highRisk} HIGH RISK patient{stats.highRisk > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-charcoal/60 mb-2">
                  Critical vitals detected. Immediate intervention required.
                </p>
                <Link to="/dashboard/risk-alerts" className="text-sm text-red-600 hover:text-red-700 font-medium">
                  View Alerts →
                </Link>
              </div>
              <div className="p-4 bg-yellow-50 rounded-gentle border-l-4 border-yellow-500">
                <p className="text-sm font-medium text-charcoal">
                  {stats.moderate} MODERATE risk
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-gentle border-l-4 border-green-500">
                <p className="text-sm font-medium text-charcoal">
                  {stats.low} LOW risk
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-charcoal mb-1">All Clear!</p>
              <p className="text-xs text-charcoal/60">No urgent maternity alerts</p>
            </div>
          )}
        </div>

        {/* PCOS summary */}
        <div className="card">
          <h3 className="text-xl font-serif text-charcoal mb-4">🌸 PCOS Summary</h3>
          {stats.pcos === 0 ? (
            <div className="text-center py-8 text-charcoal/60">
              <p>No PCOS users yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 rounded-gentle border-l-4 border-purple-500">
                <p className="text-sm font-medium text-charcoal mb-1">
                  {stats.pcos} total PCOS users
                </p>
                <p className="text-xs text-charcoal/60">
                  {stats.irregularCycle} with irregular cycles (&gt;35 days)
                </p>
              </div>

              {/* Top symptoms */}
              {symptomsData.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-charcoal/60 mb-2">TOP SYMPTOMS</p>
                  {symptomsData.slice(0, 3).map(s => (
                    <div key={s.name} className="flex items-center justify-between py-1">
                      <span className="text-sm capitalize text-charcoal">{s.name}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        {s.count} user{s.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Health type distribution */}
        <div className="card">
          <h3 className="text-xl font-serif text-charcoal mb-6">Health Type Distribution</h3>
          {users.length === 0 ? (
            <div className="text-center py-12 text-charcoal/60">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={healthTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {healthTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Maternity by trimester OR PCOS symptoms */}
        <div className="card">
          <h3 className="text-xl font-serif text-charcoal mb-6">
            {stats.maternity > 0 ? '🤰 Maternity by Trimester' : '🌸 PCOS Symptoms Frequency'}
          </h3>
          {users.length === 0 ? (
            <div className="text-center py-12 text-charcoal/60">No data yet</div>
          ) : stats.maternity > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trimesterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE2" />
                <XAxis
                  dataKey="name"
                  stroke="#3D3B37"
                  tick={{ fill: '#3D3B37', fontSize: 11 }}
                />
                <YAxis
                  stroke="#3D3B37"
                  tick={{ fill: '#3D3B37', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  {...tooltipStyle}
                  cursor={{ fill: 'rgba(164, 180, 148, 0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#F472B6"
                  radius={[8, 8, 0, 0]}
                  name="Users"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={symptomsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE2" />
                <XAxis
                  dataKey="name"
                  stroke="#3D3B37"
                  tick={{ fill: '#3D3B37', fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#3D3B37"
                  tick={{ fill: '#3D3B37', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  {...tooltipStyle}
                  cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#A78BFA"
                  radius={[8, 8, 0, 0]}
                  name="Users"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Call Modal */}
      <CallSimulationModal
        isOpen={callModalOpen}
        onClose={() => {
          setCallModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}          // ✅ renamed from patient → user
      />
    </div>
  );
}
