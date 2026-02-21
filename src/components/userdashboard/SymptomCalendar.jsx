// src/components/userdashboard/SymptomCalendar.jsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

export default function SymptomCalendar({ logs }) {
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const prevMonth = () => setView(v => {
    const d = new Date(v.year, v.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setView(v => {
    const d = new Date(v.year, v.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const firstDay    = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  // Build day → log map
  const dayMap = {};
  logs.forEach(log => {
    if (!log.date) return;
    const d = new Date(log.date);
    if (d.getFullYear() === view.year && d.getMonth() === view.month) {
      const key = d.getDate();
      if (!dayMap[key]) dayMap[key] = [];
      dayMap[key].push(log);
    }
  });

  const getDayStyle = (day) => {
    const entries = dayMap[day];
    if (!entries?.length) return null;
    const hasPeriodStart = entries.some(e => e.type === 'period_start');
    const hasPeriodEnd   = entries.some(e => e.type === 'period_end');
    const hasSymptom     = entries.some(e => e.type === 'symptom_log');
    const highPain       = entries.some(e => e.painLevel >= 8);

    if (highPain)       return 'bg-red-500 text-white';
    if (hasPeriodStart) return 'bg-pink-500 text-white';
    if (hasPeriodEnd)   return 'bg-pink-200 text-pink-800';
    if (hasSymptom)     return 'bg-purple-200 text-purple-800';
    return null;
  };

  const isToday = (day) =>
    today.getDate() === day &&
    today.getMonth() === view.month &&
    today.getFullYear() === view.year;

  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h3 className="font-bold text-gray-800">
          {MONTHS[view.month]} {view.year}
        </h3>
        <button onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const style = day ? getDayStyle(day) : null;
          return (
            <div key={i} className="aspect-square flex items-center justify-center">
              {day && (
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all cursor-default
                  ${style || (isToday(day) ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400' : 'text-gray-700 hover:bg-gray-100')}
                `}>
                  {day}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
        {[
          { color: 'bg-pink-500',   label: 'Period start' },
          { color: 'bg-pink-200',   label: 'Period end'   },
          { color: 'bg-purple-200', label: 'Symptoms'     },
          { color: 'bg-red-500',    label: 'High pain'    },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
