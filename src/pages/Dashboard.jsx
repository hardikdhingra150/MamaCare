// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Bell, Search, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import UserList       from '../components/dashboard/PatientList';
import AddUserModal   from '../components/dashboard/AddPatientModal';
import AddCheckupModal from '../components/dashboard/AddCheckupModal';
import SearchFilter   from '../components/dashboard/SearchFilter';
import Loading, { SkeletonCard } from '../components/shared/Loading';
import Sidebar        from '../components/dashboard/Sidebar';
import Overview       from './Overview';
import RiskAlerts     from './RiskAlerts';
import UserDetail     from './PatientDetail';
import Settings       from './Settings';
import MaternalRiskForm from '../components/dashboard/MaternalRiskForm';
import PCOSForm         from '../components/dashboard/PCOSForm';

// Firebase services
import {
  subscribeToUsers,   // ✅ real-time instead of getAllUsers
  addUser,
  updateUser,
  addCheckup,
  saveCallLog,
} from '../services/firebaseService';

export default function Dashboard() {
  const navigate = useNavigate();

  const [users,             setUsers]             = useState([]);
  const [isAddUserOpen,     setIsAddUserOpen]     = useState(false);
  const [isAddCheckupOpen,  setIsAddCheckupOpen]  = useState(false);
  const [selectedUser,      setSelectedUser]      = useState(null);
  const [isLoading,         setIsLoading]         = useState(true);
  const [searchTerm,        setSearchTerm]        = useState('');
  const [healthFilter,      setHealthFilter]      = useState('all');
  const [riskFilter,        setRiskFilter]        = useState('all');
  const [sortBy,            setSortBy]            = useState('risk');  // ✅ default sort by risk

  // ── Real-time listener ──────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);

    // subscribeToUsers returns the unsubscribe function
    const unsubscribe = subscribeToUsers((data) => {
      setUsers(data);
      setIsLoading(false);

      // ✅ Show toast only on first load, not on every update
      if (isLoading && data.length > 0) {
        toast.success(`✅ ${data.length} user(s) loaded`);
      }

      // ✅ Auto-alert for high risk users
      const highRisk = data.filter(u => u.riskScore === 'HIGH');
      if (highRisk.length > 0) {
        toast.error(
          `⚠️ ${highRisk.length} HIGH RISK user${highRisk.length > 1 ? 's' : ''} need attention!`,
          { id: 'high-risk-alert', duration: 5000 }  // id prevents duplicate toasts
        );
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // ── Filter + Sort ───────────────────────────────────────────
  const filteredUsers = users
    .filter(u => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm);

      const matchesHealth =
        healthFilter === 'all' || u.healthType === healthFilter;

      const matchesRisk =
        riskFilter === 'all' || u.riskScore === riskFilter;

      return matchesSearch && matchesHealth && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name?.localeCompare(b.name);
        case 'week': return (b.pregnancyWeek || 0) - (a.pregnancyWeek || 0);
        case 'risk': {
          const riskOrder = { HIGH: 3, MODERATE: 2, LOW: 1 };
          return (riskOrder[b.riskScore] || 0) - (riskOrder[a.riskScore] || 0);
        }
        case 'newest': {
          // ✅ Sort by createdAt — newest registrations first
          return (b.createdAt || 0) > (a.createdAt || 0) ? 1 : -1;
        }
        default: return 0;
      }
    });

  // ── Add user (from admin dashboard) ────────────────────────
  const handleAddUser = async (newUser) => {
    try {
      const result = await addUser(newUser);
      if (result.success) {
        // ✅ No need to reload — subscribeToUsers picks it up automatically
        toast.success(`✅ ${newUser.name} registered successfully!`);
        setIsAddUserOpen(false);
      } else {
        toast.error('Failed to add user: ' + result.error);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };

  // ── Add checkup ─────────────────────────────────────────────
  const handleAddCheckup = async (newCheckup) => {
    if (!selectedUser?.id) {
      toast.error('No user selected');
      return;
    }
    try {
      // addCheckup in firebaseService already handles risk scoring
      // and updating user vitals — so we just call it
      const result = await addCheckup({
        ...newCheckup,
        userId:     selectedUser.id,
        healthType: selectedUser.healthType,
        userName:   selectedUser.name,
        userPhone:  selectedUser.phone,
      });

      if (!result.success) {
        toast.error('Failed to record checkup: ' + result.error);
        return;
      }

      // ✅ Risk alert toast for maternity
      if (selectedUser.healthType === 'maternity') {
        const systolic   = parseInt(newCheckup.bp?.split('/')[0]) || 0;
        const hemoglobin = parseFloat(newCheckup.hemoglobin) || 0;

        if (systolic > 140 || hemoglobin < 10) {
          toast.error(`🚨 HIGH RISK detected for ${selectedUser.name}! Consider calling immediately.`, {
            duration: 6000
          });
        } else {
          toast.success(`✅ Checkup recorded for ${selectedUser.name}`);
        }
      } else {
        toast.success(`✅ Checkup recorded for ${selectedUser.name}`);
      }

      setIsAddCheckupOpen(false);
      setSelectedUser(null);

    } catch (error) {
      console.error('Error adding checkup:', error);
      toast.error('Failed to record checkup');
    }
  };

  // ── Select user for checkup ─────────────────────────────────
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setIsAddCheckupOpen(true);
  };

  // ── Stats ───────────────────────────────────────────────────
  const highRiskCount  = users.filter(u => u.riskScore === 'HIGH').length;
  const maternityCount = users.filter(u => u.healthType === 'maternity').length;
  const pcosCount      = users.filter(u => u.healthType === 'pcos').length;
  const newToday       = users.filter(u => {
    if (!u.createdAt) return false;
    const today = new Date().toLocaleDateString('en-IN');
    return u.createdAt === today;
  }).length;

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar users={users} />

      <main className="flex-1 flex flex-col min-w-0">

        {/* ── Top bar ── */}
        <header className="bg-white border-b border-cream-dark px-4 md:px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-30">

          {/* Search */}
          <div className="relative flex-1 max-w-md ml-16 md:ml-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-12 pr-4 py-2.5 bg-cream rounded-gentle border border-transparent focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3">

            {/* Health type filter pills — desktop */}
            <div className="hidden md:flex gap-2">
              {[
                { key: 'all',       label: '👥 All'         },
                { key: 'maternity', label: '🤰 Maternity'   },
                { key: 'pcos',      label: '🌸 PCOS'        },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setHealthFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    healthFilter === key
                      ? 'bg-sage text-white'
                      : 'bg-cream text-charcoal/60 hover:bg-sage/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Bell — high risk badge */}
            <button
              onClick={() => navigate('/dashboard/risk-alerts')}
              className="relative p-2.5 rounded-full hover:bg-cream transition-colors"
              title="Risk Alerts"
            >
              <Bell className="w-5 h-5 text-charcoal/70" strokeWidth={1.5} />
              {highRiskCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Add user */}
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Add User</span>
              <span className="md:hidden">Add</span>
            </button>
          </div>
        </header>

        {/* ── Quick stats bar ── */}
        <div className="bg-white border-b border-cream-dark px-6 py-2.5 flex flex-wrap gap-4 text-sm text-charcoal/60">
          <span>
            👥 Total: <strong className="text-charcoal">{users.length}</strong>
          </span>
          <span>
            🤰 Maternity: <strong className="text-pink-600">{maternityCount}</strong>
          </span>
          <span>
            🌸 PCOS: <strong className="text-purple-600">{pcosCount}</strong>
          </span>
          {highRiskCount > 0 && (
            <span>
              ⚠️ High Risk: <strong className="text-red-600">{highRiskCount}</strong>
            </span>
          )}
          {newToday > 0 && (
            <span>
              🆕 New Today: <strong className="text-green-600">{newToday}</strong>
            </span>
          )}
          {/* ✅ Live indicator */}
          <span className="ml-auto flex items-center gap-1 text-xs text-green-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
            Live
          </span>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {isLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <Routes>

              {/* Overview */}
              <Route path="/" element={<Overview users={users} />} />

              {/* Users list */}
              <Route
                path="/users"
                element={
                  filteredUsers.length === 0 ? (
                    <div className="card text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-sage/10 mx-auto mb-4 flex items-center justify-center">
                        <Plus className="w-10 h-10 text-sage/40" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-2xl font-serif text-charcoal mb-2">
                        {searchTerm || healthFilter !== 'all' || riskFilter !== 'all'
                          ? 'No users match your filters'
                          : 'No Users Yet'}
                      </h3>
                      <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
                        {searchTerm || healthFilter !== 'all' || riskFilter !== 'all'
                          ? 'Try clearing your filters'
                          : 'Register your first woman — for maternity tracking or PCOS management'}
                      </p>
                      {!searchTerm && healthFilter === 'all' && riskFilter === 'all' && (
                        <button onClick={() => setIsAddUserOpen(true)} className="btn-primary">
                          + Register First User
                        </button>
                      )}
                      {(searchTerm || healthFilter !== 'all' || riskFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setHealthFilter('all');
                            setRiskFilter('all');
                          }}
                          className="btn-primary"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <SearchFilter
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        riskFilter={riskFilter}
                        onRiskFilterChange={setRiskFilter}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                      />
                      <UserList
                        users={filteredUsers}
                        onSelectUser={handleSelectUser}
                      />
                    </>
                  )
                }
              />

              {/* User detail */}
              <Route
                path="/users/:id"
                element={
                  <UserDetail
                    users={users}
                    onSelectUser={handleSelectUser}
                  />
                }
              />

              {/* Risk alerts */}
              <Route
                path="/risk-alerts"
                element={
                  <RiskAlerts
                    users={users}
                    onSelectUser={handleSelectUser}
                  />
                }
              />

              <Route path="/settings" element={<Settings />} />

              {/* ML — Maternal */}
              <Route
                path="/ml-maternal"
                element={
                  <div className="max-w-2xl mx-auto">
                    <div className="mb-6">
                      <h1 className="text-2xl font-serif text-charcoal">🤰 Maternal Risk Assessment</h1>
                      <p className="text-charcoal/60 mt-1 text-sm">
                        AI-powered risk prediction using vital signs
                      </p>
                    </div>
                    <MaternalRiskForm users={users} />
                  </div>
                }
              />

              {/* ML — PCOS */}
              <Route
                path="/ml-pcos"
                element={
                  <div className="max-w-2xl mx-auto">
                    <div className="mb-6">
                      <h1 className="text-2xl font-serif text-charcoal">🌸 PCOS Detection</h1>
                      <p className="text-charcoal/60 mt-1 text-sm">
                        AI-powered PCOS detection using hormonal markers
                      </p>
                    </div>
                    <PCOSForm users={users} />
                  </div>
                }
              />

            </Routes>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onAddUser={handleAddUser}
      />

      <AddCheckupModal
        isOpen={isAddCheckupOpen}
        onClose={() => {
          setIsAddCheckupOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onAddCheckup={handleAddCheckup}
      />
    </div>
  );
}
