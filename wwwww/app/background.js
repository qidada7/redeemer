/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/background.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./config/env_development.json":
/*!*************************************!*\
  !*** ./config/env_development.json ***!
  \*************************************/
/*! exports provided: name, description, default */
/***/ (function(module) {

module.exports = {"name":"development","description":"Add here any environment specific stuff you like."};

/***/ }),

/***/ "./src/background.js":
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! path */ "path");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var url__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! url */ "url");
/* harmony import */ var url__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(url__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! electron */ "electron");
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var env__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! env */ "./config/env_development.json");
var env__WEBPACK_IMPORTED_MODULE_3___namespace = /*#__PURE__*/__webpack_require__.t(/*! env */ "./config/env_development.json", 1);
/* harmony import */ var _menu_dev_menu_template__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./menu/dev_menu_template */ "./src/menu/dev_menu_template.js");
/* harmony import */ var _helpers_window__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./helpers/window */ "./src/helpers/window.js");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./constants */ "./src/constants.js");
// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.


 // Special module holding environment variables which you declared
// in config/env_xxx.json file.






const fs = __webpack_require__(/*! fs */ "fs");

var log = __webpack_require__(/*! electron-log */ "electron-log"); // Same as for console transport


log.transports.file.level = 'debug';
log.transports.file.format = '[{h}:{i}:{s}:{ms}] {text}'; // Set approximate maximum log size in bytes. When it exceeds,
// the archived log will be saved as the log.old.log file

log.transports.file.maxSize = 5 * 1024 * 1024; // Write to this file, must be set before first logging

log.transports.file.file = __dirname + '/log.log'; // fs.createWriteStream options, must be set before first logging
// you can find more information at
// https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options

log.transports.file.streamConfig = {
  flags: 'a'
}; // set existed file stream

log.transports.file.stream = fs.createWriteStream(log.transports.file.file, {
  flags: 'a'
});
log.transports.file.appName = 'AMDV';

const setApplicationMenu = () => {
  const menus = [];

  if (env__WEBPACK_IMPORTED_MODULE_3__.name !== 'production') {
    menus.push(_menu_dev_menu_template__WEBPACK_IMPORTED_MODULE_4__["devMenuTemplate"]);
  }

  electron__WEBPACK_IMPORTED_MODULE_2__["Menu"].setApplicationMenu(electron__WEBPACK_IMPORTED_MODULE_2__["Menu"].buildFromTemplate(menus));
}; // Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.


if (env__WEBPACK_IMPORTED_MODULE_3__.name !== 'production') {
  const userDataPath = electron__WEBPACK_IMPORTED_MODULE_2__["app"].getPath('userData');
  electron__WEBPACK_IMPORTED_MODULE_2__["app"].setPath('userData', `${userDataPath} (${env__WEBPACK_IMPORTED_MODULE_3__.name})`);
}

electron__WEBPACK_IMPORTED_MODULE_2__["app"].commandLine.appendSwitch('js-flags', '--expose_gc');
electron__WEBPACK_IMPORTED_MODULE_2__["app"].on('ready', () => {
  setApplicationMenu();
  const mainWindow = Object(_helpers_window__WEBPACK_IMPORTED_MODULE_5__["default"])('main', {
    width: 1000,
    height: 600,
    show: false
  });
  mainWindow.loadURL(url__WEBPACK_IMPORTED_MODULE_1___default.a.format({
    pathname: path__WEBPACK_IMPORTED_MODULE_0___default.a.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true
  }));
  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.show();
    mainWindow.webContents.send(_constants__WEBPACK_IMPORTED_MODULE_6__["START_IDLE_TIMER"]);
  });

  if (env__WEBPACK_IMPORTED_MODULE_3__.name === 'development') {
    mainWindow.openDevTools();
  }
});
electron__WEBPACK_IMPORTED_MODULE_2__["app"].on('window-all-closed', () => {
  electron__WEBPACK_IMPORTED_MODULE_2__["app"].quit();
});
electron__WEBPACK_IMPORTED_MODULE_2__["app"].on('browser-window-created', function (e, window) {
  if (env__WEBPACK_IMPORTED_MODULE_3__.name == 'production') {
    window.setMenu(null);
  }
});
process.on('uncaughtException', err => {
  log.error(err, 'Uncaught Exception thrown');
});

/***/ }),

/***/ "./src/constants.js":
/*!**************************!*\
  !*** ./src/constants.js ***!
  \**************************/
/*! exports provided: WIDGET_MODE, DEFAULT_COLORS, START_IDLE_TIMER, PRODUCT_CODE, DB_NAME, REG_NOTY_QUEUE, TIMER_NOTY_QUEUE, ONE_SECOND, ONE_MINUTE_IN_SECOND, MAX_IDLE_TIME */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "WIDGET_MODE", function() { return WIDGET_MODE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DEFAULT_COLORS", function() { return DEFAULT_COLORS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "START_IDLE_TIMER", function() { return START_IDLE_TIMER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PRODUCT_CODE", function() { return PRODUCT_CODE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DB_NAME", function() { return DB_NAME; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "REG_NOTY_QUEUE", function() { return REG_NOTY_QUEUE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TIMER_NOTY_QUEUE", function() { return TIMER_NOTY_QUEUE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_SECOND", function() { return ONE_SECOND; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_MINUTE_IN_SECOND", function() { return ONE_MINUTE_IN_SECOND; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MAX_IDLE_TIME", function() { return MAX_IDLE_TIME; });
// define the display mode
const WIDGET_MODE = {
  RULER: 'ruler',
  ANGLE: 'angle',
  DELETE: 'delete',
  AUTO_ROTATION: 'auto_rotation',
  NO_SELECTION: 'no_selection'
};
Object.freeze(WIDGET_MODE);
const DEFAULT_COLORS = [0xf44336, 0xf8877e, 0xbdc1fb, 0x262b65, 0x69f65e, 0x122a0f, 0x7e3630, 0x411b18, 0x220e0c, 0x5e69f6, 0xadb2fa, 0xf44336, 0xf8877e, 0xbdc1fb, 0x262b65, 0x69f65e, 0x122a0f, 0x7e3630, 0x411b18, 0x220e0c, 0x5e69f6, 0xadb2fa, 0xf44336, 0xf8877e, 0xbdc1fb, 0x262b65, 0x69f65e, 0x122a0f, 0x7e3630, 0x411b18, 0x220e0c, 0x5e69f6, 0xadb2fa];
const START_IDLE_TIMER = "START_IDLE_TIMER";
const PRODUCT_CODE = "amdv-plain";
const DB_NAME = "amdv";
const REG_NOTY_QUEUE = "REG_NOTY_QUEUE";
const TIMER_NOTY_QUEUE = "TIMER_NOTY_QUEUE";
const ONE_SECOND = 1000;
const ONE_MINUTE_IN_SECOND = 60;
const MAX_IDLE_TIME = 20 * ONE_MINUTE_IN_SECOND;

/***/ }),

/***/ "./src/helpers/window.js":
/*!*******************************!*\
  !*** ./src/helpers/window.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ "electron");
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var fs_jetpack__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! fs-jetpack */ "fs-jetpack");
/* harmony import */ var fs_jetpack__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(fs_jetpack__WEBPACK_IMPORTED_MODULE_1__);
// This helper remembers the size and position of your windows (and restores
// them in that place after app relaunch).
// Can be used for more than one window, just construct many
// instances of it and give each different name.


/* harmony default export */ __webpack_exports__["default"] = ((name, options) => {
  const userDataDir = fs_jetpack__WEBPACK_IMPORTED_MODULE_1___default.a.cwd(electron__WEBPACK_IMPORTED_MODULE_0__["app"].getPath("userData"));
  const stateStoreFile = `window-state-${name}.json`;
  const defaultSize = {
    width: options.width,
    height: options.height,
    show: false
  };
  let state = {};
  let win;

  const restore = () => {
    let restoredState = {};

    try {
      restoredState = userDataDir.read(stateStoreFile, "json");
    } catch (err) {// For some reason json can't be read (might be corrupted).
      // No worries, we have defaults.
    }

    return Object.assign({}, defaultSize, restoredState);
  };

  const getCurrentPosition = () => {
    const position = win.getPosition();
    const size = win.getSize();
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1]
    };
  };

  const windowWithinBounds = (windowState, bounds) => {
    return windowState.x >= bounds.x && windowState.y >= bounds.y && windowState.x + windowState.width <= bounds.x + bounds.width && windowState.y + windowState.height <= bounds.y + bounds.height;
  };

  const resetToDefaults = () => {
    const bounds = electron__WEBPACK_IMPORTED_MODULE_0__["screen"].getPrimaryDisplay().bounds;
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2
    });
  };

  const ensureVisibleOnSomeDisplay = windowState => {
    const visible = electron__WEBPACK_IMPORTED_MODULE_0__["screen"].getAllDisplays().some(display => {
      return windowWithinBounds(windowState, display.bounds);
    });

    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }

    return windowState;
  };

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition());
    }

    userDataDir.write(stateStoreFile, state, {
      atomic: true
    });
  };

  state = ensureVisibleOnSomeDisplay(restore());
  win = new electron__WEBPACK_IMPORTED_MODULE_0__["BrowserWindow"](Object.assign({}, options, state));
  win.on('close', e => {
    e.preventDefault();
    electron__WEBPACK_IMPORTED_MODULE_0__["dialog"].showMessageBox({
      type: 'info',
      // title: '提示',
      message: '您确定要退出吗？',
      buttons: ['取消', '确定']
    }, idx => {
      if (idx == 0) {
        e.preventDefault();
      } else {
        saveState;
        win = null;
        electron__WEBPACK_IMPORTED_MODULE_0__["app"].exit();
      }
    });
  });
  return win;
});

/***/ }),

/***/ "./src/menu/dev_menu_template.js":
/*!***************************************!*\
  !*** ./src/menu/dev_menu_template.js ***!
  \***************************************/
/*! exports provided: devMenuTemplate */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "devMenuTemplate", function() { return devMenuTemplate; });
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ "electron");
/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);

const devMenuTemplate = {
  label: "Development",
  submenu: [{
    label: "Reload",
    accelerator: "CmdOrCtrl+R",
    click: () => {
      electron__WEBPACK_IMPORTED_MODULE_0__["BrowserWindow"].getFocusedWindow().webContents.reloadIgnoringCache();
    }
  }, {
    label: "Toggle DevTools",
    accelerator: "Alt+CmdOrCtrl+I",
    click: () => {
      electron__WEBPACK_IMPORTED_MODULE_0__["BrowserWindow"].getFocusedWindow().toggleDevTools();
    }
  }, {
    label: "Quit",
    accelerator: "CmdOrCtrl+Q",
    click: () => {
      electron__WEBPACK_IMPORTED_MODULE_0__["app"].quit();
    }
  }]
};

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ }),

/***/ "electron-log":
/*!*******************************!*\
  !*** external "electron-log" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("electron-log");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),

/***/ "fs-jetpack":
/*!*****************************!*\
  !*** external "fs-jetpack" ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("fs-jetpack");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ })

/******/ });
//# sourceMappingURL=background.js.map