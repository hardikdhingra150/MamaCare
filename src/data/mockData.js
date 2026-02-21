
export const mockPatients = [
    {
      id: '1',
      name: 'Simran Kaur',
      phone: '+919876543210',
      age: 26,
      currentWeek: 24,
      riskScore: 'HIGH',
      nextCheckup: '2026-02-20',
      lastVisit: '3 days ago',
      location: 'Village Khedi, Gurugram',
      emergencyContact: '+919123456789',
      vitals: {
        bp: '145/95',
        hemoglobin: 9.2,
        weight: 62
      },
      language: 'hindi',
      lmp: '2025-08-15'
    },
    {
      id: '2',
      name: 'Priya Sharma',
      phone: '+919123456789',
      age: 23,
      currentWeek: 16,
      riskScore: 'LOW',
      nextCheckup: '2026-02-25',
      lastVisit: '1 week ago',
      location: 'Bilaspur, Gurugram',
      emergencyContact: '+919988776655',
      vitals: {
        bp: '118/76',
        hemoglobin: 12.1,
        weight: 58
      },
      language: 'hindi',
      lmp: '2025-10-12'
    },
    {
      id: '3',
      name: 'Anita Devi',
      phone: '+919988776655',
      age: 32,
      currentWeek: 32,
      riskScore: 'MODERATE',
      nextCheckup: '2026-02-18',
      lastVisit: 'Today',
      location: 'Sohna Road, Gurugram',
      emergencyContact: '+919876543210',
      vitals: {
        bp: '132/84',
        hemoglobin: 10.8,
        weight: 65
      },
      language: 'punjabi',
      lmp: '2025-06-20'
    }
  ];
  
  export const mockCheckups = [
    {
      id: '1',
      patientId: '1',
      date: '2026-02-13',
      weight: 62,
      bp: '145/95',
      hemoglobin: 9.2,
      remarks: 'High BP detected, referred to PHC'
    },
    {
      id: '2',
      patientId: '1',
      date: '2026-01-15',
      weight: 60,
      bp: '138/88',
      hemoglobin: 9.5,
      remarks: 'BP slightly elevated, monitoring needed'
    }
  ];
  