const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.SERVER_PORT || 3000;
const API_KEY = process.env.API_KEY || '';

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ZAWSZE SERWUJ INDEX.HTML
  fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: index.html not found');
      return;
    }
    
    // Wstrzyknięcie klucza
    const html = content.replace('// __ENV_INJECTION__', `window.ENV = { API_KEY: "${API_KEY}" };`);
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`>>> QD AI STUDIO RUNNING ON PORT ${PORT} <<<`);
});