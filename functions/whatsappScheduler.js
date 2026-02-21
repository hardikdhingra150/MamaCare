const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

const twilioClient = twilio(
  TWILIO_SID,
  TWILIO_TOKEN
);

exports.sendMessage = async function(data) {
  const { patientName, phone, pregnancyWeek, language } = data;

  try {
    // Generate AI message
    const message = await generateWhatsAppMessage(patientName, pregnancyWeek, language);

    await twilioClient.messages.create({
      from: `whatsapp:${functions.config().twilio.whatsapp_number}`,
      to: `whatsapp:${phone}`,
      body: message
    });

    console.log(`✅ WhatsApp sent to ${patientName}`);

    // Log message
    await admin.firestore().collection("message_logs").add({
      patientName,
      phone,
      pregnancyWeek,
      message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error("❌ WhatsApp send error:", error);
  }
};

async function generateWhatsAppMessage(name, week, lang) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create a caring WhatsApp reminder message for a pregnant woman.
Name: ${name}
Week: ${week}
Language: ${lang === "hindi" ? "Hindi with some English" : "English"}
Length: 100-120 words
Include:
- Warm greeting
- 2-3 health tips for this week
- Reminder to take medications
- Emoji (use sparingly)
- "Reply with any questions"

Format like a real ASHA worker texting.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
