// src/components/userdashboard/DueDateCountdown.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MILESTONES = [
  { week: 12, label: 'End of 1st Trimester 🎉',    emoji: '🌱' },
  { week: 20, label: 'Halfway there! 🌟',           emoji: '⭐' },
  { week: 24, label: 'Viability milestone 💪',      emoji: '💪' },
  { week: 28, label: 'End of 2nd Trimester 🎊',     emoji: '🎊' },
  { week: 36, label: 'Baby is full term soon! 👶',  emoji: '👶' },
  { week: 40, label: 'Due date! 🎉',                emoji: '🎉' },
];

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs text-white/70 mt-1 font-medium">{label}</span>
    </div>
  );
}

export default function DueDateCountdown({ pregnancyWeek, lmp }) {
  const [timeLeft, setTimeLeft] = useState(null);

  // Calculate due date from LMP or pregnancy week
  const getDueDate = () => {
    if (lmp) {
      const d = new Date(lmp);
      d.setDate(d.getDate() + 280); // 40 weeks
      return d;
    }
    if (pregnancyWeek) {
      const d = new Date();
      d.setDate(d.getDate() + (40 - pregnancyWeek) * 7);
      return d;
    }
    return null;
  };

  useEffect(() => {
    const dueDate = getDueDate();
    if (!dueDate) return;

    const calc = () => {
      const now  = new Date();
      const diff = dueDate - now;
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0 }); return; }

      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
      });
    };

    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [pregnancyWeek, lmp]);

  const dueDate      = getDueDate();
  const weeksLeft    = 40 - (pregnancyWeek || 0);
  const progress     = Math.min(((pregnancyWeek || 0) / 40) * 100, 100);

  // Next milestone
  const nextMilestone = MILESTONES.find(m => m.week > (pregnancyWeek || 0));
  const weeksToMilestone = nextMilestone
    ? nextMilestone.week - (pregnancyWeek || 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 p-6 shadow-xl"
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
      <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/10 rounded-full" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">
              Due Date Countdown
            </p>
            <p className="text-white font-bold text-lg mt-0.5">
              {dueDate?.toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              }) || 'Set your LMP date'}
            </p>
          </div>
          <div className="text-4xl">👶</div>
        </div>

        {/* Countdown units */}
        {timeLeft && (
          <div className="flex items-center gap-3 mb-5">
            <CountdownUnit value={timeLeft.days}    label="Days"    />
            <span className="text-white/50 text-2xl font-bold mb-4">:</span>
            <CountdownUnit value={timeLeft.hours}   label="Hours"   />
            <span className="text-white/50 text-2xl font-bold mb-4">:</span>
            <CountdownUnit value={timeLeft.minutes} label="Minutes" />

            <div className="ml-auto text-center">
              <p className="text-3xl font-bold text-white">{weeksLeft}</p>
              <p className="text-xs text-white/70">weeks left</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/70 mb-1.5">
            <span>Week 1</span>
            <span className="font-bold text-white">Week {pregnancyWeek || 0}</span>
            <span>Week 40</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white rounded-full"
            />
          </div>
          <p className="text-center text-xs text-white/70 mt-1">
            {Math.round(progress)}% of your journey complete
          </p>
        </div>

        {/* Next milestone */}
        {nextMilestone && (
          <div className="bg-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">{nextMilestone.emoji}</span>
            <div>
              <p className="text-white text-xs font-bold">{nextMilestone.label}</p>
              <p className="text-white/70 text-xs mt-0.5">
                In {weeksToMilestone} week{weeksToMilestone !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
