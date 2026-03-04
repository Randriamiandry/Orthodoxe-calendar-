document.addEventListener('DOMContentLoaded', () => {
  // Éléments DOM
  const dateInput = document.getElementById('dateInput');
  const fetchButton = document.getElementById('fetchButton');
  const prevDayBtn = document.getElementById('prevDayBtn');
  const nextDayBtn = document.getElementById('nextDayBtn');
  const loader = document.getElementById('loader');
  const errorDiv = document.getElementById('error');
  const resultsDiv = document.getElementById('results');
  const themeToggle = document.getElementById('themeToggle');
  const langSelect = document.getElementById('langSelect');
  const calendarSelect = document.getElementById('calendarSelect');

  // Variables globales
  let originalData = null;
  let currentLang = localStorage.getItem('lang') || 'fr';
  let currentCalendar = localStorage.getItem('calendar') || 'gregorian';

  // Dictionnaire des textes statiques (interface) – sans les jours
  const uiDict = {
    fr: {
      appTitle: 'Calendrier liturgique orthodoxe',
      chooseDate: 'Choisir une date :',
      show: 'Afficher',
      loading: 'Chargement des données...',
      fast: 'Jeûne',
      level: 'Niveau',
      exception: 'Exception',
      saints: 'Saints du jour',
      info: 'Informations complémentaires',
      paschaDistance: 'Distance à Pâques',
      notes: 'Notes',
      readings: 'Lectures du jour',
      stories: 'Histoires des saints',
      noData: 'Aucune information disponible pour cette date.',
      tone: 'Ton',
      chapter: 'Chapitre',
      feastsTitle: 'Fêtes',
      feastLevel: 'Niveau de la fête'
    },
    mg: {
      appTitle: 'Kalandrie litorjika ortodoksa',
      chooseDate: 'Safidio ny daty :',
      show: 'Asehoy',
      loading: 'Mampiditra angona...',
      fast: 'Fifadian-kanina',
      level: 'Ambaratonga',
      exception: 'Fanavahana manokana',
      saints: 'Olo-masina amin\'ny andro',
      info: 'Fanazavana fanampiny',
      paschaDistance: 'Elanelana mankany amin\'ny Paska',
      notes: 'Fanamarihana',
      readings: 'Vakiteny amin\'ny andro',
      stories: 'Tantaran\'ny olo-masina',
      noData: 'Tsy misy fanazavana ho an\'ity daty ity.',
      tone: 'Feo',
      chapter: 'Toko',
      feastsTitle: 'Fetin\'ny Fiangonana',
      feastLevel: 'Ambaratongam-pankalazana'
    },
    en: {
      appTitle: 'Orthodox Liturgical Calendar',
      chooseDate: 'Choose a date:',
      show: 'Show',
      loading: 'Loading data...',
      fast: 'Fast',
      level: 'Level',
      exception: 'Exception',
      saints: 'Saints of the day',
      info: 'Additional information',
      paschaDistance: 'Distance to Pascha',
      notes: 'Notes',
      readings: 'Readings of the day',
      stories: 'Stories of the saints',
      noData: 'No information available for this date.',
      tone: 'Tone',
      chapter: 'Chapter',
      feastsTitle: 'Feasts',
      feastLevel: 'Feast level'
    }
  };

  // Initialisation : thème, langue et calendrier
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') document.body.classList.add('dark-theme');
  langSelect.value = currentLang;
  calendarSelect.value = currentCalendar;
  updateStaticTexts();

  // Événements
  themeToggle.addEventListener('click', toggleTheme);
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    localStorage.setItem('lang', currentLang);
    updateStaticTexts();
    if (originalData) {
      translateAndDisplay(originalData);
    }
  });

  calendarSelect.addEventListener('change', (e) => {
    currentCalendar = e.target.value;
    localStorage.setItem('calendar', currentCalendar);
    if (originalData) {
      fetchDay(dateInput.value);
    }
  });

  fetchButton.addEventListener('click', () => {
    if (dateInput.value) fetchDay(dateInput.value);
  });

  prevDayBtn.addEventListener('click', () => changeDayBy(-1));
  nextDayBtn.addEventListener('click', () => changeDayBy(1));

  // Initialiser la date du jour
  const today = new Date();
  dateInput.value = formatDate(today);
  fetchDay();

  // --------------------------------------------------------------
  // Fonctions principales
  // --------------------------------------------------------------
  function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  }

  function updateStaticTexts() {
    const t = uiDict[currentLang];
    document.getElementById('app-title').textContent = t.appTitle;
    document.getElementById('choose-date-label').textContent = t.chooseDate;
    document.getElementById('show-btn-text').textContent = t.show;
    document.getElementById('loading-text').textContent = t.loading;
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function changeDayBy(delta) {
    const currentDate = new Date(dateInput.value + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + delta);
    dateInput.value = formatDate(currentDate);
    fetchDay(dateInput.value);
  }

  async function fetchDay(dateString = null) {
    let url = `https://orthocal.info/api/${currentCalendar}/`;
    if (dateString) {
      const [y, m, d] = dateString.split('-');
      url += `${y}/${m}/${d}/`;
    } else {
      const d = new Date();
      url += `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}/`;
    }

    loader.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    resultsDiv.innerHTML = '';

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      originalData = data;
      await translateAndDisplay(data);
    } catch (err) {
      console.error(err);
      showError('Date invalide ou problème avec l’API. Veuillez réessayer.');
    } finally {
      loader.classList.add('hidden');
    }
  }

  async function translateAndDisplay(data) {
    if (currentLang === 'en') {
      displayData(data);
    } else {
      try {
        console.log(`Tentative de traduction de l'anglais vers ${currentLang}...`);
        const translated = await translateData(data, currentLang);
        console.log('Traduction réussie');
        displayData(translated);
      } catch (err) {
        console.error('Échec de la traduction :', err);
        errorDiv.textContent = 'A technical error occurred. The information is temporarily displayed in English. Please try again later.';
        errorDiv.classList.remove('hidden');
        displayData(data);
      }
    }
  }

  // --------------------------------------------------------------
  // Traduction automatique via le proxy du serveur (POST /translate)
  // --------------------------------------------------------------
  async function translateData(obj, targetLang) {
    const translated = JSON.parse(JSON.stringify(obj));

    // 1. Traduction des métadonnées simples (chaînes)
    const simpleFields = ['summary_title', 'fast_level_desc', 'fast_exception_desc', 'feast_level_description'];
    for (const field of simpleFields) {
      if (translated[field] && typeof translated[field] === 'string' && translated[field].trim()) {
        const [translatedText] = await translateBatch([translated[field]], targetLang);
        translated[field] = translatedText;
      }
    }

    // 2. Traduction du tableau service_notes (si présent)
    if (translated.service_notes && Array.isArray(translated.service_notes) && translated.service_notes.length > 0) {
      translated.service_notes = await translateBatch(translated.service_notes, targetLang);
    }

    // 3. Traduction des saints (tableau)
    if (translated.saints && Array.isArray(translated.saints)) {
      translated.saints = await translateBatch(translated.saints, targetLang);
    }

    // 4. Traduction des titres (tableau)
    if (translated.titles && Array.isArray(translated.titles)) {
      translated.titles = await translateBatch(translated.titles, targetLang);
    }

    // 5. Traduction des lectures
    if (translated.readings && Array.isArray(translated.readings)) {
      for (const reading of translated.readings) {
        if (reading.source) {
          const [translatedSource] = await translateBatch([reading.source], targetLang);
          reading.source = translatedSource;
        }
        if (reading.display) {
          const [translatedDisplay] = await translateBatch([reading.display], targetLang);
          reading.display = translatedDisplay;
        }
        if (reading.passage && Array.isArray(reading.passage)) {
          const verseContents = reading.passage.map(v => v.content).filter(c => c && c.trim());
          if (verseContents.length > 0) {
            const translatedVerses = await translateBatch(verseContents, targetLang);
            let idx = 0;
            for (let i = 0; i < reading.passage.length; i++) {
              if (reading.passage[i].content && reading.passage[i].content.trim()) {
                reading.passage[i].content = translatedVerses[idx++];
              }
            }
          }
        }
      }
    }

    // 6. Traduction des histoires
    if (translated.stories && Array.isArray(translated.stories)) {
      for (const story of translated.stories) {
        if (story.title) {
          const [translatedTitle] = await translateBatch([story.title], targetLang);
          story.title = translatedTitle;
        }
        if (story.story) {
          const [translatedStory] = await translateBatch([story.story], targetLang);
          story.story = translatedStory;
        }
      }
    }

    return translated;
  }

  async function translateBatch(texts, targetLang) {
    if (!texts || texts.length === 0) return [];
    const response = await fetch('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  }

  // --------------------------------------------------------------
  // Affichage des données (utilise les dictionnaires)
  // --------------------------------------------------------------
  function displayData(data) {
    resultsDiv.innerHTML = '';
    const t = uiDict[currentLang];

    if (!data || typeof data !== 'object') {
      resultsDiv.innerHTML = `<p class="card">${t.noData}</p>`;
      return;
    }

    // Carte principale
    const titleCard = createCard();
    if (isSundayOrMajorFeast(data)) {
      titleCard.classList.add('highlight-card');
    }

    // Construction de la ligne de titre
    let titleLine = '';
    if (data.titles && data.titles.length > 0) {
      titleLine = `<p style="font-size: 1.2rem; margin-top: 10px;"><em>${data.titles[0]}</em> — ${t.tone} ${data.tone || '?'}</p>`;
    } else {
      titleLine = `<p style="font-size: 1.2rem; margin-top: 10px;">${t.tone} ${data.tone || '?'}</p>`;
    }

    titleCard.innerHTML = `
      <h2><i class="fas fa-calendar-day"></i> ${data.summary_title || 'Titre non disponible'}</h2>
      ${titleLine}
    `;
    resultsDiv.appendChild(titleCard);

    // Fêtes
    if (data.feasts && data.feasts.length > 0) {
      const feastsCard = createCard();
      feastsCard.innerHTML = `<h2><i class="fas fa-star"></i> ${t.feastsTitle}</h2>`;
      const ul = document.createElement('ul');
      ul.className = 'tag-list';
      data.feasts.forEach(feast => {
        const li = document.createElement('li');
        li.className = 'tag';
        li.textContent = feast;
        ul.appendChild(li);
      });
      feastsCard.appendChild(ul);
      resultsDiv.appendChild(feastsCard);
    }

    // Jeûne
    if (data.fast_level_desc || data.fast_exception_desc) {
      const fastCard = createCard();
      fastCard.innerHTML = `
        <h2><i class="fas fa-utensils"></i> ${t.fast}</h2>
        <p><strong>${t.level} :</strong> ${data.fast_level_desc || '—'}</p>
        <p><strong>${t.exception} :</strong> ${data.fast_exception_desc || '—'}</p>
      `;
      resultsDiv.appendChild(fastCard);
    }

    // Saints
    if (data.saints && data.saints.length > 0) {
      const saintsCard = createCard();
      saintsCard.innerHTML = `<h2><i class="fas fa-cross"></i> ${t.saints}</h2>`;
      const ul = document.createElement('ul');
      ul.className = 'tag-list';
      data.saints.forEach(saint => {
        const li = document.createElement('li');
        li.className = 'tag';
        li.textContent = saint;
        ul.appendChild(li);
      });
      saintsCard.appendChild(ul);
      resultsDiv.appendChild(saintsCard);
    }

    // Informations complémentaires
    const extraCard = createCard();
    let extraHTML = `<h2><i class="fas fa-info-circle"></i> ${t.info}</h2>`;
    extraHTML += `<p><strong>${t.paschaDistance} :</strong> ${data.pascha_distance ?? '—'} jours</p>`;
    if (data.feast_level_description) {
      extraHTML += `<p><strong>${t.feastLevel} :</strong> ${data.feast_level_description}</p>`;
    }
    if (data.service_notes && Array.isArray(data.service_notes) && data.service_notes.length > 0) {
      extraHTML += `<p><strong>${t.notes} :</strong></p><ul class="note-list">`;
      data.service_notes.forEach(note => {
        extraHTML += `<li>${note}</li>`;
      });
      extraHTML += `</ul>`;
    } else if (data.service_notes && typeof data.service_notes === 'string') {
      // Au cas où ce serait une chaîne (ancien format)
      extraHTML += `<p><strong>${t.notes} :</strong> ${data.service_notes}</p>`;
    }
    extraCard.innerHTML = extraHTML;
    resultsDiv.appendChild(extraCard);

    // Lectures
    if (data.readings && data.readings.length > 0) {
      const readingsCard = createCard();
      readingsCard.innerHTML = `<h2><i class="fas fa-bible"></i> ${t.readings}</h2>`;
      data.readings.forEach(reading => {
        const readingDiv = document.createElement('div');
        readingDiv.className = 'reading-item';

        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'reading-source';
        sourceDiv.innerHTML = `<i class="fas fa-scroll"></i> ${reading.source || 'Source inconnue'}`;
        readingDiv.appendChild(sourceDiv);

        if (reading.display) {
          const displayDiv = document.createElement('div');
          displayDiv.className = 'reading-display';
          displayDiv.textContent = reading.display;
          readingDiv.appendChild(displayDiv);
        }

        if (reading.passage && reading.passage.length > 0) {
          let currentChapter = null;
          reading.passage.forEach(item => {
            const chapter = item.chapter;
            if (chapter !== currentChapter) {
              currentChapter = chapter;
              const chapterDiv = document.createElement('div');
              chapterDiv.className = 'reading-chapter';
              chapterDiv.innerHTML = `<i class="fas fa-bookmark"></i> ${t.chapter} ${chapter}`;
              readingDiv.appendChild(chapterDiv);
            }
            const verseDiv = document.createElement('div');
            verseDiv.className = 'reading-verse';
            verseDiv.innerHTML = `<span class="verse-ref">${chapter}:${item.verse}</span> <span class="verse-text">${item.content}</span>`;
            readingDiv.appendChild(verseDiv);
          });
        } else {
          const noVerse = document.createElement('p');
          noVerse.textContent = 'Aucun verset détaillé.';
          readingDiv.appendChild(noVerse);
        }
        readingsCard.appendChild(readingDiv);
      });
      resultsDiv.appendChild(readingsCard);
    }

    // Histoires
    if (data.stories && data.stories.length > 0) {
      const storiesCard = createCard();
      storiesCard.innerHTML = `<h2><i class="fas fa-book-open"></i> ${t.stories}</h2>`;
      data.stories.forEach(story => {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'story-item';
        storyDiv.innerHTML = `
          <div class="story-title"><i class="fas fa-user"></i> ${story.title || ''}</div>
          <div class="story-content">${story.story || ''}</div>
        `;
        storiesCard.appendChild(storyDiv);
      });
      resultsDiv.appendChild(storiesCard);
    }

    if (resultsDiv.children.length === 0) {
      resultsDiv.innerHTML = `<p class="card">${t.noData}</p>`;
    }
  }

  // --------------------------------------------------------------
  // Utilitaires
  // --------------------------------------------------------------
  function createCard() {
    const card = document.createElement('div');
    card.className = 'card';
    return card;
  }

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  function isSundayOrMajorFeast(data) {
    if (data.weekday === 0) return true;
    if (data.feasts) {
      const majorKeywords = ['pâques', 'nativité', 'theophanie', 'pentecôte', 'dormition', 'orthodoxy'];
      return data.feasts.some(f => majorKeywords.some(keyword => f.toLowerCase().includes(keyword)));
    }
    return false;
  }
});