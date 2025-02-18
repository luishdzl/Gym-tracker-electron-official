const { app, BrowserWindow } = require('electron')
const path = require('path')
const { fork } = require('child_process')
const fs = require('fs')

let mainWindow

function createWindow() {
  const dbPath = path.join(app.getPath('userData'), 'gymtracker.db');
  
  // 1. Crear directorio primero
  const dbFolder = path.dirname(dbPath);
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }

  // 2. Configurar ruta del backend
  const backendPath = process.env.NODE_ENV === 'development' 
    ? path.join(__dirname, '../backend/app.js')
    : path.join(__dirname, 'backend/app.js'); // Ruta relativa en producción

  // 3. Iniciar backend
  const backendProcess = fork(backendPath, {
    env: {
      DB_PATH: dbPath,
      ELECTRON: 'true'
    }
  });



// Añadir verificación explícita del archivo
if (!fs.existsSync(dbPath)) {
  console.log("El archivo de base de datos no existe. Debería crearse automáticamente.");
}

  // Verificar la rura en consola
  console.log("Ruta de la base de datos:", dbPath);

  // Crear ventana
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Cargar el frontend
  const indexPath = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'  // Modo desarrollo
    : `file://${path.join(__dirname, '../public/index.html')}`;  // Modo producción

  mainWindow.loadURL(indexPath).catch(err => {
    console.error("Error al cargar la URL:", err);
    app.quit();
  });

  // Solo abrir DevTools en desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}


const { ipcMain, dialog } = require('electron')

ipcMain.handle('dialog:openFile', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'SQLite Databases', extensions: ['sqlite', 'db'] }]
  })
  return filePaths[0]
})

ipcMain.handle('dialog:saveFile', async () => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'SQLite Databases', extensions: ['sqlite', 'db'] }]
  })
  return filePath
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})