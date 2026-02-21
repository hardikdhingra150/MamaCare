// src/services/firebaseService.js
import {
  collection, doc, getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
  limit, onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── USERS ───────────────────────────────────────────────────

export const getAllUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // ✅ Convert Firestore timestamps to readable strings
      createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString('en-IN') || null,
    }));
    return { success: true, data };
  } catch (error) {
    console.error('getAllUsers error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const getUserById = async (userId) => {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return { success: true, data: { id: snap.id, ...snap.data() } };
    }
    return { success: false, error: 'User not found', data: null };
  } catch (error) {
    console.error('getUserById error:', error);
    return { success: false, error: error.message, data: null };
  }
};

export const addUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      isActive:  true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('addUser error:', error);
    return { success: false, error: error.message };
  }
};

export const updateUser = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('updateUser error:', error);
    return { success: false, error: error.message };
  }
};

export const deleteUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      isActive:  false,
      deletedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('deleteUser error:', error);
    return { success: false, error: error.message };
  }
};

export const getUsersByType = async (healthType) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('healthType', '==', healthType),
      where('isActive',   '==', true)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    console.error('getUsersByType error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const getHighRiskUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('riskScore', '==', 'HIGH'),
      where('isActive',  '==', true)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    console.error('getHighRiskUsers error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// ✅ NEW — Real-time listener for dashboard live updates
export const subscribeToUsers = (callback) => {
  const q = query(
    collection(db, 'users'),
    where('isActive', '==', true)
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString('en-IN') || null,
    }));
    callback(data);
  }, (error) => {
    console.error('subscribeToUsers error:', error);
    callback([]);
  });
};

// ─── CHECKUPS ─────────────────────────────────────────────────

export const getCheckups = async (userId) => {
  try {
    const q = query(
      collection(db, 'checkups'),
      where('userId',    '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // ✅ Convert timestamp → readable date string
      date: doc.data().createdAt?.toDate?.()?.toLocaleDateString('en-IN') ||
            doc.data().date || 'N/A',
    }));
    return { success: true, data };
  } catch (error) {
    console.error('getCheckups error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const addCheckup = async (checkupData) => {
  try {
    const docRef = await addDoc(collection(db, 'checkups'), {
      ...checkupData,
      createdAt: serverTimestamp(),
    });

    // ✅ Also update user's lastVisit + riskScore after checkup
    if (checkupData.userId) {
      const riskScore = calculateRiskFromCheckup(checkupData);
      await updateDoc(doc(db, 'users', checkupData.userId), {
        lastVisit:  new Date().toLocaleDateString('en-IN'),
        riskScore,
        vitals: {
          bp:          checkupData.bp          || null,
          hemoglobin:  checkupData.hemoglobin  || null,
          weight:      checkupData.weight      || null,
        },
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('addCheckup error:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Auto risk scoring after checkup (no ML call needed for basic cases)
const calculateRiskFromCheckup = (checkup) => {
  const systolic   = parseInt(checkup.bp?.split('/')[0]) || 0;
  const hemoglobin = parseFloat(checkup.hemoglobin)      || 0;

  if (systolic > 140 || hemoglobin < 8)  return 'HIGH';
  if (systolic > 130 || hemoglobin < 10) return 'MODERATE';
  return 'LOW';
};

// ─── CALL LOGS ────────────────────────────────────────────────

export const getCallLogs = async (userId) => {
  try {
    const q = query(
      collection(db, 'callLogs'),
      where('userId',    '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    console.error('getCallLogs error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const getAllCallLogs = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'callLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    console.error('getAllCallLogs error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// ✅ NEW — Save a call log when admin clicks "Call Now"
export const saveCallLog = async (userId, userPhone, healthType, triggeredBy = 'admin') => {
  try {
    const docRef = await addDoc(collection(db, 'callLogs'), {
      userId,
      phone:       userPhone,
      healthType,
      triggeredBy,           // 'admin' | 'auto_risk' | 'scheduled'
      status:      'initiated',
      duration:    0,
      timestamp:   serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('saveCallLog error:', error);
    return { success: false, error: error.message };
  }
};

// ─── WHATSAPP CONVERSATIONS ───────────────────────────────────

export const getWhatsAppMessages = async (userId) => {
  try {
    const q = query(
      collection(db, 'whatsapp_conversations'),
      where('userId',    '==', userId),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data };
  } catch (error) {
    console.error('getWhatsAppMessages error:', error);
    return { success: false, error: error.message, data: [] };
  }
};

// ✅ NEW — Real-time WhatsApp listener (live chat updates)
export const subscribeToWhatsApp = (userId, callback) => {
  const q = query(
    collection(db, 'whatsapp_conversations'),
    where('userId',    '==', userId),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

// ─── ML PREDICTIONS ───────────────────────────────────────────

export const getMLPrediction = async (userId) => {
  try {
    const q = query(
      collection(db, 'ml_predictions'),
      where('userId',    '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      return {
        success: true,
        data: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() },
      };
    }
    return { success: true, data: null };
  } catch (error) {
    console.error('getMLPrediction error:', error);
    return { success: false, error: error.message, data: null };
  }
};

export const saveMLPrediction = async (predictionData) => {
  try {
    const docRef = await addDoc(collection(db, 'ml_predictions'), {
      ...predictionData,
      createdAt: serverTimestamp(),
    });

    // ✅ Also update riskScore on the user doc after ML runs
    if (predictionData.userId && predictionData.result?.riskLevel) {
      const mlRisk = predictionData.result.riskLevel;
      const riskScore =
        mlRisk === 'high risk' ? 'HIGH' :
        mlRisk === 'mid risk'  ? 'MODERATE' : 'LOW';

      await updateDoc(doc(db, 'users', predictionData.userId), {
        riskScore,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('saveMLPrediction error:', error);
    return { success: false, error: error.message };
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────

// ✅ NEW — Get overview stats in one call
export const getDashboardStats = async () => {
  try {
    const [usersSnap, checkupsSnap, callsSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'),    where('isActive', '==', true))),
      getDocs(collection(db, 'checkups')),
      getDocs(collection(db, 'callLogs')),
    ]);

    const users = usersSnap.docs.map(d => d.data());

    return {
      success: true,
      data: {
        totalUsers:      users.length,
        maternityCount:  users.filter(u => u.healthType === 'maternity').length,
        pcosCount:       users.filter(u => u.healthType === 'pcos').length,
        highRiskCount:   users.filter(u => u.riskScore  === 'HIGH').length,
        totalCheckups:   checkupsSnap.size,
        totalCalls:      callsSnap.size,
      },
    };
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return { success: false, error: error.message, data: {} };
  }
};
