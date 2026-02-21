// src/pages/PatientPortal.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, Phone, Bell, Activity, ArrowLeft } from 'lucide-react';

export default function PatientPortal() {
  const navigate = useNavigate();
  
  // Mock patient data (in real app, this comes from backend)
  const patient = {
    name: 'Simran Kaur',
    phone: '+919876543210',
    currentWeek: 24,
    nextCheckup: '2026-02-20',
    language: 'hindi',
    vitals: {
      bp: '120/80',
      hemoglobin: 11.5,
      weight: 62
    }
  };

  const tips = [
    {
      icon: '🥛',
      title: 'Take Iron Tablet',
      description: 'Take your iron tablet after breakfast with orange juice'
    },
    {
      icon: '🚶‍♀️',
      title: 'Light Exercise',
      description: 'Walk for 20 minutes in the morning'
    },
    {
      icon: '💧',
      title: 'Stay Hydrated',
      description: 'Drink at least 8 glasses of water today'
    }
  ];

  const getDaysUntilCheckup = () => {
    const today = new Date();
    const checkupDate = new Date(patient.nextCheckup);
    const diffTime = checkupDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-sage/5">
      {/* Header */}
      <header className="bg-white border-b border-cream-dark px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-charcoal hover:text-sage transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-terracotta" fill="currentColor" strokeWidth={0} />
            <span className="text-xl font-serif text-terracotta">Maternal Care</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Welcome Card */}
        <div className="card bg-gradient-to-r from-sage to-sage-dark text-white mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl">👶</span>
            </div>
            <div>
              <h1 className="text-3xl font-serif mb-1">Welcome, {patient.name}!</h1>
              <p className="text-white/90">You are in Week {patient.currentWeek}</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-gentle p-4">
            <p className="text-sm text-white/80 mb-2">Your baby is now the size of:</p>
            <p className="text-2xl font-serif">🌽 Corn (30cm)</p>
          </div>
        </div>

        {/* Next Checkup Card */}
        <div className="card border-l-4 border-terracotta mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-terracotta" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-serif text-charcoal mb-1">Next Checkup</h3>
              <p className="text-2xl font-semibold text-terracotta mb-2">
                {new Date(patient.nextCheckup).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-charcoal/60">
                {getDaysUntilCheckup()} days remaining
              </p>
            </div>
          </div>
        </div>

        {/* Current Vitals */}
        <div className="card mb-6">
          <h3 className="text-xl font-serif text-charcoal mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-sage" />
            Your Current Vitals
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-cream-dark rounded-gentle">
              <p className="text-sm text-charcoal/60 mb-1">Blood Pressure</p>
              <p className="text-2xl font-semibold text-charcoal">{patient.vitals.bp}</p>
            </div>
            <div className="text-center p-4 bg-cream-dark rounded-gentle">
              <p className="text-sm text-charcoal/60 mb-1">Hemoglobin</p>
              <p className="text-2xl font-semibold text-charcoal">{patient.vitals.hemoglobin}</p>
            </div>
            <div className="text-center p-4 bg-cream-dark rounded-gentle">
              <p className="text-sm text-charcoal/60 mb-1">Weight (kg)</p>
              <p className="text-2xl font-semibold text-charcoal">{patient.vitals.weight}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-gentle">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <span className="text-xl">✅</span>
              All vitals are within normal range
            </p>
          </div>
        </div>

        {/* Today's Tips */}
        <div className="card mb-6">
          <h3 className="text-xl font-serif text-charcoal mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-sage" />
            Today's Health Tips
          </h3>
          <div className="space-y-3">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-cream-dark rounded-gentle hover:bg-cream transition-colors">
                <span className="text-3xl">{tip.icon}</span>
                <div>
                  <p className="font-semibold text-charcoal">{tip.title}</p>
                  <p className="text-sm text-charcoal/70">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-serif text-charcoal mb-2">Need Help?</h3>
              <p className="text-sm text-charcoal/70 mb-4">
                If you experience any of these symptoms, call immediately:
              </p>
              <ul className="text-sm text-charcoal/70 mb-4 space-y-1">
                <li>• Severe headache or blurred vision</li>
                <li>• Heavy bleeding or fluid leakage</li>
                <li>• Severe abdominal pain</li>
                <li>• Reduced baby movement</li>
              </ul>
              <a 
                href="tel:1800-123-4567"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-soft transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Emergency: 1800-123-4567
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-charcoal/60">
          <p>You will receive weekly health tips via voice calls in {patient.language === 'hindi' ? 'Hindi' : patient.language === 'punjabi' ? 'Punjabi' : 'English'}</p>
          <p className="mt-2">Registered Number: {patient.phone}</p>
        </div>
      </div>
    </div>
  );
}
