const express = require('express');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --------------------------------------------------------------
// Fonction de traduction individuelle (basée sur index.js)
// --------------------------------------------------------------
async function translateText(text, targetLang, context = '') {
  if (!text || text.trim().length === 0) return text;

  const trimmed = text.trim();
  const logPrefix = context ? `[${context}] ` : '';

  const baseUrl = 'https://translate.googleapis.com/translate_a/single';
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLang,
    dt: 't',
    q: trimmed
  });
  const url = `${baseUrl}?${params.toString()}`;

  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'curl/7.68.0',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    };

    const req = https.get(url, options, (res) => {
      let data = '';
      let receivedSize = 0;

      const processResponse = (data) => {
        try {
          let cleanData = data;
          if (data.startsWith(")]}'\n")) {
            cleanData = data.substring(5);
          }
          const json = JSON.parse(cleanData);
          let translation = '';
          if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
            translation = json[0].map(segment => segment[0] || '').join('');
          }
          resolve(translation || trimmed); // fallback si vide
        } catch (err) {
          resolve(trimmed);
        }
      };

      if (res.headers['content-encoding']?.includes('gzip')) {
        const gunzip = zlib.createGunzip();
        res.pipe(gunzip);
        gunzip.on('data', (chunk) => {
          data += chunk;
          receivedSize += chunk.length;
        });
        gunzip.on('end', () => processResponse(data));
      } else {
        res.on('data', (chunk) => {
          data += chunk;
          receivedSize += chunk.length;
        });
        res.on('end', () => processResponse(data));
      }
    });

    req.setTimeout(30000, () => {
      req.destroy();
      resolve(trimmed);
    });

    req.on('error', () => {
      resolve(trimmed);
    });
  });
}

// --------------------------------------------------------------
// Exécution parallèle avec limite de concurrence
// --------------------------------------------------------------
async function translateAll(texts, targetLang, concurrency = 5) {
  const results = new Array(texts.length);
  let index = 0;

  const worker = async () => {
    while (index < texts.length) {
      const i = index++;
      const text = texts[i];
      if (text && text.trim() !== '') {
        results[i] = await translateText(text, targetLang, `#${i}`);
      } else {
        results[i] = text; // garder les chaînes vides
      }
    }
  };

  const workers = Array(concurrency).fill().map(() => worker());
  await Promise.all(workers);
  return results;
}

// --------------------------------------------------------------
// Route de traduction
// --------------------------------------------------------------
app.post('/translate', async (req, res) => {
  const { texts, targetLang } = req.body;

  console.log('\n=== /translate appelé ===');
  console.log('Heure:', new Date().toISOString());
  console.log('Langue cible:', targetLang);
  console.log('Nombre de textes reçus:', texts?.length);

  if (!texts || !Array.isArray(texts) || !targetLang) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }

  try {
    const translated = await translateAll(texts, targetLang, 5); // 5 requêtes simultanées
    console.log(`Envoi de ${translated.length} traductions au client`);
    res.json(translated);
  } catch (error) {
    console.error('Erreur proxy:', error);
    res.status(500).json({ error: 'Échec de la traduction' });
  }
});

// --------------------------------------------------------------
// Route principale
// --------------------------------------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
