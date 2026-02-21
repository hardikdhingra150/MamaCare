// src/components/userdashboard/VitalsChart.jsx
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
  } from 'recharts';
  
  const CustomTooltip = ({ active, payload, label, unit }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-800">
          {payload[0].value} <span className="text-gray-400 font-normal">{unit}</span>
        </p>
      </div>
    );
  };
  
  export function BPChart({ checkups }) {
    const data = checkups
      .filter(c => c.bp)
      .slice(0, 10)
      .reverse()
      .map(c => ({
        date: c.date?.split(' ').slice(0,2).join(' ') || c.date,
        sys:  parseInt(c.bp?.split('/')[0]) || null,
        dia:  parseInt(c.bp?.split('/')[1]) || null,
      }))
      .filter(d => d.sys);
  
    if (data.length < 2) return (
      <div className="h-32 flex items-center justify-center text-sm text-gray-400">
        Log at least 2 vitals to see your BP trend 📈
      </div>
    );
  
    return (
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis domain={[60, 180]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip unit="mmHg" />} />
          {/* Normal range band */}
          <ReferenceLine y={140} stroke="#fca5a5" strokeDasharray="4 4"
            label={{ value: 'High', position: 'right', fontSize: 9, fill: '#ef4444' }} />
          <ReferenceLine y={90} stroke="#86efac" strokeDasharray="4 4"
            label={{ value: 'Low', position: 'right', fontSize: 9, fill: '#22c55e' }} />
          <Line type="monotone" dataKey="sys" stroke="#f472b6" strokeWidth={2.5}
            dot={{ fill: '#f472b6', r: 4 }} name="Systolic" />
          <Line type="monotone" dataKey="dia" stroke="#c084fc" strokeWidth={2}
            dot={{ fill: '#c084fc', r: 3 }} strokeDasharray="4 4" name="Diastolic" />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  
  export function HbChart({ checkups }) {
    const data = checkups
      .filter(c => c.hemoglobin)
      .slice(0, 10)
      .reverse()
      .map(c => ({
        date: c.date?.split(' ').slice(0,2).join(' ') || c.date,
        hb:   parseFloat(c.hemoglobin),
      }));
  
    if (data.length < 2) return (
      <div className="h-32 flex items-center justify-center text-sm text-gray-400">
        Log at least 2 vitals to see your Hemoglobin trend 📈
      </div>
    );
  
    return (
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="hbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis domain={[5, 18]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip unit="g/dL" />} />
          <ReferenceLine y={11} stroke="#86efac" strokeDasharray="4 4"
            label={{ value: 'Normal', position: 'right', fontSize: 9, fill: '#22c55e' }} />
          <ReferenceLine y={8} stroke="#fca5a5" strokeDasharray="4 4"
            label={{ value: 'Low', position: 'right', fontSize: 9, fill: '#ef4444' }} />
          <Area type="monotone" dataKey="hb" stroke="#a855f7" strokeWidth={2.5}
            fill="url(#hbGrad)" dot={{ fill: '#a855f7', r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  
  export function PainChart({ logs }) {
    const data = logs
      .filter(l => l.painLevel && l.type === 'period_start')
      .slice(0, 8)
      .reverse()
      .map(l => ({
        date:  new Date(l.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
        pain:  l.painLevel,
      }));
  
    if (data.length < 2) return (
      <div className="h-32 flex items-center justify-center text-sm text-gray-400">
        Log at least 2 periods to see your pain trend 📈
      </div>
    );
  
    return (
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f472b6" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip unit="/10" />} />
          <ReferenceLine y={7} stroke="#fca5a5" strokeDasharray="4 4"
            label={{ value: 'Severe', position: 'right', fontSize: 9, fill: '#ef4444' }} />
          <Area type="monotone" dataKey="pain" stroke="#f472b6" strokeWidth={2.5}
            fill="url(#painGrad)" dot={{ fill: '#f472b6', r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  