const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

const twilioClient = twilio(
  TWILIO_SID,
  TWILIO_TOKEN
);

// AI-powered conversational IVR
exports.aiConversationalIVR = functions.https.onRequest(async (req, res) => {
  const { week, lang, name, SpeechResult, Digits } = req.query;

  console.log(`🎙️ AI IVR: Week ${week}, Language ${lang}, Input: ${SpeechResult || Digits}`);

  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  // Voice settings
  const voice = lang === "hindi" ? "Polly.Aditi" : "Polly.Raveena";
  const language = lang === "hindi" ? "hi-IN" : "en-IN";

  try {
    // Generate personalized health tip
    const healthTip = await generateHealthTipWithAI(week, lang);

    // First message
    if (!SpeechResult && !Digits) {
      twiml.say({
        voice: voice,
        language: language
      }, healthTip);

      // Gather speech or keypress input
      const gather = twiml.gather({
        input: ["speech", "dtmf"],
        timeout: 5,
        speechTimeout: "auto",
        action: `/aiConversationalIVR?week=${week}&lang=${lang}&name=${name}`,
        language: language
      });

      gather.say({
        voice: voice,
        language: language
      }, lang === "hindi" 
        ? "Kya aap kuch poochna chahti hain? Bolo 'haan' ya 1 dabayen. Emergency ke liye 2 dabayen."
        : "Do you have any questions? Say 'yes' or press 1. For emergency, press 2."
      );

      res.type("text/xml");
      res.send(twiml.toString());
      return;
    }

    // Handle user response
    if (SpeechResult) {
      const userSpeech = SpeechResult.toLowerCase();
      
      // Emergency keywords
      if (userSpeech.includes("emergency") || userSpeech.includes("help") || 
          userSpeech.includes("khoon") || userSpeech.includes("dard")) {
        twiml.say({
          voice: voice,
          language: language
        }, lang === "hindi"
          ? "Yeh emergency hai. Turant nazdeeki hospital jayen ya 102 par call karein. Main aapke ASHA worker ko bhi inform kar rahi hoon."
          : "This is an emergency. Please go to the nearest hospital immediately or call 102. I'm also informing your ASHA worker."
        );

        // Trigger emergency alert
        await triggerEmergencyAlert(name, week);
        
        res.type("text/xml");
        res.send(twiml.toString());
        return;
      }

      // Question detected
      if (userSpeech.includes("yes") || userSpeech.includes("haan") || 
          userSpeech.includes("question") || userSpeech.includes("puchna")) {
        
        const gather2 = twiml.gather({
          input: ["speech"],
          timeout: 10,
          speechTimeout: "auto",
          action: `/aiAnswerQuestion?week=${week}&lang=${lang}&name=${name}`,
          language: language
        });

        gather2.say({
          voice: voice,
          language: language
        }, lang === "hindi"
          ? "Haan boliye, aap kya poochna chahti hain?"
          : "Yes, please ask your question."
        );

        res.type("text/xml");
        res.send(twiml.toString());
        return;
      }
    }

    // Handle DTMF (keypress)
    if (Digits === "1") {
      // Repeat message
      twiml.say({ voice, language }, healthTip);
      twiml.redirect(`/aiConversationalIVR?week=${week}&lang=${lang}&name=${name}`);
    } else if (Digits === "2") {
      // Emergency
      twiml.say({ voice, language }, 
        lang === "hindi"
          ? "Emergency alert bhej di gayi hai. Turant hospital jayen."
          : "Emergency alert sent. Please go to hospital immediately."
      );
      await triggerEmergencyAlert(name, week);
    }

    // End call
    twiml.say({ voice, language },
      lang === "hindi"
        ? "Dhanyavaad. Apna khayal rakhiye. Namaste."
        : "Thank you. Take care. Goodbye."
    );

    res.type("text/xml");
    res.send(twiml.toString());

  } catch (error) {
    console.error("❌ AI IVR error:", error);
    twiml.say("Sorry, technical issue. Please call back later.");
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

// AI answers patient questions in real-time
exports.aiAnswerQuestion = functions.https.onRequest(async (req, res) => {
  const { week, lang, name, SpeechResult } = req.query;

  console.log(`❓ Patient question: "${SpeechResult}"`);

  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const voice = lang === "hindi" ? "Polly.Aditi" : "Polly.Raveena";
  const language = lang === "hindi" ? "hi-IN" : "en-IN";

  try {
    // Generate AI answer using Gemini
    const answer = await generateAIAnswer(SpeechResult, week, lang);

    twiml.say({ voice, language }, answer);

    // Ask if they have more questions
    const gather = twiml.gather({
      input: ["speech", "dtmf"],
      timeout: 5,
      action: `/aiConversationalIVR?week=${week}&lang=${lang}&name=${name}`,
      language: language
    });

    gather.say({ voice, language },
      lang === "hindi"
        ? "Koi aur sawal? Bolo 'haan' ya 1 dabayen."
        : "Any other questions? Say 'yes' or press 1."
    );

    res.type("text/xml");
    res.send(twiml.toString());

  } catch (error) {
    console.error("❌ AI answer error:", error);
    twiml.say("Sorry, I couldn't understand. Please try again.");
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

// Make AI call function
exports.makeAICall = async function(data) {
  const { patientId, patientName, phone, pregnancyWeek, language } = data;

  try {
    const call = await twilioClient.calls.create({
      url: `https://${functions.config().project.id}.cloudfunctions.net/aiConversationalIVR?week=${pregnancyWeek}&lang=${language}&name=${encodeURIComponent(patientName)}`,
      to: phone,
      from: TWILIO_NUMBER,
      record: true,
      recordingStatusCallback: `/callRecordingCallback?patientId=${patientId}`,
      machineDetection: "DetectMessageEnd" // Don't leave voicemail
    });

    console.log(`✅ AI call initiated: ${call.sid}`);

    // Log call
    await admin.firestore().collection("call_logs").add({
      patientId,
      callSid: call.sid,
      type: "ai_conversational",
      pregnancyWeek,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "initiated"
    });

    return call.sid;

  } catch (error) {
    console.error("❌ AI call error:", error);
    throw error;
  }
};

// Generate health tip using AI
async function generateHealthTipWithAI(week, lang) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Generate a friendly, conversational health tip for a pregnant woman at week ${week}.
Language: ${lang === "hindi" ? "Hindi (Devanagari script)" : "English"}
Tone: Warm, caring ASHA worker
Length: 60-80 words
Include:
- Greeting with "Namaste"
- 1-2 specific tips for this week
- Encouragement
- Natural speaking style (not robotic)

Example format (Hindi):
"Namaste! Main aapki ASHA worker hoon. Aap ${week} hafte ki pregnant hain. [specific tip]. [another tip]. Apna dhyan rakhiye, aur koi bhi problem ho to mujhe ya doctor ko zaroor bataye. Aap bahut achha kar rahi hain!"`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Generate AI answer to question
async function generateAIAnswer(question, week, lang) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `You are an ASHA health worker. Answer this pregnancy question:
Question: "${question}"
Pregnancy week: ${week}
Language: ${lang === "hindi" ? "Hindi" : "English"}
Length: 40-60 words
Be warm, clear, and actionable. If it's an emergency symptom, tell them to see a doctor immediately.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function triggerEmergencyAlert(patientName, week) {
  // Send alert to ASHA worker
  await admin.firestore().collection("emergency_alerts").add({
    patientName,
    pregnancyWeek: week,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    status: "pending"
  });

  console.log(`🚨 Emergency alert created for ${patientName}`);
}
