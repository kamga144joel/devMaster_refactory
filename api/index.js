const express = require('express');
const cors = require('cors');
const path = require('path');

// Import des routes TypeScript (converties pour Node.js)
const { handleDemo } = require('../server/routes/demo');
const { handleMentor } = require('../server/routes/mentor');
const { handleExercise } = require('../server/routes/exercise');
const { handleQuiz } = require('../server/routes/quiz');
const { handleCourse } = require('../server/routes/course');
const { handleChat } = require('../server/routes/chat');
const { geniusSearch, geniusLyrics } = require('../server/routes/genius');
const { spotifySearch, spotifyTrack } = require('../server/routes/spotify');
const { handleImage } = require('../server/routes/image');
const { exportPdf, exportDocx, exportCourse } = require('../server/routes/export');
const { webSearch } = require('../server/routes/search');
const { handleGlossary } = require('../server/routes/glossary');
const { handleSave } = require('../server/routes/save');
const { handleContact } = require('../server/routes/contact');
const { handleSendMailjet } = require('../server/routes/send-mailjet');
const { handleSendWelcome } = require('../server/routes/send-welcome-mail');
const { handleWelcomeList } = require('../server/routes/welcome-list');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des variables d'environnement
process.env.NODE_ENV = 'production';

// Routes API
app.get('/api/ping', (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? 'ping';
  res.json({ message: ping });
});

app.get('/api/demo', handleDemo);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/mentor', handleMentor);
app.post('/api/exercise', handleExercise);
app.post('/api/quiz', handleQuiz);
app.post('/api/course', handleCourse);
app.post('/api/chat', handleChat);
app.post('/api/image', handleImage);

app.get('/api/genius/search', geniusSearch);
app.get('/api/genius/lyrics', geniusLyrics);
app.get('/api/spotify/search', spotifySearch);
app.get('/api/spotify/track', spotifyTrack);
app.get('/api/search', webSearch);

app.post('/api/export/pdf', exportPdf);
app.post('/api/export/docx', exportDocx);
app.post('/api/export/course', exportCourse);

app.post('/api/glossary', handleGlossary);
app.post('/api/save', handleSave);
app.post('/api/contact', handleContact);
app.post('/api/send-mailjet', handleSendMailjet);
app.post('/api/send-welcome-mail', handleSendWelcome);
app.get('/api/welcome-list', handleWelcomeList);

// Middleware pour les erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Export pour Vercel
module.exports = (req, res) => {
  app(req, res);
};
