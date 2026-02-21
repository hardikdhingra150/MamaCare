// src/components/dashboard/CallSimulationModal.jsx
import { useState, useEffect } from 'react';
import { X, Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import toast from 'react-hot-toast';

export default function CallSimulationModal({ isOpen, onClose, user }) {
  const [callStatus, setCallStatus] = useState('idle'); // idle | dialing | connected | ended
  const [duration, setDuration] = useState(0);
  const [isRealCall, setIsRealCall] = useState(false);
  const [callSid, setCallSid] = useState(null);

  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const handleClose = () => {
    setCallStatus('idle');
    setDuration(0);
    setIsRealCall(false);
    setCallSid(null);
    onClose();
  };

  // ── Simulated call (demo) ───────────────────────────────────
  const handleSimulatedCall = () => {
    setCallStatus('dialing');
    toast('📞 Simulating call...');
    setTimeout(() => {
      setCallStatus('connected');
      toast.success('✅ Call connected (simulated)');
    }, 2000);
  };

  // ── Real Twilio call ────────────────────────────────────────
  const handleRealCall = async () => {
    if (!user?.phone) {
      toast.error('Phone number not available');
      return;
    }

    setIsRealCall(true);
    setCallStatus('dialing');
    const loadingToast = toast.loading('📞 Initiating real call via Twilio...');

    try {
      const makeHealthTipCall = httpsCallable(functions, 'makeHealthTipCall');

      // ✅ Build payload based on healthType
      const payload = {
        userId:     user.id,                      // ✅ changed patientId → userId
        phone:      user.phone,
        language:   user.language || 'hindi',
        healthType: user.healthType || 'maternity', // ✅ NEW — tells function what tips to use
        userName:   user.name,                    // ✅ changed patientName → userName

        // Maternity-specific
        ...(user.healthType === 'maternity' && {
          week: user.pregnancyWeek || user.currentWeek,
        }),

        // PCOS-specific
        ...(user.healthType === 'pcos' && {
          cycleLength: user.cycleLength,
          symptoms:    user.symptoms || [],
        }),
      };

      console.log('🔥 Calling Firebase Function with:', payload);

      const result = await makeHealthTipCall(payload);

      console.log('✅ Function response:', result.data);
      toast.dismiss(loadingToast);

      if (result.data.success) {
        setCallStatus('connected');
        setCallSid(result.data.callSid);
        toast.success(
          `✅ Call initiated to ${user.name}!\nCall SID: ${result.data.callSid}\nCheck your phone! 📱`
        );
      } else {
        setCallStatus('idle');
        setIsRealCall(false);
        toast.error(`❌ Call failed: ${result.data.error}`);
      }
    } catch (error) {
      console.error('❌ Call error:', error);
      toast.dismiss(loadingToast);

      const errorMap = {
        'functions/not-found':       'Cloud Function not found. Deploy functions first.',
        'functions/unauthenticated': 'Authentication required. Please login.',
        'functions/permission-denied': 'Permission denied. Check Firebase rules.',
      };

      toast.error(`❌ ${errorMap[error.code] || error.message || 'Failed to make call'}`);
      setCallStatus('idle');
      setIsRealCall(false);
    }
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(handleClose, 2000);
  };

  const formatDuration = () =>
    `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

  if (!isOpen || !user) return null;

  // ── Avatar initials ─────────────────────────────────────────
  const initials = user.name?.split(' ').map(n => n[0]).join('') || '?';

  // ── Subtitle under name ─────────────────────────────────────
  const subtitle = user.healthType === 'pcos'
    ? `PCOS • Cycle: ${user.cycleLength || '?'} days`
    : `Week ${user.pregnancyWeek || user.currentWeek || '?'} • ${user.language || 'hindi'}`;

  // ── Call tip preview ────────────────────────────────────────
  const tipPreview = user.healthType === 'pcos'
    ? 'Will play PCOS health tips based on symptoms'
    : `Will play Week ${user.pregnancyWeek || user.currentWeek || '?'} maternity tips`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-charcoal/60 hover:text-charcoal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* User info */}
        <div className="text-center mb-8">
          <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-serif shadow-lg bg-gradient-to-br ${
            user.healthType === 'pcos'
              ? 'from-purple-400 to-purple-600'
              : 'from-terracotta to-terracotta-dark'
          }`}>
            {initials}
          </div>
          <h3 className="text-2xl font-serif text-charcoal mb-1">{user.name}</h3>
          <p className="text-charcoal/60">{user.phone}</p>
          <p className="text-sm text-charcoal/50 mt-1">{subtitle}</p>

          {/* Health type pill */}
          <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${
            user.healthType === 'pcos'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-pink-100 text-pink-700'
          }`}>
            {user.healthType === 'pcos' ? '🌸 PCOS' : '🤰 Maternity'}
          </span>
        </div>

        {/* ── IDLE ── */}
        {callStatus === 'idle' && (
          <div className="space-y-4">
            <button
              onClick={handleRealCall}
              className="w-full py-4 bg-gradient-to-r from-sage to-sage-dark text-white font-semibold rounded-gentle hover:shadow-lg transition-all flex items-center justify-center gap-3"
            >
              <Phone className="w-5 h-5" />
              Make Real IVR Call (Twilio)
            </button>

            <button
              onClick={handleSimulatedCall}
              className="w-full py-3 bg-cream hover:bg-cream-dark text-charcoal font-medium rounded-gentle transition-colors flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              Simulate Call (Demo Only)
            </button>

            <div className="bg-sage/10 border border-sage/20 rounded-gentle p-3 space-y-1">
              <p className="text-xs text-center text-charcoal/70">
                ✅ {tipPreview}
              </p>
              <p className="text-xs text-center text-charcoal/70">
                Language: <strong>{user.language || 'hindi'}</strong>
              </p>
              <p className="text-xs text-center text-charcoal/50">
                Make sure Firebase Functions are deployed
              </p>
            </div>
          </div>
        )}

        {/* ── DIALING ── */}
        {callStatus === 'dialing' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-sage/20 mx-auto mb-4 flex items-center justify-center animate-pulse">
              <PhoneCall className="w-10 h-10 text-sage animate-bounce" />
            </div>
            <p className="text-xl font-medium text-charcoal mb-2">
              {isRealCall ? 'Calling via Twilio...' : 'Dialing...'}
            </p>
            <p className="text-sm text-charcoal/60">
              {isRealCall ? 'Connecting to IVR system' : 'Simulating connection'}
            </p>
            {isRealCall && (
              <p className="text-xs text-charcoal/50 mt-2">
                Check your phone for incoming call 📱
              </p>
            )}
          </div>
        )}

        {/* ── CONNECTED ── */}
        {callStatus === 'connected' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <Phone className="w-10 h-10 text-green-600" />
            </div>
            <p className="text-xl font-medium text-charcoal mb-2">Call Connected</p>
            <p className="text-3xl font-bold text-sage mb-4">{formatDuration()}</p>

            {isRealCall && callSid && (
              <div className="bg-green-50 rounded-gentle p-3 mb-4">
                <p className="text-xs text-charcoal/60 mb-1">Call SID:</p>
                <p className="text-xs font-mono text-green-700 break-all">{callSid}</p>
              </div>
            )}

            <p className="text-sm text-charcoal/60 mb-6">
              {isRealCall
                ? `📱 Playing ${user.healthType === 'pcos' ? 'PCOS' : 'maternity'} tips in ${user.language || 'hindi'}!`
                : 'Simulated conversation in progress'}
            </p>

            <button
              onClick={handleEndCall}
              className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </button>
          </div>
        )}

        {/* ── ENDED ── */}
        {callStatus === 'ended' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-charcoal/10 mx-auto mb-4 flex items-center justify-center">
              <PhoneOff className="w-10 h-10 text-charcoal/60" />
            </div>
            <p className="text-xl font-medium text-charcoal mb-2">Call Ended</p>
            <p className="text-sm text-charcoal/60">Duration: {formatDuration()}</p>
            {isRealCall && (
              <p className="text-xs text-green-600 mt-2">✅ Call logged in Firestore</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
