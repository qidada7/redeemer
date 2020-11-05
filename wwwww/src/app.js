import jQuery from 'jquery';
window.jQuery = jQuery;
window.$ = jQuery;

const Noty = require('noty');
require('jquery-ui-bundle');

require('../semantic/dist/semantic.min.js');
require('./ui/sidebar.js');

import '../semantic/dist/semantic.min.css';
import './stylesheets/font/flaticon.css';
import './stylesheets/main.css';

// Small helpers you might want to keep
import './helpers/context_menu.js';
import './helpers/external_links.js';
// import * as MedicalViewer from './viewers';
import MedicalViewer from './MedicalViewer';
import {
  WIDGET_MODE,
  DEFAULT_COLORS,
  START_IDLE_TIMER,
  PRODUCT_CODE,
  DB_NAME,
  REG_NOTY_QUEUE,
  TIMER_NOTY_QUEUE,
  MAX_IDLE_TIME,
  ONE_SECOND
} from './constants';
import { ORGAN_NAME_REGEX } from './helpers/filenameHelper';
// ----------------------------------------------------------------------------
// Everything below is just to show you how it works. You can delete all of it.
// ----------------------------------------------------------------------------

import { remote, ipcRenderer } from 'electron';
import Dexie from 'dexie';
import jetpack from 'fs-jetpack';
import { machineIdSync } from '@garycourt/node-machine-id';
const licenseKeyGen = require('license-key-gen');
const format = require('string-format');
format.extend(String.prototype, {});
const directoryExists = require('directory-exists');

const ko = require('knockout');
const fs = require('fs');
const log = remote.require("electron-log");

process.on('uncaughtException', err => {
  log.error(err, 'Uncaught Exception thrown');
  // remote.dialog.showErrorBox(
  //   'Unexpected issue happened',
  //   'Please restart the application.'
  // );
});

log.info("Creating DB...");
const db = new Dexie(DB_NAME);

let timeoutId;
let timeInSeconds = 10;
ipcRenderer.on(START_IDLE_TIMER, ({ event }) => {
  log.info("Starting Idle timmer...");
  setupTimers();
});

function setupTimers() {
  document.addEventListener('mousemove', resetTimer, false);
  document.addEventListener('mousedown', resetTimer, false);
  document.addEventListener('keypress', resetTimer, false);
  document.addEventListener('touchmove', resetTimer, false);

  startTimer();
}

function resetTimer() {
  window.clearInterval(timeoutId);
  updateTimer();
  startTimer();
}

function startTimer() {
  timeInSeconds = MAX_IDLE_TIME;
  // window.setTimeout returns an Id that can be used to start and stop a timer
  timeoutId = window.setInterval(onceSecondPassed, ONE_SECOND);
}

function onceSecondPassed() {
  $.when(updateTimer()).then(() => {
    if (timeInSeconds-- == 0) {
      clearInterval(timeoutId);
      doInactive();
    }
  });
}

function updateTimer() {
  let minutes = parseInt(timeInSeconds / 60, 10);
  let seconds = parseInt(timeInSeconds % 60, 10);

  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  if (seconds <= 10 && minutes == 0) {
    let message = "应用将在 <span class='timer'>"+minutes+":"+seconds+"</span> 后关闭!";
    new Noty({
      layout: 'topRight',
      type: 'warning',
      theme: 'relax',
      text: message,
      progressBar: true,
      killer: TIMER_NOTY_QUEUE,
      timeout: 1000,
      queue:TIMER_NOTY_QUEUE
    }).show();
  } else {

  }
}

function doInactive() {
  app.quit();
}

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());
ko.extenders.hexColor = function(target, option) {
  target.hexColor = ko.computed({
    read: function() {
      return '#' + this().toString(16);
    },
    write: function(value) {
      this(value / 100);
    },
    owner: target
  });
  return target;
};
// Holy crap! This is browser window with HTML and stuff, but I can read
// files from disk like it's node.js! Welcome to Electron world :)

function Viewmodel() {
  const manifest = appDir.read('package.json', 'json');

  // always store the this keyword first.
  let self = this;

  self.machineId = ko.observable(machineIdSync());
  self.licenseKey = ko.observable();

  self.hide2D = ko.observable(true);
  self.hideVr = ko.observable(true);
  self.stlOrganArray = ko.observableArray();
  self.isRegistered = ko.observable(false);
  self.medicalViewer = null;

  //initialize the registration
  db.version(1).stores({ registration: '++id,machineId,key' });
  log.info("Checking Registration Status...");
  db.transaction('rw', db.registration, function*() {
    // check if the machineId is calculated and inserted.
    if (
      (yield db.registration
        .where('machineId')
        .equalsIgnoreCase(self.machineId())
        .count()) === 0
    ) {
      let id = yield db.registration.add({ machineId: self.machineId() });
    }
    const registration = yield db.registration
      .where('machineId')
      .equalsIgnoreCase(self.machineId())
      .first();
    let {errorCode, message} =  (yield self.validateRegistration(registration));
    self.isRegistered(errorCode === 0);
    log.info("isRegistered: "+ self.isRegistered()+" Message: "+ message);
  }).catch(e => {
    log.info("Failing to verify registration status: "+e.stack);
  });

  self.validateRegistration = ({ machineId, key }) => {
    let info = { machineId };
    let licenseData = { info, prodCode: PRODUCT_CODE };
    try {
      var validateResult = licenseKeyGen.validateLicense(licenseData, key);
      return validateResult;
    } catch (err) {
      log.info(err)
      return err;
    }
  };

  log.info("Preparing Environment. ");

  function Organ(filePath, name, label, colorHex, opacityIndex = 0) {
    let self = this;
    self.opacityOptions = [1, 0.75, 0.5, 0.25, 0];
    self.opacityIndex = opacityIndex;
    self.name = ko.observable(name);
    self.htmlColor = ko.observable('#' + colorHex.toString(16));
    self.opacity = ko.observable(self.opacityOptions[self.opacityIndex]);
    self.location = filePath;
    self.label = label;
    self.color = colorHex;
    self.opacityFormatted = ko.computed(function() {
      return self.opacity() * 100 + '%';
    });
    self.switchOpacity = () => {
      self.opacityIndex = (self.opacityIndex + 1) % self.opacityOptions.length;
      self.opacity(self.opacityOptions[self.opacityIndex]);
    };
  }

  // self.selectedStlFiles = [];
  //describe what the mode of current is.
  self.widgetMode = ko.observable(WIDGET_MODE.NO_SELECTION);

  self.openAbout = () => {
    $('.ui.modal.about')
      .modal({ closable: false, useFlex: true })
      .modal('show');
  };
  //打开用户登录
  self.openUserPost = () => {
    ('.ui.modal.userPost')
     .modal({
         closable: false,
         useFlex: true
       })
       .modal('show');
  }
  self.openUserMsg = () => {
    $('.ui.modal.userMsg')
      .modal({ closable: false, useFlex: true })
      .modal('show');
  };

  self.openFolder = () => {
      if (this.medicalViewer) {
           remote.dialog.showMessageBox({
            type: 'info',
            // title: '提示',
            message:'已加载文件，是否重新加载？',
            buttons:['取消','确定'],
          },(idx)=>{
            if(idx==0){
              e.preventDefault();
            }else{
               const selectedFolder = remote.dialog.showOpenDialog(
                {
                  defaultPath: app.getAppPath() + '\\app\\data\\',
                  properties: ['openDirectory']
                },
                self.readDicomAndStlFiles
              );
            }
          })
      }else{
          const selectedFolder = remote.dialog.showOpenDialog(
            {
              defaultPath: app.getAppPath() + '\\app\\data\\',
              properties: ['openDirectory']
            },
            self.readDicomAndStlFiles
          );
      }

  };

  self.readDicomAndStlFiles = selectedFolders => {
    if (selectedFolders === undefined) {
      log.debug('No file selected!');
      return;
    }
    // force the Garbage Collection happened.
    global.gc();
    // try to read from dcom files
    let errorMessages = [];
    let dicomFilePaths = self.readFiles(
      selectedFolders.toString(),
      'dicom',
      errorMessages
    );
    let selectedStlFiles = self.readFiles(
      selectedFolders.toString(),
      'stl',
      errorMessages
    );

    if (errorMessages.length !== 0) {
      let errorBody = errorMessages.join('\n\r');
      remote.dialog.showErrorBox('无法找到文件夹：', errorBody);
      return;
    }
    this.reset();
    if (dicomFilePaths.size !== 0 && selectedStlFiles.size !== 0) {
      let stlDataInfo = [];
      let count = 0;
      selectedStlFiles.forEach((filePath, fileName) => {
        let organName = fileName.match(ORGAN_NAME_REGEX)
          ? fileName.match(ORGAN_NAME_REGEX)[0]
          : fileName;
        let organHtml = new Organ(
          filePath,
          organName,
          fileName,
          DEFAULT_COLORS[count]
        );
        let details = {
          location: filePath,
          label: fileName,
          loaded: false,
          material: null,
          materialFront: null,
          materialBack: null,
          mesh: null,
          meshFront: null,
          meshBack: null,
          color: DEFAULT_COLORS[count],
          opacity: organHtml.opacity(),
          organ: organHtml
        };

        stlDataInfo.push([fileName, details]);
        self.stlOrganArray.push(organHtml);
        count++;
      });

      let stlData = new Map(stlDataInfo);
      let options = {
        widgetMode: this.widgetMode(),
        hide2D: this.hide2D(),
        hideVr: this.hideVr()
      };

      this.medicalViewer = new MedicalViewer();
      this.medicalViewer.renderDicomAndStl(
        [...dicomFilePaths.values()],
        stlData,
        options
      );
      dicomFilePaths = null;
      selectedStlFiles = null;
    }
  };

  self.reset = () => {
    if (this.medicalViewer) {
      this.medicalViewer.dispose();
      this.medicalViewer = null;
    }
    self.stlOrganArray().forEach(element => {
      delete element.name;
      delete element.htmlColor;
      delete element.opacity;
      delete element.location;
      delete element.label;
      delete element.color;
    });
    self.stlOrganArray([]);
    // very important to clear the buffer.
    window.Buffer = null;
    global.gc();
  };

  self.readFiles = (rootPath, directory, errMessage) => {
    let fullFilePaths = [];
    let folderPath = '{0}\\{1}'.format(rootPath, directory);
    if (directoryExists.sync(folderPath)) {
      let fileNames = fs.readdirSync(folderPath);
      for (let fileName of fileNames) {
        fullFilePaths.push([
          fileName.toString(),
          '{0}\\{1}'.format(folderPath, fileName.toString())
        ]);
      }
    } else {
      errMessage.push('无法找到 [{0}] 文件夹.'.format(directory));
    }
    return new Map(fullFilePaths);
  };

  self.setWidgetMode = (data, event) => {
    let btn = event.target;
    if ($(event.target).is('i')) {
      btn = $(event.target).parent();
    }
    if (this.widgetMode() !== $(btn).val()) {
      this.widgetMode($(btn).val());
    } else {
      this.widgetMode(WIDGET_MODE.NO_SELECTION);
    }
    if (this.medicalViewer) {
      if (this.widgetMode() === WIDGET_MODE.AUTO_ROTATION) {
        this.hideVr(true);
        this.medicalViewer.setHideVr(self.hideVr());
      }
      this.medicalViewer.switchWidgetMode(this.widgetMode());
    }
  };

  self.selectColor = (data, event) => {
    data.setStlColor(data.htmlColor());
  };
  self.showTooltip = (data, event) => {
       log.info("show");
  };
  self.hideTooltip = (event) => {
       log.info("hide")
  };

  self.setHide2D = (data, event) => {
    self.hide2D(!self.hide2D());
    if (this.medicalViewer) {
      this.medicalViewer.setHide2D(self.hide2D());
    }
  };

  self.setHideVr = (data, event) => {
    self.hideVr(!self.hideVr());
    if (this.medicalViewer) {
      this.medicalViewer.setHideVr(self.hideVr());
    }
  };

  self.switchTransparency = (data, event) => {
    //switch the opacity
    data.switchOpacity();
    data.updateStlOpacity();
  };

  self.getVersion = () => {
    return 'v' + manifest.version;
  };

  self.registerKey = () => {
    let {errorCode, message} =  self.validateRegistration({
      machineId: self.machineId(),
      key: self.licenseKey()
    });
    self.isRegistered(errorCode === 0);
    if (self.isRegistered()) {
      db.registration
        .where('machineId')
        .equalsIgnoreCase(self.machineId())
        .modify({ key: this.licenseKey() });
      new Noty({
          layout: 'topRight',
          type: 'success',
          theme: 'metroui',
          text: "注册码成功！",
          progressBar: true,
          killer: REG_NOTY_QUEUE,
          visibilityControl:true,
          timeout: 3000,
          queue: REG_NOTY_QUEUE
        }).show();
    } else {
      self.licenseKey(null);
      new Noty({
        layout: 'topRight',
        type: 'error',
        theme: 'metroui',
        text: "注册码无效！",
        progressBar: true,
        killer: REG_NOTY_QUEUE,
        visibilityControl:true,
        timeout: 3000,
        queue: REG_NOTY_QUEUE
      }).show();
    }
  };

  self.registrationComments = (data, event)=>{
    if(!self.isRegistered()){
      new Noty({
        layout: 'topRight',
        type: 'info',
        theme: 'metroui',
        text: "请注册后，全部功能开放使用。",
        progressBar: true,
        killer: REG_NOTY_QUEUE,
        visibilityControl:true,
        timeout: 10000,
        queue: REG_NOTY_QUEUE
      }).show();
    }
  }

  $('.renderer').keypress(event => {
    if (event.keyCode == 32) {
      // user has pressed space
      if (!$(event.target).hasClass('main-screen')) {
        $('.main-screen')
          .addClass('side-screen')
          .removeClass('main-screen')
          .css('order', '0');
        $(event.target)
          .addClass('main-screen')
          .removeClass('side-screen')
          .css('order', '-1');
        if (this.medicalViewer) {
          this.medicalViewer.resizeWindow();
        }
      }
    }
  });

  function getContainment($box, $drag) {
    var x1 = $box.offset().left;
    var y1 = $box.offset().top;
    var x2 = $box.offset().left + $box.width() - $drag.width();
    var y2 = $box.offset().top + $box.height() - $drag.height();
    return [x1, y1, x2, y2];
  }

  $('#my-gui-container').draggable({
    containment: getContainment($('#container'), $('#my-gui-container')),
    cancel: 'li.cr'
  });
  window.addEventListener('resize', function(e) {
    $('#my-gui-container').draggable({
      containment: getContainment($('#container'), $('#my-gui-container')),
      cancel: 'li.cr'
    });
  });
}

// this line must be called.
window.onload = _ => {
  ko.applyBindings(new Viewmodel());
};
