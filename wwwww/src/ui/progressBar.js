import '../stylesheets/progressBar.css';

export default function CustomProgressBar(container) {
  this._container = container;
  this._modes = {
    load: {
      name: 'load',
      color: '#FF0000'
    },
    parse: {
      name: 'parse',
      color: '#00FF00'
    }
  };
  this._requestAnimationFrameID = null;
  this._mode = null;
  this._value = null;
  this._total = null;

  this.init = () => {
    var container = document.createElement('div');
    container.classList.add('progress-bar');
    container.classList.add('flex-container');
    container.classList.add('column');
    container.innerHTML =
      '<div class="progress parse flex-item">读取数据中 ... </div><div class="progress load flex-item"></div>';
    this._container.appendChild(container);
    // start rendering loop
    this.updateUI();
  };

  this.update = (value, total, mode, url = '') => {
    this._mode = mode;
    this._value = value;
    // depending on CDN, total return to XHTTPRequest can be 0.
    // In this case, we generate a random number to animate the progressbar
    if (total === 0) {
      this._total = value;
      this._value = Math.random() * value;
    } else {
      this._total = total;
    }
  };

  this.updateUI = () => {
    var self = this;
    this._requestAnimationFrameID = requestAnimationFrame(self.updateUI);

    if (
      !(
        this._modes.hasOwnProperty(this._mode) &&
        this._modes[this._mode].hasOwnProperty('name') &&
        this._modes[this._mode].hasOwnProperty('color')
      )
    ) {
      return false;
    }

    var progress = Math.round((this._value / this._total) * 100);
    var color = this._modes[this._mode].color;

    var progressBar = this._container.getElementsByClassName(
      'progress ' + this._modes[this._mode].name
    );
    if (progressBar.length > 0) {
      progressBar[0].style.borderColor = color;
      progressBar[0].style.width = progress + '%';
    }
    progressBar = null;

    var loader = this._container.getElementsByClassName('progress load');
    loader[0].style.display = 'block';
    // show progress parse
    var container = this._container.getElementsByClassName('progress-bar');
    var parser = this._container.getElementsByClassName('progress parse');
    parser[0].style.display = 'block';
    parser[0].style.width = '100%';
  };

  this.free = () => {
    var progressContainers = this._container.getElementsByClassName(
      'progress-bar'
    );
    // console.log( progressContainers );
    if (progressContainers.length > 0) {
      progressContainers[0].parentNode.removeChild(progressContainers[0]);
    }
    progressContainers = null;
    // stop rendering loop
    window.cancelAnimationFrame(this._requestAnimationFrameID);
  };

  this.setTotalFiles = totalFiles => {
    this._totalFiles = totalFiles;
  };

  this.getTotalFiles = () => {
    return this._totalFiles;
  };

  this.init();
}
