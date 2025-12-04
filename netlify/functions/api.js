const express = require('express');
const cors = require('cors');

// Variables hardcoded
const config = {
  MJ_APIKEY_PUBLIC: 'e162678819818aac742356c0b675b568',
  MJ_APIKEY_PRIVATE: 'd546dbc29649d21dd7f24e155e434add',
  MJ_FROM_EMAIL: 'kamgathierry@cinaf.tv',
  VITE_PUBLIC_BUILDER_KEY: '7438819957ca45f78bda6f56031a37bc',
  BUILDER_PRIVATE_KEY: 'bpk-15cb0ca1ae11476a8cfcf5b81f07b97d',
  SUPABASE_URL: 'https://naqvqgapovjbakantwst.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcXZxZ2Fwb3ZqYmFrYW50d3N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2NTIwNywiZXhwIjoyMDY4MjQxMjA3fQ.yGy-sHXKcgvx6YVJK5uMOm5xaYyDlxTU8GdvjiEjW1s',
  OPENAI_API_KEY: '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',
  GEMINI_API_KEY: 'AIzaSyBZRdYr5Lge7Tjf6-mns-HlX319uQaxfyc',
  HUGGINGFACE_API_KEY: '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',
  SPOTIFY_CLIENT_ID: 'ad7c52e322ae4d74917ffec8be8a36b5'
};

// Handler pour Netlify Functions
exports.handler = async (event, context) => {
  try {
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Route de test
    app.get('/api/ping', (req, res) => {
      res.json({ message: 'pong from Netlify Functions!' });
    });
    
    // Route quiz
    app.post('/api/quiz', (req, res) => {
      res.json({ 
        message: 'Quiz endpoint working',
        data: { question: 'Test question', options: ['A', 'B', 'C'] }
      });
    });
    
    // Route chat
    app.post('/api/chat', (req, res) => {
      res.json({ 
        message: 'Chat endpoint working',
        response: 'Hello from hardcoded backend!'
      });
    });
    
    // Simuler le traitement de la requête
    const method = event.httpMethod;
    const path = event.path;
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        message: 'API Netlify avec hardcoded variables',
        path: path,
        method: method,
        config: { keys: Object.keys(config) }
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
