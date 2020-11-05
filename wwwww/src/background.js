// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.
import path from 'path';
import url from 'url';
import { app, Menu } from 'electron';
// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from 'env';
import { devMenuTemplate } from './menu/dev_menu_template';
import createWindow from './helpers/window';
import { START_IDLE_TIMER } from "./constants";
const fs = require('fs');
var log = require('electron-log');
// Same as for console transport
log.transports.file.level = 'debug';
log.transports.file.format = '[{h}:{i}:{s}:{ms}] {text}';

// Set approximate maximum log size in bytes. When it exceeds,
// the archived log will be saved as the log.old.log file
log.transports.file.maxSize = 5 * 1024 * 1024;

// Write to this file, must be set before first logging
log.transports.file.file = __dirname + '/log.log';

// fs.createWriteStream options, must be set before first logging
// you can find more information at
// https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
log.transports.file.streamConfig = { flags: 'a' };

// set existed file stream
log.transports.file.stream = fs.createWriteStream(log.transports.file.file, { flags: 'a' });
log.transports.file.appName = 'AMDV';

const setApplicationMenu = () => {
  const menus = [];
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.commandLine.appendSwitch('js-flags', '--expose_gc');

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    show: false
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'app.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  mainWindow.webContents.on('did-finish-load', function() {
    mainWindow.show();
    mainWindow.webContents.send(START_IDLE_TIMER);
  });

  if (env.name === 'development') {
    mainWindow.openDevTools();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('browser-window-created', function(e, window) {
  if (env.name == 'production') {
    window.setMenu(null);
  }
});

process.on('uncaughtException', err => {
  log.error(err, 'Uncaught Exception thrown');
});
