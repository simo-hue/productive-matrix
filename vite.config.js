import fs from 'fs';
import path from 'path';

// Local storage backend emulation natively hooked into Vite's dev server.
const tasksFilePath = path.resolve(process.cwd(), 'tasks.json');

const localApiPlugin = () => ({
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Ensure file exists when API is called
      if (!fs.existsSync(tasksFilePath)) {
        fs.writeFileSync(tasksFilePath, '[]');
      }

      if (req.url === '/api/tasks' && req.method === 'GET') {
        const data = fs.readFileSync(tasksFilePath, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.end(data);
        return;
      }

      if (req.url === '/api/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          fs.writeFileSync(tasksFilePath, body);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        });
        return;
      }
      
      next();
    });
  }
});

export default {
  plugins: [localApiPlugin()]
};
