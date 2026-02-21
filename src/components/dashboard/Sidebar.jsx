// src/components/dashboard/Sidebar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, AlertCircle,
  Settings, ChevronDown, Menu, X, Brain, Stethoscope
} from 'lucide-react';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function Sidebar({ users = [] }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path ||
    location.pathname.startsWith(path + '/');

  // ── Counts for badges ───────────────────────────────────────
  const highRiskCount    = users.filter(u => u.riskScore === 'HIGH').length;
  const irregularCount   = users.filter(u => u.healthType === 'pcos' && u.cycleLength > 35).length;
  const totalAlertCount  = highRiskCount + irregularCount;
  const maternityCount   = users.filter(u => u.healthType === 'maternity').length;
  const pcosCount        = users.filter(u => u.healthType === 'pcos').length;

  // ── Main nav items ──────────────────────────────────────────
  const menuItems = [
    {
      icon:  LayoutDashboard,
      label: 'Overview',
      path:  '/dashboard',
      emoji: '📊',
      count: null,
    },
    {
      icon:  Users,
      label: 'All Users',
      path:  '/dashboard/users',
      emoji: '👥',
      count: users.length || null,
    },
    {
      icon:  AlertCircle,
      label: 'Risk Alerts',
      path:  '/dashboard/risk-alerts',
      emoji: '⚠️',
      count: totalAlertCount || null,
      urgent: totalAlertCount > 0,
    },
    {
      icon:  Settings,
      label: 'Settings',
      path:  '/dashboard/settings',
      emoji: '⚙️',
      count: null,
    },
  ];

  // ── AI Tools nav ────────────────────────────────────────────
  const mlMenuItems = [
    {
      icon:  Brain,
      label: 'Maternal Risk',
      path:  '/dashboard/ml-maternal',
      badge: 'AI',
      count: maternityCount || null,
    },
    {
      icon:  Stethoscope,
      label: 'PCOS Detection',
      path:  '/dashboard/ml-pcos',
      badge: 'AI',
      count: pcosCount || null,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // ── Get current user's initials for profile section ─────────
  const currentUser = auth.currentUser;
  const userInitials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : currentUser?.email?.[0].toUpperCase() || '?';
  const userName     = currentUser?.displayName || currentUser?.email || 'User';

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-6 left-6 z-50 p-3 bg-white rounded-full shadow-lg"
      >
        {isMobileOpen
          ? <X    className="w-6 h-6 text-charcoal" />
          : <Menu className="w-6 h-6 text-charcoal" />
        }
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-72 bg-white border-r border-cream-dark p-8 shadow-sm
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="mb-10 mt-16 md:mt-0">
          <h2 className="text-3xl font-serif text-terracotta mb-1">MaterniCare</h2>
          <p className="text-sm text-charcoal/50 font-light">Women's Health Platform</p>  {/* ✅ no ASHA */}
        </div>

        {/* ── Quick stats strip ── */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-pink-50 rounded-gentle p-2 text-center">
            <p className="text-lg font-bold text-pink-600">{maternityCount}</p>
            <p className="text-xs text-pink-500">🤰 Maternity</p>
          </div>
          <div className="flex-1 bg-purple-50 rounded-gentle p-2 text-center">
            <p className="text-lg font-bold text-purple-600">{pcosCount}</p>
            <p className="text-xs text-purple-500">🌸 PCOS</p>
          </div>
          {totalAlertCount > 0 && (
            <div className="flex-1 bg-red-50 rounded-gentle p-2 text-center">
              <p className="text-lg font-bold text-red-600">{totalAlertCount}</p>
              <p className="text-xs text-red-500">⚠️ Alerts</p>
            </div>
          )}
        </div>

        {/* ── Main nav ── */}
        <nav className="space-y-1">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-gentle transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-sage to-sage-dark text-white shadow-md'
                  : 'text-charcoal/70 hover:bg-cream-dark hover:text-charcoal'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.emoji}</span>
                <span className="font-medium">{item.label}</span>
              </div>

              {item.count !== null && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  isActive(item.path)
                    ? 'bg-white/20 text-white'
                    : item.urgent
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-terracotta/10 text-terracotta'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── AI Tools section ── */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-charcoal/30 uppercase tracking-widest px-2 mb-3">
            AI Tools
          </p>
          <nav className="space-y-1">
            {mlMenuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-gentle transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'text-charcoal/70 hover:bg-cream-dark hover:text-charcoal'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {item.count !== null && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'bg-charcoal/10 text-charcoal/50'
                    }`}>
                      {item.count}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 text-purple-600'
                  }`}>
                    {item.badge}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Profile + Sign out ── */}
        <div className="mt-6 border-t border-cream-dark pt-4">
          <div className="flex items-center gap-3 p-3 bg-cream-dark rounded-gentle">

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center text-white font-serif text-sm flex-shrink-0">
              {userInitials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-charcoal text-sm truncate">{userName}</p>
              <p className="text-xs text-charcoal/60">Admin</p>  {/* ✅ no ASHA */}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="text-xs text-charcoal/40 hover:text-red-500 transition-colors whitespace-nowrap"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
