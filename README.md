# 🌸 MamaCare — AI-Powered Women's Health Platform

MamaCare is a full-stack AI health assistant built for women in India, focusing on **maternal health** and **PCOS management**. It combines real-time risk monitoring, AI-powered WhatsApp chatbot, automated health calls, and a React dashboard — all powered by Firebase, Twilio, and Gemini AI.

---

## 🚀 Features

### 🤰 Maternity Module
- Log vitals (BP, hemoglobin, blood sugar, body temp, heart rate)
- Auto ML risk scoring — LOW / MODERATE / HIGH
- Real-time risk alerts via WhatsApp to patient + emergency contact
- Weekly pregnancy tips via automated AI voice calls
- Daily checkup reminders via WhatsApp
- Pregnancy week tracker from LMP date

### 🩺 PCOS Module
- Cycle tracking with pain level logging
- High-pain auto-alerts via WhatsApp
- PCOS risk prediction (ML model)
- Diet & exercise recommendations via AI

### 🤖 AI WhatsApp Bot
- Conversational bot via Twilio WhatsApp Sandbox
- Powered by Gemini 2.0 Flash
- Supports maternity and PCOS modes
- Hindi + English bilingual responses
- Emergency detection with auto-alert to emergency contact
- Symptom logging from WhatsApp messages

### 📞 AI Voice IVR
- Automated outbound health tip calls via Twilio
- Conversational voice using Polly voices (Aditi / Raveena)
- Speech recognition + DTMF input support
- Emergency alert trigger during live calls
- Call logs saved to Firestore

### 📊 Dashboard
- Patient vitals tracking with charts
- Risk score overview (LOW / MODERATE / HIGH)
- Call and WhatsApp logs
- Admin panel with manual triggers

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firebase Firestore |
| Backend | Firebase Cloud Functions v2 (Node.js) |
| AI | Google Gemini 2.0 Flash |
| Calls & SMS | Twilio Voice + WhatsApp API |
| Hosting | Firebase Hosting / Vercel |
| Scheduling | Firebase onSchedule (cron jobs) |
| Secrets | Firebase Secret Manager |

---

## 📁 Project Structure

mamacare/
├── src/
│ ├── components/
│ │ ├── userdashboard/
│ │ │ ├── PCOSDashboard.jsx
│ │ │ ├── MaternityDashboard.jsx
│ │ │ ├── SymptomCalendar.jsx
│ │ │ └── VitalsChart.jsx
│ │ └── admin/
│ │ └── AdminDashboard.jsx
│ ├── config/
│ │ └── firebase.js
│ └── App.jsx
├── functions/
│ └── index.js
├── .env ← never commit this
├── firebase.json
└── README.md
---

## ⚙️ Setup & Installation

### 1. Clone the repo
```bash
git clone https://github.com/hardikdhingra150/MamaCare.git
cd MamaCare

2. Install frontend dependencies
npm install

3. Install functions dependencies
cd functions && npm install && cd ..

4. Configure environment variables
Create a .env file in the root:
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id


5. Set Firebase secrets
firebase functions:secrets:set TWILIO_SID
firebase functions:secrets:set TWILIO_TOKEN
firebase functions:secrets:set TWILIO_NUMBER
firebase functions:secrets:set GEMINI_KEY

6. Run locally
npm run dev

7. Deploy
firebase deploy

☁️ Cloud Functions
Function	Trigger	Description
onCheckupCreated	Firestore	Risk scoring + WhatsApp alert on new checkup
onCycleLogCreated	Firestore	Pain alert on high PCOS pain log
makeHealthTipCall	onCall	Initiates AI voice call to patient
aiConversationalIVR	onRequest	Handles live IVR voice conversation
aiAnswerQuestion	onRequest	Answers spoken pregnancy questions
whatsappBot	onRequest	WhatsApp chatbot (Twilio webhook)
callStatusCallback	onRequest	Updates call log on completion
dailyCheckupReminder	Cron 3:30 AM IST	WhatsApp reminders for scheduled checkups
scheduleDailyWhatsApp	Cron 3:30 AM IST	Daily health tips to all patients
scheduleDailyCalls	Cron 4:30 AM IST	Automated calls (pregnancy week 12–40)
scheduleWeeklyCalls	Cron Mon/Wed/Fri	3x/week calls to active users
triggerDailyCalls	onCall	Manual call trigger from admin
triggerDailyWhatsApp	onCall	Manual WhatsApp blast from admin
predictMaternalRisk	onCall	ML risk prediction for maternity
predictPCOS	onCall	ML risk prediction for PCOS


📱 WhatsApp Bot Commands
Command	Action
hi / hello	Show welcome menu
maternity	Switch to maternity mode
pcos	Switch to PCOS mode
diet	Get personalized meal plan
medicine	Get medicine schedule
exercise	Get safe exercise plan
emergency	Trigger emergency alert to contact

🤖 ML Risk Models
Maternal Risk
Input: systolic/diastolic BP, blood sugar, body temperature, heart rate, age
Output: { risk: "LOW" | "MODERATE" | "HIGH", confidence: 0.0–1.0 }

PCOS Risk
Input: irregular cycles, weight gain, acne, hair loss, hirsutism, follicle count, AMH, LH/FSH ratio, BMI
Output: { risk: "LOW" | "MODERATE" | "HIGH", confidence: 0.0–1.0 }

🔐 Security
All secrets stored in Firebase Secret Manager — never in code

.env files excluded via .gitignore

Firebase Authentication for all user routes

Firestore security rules enforce user-level access

👨‍💻 Built By
Hardik Dhingra 

📄 License
MIT License — free to use, modify, and build upon.
