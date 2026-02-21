// functions/index.js
const { onDocumentCreated }             = require("firebase-functions/v2/firestore");
const { onSchedule }                    = require("firebase-functions/v2/scheduler");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions }              = require("firebase-functions/v2");
const { defineSecret }                  = require("firebase-functions/params"); // ✅ NEW
const admin                             = require("firebase-admin");
const twilio                            = require("twilio");
const { GoogleGenerativeAI }            = require("@google/generative-ai");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// ✅ Secrets — replaces process.env for deployed functions
const TWILIO_SID    = defineSecret("TWILIO_SID");
const TWILIO_TOKEN  = defineSecret("TWILIO_TOKEN");
const TWILIO_NUMBER = defineSecret("TWILIO_NUMBER");
const GEMINI_KEY    = defineSecret("GEMINI_KEY");

// ── Helpers ──────────────────────────────────────────────────
function getTwilioClient() {
  if (!TWILIO_SID.value() || !TWILIO_TOKEN.value())
    throw new Error(`Twilio not configured. SID:${TWILIO_SID.value() ? "✅" : "❌"} TOKEN:${TWILIO_TOKEN.value() ? "✅" : "❌"}`);
  return twilio(TWILIO_SID.value(), TWILIO_TOKEN.value());
}

function formatPhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return raw;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

function calculatePregnancyWeek(lmpDate) {
  const diffDays = Math.ceil((new Date() - new Date(lmpDate)) / 86400000);
  return Math.floor(diffDays / 7);
}

async function getGeminiResponse(prompt) {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY.value()); // ✅ .value()
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: { maxOutputTokens: 300, temperature: 0.4 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ── All secrets list (reused across functions) ───────────────
const ALL_SECRETS = [TWILIO_SID, TWILIO_TOKEN, TWILIO_NUMBER, GEMINI_KEY];
const TWILIO_SECRETS = [TWILIO_SID, TWILIO_TOKEN, TWILIO_NUMBER];


// ─────────────────────────────────────────────────────────────
// ✅ ON CHECKUP CREATED
// ─────────────────────────────────────────────────────────────
exports.onCheckupCreated = onDocumentCreated(
  { document: "checkups/{docId}", secrets: TWILIO_SECRETS },
  async (event) => {
    const snap = event.data;
    const data = snap.data();
    const db   = admin.firestore();
    const twilioClient = getTwilioClient();

    const recentSnap = await db.collection("checkups")
      .where("userId", "==", data.userId)
      .orderBy("createdAt", "desc")
      .limit(3).get();

    const recent    = recentSnap.docs.map(d => d.data());
    const highCount = recent.filter(c => c.riskScore === "HIGH").length;
    const modCount  = recent.filter(c => c.riskScore === "MODERATE").length;

    const overall =
      highCount >= 2 ? "HIGH"     :
      highCount >= 1 ? "MODERATE" :
      modCount  >= 2 ? "MODERATE" : "LOW";

    await db.collection("users").doc(data.userId).update({
      riskScore: overall,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (data.riskScore !== "HIGH") return null;

    const userDoc = await db.collection("users").doc(data.userId).get();
    const user    = userDoc.data();
    if (!user?.phone) return null;

    const phone = formatPhone(user.phone);
    if (!phone) return null;

    const patientMsg =
      `🚨 *MamaCare Alert* — High Risk Detected\n\n` +
      `Hi ${user.name}, your latest vitals show high risk indicators.\n\n` +
      `BP: ${data.bp || "—"} | Hb: ${data.hemoglobin || "—"} g/dL\n\n` +
      (user.language === "hindi"
        ? `⚠️ Kripya turant apne nazdeeki health center jayen.\nYa 102 par call karein.`
        : `⚠️ Please visit your nearest health center immediately.\nOr call 102.`);

    try {
      await twilioClient.messages.create({
        from: "whatsapp:+14155238886",
        to:   `whatsapp:${phone}`,
        body: patientMsg,
      });
    } catch (e) {
      console.error("❌ WhatsApp alert failed:", e.message);
    }

    if (data.healthType === "maternity" && user.emergencyContact) {
      const ePhone = formatPhone(user.emergencyContact);
      if (ePhone) {
        try {
          await twilioClient.messages.create({
            from: "whatsapp:+14155238886",
            to:   `whatsapp:${ePhone}`,
            body:
              `🚨 *MamaCare Emergency Alert*\n\n` +
              `${user.name} has been flagged as HIGH RISK.\n` +
              `Please check on her and help her reach a clinic immediately.`,
          });
        } catch (e) {
          console.error("❌ Emergency contact alert failed:", e.message);
        }
      }
    }

    await db.collection("whatsapp_logs").add({
      userId:      data.userId,
      patientName: user.name,
      phone,
      message:     patientMsg,
      direction:   "outbound",
      type:        "risk_alert_maternity",
      riskScore:   "HIGH",
      timestamp:   admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ ON CYCLE LOG CREATED
// ─────────────────────────────────────────────────────────────
exports.onCycleLogCreated = onDocumentCreated(
  { document: "cycle_logs/{docId}", secrets: TWILIO_SECRETS },
  async (event) => {
    const snap = event.data;
    const data = snap.data();
    if (data.painLevel < 8 && data.riskScore !== "HIGH") return null;

    const db = admin.firestore();
    const twilioClient = getTwilioClient();

    const userDoc = await db.collection("users").doc(data.userId).get();
    const user    = userDoc.data();
    if (!user?.phone) return null;

    const phone = formatPhone(user.phone);
    if (!phone) return null;

    const msg =
      `💜 *MamaCare* — High Pain Alert\n\n` +
      `Hi ${user.name}, you logged a pain level of ${data.painLevel}/10.\n\n` +
      (user.language === "hindi"
        ? `🧘 Heating pad, halki stretching ya rest karein.\n📞 Agar dard zyada ho toh doctor se milein.`
        : `🧘 Try a heating pad, light stretching, or rest.\n📞 If pain is unbearable, contact your doctor.`);

    try {
      await twilioClient.messages.create({
        from: "whatsapp:+14155238886",
        to:   "whatsapp:" + phone,
        body: msg,
      });
    } catch (e) {
      console.error("❌ PCOS alert failed:", e.message);
    }

    await db.collection("whatsapp_logs").add({
      userId:      data.userId,
      patientName: user.name,
      phone,
      message:     msg,
      direction:   "outbound",
      type:        "risk_alert_pcos",
      painLevel:   data.painLevel,
      timestamp:   admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ DAILY CHECKUP REMINDER
// ─────────────────────────────────────────────────────────────
exports.dailyCheckupReminder = onSchedule(
  { schedule: "30 3 * * *", timeZone: "Asia/Kolkata", secrets: TWILIO_SECRETS },
  async () => {
    const db  = admin.firestore();
    const twilioClient = getTwilioClient();
    const today = new Date().toISOString().split("T")[0];

    const snap = await db.collection("users")
      .where("healthType", "==", "maternity")
      .where("isActive",   "==", true)
      .get();

    const promises = snap.docs.map(async (doc) => {
      const user = doc.data();
      if (!user.nextCheckup || !user.phone) return;

      const checkupDate = new Date(user.nextCheckup).toISOString().split("T")[0];
      if (checkupDate !== today) return;

      const phone = formatPhone(user.phone);
      if (!phone) return;

      const msg =
        `🏥 *MamaCare Reminder*\n\n` +
        `Hi ${user.name}! You have a checkup scheduled today.\n\n` +
        (user.language === "hindi"
          ? `✅ Apni vitals log karna na bhulen. Apna dhyan rakhiye! 💕`
          : `✅ Don't forget to log your vitals after your visit. Stay safe! 💕`);

      try {
        await twilioClient.messages.create({
          from: "whatsapp:+14155238886",
          to:   `whatsapp:${phone}`,
          body: msg,
        });
        await db.collection("whatsapp_logs").add({
          userId:      doc.id,
          patientName: user.name,
          phone,
          message:     msg,
          direction:   "outbound",
          type:        "checkup_reminder",
          timestamp:   admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error("❌ Reminder failed for", user.name, ":", e.message);
      }
    });

    await Promise.allSettled(promises);
    console.log("✅ Checkup reminders sent for", today);
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ MAKE HEALTH TIP CALL
// ─────────────────────────────────────────────────────────────
exports.makeHealthTipCall = onCall(
  { secrets: ALL_SECRETS },
  async (request) => {
    const { patientId, patientName, phone: rawPhone, week, language } = request.data;

    if (!rawPhone)
      throw new HttpsError("invalid-argument", "Phone number is required");
    if (!TWILIO_SID.value() || !TWILIO_TOKEN.value() || !TWILIO_NUMBER.value())
      throw new HttpsError("failed-precondition", "Twilio not configured");

    const phone = formatPhone(rawPhone);
    if (!phone)
      throw new HttpsError("invalid-argument", "Invalid phone number format");

    try {
      const twilioClient = getTwilioClient();
      const call = await twilioClient.calls.create({
        url:  `https://us-central1-maternity-76579.cloudfunctions.net/aiConversationalIVR` +
              `?week=${week || 0}&lang=${language || "hindi"}&name=${encodeURIComponent(patientName || "Patient")}`,
        to:   phone,
        from: TWILIO_NUMBER.value(), // ✅ .value()
        statusCallback:
          `https://us-central1-maternity-76579.cloudfunctions.net/callStatusCallback` +
          `?patientId=${patientId || "unknown"}`,
        statusCallbackEvent: ["completed"],
        record:  true,
        timeout: 60,
      });

      await admin.firestore().collection("call_logs").add({
        userId:        patientId  || null,
        callSid:       call.sid,
        patientName:   patientName || "Unknown",
        phone,
        pregnancyWeek: week     || 0,
        language:      language || "hindi",
        timestamp:     admin.firestore.FieldValue.serverTimestamp(),
        status:        "initiated",
        type:          "user_requested",
      });

      console.log(`✅ Call initiated to ${phone} | SID: ${call.sid}`);
      return { success: true, callSid: call.sid };

    } catch (error) {
      console.error("❌ makeHealthTipCall error:", error.message, "| Code:", error.code);
      if (error.code === 21216)
        throw new HttpsError("permission-denied", "Number not verified on Twilio trial. Add it at console.twilio.com → Verified Caller IDs.");
      if (error.code === 20003)
        throw new HttpsError("unauthenticated", "Twilio auth failed. Check TWILIO_SID and TWILIO_TOKEN.");
      if (error.code === 21606)
        throw new HttpsError("invalid-argument", "Invalid 'To' number. Ensure phone is in +91XXXXXXXXXX format.");
      throw new HttpsError("internal", error.message);
    }
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ CALL STATUS CALLBACK
// ─────────────────────────────────────────────────────────────
exports.callStatusCallback = onRequest(async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  try {
    const snap = await admin.firestore().collection("call_logs")
      .where("callSid", "==", CallSid).limit(1).get();
    if (!snap.empty) {
      await snap.docs[0].ref.update({
        status:      CallStatus,
        duration:    parseInt(CallDuration) || 0,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ callStatusCallback error:", error.message);
    res.status(500).send("Error");
  }
});


// ─────────────────────────────────────────────────────────────
// ✅ WHATSAPP BOT
// ─────────────────────────────────────────────────────────────
exports.whatsappBot = onRequest(
  { timeoutSeconds: 60, memory: "512MiB", secrets: ALL_SECRETS },
  async (req, res) => {
    try {
      const { Body, From, ProfileName } = req.body;
      if (!Body || !From) {
        res.type("text/xml");
        return res.send("<Response></Response>");
      }

      const userMessage  = Body.trim().toLowerCase();
      const userPhone    = From.replace("whatsapp:", "");
      const twiml        = new twilio.twiml.MessagingResponse();

      const userRef = admin.firestore()
        .collection("whatsapp_conversations").doc(userPhone);
      const userDoc = await userRef.get();
      let userData  = userDoc.exists ? userDoc.data() : {
        name:                ProfileName || "User",
        phone:               userPhone,
        context:             "general",
        conversationHistory: [],
        createdAt:           admin.firestore.FieldValue.serverTimestamp(),
      };

      const incomingDigits = userPhone.replace(/\D/g, "").slice(-10);
      let matchedPatientId   = null;
      let matchedPatientName = ProfileName || "Unknown";
      let matchedCollection  = null;
      let matchedUserProfile = null;

      const usersSnap = await admin.firestore().collection("users").get();
      usersSnap.forEach((doc) => {
        const storedDigits = (doc.data().phone || "").replace(/\D/g, "").slice(-10);
        if (storedDigits && storedDigits === incomingDigits) {
          matchedPatientId   = doc.id;
          matchedPatientName = doc.data().name || ProfileName || "Unknown";
          matchedCollection  = "users";
          matchedUserProfile = doc.data();
        }
      });

      if (!matchedPatientId) {
        const patientsSnap = await admin.firestore().collection("patients").get();
        patientsSnap.forEach((doc) => {
          const storedDigits = (doc.data().phone || "").replace(/\D/g, "").slice(-10);
          if (storedDigits && storedDigits === incomingDigits) {
            matchedPatientId   = doc.id;
            matchedPatientName = doc.data().name || ProfileName || "Unknown";
            matchedCollection  = "patients";
            matchedUserProfile = doc.data();
          }
        });
      }

      if (["hi", "hello", "start", "hey"].includes(userMessage)) {
        const reply =
          `👋 Namaste ${matchedPatientName}!\n\n` +
          `Welcome to *MamaCare* 🌸\n\n` +
          `Type:\n` +
          `🤰 *maternity* — Pregnancy help\n` +
          `🩺 *pcos* — PCOS help\n` +
          `🥗 *diet* — Diet plan\n` +
          `💊 *medicine* — Medicine reminders\n` +
          `🆘 *emergency* — Emergency help`;
        twiml.message(reply);
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      if (userMessage.includes("maternity") || userMessage.includes("pregnancy")) {
        userData.context = "maternity";
        await userRef.set(userData, { merge: true });
        twiml.message(
          `🤰 *Maternity mode ON!*\n\n` +
          `Ask me anything about:\n` +
          `• Diet & nutrition\n• Symptoms\n• Exercise\n• Week-by-week tips\n• Medicines\n\nI'll give you exact answers! 💚`
        );
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      if (userMessage.includes("pcos")) {
        userData.context = "pcos";
        await userRef.set(userData, { merge: true });
        twiml.message(
          `🩺 *PCOS mode ON!*\n\n` +
          `Ask me anything about:\n` +
          `• PCOS diet plan\n• Symptoms\n• Hormone balance\n• Exercise tips\n• Fertility\n\nI'll give you exact answers! 💙`
        );
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      if (
        userMessage.includes("emergency") ||
        userMessage.includes("bleeding")  ||
        userMessage.includes("khoon")     ||
        userMessage.includes("bahut dard")
      ) {
        twiml.message(
          `🚨 *EMERGENCY ALERT*\n\n` +
          `Please call *102* immediately!\n\n` +
          `Or go to your nearest hospital right now.\n\n` +
          `We have notified your emergency contact. 🙏`
        );
        if (matchedUserProfile?.emergencyContact) {
          const twilioClient = getTwilioClient();
          const ePhone = formatPhone(matchedUserProfile.emergencyContact);
          if (ePhone) {
            try {
              await twilioClient.messages.create({
                from: "whatsapp:+14155238886",
                to:   `whatsapp:${ePhone}`,
                body: `🚨 *MamaCare Emergency*\n\n${matchedPatientName} has reported an emergency on WhatsApp.\nPlease check on her immediately and call 102.`,
              });
            } catch (e) {
              console.error("❌ Emergency contact failed:", e.message);
            }
          }
        }
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      const symptomKeywords = [
        "pain", "cramp", "bleed", "nausea", "headache", "swelling",
        "dard", "khoon", "took", "medicine", "tired", "mood", "vomit",
        "dizzy", "spotting", "moving", "fever", "itching", "weak",
      ];
      const isSymptom = symptomKeywords.some(k => userMessage.includes(k));
      if (isSymptom && matchedPatientId) {
        await admin.firestore().collection("symptom_logs").add({
          userId:        matchedPatientId,
          userName:      matchedPatientName,
          healthType:    matchedUserProfile?.healthType || userData.context || "unknown",
          symptom:       Body,
          pregnancyWeek: matchedUserProfile?.pregnancyWeek || null,
          riskScore:     matchedUserProfile?.riskScore     || "LOW",
          source:        "whatsapp_bot",
          timestamp:     admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      if (userData.context === "general") {
        twiml.message(
          `Please type *maternity* or *pcos* first to get started 😊\n\nOr type *hi* to see all options.`
        );
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      let response;
      try {
        if (!GEMINI_KEY.value()) throw new Error("No API key"); // ✅ .value()

        const profileContext = matchedUserProfile ? `
User Profile:
- Name: ${matchedUserProfile.name || "Unknown"}
- Health Type: ${matchedUserProfile.healthType || userData.context}
- Pregnancy Week: ${matchedUserProfile.pregnancyWeek || "unknown"}
- Risk Score: ${matchedUserProfile.riskScore || "LOW"}
- Age: ${matchedUserProfile.age || "unknown"}
- Language preference: ${matchedUserProfile.language || "english"}
` : `User context: ${userData.context}`;

        const history = (userData.conversationHistory || [])
          .slice(-6)
          .map(m => `${m.role === "user" ? "User" : "MamaCare"}: ${m.message}`)
          .join("\n");

        const isMaternitDiet =
          userMessage.includes("diet") || userMessage.includes("eat") ||
          userMessage.includes("food") || userMessage.includes("khana") ||
          userMessage.includes("meal") || userMessage.includes("breakfast") ||
          userMessage.includes("lunch") || userMessage.includes("dinner") ||
          userMessage.includes("nutrition");

        const isPCOSDiet =
          userData.context === "pcos" && (
            userMessage.includes("diet") || userMessage.includes("eat") ||
            userMessage.includes("food") || userMessage.includes("khana") ||
            userMessage.includes("meal")
          );

        const prompt = `
You are MamaCare, an expert AI health assistant for women's health in India.
You specialize in maternal health and PCOS management.

${profileContext}

${history ? `Recent conversation:\n${history}\n` : ""}

User's message: "${Body}"

STRICT RULES — FOLLOW EXACTLY:
1. Give SPECIFIC, ACTIONABLE answers — never say "consult a doctor" unless it is a medical emergency
2. For diet questions — give an EXACT meal plan with specific foods, quantities, and timings
3. For medicine questions — give exact names, dosages, and timing
4. For symptom questions — explain what it means and what to do right now
5. For exercise questions — give exact exercises, duration, and frequency
6. Keep response under 200 words
7. Use simple Hindi-English mix if user seems Hindi-speaking
8. Use bullet points and emojis for readability
9. Be warm, supportive, and confident like a trusted friend
10. ONLY say "visit doctor" if symptoms suggest genuine emergency

${isMaternitDiet ? `
This is a DIET question for a pregnant woman (week ${matchedUserProfile?.pregnancyWeek || "unknown"}).
Give an exact full-day meal plan with quantities. DO NOT say "consult doctor for diet".
` : ""}

${isPCOSDiet ? `
This is a DIET question for a PCOS patient.
Give exact PCOS-friendly meal plan with foods, quantities, timing and supplements.
DO NOT say "consult doctor for diet".
` : ""}

Answer now:`;

        response = await getGeminiResponse(prompt);

      } catch (err) {
        console.warn("⚠️ Gemini failed, using fallback:", err.message);
        const k = userMessage;
        if (userData.context === "maternity") {
          if (k.includes("diet") || k.includes("eat") || k.includes("khana") || k.includes("food")) {
            response =
              `🥗 *Pregnancy Diet Plan (Daily)*\n\n` +
              `*Breakfast:* 2 rotis + 1 bowl dal + 1 glass milk 🥛\n` +
              `*Mid-morning:* 1 banana + 4 soaked almonds\n` +
              `*Lunch:* 2 rotis + sabzi + 1 bowl curd + salad\n` +
              `*Evening:* 1 fruit + 1 glass milk\n` +
              `*Dinner:* 2 rotis + dal + green sabzi\n\n` +
              `💊 Iron after lunch | Folic acid after breakfast | Calcium after dinner\n` +
              `💧 8-10 glasses water\n\n` +
              `❌ Avoid: Raw papaya, pineapple, junk food`;
          } else if (k.includes("iron") || k.includes("tablet") || k.includes("medicine")) {
            response =
              `💊 *Pregnancy Medicines*\n\n` +
              `• *Folic Acid 5mg* — after breakfast daily\n` +
              `• *Iron + Folic (IFA)* — after lunch daily\n` +
              `• *Calcium* — after dinner daily\n\n` +
              `⚠️ Never take iron with tea/coffee. Take with lemon water.`;
          } else if (k.includes("exercise") || k.includes("walk") || k.includes("yoga")) {
            response =
              `🧘 *Safe Pregnancy Exercises*\n\n` +
              `• Walking — 20-30 mins daily\n` +
              `• Prenatal yoga — 15 mins daily\n` +
              `• Kegel exercises — 3 sets of 10 daily\n` +
              `• Deep breathing — 5 mins morning & night\n\n` +
              `❌ Avoid: Heavy lifting, lying flat after week 20`;
          } else {
            response = `🤰 Ask me about:\n• *Diet* • *Medicine* • *Exercise* • *Symptoms* • *Week tips*`;
          }
        } else {
          if (k.includes("diet") || k.includes("eat") || k.includes("food") || k.includes("khana")) {
            response =
              `🥗 *PCOS Diet Plan (Daily)*\n\n` +
              `*Breakfast:* 2 eggs / 1 bowl oats + nuts (no sugar)\n` +
              `*Lunch:* Brown rice / 2 rotis + dal + sabzi\n` +
              `*Evening:* Green tea + flax seeds\n` +
              `*Dinner:* Grilled paneer / chicken + veggies\n\n` +
              `✅ Best: Methi seeds, cinnamon, leafy greens\n` +
              `❌ Avoid: Sugar, white rice, maida, processed foods`;
          } else if (k.includes("exercise") || k.includes("workout")) {
            response =
              `🏃 *Best PCOS Exercises*\n\n` +
              `• Brisk walking — 30 mins daily\n` +
              `• Strength training — 3x/week\n` +
              `• Yoga: Surya namaskar 5 rounds daily\n` +
              `• HIIT — 20 mins, 2x/week\n\n` +
              `💡 30 mins daily reduces PCOS symptoms by 40%!`;
          } else {
            response = `🩺 Ask me about:\n• *Diet* • *Exercise* • *Symptoms* • *Supplements* • *Cycle tracking*`;
          }
        }
      }

      await admin.firestore().collection("whatsapp_logs").add({
        patientId:   matchedPatientId,
        patientName: matchedPatientName,
        matchedFrom: matchedCollection || "unlinked",
        phone:       userPhone,
        message:     Body,
        response,
        direction:   "inbound",
        context:     userData.context,
        timestamp:   admin.firestore.FieldValue.serverTimestamp(),
        type:        matchedPatientId ? "bot_conversation" : "bot_conversation_unlinked",
      });

      userData.conversationHistory.push(
        { role: "user",      message: Body     },
        { role: "assistant", message: response }
      );
      if (userData.conversationHistory.length > 10)
        userData.conversationHistory = userData.conversationHistory.slice(-10);
      userData.lastMessageAt = admin.firestore.FieldValue.serverTimestamp();
      await userRef.set(userData, { merge: true });

      twiml.message(response);
      res.type("text/xml");
      res.send(twiml.toString());

    } catch (error) {
      console.error("❌ WHATSAPP ERROR:", error.message);
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Sorry! Type 'hi' to restart 🙏");
      res.type("text/xml");
      res.send(twiml.toString());
    }
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ AI CONVERSATIONAL IVR
// ─────────────────────────────────────────────────────────────
exports.aiConversationalIVR = onRequest(
  { timeoutSeconds: 60, memory: "512MiB", secrets: ALL_SECRETS },
  async (req, res) => {
    const { week, lang, name, SpeechResult, Digits } = req.query;
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml    = new VoiceResponse();
    const voice    = lang === "hindi" ? "Polly.Aditi" : "Polly.Raveena";
    const language = lang === "hindi" ? "hi-IN" : "en-IN";
    const baseUrl  = "https://us-central1-maternity-76579.cloudfunctions.net";

    try {
      if (!Digits && !SpeechResult) {
        const healthTips = {
          hindi:   `Namaste ${name}. Aap ${week} hafte ki pregnant hain. Roz iron tablets len aur paani zyada piyen. Har 2-3 ghante mein thoda khana khayen. Apna dhyan rakhiye.`,
          english: `Hello ${name}. You are ${week} weeks pregnant. Take iron tablets daily and drink plenty of water. Eat small meals every 2-3 hours. Take care.`,
        };
        twiml.say({ voice, language }, healthTips[lang === "hindi" ? "hindi" : "english"]);
        twiml.pause({ length: 1 });
        const gather = twiml.gather({
          input: ["speech", "dtmf"], timeout: 10, speechTimeout: "auto", numDigits: 1,
          action: `${baseUrl}/aiConversationalIVR?week=${week}&lang=${lang}&name=${encodeURIComponent(name)}`,
          method: "GET", language,
          hints:  "iron, diet, exercise, hospital, emergency, khana, paani",
        });
        gather.say({ voice, language },
          lang === "hindi"
            ? "Aap apna sawal bol sakti hain ya button daba sakti hain. Sawal ke liye 1 dabayen. Emergency ke liye 2 dabayen."
            : "You can speak your question or press a button. Press 1 for questions. Press 2 for emergency."
        );
        twiml.say({ voice, language }, lang === "hindi" ? "Koi input nahi mila. Dhanyavaad." : "No input received. Thank you.");
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      if (SpeechResult && !Digits) {
        const emergencyWords = ["emergency", "help", "bleeding", "khoon", "dard", "pain", "hospital", "urgent"];
        const isEmergency = emergencyWords.some(w => SpeechResult.toLowerCase().includes(w));

        if (isEmergency) {
          twiml.say({ voice, language },
            lang === "hindi"
              ? "Samajh gayi. Yeh emergency lag raha hai. Alert bhej di gayi hai. Turant 102 par call karein."
              : "Understood. This seems like an emergency. Alert sent. Please call 102 immediately."
          );
          await admin.firestore().collection("emergency_alerts").add({
            patientName: name, pregnancyWeek: week, speechInput: SpeechResult,
            timestamp:   admin.firestore.FieldValue.serverTimestamp(),
            status: "pending", type: "speech_emergency",
          });
          res.type("text/xml");
          return res.send(twiml.toString());
        }

        let answer;
        try {
          const prompt =
            `You are an experienced ASHA health worker in India. ` +
            `Answer this pregnancy question with EXACT advice (no "consult doctor" unless emergency): ${SpeechResult}. ` +
            `Patient is at week ${week}. Language: ${lang === "hindi" ? "Hindi (Devanagari)" : "English"}. ` +
            `Keep answer 50-70 words. Be specific and actionable.`;
          answer = await getGeminiResponse(prompt);
        } catch {
          const q = SpeechResult.toLowerCase();
          if (q.includes("iron") || q.includes("tablet"))        answer = lang === "hindi" ? "Iron tablets roz lena bahut zaroori hai. Khane ke baad len, chai ke saath nahi." : "Take iron tablets daily after meals, not with tea.";
          else if (q.includes("eat") || q.includes("diet"))      answer = lang === "hindi" ? "Dal, sabzi, roti, doodh, fruits roz len. Paani 8 glass." : "Eat dal, vegetables, roti, milk, fruits daily. Drink 8 glasses of water.";
          else if (q.includes("walk") || q.includes("exercise")) answer = lang === "hindi" ? "Roz 20-30 minute walking karein." : "Walk 20-30 minutes daily.";
          else                                                    answer = lang === "hindi" ? "Roz iron tablets len, paani zyada piyen." : "Take iron tablets daily, drink plenty of water.";
        }

        twiml.say({ voice, language }, answer);
        twiml.pause({ length: 1 });
        const gather2 = twiml.gather({
          input: ["speech", "dtmf"], timeout: 10, speechTimeout: "auto", numDigits: 1,
          action: `${baseUrl}/aiConversationalIVR?week=${week}&lang=${lang}&name=${encodeURIComponent(name)}`,
          method: "GET", language,
        });
        gather2.say({ voice, language },
          lang === "hindi"
            ? "Aur sawal ke liye bolo ya 1 dabayen. Emergency ke liye 2 dabayen."
            : "Speak or press 1 for more questions. Press 2 for emergency."
        );
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      if (Digits === "1") {
        const gather2 = twiml.gather({
          input: ["speech", "dtmf"], timeout: 15, speechTimeout: "auto", numDigits: 1,
          action: `${baseUrl}/aiAnswerQuestion?week=${week}&lang=${lang}&name=${encodeURIComponent(name)}`,
          method: "GET", language,
        });
        gather2.say({ voice, language },
          lang === "hindi"
            ? "Apna sawal boliye. Iron ke liye 1, diet ke liye 2, exercise ke liye 3 dabayen."
            : "Speak your question. Press 1 for iron, 2 for diet, 3 for exercise."
        );
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      if (Digits === "2") {
        twiml.say({ voice, language },
          lang === "hindi"
            ? "Samajh gayi. Alert bhej di gayi hai. Turant 102 par call karein."
            : "Understood. Alert sent. Please call 102 immediately."
        );
        await admin.firestore().collection("emergency_alerts").add({
          patientName: name, pregnancyWeek: week,
          timestamp:   admin.firestore.FieldValue.serverTimestamp(),
          status: "pending", type: "button_emergency",
        });
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      twiml.say({ voice, language }, lang === "hindi" ? "Dhanyavaad." : "Thank you.");
      res.type("text/xml");
      res.send(twiml.toString());

    } catch (error) {
      console.error("❌ IVR ERROR:", error.message);
      twiml.say("Technical error. Goodbye.");
      res.type("text/xml");
      res.send(twiml.toString());
    }
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ AI ANSWER QUESTION
// ─────────────────────────────────────────────────────────────
exports.aiAnswerQuestion = onRequest(
  { timeoutSeconds: 60, memory: "512MiB", secrets: ALL_SECRETS },
  async (req, res) => {
    const { week, lang, name, SpeechResult, Digits } = req.query;
    const twiml    = new twilio.twiml.VoiceResponse();
    const voice    = lang === "hindi" ? "Polly.Aditi" : "Polly.Raveena";
    const language = lang === "hindi" ? "hi-IN" : "en-IN";
    const baseUrl  = "https://us-central1-maternity-76579.cloudfunctions.net";

    try {
      let answer;
      if (SpeechResult && !Digits) {
        try {
          const prompt =
            `ASHA worker. Answer with EXACT advice (no consult doctor unless emergency): ` +
            `${SpeechResult}. Week ${week}. Language: ${lang === "hindi" ? "Hindi" : "English"}. 50-70 words.`;
          answer = await getGeminiResponse(prompt);
        } catch {
          answer = lang === "hindi"
            ? "Roz iron tablets len, paani 8 glass piyen, aur healthy khana khayen."
            : "Take iron tablets daily, drink 8 glasses of water, and eat healthy food.";
        }
      } else if (Digits) {
        const answers = {
          hindi: {
            "1": "Iron tablets roz khana bahut zaroori hai. Khane ke baad len, chai ke saath nahi. Vitamin C ke saath len jaise nimbu paani.",
            "2": "Roz ek plate dal chawal ya roti sabzi, ek glass doodh, ek fruit zaroor len. Junk food avoid karein.",
            "3": "Roz 20-30 minute morning walk karein. Halki yoga jaise butterfly pose safe hain.",
          },
          english: {
            "1": "Take iron tablets daily after meals, not with tea. Take with lemon water for better absorption.",
            "2": "Eat dal, vegetables, roti, 1 glass milk, and 1 fruit daily. Avoid junk food and excess tea.",
            "3": "Walk 20-30 minutes every morning. Light yoga like butterfly pose is safe during pregnancy.",
          },
        };
        answer = answers[lang === "hindi" ? "hindi" : "english"][Digits]
          || (lang === "hindi" ? "Galat option." : "Invalid option.");
      } else {
        answer = lang === "hindi" ? "Koi input nahi mila." : "No input received.";
      }

      twiml.say({ voice, language }, answer);
      twiml.pause({ length: 1 });
      const gather = twiml.gather({
        input: ["speech", "dtmf"], timeout: 10, speechTimeout: "auto", numDigits: 1,
        action: `${baseUrl}/aiConversationalIVR?week=${week}&lang=${lang}&name=${encodeURIComponent(name)}`,
        method: "GET", language,
      });
      gather.say({ voice, language },
        lang === "hindi"
          ? "Aur sawal ke liye bolo ya 1 dabayen. Emergency ke liye 2 dabayen."
          : "Speak or press 1 for more. Press 2 for emergency."
      );
      res.type("text/xml");
      res.send(twiml.toString());

    } catch (error) {
      console.error("❌ ANSWER ERROR:", error.message);
      twiml.say("Error occurred. Goodbye.");
      res.type("text/xml");
      res.send(twiml.toString());
    }
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ SCHEDULED DAILY WHATSAPP
// ─────────────────────────────────────────────────────────────
exports.scheduleDailyWhatsApp = onSchedule(
  { schedule: "30 3 * * *", timeZone: "Asia/Kolkata", secrets: TWILIO_SECRETS },
  async () => {
    const twilioClient     = getTwilioClient();
    const patientsSnapshot = await admin.firestore().collection("patients").get();
    const dayOfWeek        = new Date().getDay();
    const tipTypes         = ["iron", "water", "food", "exercise", "checkup"];
    const tipType          = tipTypes[dayOfWeek % tipTypes.length];

    const promises = [];
    patientsSnapshot.forEach((doc) => {
      const patient     = doc.data();
      if (!patient.phone) return;
      const phone       = formatPhone(patient.phone);
      if (!phone) return;
      const currentWeek = patient.lmp ? calculatePregnancyWeek(patient.lmp) : 20;
      const lang        = patient.language === "english" ? "english" : "hindi";

      const tips = {
        hindi: {
          iron:     `☀️ Good morning ${patient.name}!\n\n💊 Aaj iron tablet leni hai!\n✅ Khane ke baad len\n\nApna dhyan rakhiye! 💚`,
          water:    `☀️ Namaste ${patient.name}!\n\n💧 Aaj paani zyada piyen!\n✅ 8-10 glass roz\n\nHealthy rahiye! 💚`,
          food:     `☀️ Good morning ${patient.name}!\n\n🍲 Aaj healthy khana khayen!\n✅ Dal, sabzi, roti, doodh, fruits\n\nAap aur baby ke liye! 💚`,
          exercise: `☀️ Namaste ${patient.name}!\n\n🚶 Aaj thoda chalein!\n✅ 20-30 minute walking\n\nActive rahiye! 💚`,
          checkup:  `☀️ Good morning ${patient.name}!\n\n🏥 Hospital checkup reminder!\nWeek ${currentWeek} chal raha hai! 💚`,
        },
        english: {
          iron:     `☀️ Good morning ${patient.name}!\n\n💊 Take your iron tablet today!\n✅ After meals\n\nTake care! 💚`,
          water:    `☀️ Hello ${patient.name}!\n\n💧 Drink plenty of water!\n✅ 8-10 glasses daily\n\nStay healthy! 💚`,
          food:     `☀️ Good morning ${patient.name}!\n\n🍲 Eat healthy today!\n✅ Lentils, vegetables, grains, milk, fruits\n\nFor you and baby! 💚`,
          exercise: `☀️ Hello ${patient.name}!\n\n🚶 Walk today!\n✅ 20-30 minutes\n\nStay active! 💚`,
          checkup:  `☀️ Good morning ${patient.name}!\n\n🏥 Hospital checkup reminder!\nWeek ${currentWeek} now! 💚`,
        },
      };

      const promise = twilioClient.messages
        .create({ body: tips[lang][tipType], from: "whatsapp:+14155238886", to: "whatsapp:" + phone })
        .then((msg) => admin.firestore().collection("whatsapp_logs").add({
          patientId: doc.id, patientName: patient.name, phone,
          messageSid: msg.sid, message: tips[lang][tipType],
          direction: "outbound", messageType: tipType,
          pregnancyWeek: currentWeek,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          type: "automated_daily", status: "sent",
        }))
        .catch((err) => console.error("❌ Failed for", patient.name, ":", err.message));

      promises.push(promise);
    });

    await Promise.all(promises);
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ SCHEDULED DAILY CALLS
// ─────────────────────────────────────────────────────────────
exports.scheduleDailyCalls = onSchedule(
  { schedule: "30 4 * * *", timeZone: "Asia/Kolkata", secrets: TWILIO_SECRETS },
  async () => {
    const twilioClient     = getTwilioClient();
    const patientsSnapshot = await admin.firestore().collection("patients").get();

    const promises = [];
    patientsSnapshot.forEach((doc) => {
      const patient     = doc.data();
      if (!patient.phone) return;
      const phone       = formatPhone(patient.phone);
      if (!phone) return;
      const currentWeek = patient.lmp ? calculatePregnancyWeek(patient.lmp) : 20;
      if (currentWeek < 12 || currentWeek > 40) return;

      const promise = twilioClient.calls
        .create({
          url: `https://us-central1-maternity-76579.cloudfunctions.net/aiConversationalIVR?week=${currentWeek}&lang=${patient.language || "hindi"}&name=${encodeURIComponent(patient.name)}`,
          to: phone, from: TWILIO_NUMBER.value(), // ✅ .value()
          statusCallback:      `https://us-central1-maternity-76579.cloudfunctions.net/callStatusCallback?patientId=${doc.id}`,
          statusCallbackEvent: ["completed"], record: true, timeout: 60,
        })
        .then((call) => admin.firestore().collection("call_logs").add({
          patientId: doc.id, callSid: call.sid, patientName: patient.name,
          phone, pregnancyWeek: currentWeek,
          language: patient.language || "hindi", type: "automated_daily",
          timestamp: admin.firestore.FieldValue.serverTimestamp(), status: "initiated",
        }))
        .catch((err) => console.error("❌ Call failed for", patient.name, ":", err.message));

      promises.push(promise);
    });

    await Promise.all(promises);
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ MANUAL TRIGGERS
// ─────────────────────────────────────────────────────────────
exports.triggerDailyWhatsApp = onCall(
  { secrets: TWILIO_SECRETS },
  async (request) => {
    const data = request.data;
    try {
      const twilioClient     = getTwilioClient();
      const patientsSnapshot = await admin.firestore().collection("patients").limit(data.limit || 1).get();
      if (patientsSnapshot.empty) return { success: false, message: "No patients found" };

      const results = [];
      for (const doc of patientsSnapshot.docs) {
        const patient = doc.data();
        const phone   = formatPhone(patient.phone);
        if (!phone) continue;
        const message = `☀️ TEST: Good morning ${patient.name}!\n\n💊 Iron tablet reminder.\n\nTake care! 💚`;
        const msg = await twilioClient.messages.create({
          body: message, from: "whatsapp:+14155238886", to: "whatsapp:" + phone,
        });
        await admin.firestore().collection("whatsapp_logs").add({
          patientId: doc.id, patientName: patient.name, phone,
          messageSid: msg.sid, message, direction: "outbound",
          type: "manual_trigger", timestamp: admin.firestore.FieldValue.serverTimestamp(), status: "sent",
        });
        results.push({ patient: patient.name, messageSid: msg.sid });
      }
      return { success: true, messages: results };
    } catch (error) {
      throw new HttpsError("internal", error.message);
    }
  }
);

exports.triggerDailyCalls = onCall(
  { secrets: TWILIO_SECRETS },
  async (request) => {
    const data = request.data;
    try {
      const twilioClient     = getTwilioClient();
      const patientsSnapshot = await admin.firestore().collection("patients").limit(data.limit || 1).get();
      if (patientsSnapshot.empty) return { success: false, message: "No patients found" };

      const results = [];
      for (const doc of patientsSnapshot.docs) {
        const patient     = doc.data();
        const phone       = formatPhone(patient.phone);
        if (!phone) continue;
        const currentWeek = patient.lmp ? calculatePregnancyWeek(patient.lmp) : 20;
        const call = await twilioClient.calls.create({
          url: `https://us-central1-maternity-76579.cloudfunctions.net/aiConversationalIVR?week=${currentWeek}&lang=${patient.language || "hindi"}&name=${encodeURIComponent(patient.name)}`,
          to: phone, from: TWILIO_NUMBER.value(), // ✅ .value()
          statusCallback:      `https://us-central1-maternity-76579.cloudfunctions.net/callStatusCallback?patientId=${doc.id}`,
          statusCallbackEvent: ["completed"], record: true,
        });
        await admin.firestore().collection("call_logs").add({
          patientId: doc.id, callSid: call.sid, patientName: patient.name,
          phone, pregnancyWeek: currentWeek,
          language: patient.language || "hindi", type: "manual_trigger",
          timestamp: admin.firestore.FieldValue.serverTimestamp(), status: "initiated",
        });
        results.push({ patient: patient.name, callSid: call.sid, week: currentWeek });
      }
      return { success: true, calls: results };
    } catch (error) {
      throw new HttpsError("internal", error.message);
    }
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ 3x/WEEK SCHEDULED CALLS
// ─────────────────────────────────────────────────────────────
exports.scheduleWeeklyCalls = onSchedule(
  { schedule: "30 4 * * 1,3,5", timeZone: "Asia/Kolkata", secrets: TWILIO_SECRETS },
  async () => {
    const twilioClient = getTwilioClient();
    const snap = await admin.firestore()
      .collection("users")
      .where("isActive", "==", true)
      .get();

    const promises = snap.docs.map(async (docSnap) => {
      const user        = docSnap.data();
      const phone       = formatPhone(user.phone);
      if (!phone) return;
      const currentWeek = user.pregnancyWeek || 0;
      const lang        = user.language || "hindi";

      try {
        const call = await twilioClient.calls.create({
          url:  `https://us-central1-maternity-76579.cloudfunctions.net/aiConversationalIVR` +
                `?week=${currentWeek}&lang=${lang}&name=${encodeURIComponent(user.name || "Patient")}`,
          to:   phone,
          from: TWILIO_NUMBER.value(), // ✅ .value()
          statusCallback:
            `https://us-central1-maternity-76579.cloudfunctions.net/callStatusCallback?patientId=${docSnap.id}`,
          statusCallbackEvent: ["completed"],
          record:  true,
          timeout: 60,
        });
        await admin.firestore().collection("call_logs").add({
          userId:        docSnap.id,
          callSid:       call.sid,
          patientName:   user.name,
          phone,
          pregnancyWeek: currentWeek,
          healthType:    user.healthType || "unknown",
          language:      lang,
          type:          "scheduled_3x_weekly",
          timestamp:     admin.firestore.FieldValue.serverTimestamp(),
          status:        "initiated",
        });
      } catch (err) {
        console.error("❌ Weekly call failed for", user.name, ":", err.message);
      }
    });

    await Promise.allSettled(promises);
    console.log("✅ 3x/week calls done");
  }
);


// ─────────────────────────────────────────────────────────────
// ✅ ML FUNCTIONS (no secrets needed)
// ─────────────────────────────────────────────────────────────
exports.predictMaternalRisk = onCall(
  { timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    const { age, systolicBP, diastolicBP, bloodSugar, bodyTemp, heartRate } = request.data;
    if (!age || !systolicBP || !diastolicBP || !bloodSugar || !bodyTemp || !heartRate)
      throw new HttpsError("invalid-argument", "Missing required fields");

    let score = 0;
    if      (systolicBP > 160 || diastolicBP > 110) score += 3;
    else if (systolicBP > 140 || diastolicBP > 90)  score += 2;
    else if (systolicBP > 130 || diastolicBP > 85)  score += 1;
    if      (bloodSugar > 140) score += 3;
    else if (bloodSugar > 110) score += 2;
    else if (bloodSugar > 100) score += 1;
    if      (bodyTemp > 100.4) score += 2;
    else if (bodyTemp > 99.5)  score += 1;
    if      (heartRate > 110 || heartRate < 50) score += 2;
    else if (heartRate > 100 || heartRate < 60) score += 1;
    if      (age > 40 || age < 17) score += 2;
    else if (age > 35)             score += 1;

    let risk, confidence;
    if      (score >= 6) { risk = "HIGH";     confidence = Math.min(0.95, 0.75 + score * 0.02); }
    else if (score >= 3) { risk = "MODERATE"; confidence = Math.min(0.90, 0.65 + score * 0.03); }
    else                 { risk = "LOW";      confidence = Math.min(0.95, 0.80 + (5 - score) * 0.03); }

    return { success: true, risk, confidence: parseFloat(confidence.toFixed(4)), score };
  }
);


exports.predictPCOS = onCall(
  { timeoutSeconds: 60, memory: "256MiB" },
  async (request) => {
    const data = request.data;
    if (!data || typeof data !== "object")
      throw new HttpsError("invalid-argument", "Invalid features");

    let score = 0;
    if (data.irregular_cycles)    score += 2;
    if (data.weight_gain)         score += 1;
    if (data.acne)                score += 1;
    if (data.hair_loss)           score += 1;
    if (data.hirsutism)           score += 2;
    if (data.follicle_count > 12) score += 2;
    if (data.amh > 4.0)          score += 2;
    if (data.lh_fsh_ratio > 2)   score += 2;
    if (data.bmi > 30)           score += 1;

    let risk, confidence;
    if      (score >= 7) { risk = "HIGH";     confidence = Math.min(0.95, 0.78 + score * 0.015); }
    else if (score >= 4) { risk = "MODERATE"; confidence = Math.min(0.88, 0.65 + score * 0.02);  }
    else                 { risk = "LOW";      confidence = Math.min(0.95, 0.80 + (6 - score) * 0.025); }

    return { success: true, risk, confidence: parseFloat(confidence.toFixed(4)), score };
  }
);
