const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Schedule automatic calls - Runs 3 times per week
// Monday, Wednesday, Friday at 10:00 AM IST
exports.scheduleWeeklyCalls = functions.pubsub
  .schedule("0 10 * * 1,3,5") // Cron: 10 AM on Mon, Wed, Fri
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    console.log("🔔 Running scheduled call automation...");

    try {
      const db = admin.firestore();
      
      // Get all active patients
      const patientsSnapshot = await db
        .collection("patients")
        .where("status", "==", "active")
        .get();

      const callPromises = [];

      for (const doc of patientsSnapshot.docs) {
        const patient = doc.data();
        const patientId = doc.id;

        // Calculate pregnancy week
        const pregnancyWeek = calculatePregnancyWeek(patient.lmpDate);

        // Check if patient needs a call today
        const lastCallRef = await db
          .collection("call_logs")
          .where("patientId", "==", patientId)
          .orderBy("timestamp", "desc")
          .limit(1)
          .get();

        let shouldCall = true;
        if (!lastCallRef.empty) {
          const lastCall = lastCallRef.docs[0].data();
          const daysSinceLastCall = Math.floor(
            (Date.now() - lastCall.timestamp.toMillis()) / (1000 * 60 * 60 * 24)
          );
          
          // Don't call if called in last 2 days
          if (daysSinceLastCall < 2) {
            shouldCall = false;
          }
        }

        if (shouldCall) {
          console.log(`📞 Scheduling call for ${patient.name} (Week ${pregnancyWeek})`);
          
          // Trigger AI call
          callPromises.push(
            makeAIConversationalCall({
              patientId,
              patientName: patient.name,
              phone: patient.phone,
              pregnancyWeek,
              language: patient.preferredLanguage || "hindi"
            })
          );
        }
      }

      await Promise.all(callPromises);
      console.log(`✅ Scheduled ${callPromises.length} calls`);

    } catch (error) {
      console.error("❌ Scheduler error:", error);
    }
  });

// Schedule WhatsApp messages - Daily at 9:00 AM IST
exports.scheduleWhatsAppReminders = functions.pubsub
  .schedule("0 9 * * *") // Daily at 9 AM
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    console.log("📱 Running WhatsApp message automation...");

    try {
      const db = admin.firestore();
      const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.

      // Send messages on Mon(1), Wed(3), Fri(5)
      if (![1, 3, 5].includes(today)) {
        console.log("⏭️ Not a message day, skipping...");
        return;
      }

      const patientsSnapshot = await db
        .collection("patients")
        .where("status", "==", "active")
        .get();

      const messagePromises = [];

      for (const doc of patientsSnapshot.docs) {
        const patient = doc.data();
        const pregnancyWeek = calculatePregnancyWeek(patient.lmpDate);

        messagePromises.push(
          sendScheduledWhatsAppMessage({
            patientName: patient.name,
            phone: patient.phone,
            pregnancyWeek,
            language: patient.preferredLanguage || "hindi"
          })
        );
      }

      await Promise.all(messagePromises);
      console.log(`✅ Sent ${messagePromises.length} WhatsApp messages`);

    } catch (error) {
      console.error("❌ WhatsApp scheduler error:", error);
    }
  });

function calculatePregnancyWeek(lmpDate) {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffTime = Math.abs(today - lmp);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

async function makeAIConversationalCall(data) {
  // Call the AI voice function
  const makeCallFunction = require("./aiVoiceCall").makeAICall;
  return await makeCallFunction(data);
}

async function sendScheduledWhatsAppMessage(data) {
  // Call WhatsApp function
  const sendMessageFunction = require("./whatsappScheduler").sendMessage;
  return await sendMessageFunction(data);
}
