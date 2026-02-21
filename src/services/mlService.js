import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MATERNAL_URL = 'https://us-central1-maternity-76579.cloudfunctions.net/predictMaternalRisk';
const PCOS_URL     = 'https://us-central1-maternity-76579.cloudfunctions.net/predictPCOS';

export const predictMaternalRisk = async (formData) => {
  try {
    const response = await fetch(MATERNAL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        age:         Number(formData.age),
        systolicBP:  Number(formData.systolicBP),
        diastolicBP: Number(formData.diastolicBP),
        bloodSugar:  Number(formData.bloodSugar),
        bodyTemp:    Number(formData.bodyTemp),
        heartRate:   Number(formData.heartRate),
      }),
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('Maternal prediction error:', err);
    return { success: false, error: err.message };
  }
};

export const predictPCOS = async (formData) => {
  try {
    const response = await fetch(PCOS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Age:             Number(formData.age),
        BMI:             Number(formData.bmi),
        Cycle_Length:    Number(formData.cycleLength),
        LH:              Number(formData.lh),
        FSH:             Number(formData.fsh),
        Testosterone:    Number(formData.testosterone),
        Waist_Hip_Ratio: Number(formData.waistHipRatio),
        Insulin:         Number(formData.insulin),
        LH_FSH_Ratio:    Number(formData.lh) / Number(formData.fsh),
      }),
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('PCOS prediction error:', err);
    return { success: false, error: err.message };
  }
};

// ✅ NEW: Save ML prediction result to Firestore
export const saveMLPrediction = async (patientId, type, inputData, result) => {
  try {
    await addDoc(collection(db, 'ml_predictions'), {
      patientId,
      type,           // 'maternal' or 'pcos'
      inputData,
      result,
      timestamp: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error('Save prediction error:', err);
    return { success: false, error: err.message };
  }
};
