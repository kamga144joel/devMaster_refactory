const { createServer } = require('../../server');

// Handler pour Netlify Functions
exports.handler = async (event, context) => {
  try {
    // Importer et créer le serveur Express
    const app = createServer();
    
    // Simuler une requête Express
    const mockReq = {
      method: event.httpMethod,
      url: event.path,
      headers: event.headers,
      body: event.body,
      query: event.queryStringParameters
    };
    
    // Retourner une réponse simple pour tester
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        message: 'API Netlify fonctionnelle',
        path: event.path,
        method: event.httpMethod
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
