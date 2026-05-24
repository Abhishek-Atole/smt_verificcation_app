import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    title: 'SMT Verification Admin',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
  // In development prefer the Vite dev server when available so hot-reload works.
  const possibleDevUrls = [
    process.env.VITE_DEV_SERVER_URL,
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter(Boolean);

  const tryDevUrls = async () => {
    for (const url of possibleDevUrls) {
      try {
        // attempt to load dev server URL; if it fails we'll try the next
        await window.loadURL(url);
        // open devtools when running from dev server
        try {
          window.webContents.openDevTools({ mode: 'detach' });
        } catch (err) {
          // ignore if opening devtools fails
        }
        return true;
      } catch (e) {
        // continue to next url
      }
    }
    return false;
  };

  // Forward renderer console messages and load errors to the main process stdout
  try {
    window.webContents.on('console-message', (event, level, message, line, sourceId) => {
      try {
        console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
      } catch (e) {}
    });

    window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Renderer failed to load:', errorCode, errorDescription, validatedURL);
    });

    window.webContents.on('crashed', () => {
      console.error('Renderer process crashed');
    });
  } catch (e) {
    // ignore if webContents not available yet
  }

  // try dev servers first, otherwise load the built file
  tryDevUrls().then((loaded) => {
    if (!loaded) {
      // When loading the built app via file://, absolute asset paths like `/assets/...`
      // will not resolve. Create a small local copy with relative asset paths so
      // the renderer can find the JS/CSS under `dist/assets/`.
      try {
        import('fs')
          .then((fs) => {
            const distDir = path.join(__dirname, '..', 'dist');
            const electronIndex = path.join(distDir, 'index.electron.html');
            let html = fs.readFileSync(indexHtmlPath, 'utf8');
            html = html.replace(/\b\/assets\//g, './assets/');
            fs.writeFileSync(electronIndex, html, 'utf8');
            window.loadFile(electronIndex).catch((err) => {
              console.error('Failed to load electron index file', err);
            });
          })
          .catch((err) => {
            console.error('Failed to import fs for electron index prep', err);
          });
      } catch (err) {
        console.error('Failed to prepare electron index file', err);
      }
    }
  });

  return window;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
