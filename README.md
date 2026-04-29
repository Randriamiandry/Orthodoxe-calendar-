📅 Orthodox Liturgical Calendar

Orthodoxe-calendar is a web application that displays the daily liturgical information according to the Orthodox calendar. It relies on the orthocal.info API and provides automatic translation into French, Malagasy, and English.

🌍 Live demo: orthodox-daily.vercel.app

✨ Features

· 📆 Daily display – Feasts, fasts, saints, tones, readings, saints' stories…
· 🔁 Date navigation – Select a specific date or go to the previous/next day.
· 🌐 Three languages – French, Malagasy, English. Both the interface and content are automatically translated.
· 🎨 Light/Dark theme – Toggle between themes; preference is saved.
· 📅 Gregorian or Julian calendar – The chosen calendar is stored in the browser.
· 🚀 Serverless deployment on Vercel – No server to maintain.

🛠️ Technologies

Part Details
Frontend HTML5, CSS3, JavaScript (vanilla)
Backend Node.js, Express (version 4)
Translation Proxy to Google Translate (via translate.googleapis.com)
Hosting Vercel (configured in vercel.json)
External API orthocal.info


📦 Installation (for local development)

1. Clone the repository
   ```bash
   git clone https://github.com/Randriamiandry/Orthodoxe-calendar-.git
   cd Orthodoxe-calendar-
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the server
   ```bash
   npm run dev
   ```
   The server listens on http://localhost:3000.
4. Open the app
   Go to http://localhost:3000 in your browser.


🗂️ Project structure

```
.
├── package.json          # Dependencies and scripts
├── server.js             # Express server + translation proxy
├── vercel.json           # Vercel deployment configuration
└── public/
    ├── index.html        # Main web page
    ├── style.css         # Styles (light/dark theme included)
    ├── script.js         # Frontend logic (API, translation, display)
    └── ort.txt           # Data file (currently empty)
```

---

🔗 Usage

· Change language: use the dropdown in the top right corner (🇫🇷, 🇲🇬, 🇬🇧).
· Switch calendar: toggle between Gregorian and Julian.
· Navigate between days: use the ◀ and ▶ buttons next to the date.
· Dark theme: click the moon/sun icon.


🌐 API

Translation endpoint

Method Endpoint Description
POST /translate Translates an array of texts into a target language

Request body:

```json
{
  "texts": ["English text", "another text"],
  "targetLang": "fr"
}
```

Response:

```json
[
  "translated text in French",
  "another translated text"
]
```

---

📄 License

This project is licensed under the MIT license. You are free to use, modify, and distribute it.

---

👤 Author

Randriamiandry – Development and maintenance.

---

Liturgical data provided by orthocal.info.