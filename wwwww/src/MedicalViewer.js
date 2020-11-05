/* globals Stats, dat*/
import './stylesheets/viewers.css';
import ProgressBar from './ui/progressBar.js';
import NodeStl from 'node-stl';
import { WIDGET_MODE } from './constants';
import { ORGAN_NAME_REGEX } from './helpers/filenameHelper';
var log = require('electron-log');

const OrbitControls = require('three-orbitcontrols');

const blackColor = 0x212121;
const redColor = 0xff1744;
const yellowColor = 0xffea00;
const greenColor = 0x76ff03;

const container0 = document.getElementById('r0');
const container1 = document.getElementById('r1');
const container2 = document.getElementById('r2');
const container3 = document.getElementById('r3');
const containers = [container0, container1, container2, container3];

export default class MedicalViewer {
  constructor() {
    this.ready = false;

    this.redContourHelper = null;
    this.redTextureTarget = null;
    this.redContourScene = null;

    this.widgets = [];
    this.renderer2DScenes = [];
    this.stlObjectList = null;
    this.stlDetails = new Map();
    this.gui = null;
    this.widgetMode = WIDGET_MODE.NO_SELECTION;
    this.hideVr = true;
    this.mouseUpEventHandler = null;
    this.mouseMoveEventHandler = null;
    this.mouseDownEventHandler = null;
    this.onDoubleClick = null;
    this.onClick = null;
    this.onScroll = null;
    this.onStart = null;
    this.onEnd = null;
    this.onWheel = null;
    this.onChange = null;
    this.onWindowResize = null;
    this.onYellowChanged = null;
    this.onRedChanged = null;
    this.onGreenChanged = null;
    this.keyPressCheck = null;
    this.vrHelper = null;
    this.lut = null;
    this.modified = false;
    this.wheel = null;
    this.wheelTO = null;
    this.isCtrl = false;
    this.isShift = false;
    this.guiData = {
      r1GrayData: {
        windowWidth: 200,
        windowCenter: 45,
        hideAxial2D: true
      },
      r2GrayData: {
        windowWidth: 200,
        windowCenter: 45,
        hideSagittal2D: true
      },
      r3GrayData: {
        windowWidth: 200,
        windowCenter: 45,
        hideCoronal2D: true
      }
    }
    // 3d renderer
    this.r0 = this._initialRenderer('r0', blackColor, 0);

    // 2d axial renderer
    this.r1 = this._initialRenderer('r1', blackColor, 1, 'axial', redColor);

    // 2d sagittal renderer
    this.r2 = this._initialRenderer(
      'r2',
      blackColor,
      2,
      'sagittal',
      yellowColor
    );

    // 2d coronal renderer
    this.r3 = this._initialRenderer('r3', blackColor, 3, 'coronal', greenColor);

    // extra variables to show mesh plane intersections in 2D renderers
    this.sceneClip = new THREE.Scene();
    this.clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
    this.clipPlane2 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
    this.clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
  }

  _initialRenderer(
    domId,
    backgroundColor,
    targetId,
    sliceOrientation = null,
    sliceColor = null
  ) {
    return {
      domId: domId,
      domElement: null,
      renderer: null,
      color: backgroundColor,
      sliceOrientation: sliceOrientation,
      sliceColor: sliceColor,
      targetID: targetId,
      camera: null,
      controls: null,
      scene: null,
      light: null,
      stackHelper: null,
      localizerHelper: null,
      localizerScene: null
    };
  }

  _initRenderer3D(renderObj) {
    let self = this;
    // renderer
    renderObj.domElement = document.getElementById(renderObj.domId);
    renderObj.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderObj.renderer.setSize(
      renderObj.domElement.clientWidth,
      renderObj.domElement.clientHeight
    );
    renderObj.renderer.setPixelRatio(window.devicePixelRatio);
    renderObj.renderer.domElement.id = renderObj.targetID;
    renderObj.domElement.appendChild(renderObj.renderer.domElement);

    // camera
    renderObj.camera = new THREE.PerspectiveCamera(
      45,
      renderObj.domElement.clientWidth / renderObj.domElement.clientHeight,
      0.1,
      100000
    );
    renderObj.camera.position.set(300, -480, 10); //设置相机位置
    renderObj.camera.up.set(0, 0, 1);
    // controls
    renderObj.controls = new OrbitControls(
      renderObj.camera,
      renderObj.domElement
    );

    // 使动画循环使用时阻尼或自转 意思是否有惯性
    renderObj.controls.enableDamping = false;
    //是否可以缩放
    renderObj.controls.enableZoom = true;

    //是否自动旋转
    renderObj.controls.autoRotate = false;

    //设置相机距离原点的最近距离
    renderObj.controls.minDistance = 200;

    //设置相机距离原点的最远距离
    renderObj.controls.maxDistance = 800;

    //是否开启右键拖拽
    renderObj.controls.enablePan = false;
    renderObj.controls.rotateSpeed = 0.2;
    renderObj.controls.zoomSpeed = 1.5;
    // renderObj.controls.panSpeed = 0.8;
    renderObj.controls.enableDamping = false;
    // renderObj.controls.dynamicDampingFactor = 0.3;
    renderObj.camera.controls = renderObj.controls;

    // scene
    renderObj.scene = new THREE.Scene();

    // light
    renderObj.light = new THREE.DirectionalLight(0xaaaaaa, 1);
    renderObj.light.position.copy(renderObj.camera.position);
    renderObj.scene.add(renderObj.light);
    renderObj.scene.add(new THREE.AmbientLight(0x999999));

    self.onStart = event => {
      if (
        self.vrHelper &&
        self.vrHelper.uniforms &&
        !self.wheel &&
        renderObj.scene.children.includes(self.vrHelper)
      ) {
        renderObj.renderer.setPixelRatio(0.1 * window.devicePixelRatio);
        renderObj.renderer.setSize(
          renderObj.domElement.clientWidth,
          renderObj.domElement.clientHeight
        );
        self.modified = true;
      }
    };

    self.onEnd = event => {
      if (
        self.vrHelper &&
        self.vrHelper.uniforms &&
        !self.wheel &&
        renderObj.scene.children.includes(self.vrHelper)
      ) {
        renderObj.renderer.setPixelRatio(0.5 * window.devicePixelRatio);
        renderObj.renderer.setSize(
          renderObj.domElement.clientWidth,
          renderObj.domElement.clientHeight
        );
        self.modified = true;
        setTimeout(() => {
          renderObj.renderer.setPixelRatio(window.devicePixelRatio);
          renderObj.renderer.setSize(
            renderObj.domElement.clientWidth,
            renderObj.domElement.clientHeight
          );
          self.modified = true;
        }, 50);
      }
    };

    self.onWheel = () => {
      if (!self.wheel && renderObj.scene.children.includes(self.vrHelper)) {
        renderObj.renderer.setPixelRatio(0.1 * window.devicePixelRatio);
        renderObj.renderer.setSize(
          renderObj.domElement.clientWidth,
          renderObj.domElement.clientHeight
        );
        self.wheel = Date.now();
      }

      if (
        Date.now() - self.wheel < 300 &&
        renderObj.scene.children.includes(self.vrHelper)
      ) {
        clearTimeout(self.wheelTO);
        self.wheelTO = setTimeout(() => {
          renderObj.renderer.setPixelRatio(0.5 * window.devicePixelRatio);
          renderObj.renderer.setSize(
            renderObj.domElement.clientWidth,
            renderObj.domElement.clientHeight
          );
          self.modified = true;

          setTimeout(() => {
            renderObj.renderer.setPixelRatio(window.devicePixelRatio);
            renderObj.renderer.setSize(
              renderObj.domElement.clientWidth,
              renderObj.domElement.clientHeight
            );
            self.wheel = null;
            self.modified = true;
          }, 50);
        }, 100);
      }
      self.modified = true;
    };

    self.onChange = () => {
      self.modified = true;
    };
    renderObj.controls.addEventListener('change', self.onChange);

    renderObj.controls.addEventListener('start', self.onStart);
    renderObj.controls.addEventListener('end', self.onEnd);
    renderObj.renderer.domElement.addEventListener('wheel', self.onWheel);
  }

  _initRenderer2D(rendererObj) {
    // renderer
    rendererObj.domElement = document.getElementById(rendererObj.domId);
    rendererObj.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    rendererObj.renderer.autoClear = false;
    rendererObj.renderer.localClippingEnabled = true;
    rendererObj.renderer.setSize(
      rendererObj.domElement.clientWidth,
      rendererObj.domElement.clientHeight
    );
    rendererObj.renderer.setClearColor(0x121212, 1);
    rendererObj.renderer.domElement.id = rendererObj.targetID;
    rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

    // camera
    rendererObj.camera = new AMI.OrthographicCamera(
      rendererObj.domElement.clientWidth / -2,
      rendererObj.domElement.clientWidth / 2,
      rendererObj.domElement.clientHeight / 2,
      rendererObj.domElement.clientHeight / -2,
      1,
      1000
    );

    // controls
    rendererObj.controls = new AMI.TrackballOrthoControl(
      rendererObj.camera,
      rendererObj.domElement
    );
    rendererObj.controls.staticMoving = true;
    rendererObj.controls.noPan = true;
    rendererObj.controls.noZoom = true;
    rendererObj.controls.noRotate = true;
    rendererObj.camera.controls = rendererObj.controls;
    window.console.log( rendererObj.controls);

    // scene
    rendererObj.scene = new THREE.Scene();
  }

  _initHelpersStack(rendererObj, stack) {
    rendererObj.stackHelper = new AMI.StackHelper(stack);
    rendererObj.stackHelper.bbox.visible = false;
    rendererObj.stackHelper.borderColor = rendererObj.sliceColor;
    rendererObj.stackHelper.slice.canvasWidth =
      rendererObj.domElement.clientWidth;
    rendererObj.stackHelper.slice.canvasHeight =
      rendererObj.domElement.clientHeight;

    // set camera
    let worldbb = stack.worldBoundingBox();
    let lpsDims = new THREE.Vector3(
      (worldbb[1] - worldbb[0]) / 2,
      (worldbb[3] - worldbb[2]) / 2,
      (worldbb[5] - worldbb[4]) / 2
    );

    // box: {halfDimensions, center}
    let box = {
      center: stack.worldCenter().clone(),
      halfDimensions: new THREE.Vector3(
        lpsDims.x + 10,
        lpsDims.y + 10,
        lpsDims.z + 10
      )
    };

    // init and zoom
    let canvas = {
      width: rendererObj.domElement.clientWidth,
      height: rendererObj.domElement.clientHeight
    };

    rendererObj.camera.directions = [
      stack.xCosine,
      stack.yCosine,
      stack.zCosine
    ];
    rendererObj.camera.box = box;
    rendererObj.camera.canvas = canvas;
    rendererObj.camera.orientation = rendererObj.sliceOrientation;
    rendererObj.camera.update();
    rendererObj.camera.fitBox(2, 1);

    rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
    rendererObj.stackHelper.index = Math.floor(
      rendererObj.stackHelper.orientationMaxIndex / 2
    );
    rendererObj.scene.add(rendererObj.stackHelper);
  }

  _initHelpersLocalizer(rendererObj, stack, referencePlane, localizers) {
    rendererObj.localizerHelper = new AMI.LocalizerHelper(
      stack,
      rendererObj.stackHelper.slice.geometry,
      referencePlane
    );

    for (let i = 0; i < localizers.length; i++) {
      rendererObj.localizerHelper['plane' + (i + 1)] = localizers[i].plane;
      rendererObj.localizerHelper['color' + (i + 1)] = localizers[i].color;
    }

    rendererObj.localizerHelper.canvasWidth =
      rendererObj.domElement.clientWidth;
    rendererObj.localizerHelper.canvasHeight =
      rendererObj.domElement.clientHeight;

    rendererObj.localizerScene = new THREE.Scene();
    rendererObj.localizerScene.add(rendererObj.localizerHelper);
  }

  _update2DIn3DScenes(shouldHide, sense) {
    if(shouldHide){
      if (this.r0.scene.children.includes(sense)) {
        this.r0.scene.remove(sense);
      }
    }else{
      if (!this.r0.scene.children.includes(sense)) {
        this.r0.scene.add(sense);
      }
    }
  }

  _updateVrIn3DScenes() {
    //hide Vr actived
    if (this.hideVr) {
      if (this.r0.scene.children.includes(this.vrHelper)) {
        this.r0.scene.remove(this.vrHelper);
      }
    } else {
      if (!this.r0.scene.children.includes(this.vrHelper)) {
        this.r0.scene.add(this.vrHelper);
      }
    }
  }

  /**
   * Update the 2D's graphic with the given renderer
   * @param {Renderer} rendererObject
   * @param {THREE.Plane} clipPlane
   * @param {THREE.WebGLRenderTarget} textureTarget when this is dicom series renderer, the it should NOT be null. It is null, when it is other 2d Renderer.
   * @param {AMI.ContourHelper} contourHelper when this is dicom series renderer, the it should NOT be null. It is null, when it is other 2d Renderer.
   * @param {THREE.Scene} contourScene when this is dicom series renderer, the it should NOT be null. It is null, when it is other 2d Renderer.
   * @param {THREE.Scene} scene2dClip when this is dicom series renderer, the it should BE null. It should Not be null, when it is other 2d Renderer.
   */
  _render2D(
    rendererObject,
    stlList,
    clipPlane,
    textureTarget = null,
    contourHelper = null,
    contourScene = null,
    scene2dClip = null
  ) {
    // 2D renderer
    rendererObject.renderer.clear();
    rendererObject.renderer.render(rendererObject.scene, rendererObject.camera);
    // mesh
    rendererObject.renderer.clearDepth();
    stlList.forEach((stlObject, key) => {
      stlObject.materialFront.clippingPlanes = [clipPlane];
      stlObject.materialBack.clippingPlanes = [clipPlane];
      if (textureTarget && contourHelper && contourScene) {
        rendererObject.renderer.render(
          stlObject.scene,
          rendererObject.camera,
          textureTarget,
          true
        );
        rendererObject.renderer.clearDepth();
        contourHelper.contourWidth = stlObject.selected ? 3 : 2;
        contourHelper.contourOpacity = stlObject.selected ? 1 : 0.8;
        rendererObject.renderer.render(contourScene, rendererObject.camera);
        rendererObject.renderer.clearDepth();
      }
    });

    if (scene2dClip) {
      rendererObject.renderer.render(scene2dClip, rendererObject.camera);
    }
    // localizer
    rendererObject.renderer.clearDepth();
    rendererObject.renderer.render(
      rendererObject.localizerScene,
      rendererObject.camera
    );
  }

  _render2DScreen(
    rendererObject,
    stlList,
    clipPlane,
    textureTarget = null,
    contourHelper = null,
    contourScene = null,
    sceneClip2D = null
  ) {
    rendererObject.renderer.clear();
    rendererObject.renderer.render(rendererObject.scene, rendererObject.camera);
    // mesh
    rendererObject.renderer.clearDepth();
    stlList.forEach((object, key) => {
      object.materialFront.clippingPlanes = [clipPlane];
      object.materialBack.clippingPlanes = [clipPlane];
      if (textureTarget && contourHelper && contourScene) {
        rendererObject.renderer.render(
          object.scene,
          rendererObject.camera,
          textureTarget,
          true
        );
        rendererObject.renderer.clearDepth();
        contourHelper.contourWidth = object.selected ? 3 : 2;
        contourHelper.contourOpacity = object.selected ? 1 : 0.8;
        rendererObject.renderer.render(contourScene, rendererObject.camera);
        rendererObject.renderer.clearDepth();
      }
    });

    if (sceneClip2D) {
      rendererObject.renderer.render(sceneClip2D, rendererObject.camera);
    }

    // localizer
    rendererObject.renderer.clearDepth();
    rendererObject.renderer.render(
      rendererObject.localizerScene,
      rendererObject.camera
    );
  }

  _render() {
    if (this.ready) {
      // render
      this.r0.controls.update();
      this.r1.controls.update();
      this.r2.controls.update();
      this.r3.controls.update();

      if (this.modified) {
        // we are ready when both meshes have been loaded
        this._update2DIn3DScenes(this.guiData.r1GrayData.hideAxial2D, this.r1.scene);
        this._update2DIn3DScenes(this.guiData.r2GrayData.hideSagittal2D, this.r2.scene);
        this._update2DIn3DScenes(this.guiData.r3GrayData.hideCoronal2D, this.r3.scene);
        this._updateVrIn3DScenes();
        this.r0.light.position.copy(this.r0.camera.position);
        this.r0.renderer.render(this.r0.scene, this.r0.camera);
        this.modified = false;
      }

      // r1
      this._render2DScreen(
        this.r1,
        this.stlObjectList,
        this.clipPlane1,
        this.redTextureTarget,
        this.redContourHelper,
        this.redContourScene
      );

      // r2
      this._render2DScreen(
        this.r2,
        this.stlObjectList,
        this.clipPlane2,
        null,
        null,
        null,
        this.sceneClip
      );

      // r3
      this._render2DScreen(
        this.r3,
        this.stlObjectList,
        this.clipPlane3,
        null,
        null,
        null,
        this.sceneClip
      );
    }
  }

  renderDicomAndStl(dicomFilesFiles, stlData, options) {
    let self = this;
    // init threeJS
    self._init();
    //initial the configuration from app.
    self.setHide2D(options.hide2D);
    self.setHideVr(options.hideVr);
    self.switchWidgetMode(options.widgetMode);
    // load sequence for each file
    // instantiate the loader
    // it loads and parses the dicom image
    self.stlObjectList = stlData;
    // the main container which will hold four sub screens
    let container = $('.pusher.admv-canvas').get(0);
    let loader = new AMI.VolumeLoader(container, ProgressBar);
    log.info('Loading Files');
    loader
      .load(dicomFilesFiles)
      .then(() => {
        log.info('Files are loaded');

        // get first stack from series
        let stack = loader.data[0].mergeSeries(loader.data)[0].stack[0];
        loader.free();
        loader = null;
        stack.prepare();

        // center 3d camera/control on the stack
        let centerLPS = stack.worldCenter();
        self.r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        self.r0.camera.updateProjectionMatrix();
        self.r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

        self.vrHelper = new AMI.VolumeRenderingHelper(stack);
        self.r0.scene.add(self.vrHelper);
        // CREATE LUT
        self.lut = new AMI.LutHelper('my-lut-canvases');
        self.lut.luts = AMI.LutHelper.presetLuts();
        self.lut.lutsO = AMI.LutHelper.presetLutsO();
        self.lut.lut = 'random';
        // update related uniforms
        self.vrHelper.uniforms.uTextureLUT.value = self.lut.texture;
        self.vrHelper.uniforms.uLut.value = 1;

        // bouding box
        // let boxHelper = new AMI.BoundingBoxHelper(stack);
        // self.r0.scene.add(boxHelper);

        // red slice
        self._initHelpersStack(self.r1, stack);
        self.r0.scene.add(self.r1.scene);
        self.renderer2DScenes.push(self.r1.scene);

        self.redTextureTarget = new THREE.WebGLRenderTarget(
          $(".main-screen")[0].clientWidth,
          $(".main-screen")[0].clientHeight,
          {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat
          }
        );

        self.redContourHelper = new AMI.ContourHelper(
          stack,
          self.r1.stackHelper.slice.geometry
        );
        self.redContourHelper.canvasWidth = self.redTextureTarget.width;
        self.redContourHelper.canvasHeight = self.redTextureTarget.height;
        self.redContourHelper.textureToFilter = self.redTextureTarget.texture;
        self.redContourScene = new THREE.Scene();
        self.redContourScene.add(self.redContourHelper);

        // yellow slice
        self._initHelpersStack(self.r2, stack);
        self.r0.scene.add(self.r2.scene);
        self.renderer2DScenes.push(self.r2.scene);

        // green slice
        self._initHelpersStack(self.r3, stack);
        self.r0.scene.add(self.r3.scene);
        self.renderer2DScenes.push(self.r3.scene);

        // create new mesh with Localizer shaders
        let plane1 = self.r1.stackHelper.slice.cartesianEquation();
        let plane2 = self.r2.stackHelper.slice.cartesianEquation();
        let plane3 = self.r3.stackHelper.slice.cartesianEquation();

        // localizer red slice
        self._initHelpersLocalizer(self.r1, stack, plane1, [
          {
            plane: plane2,
            color: new THREE.Color(self.r2.stackHelper.borderColor)
          },
          {
            plane: plane3,
            color: new THREE.Color(self.r3.stackHelper.borderColor)
          }
        ]);

        // localizer yellow slice
        self._initHelpersLocalizer(self.r2, stack, plane2, [
          {
            plane: plane1,
            color: new THREE.Color(self.r1.stackHelper.borderColor)
          },
          {
            plane: plane3,
            color: new THREE.Color(self.r3.stackHelper.borderColor)
          }
        ]);

        // localizer green slice
        self._initHelpersLocalizer(self.r3, stack, plane3, [
          {
            plane: plane1,
            color: new THREE.Color(self.r1.stackHelper.borderColor)
          },
          {
            plane: plane2,
            color: new THREE.Color(self.r2.stackHelper.borderColor)
          }
        ]);

        function calculateMouseDetail(event, container) {
          let canvas = event.target.parentElement;
          let id = event.target.id;

          let camera = null;
          let scene = null;
          let controls = null;
          let index = 0;
          switch (id) {
            case '0':
              camera = self.r0.camera;
              scene = self.r0.scene;
              controls = self.r0.controls;
              break;
            case '1':
              camera = self.r1.camera;
              scene = self.r1.scene;
              controls = self.r1.controls;
              index = self.r1.stackHelper.index;
              break;
            case '2':
              camera = self.r2.camera;
              scene = self.r2.scene;
              controls = self.r2.controls;
              index = self.r2.stackHelper.index;
              break;
            case '3':
              camera = self.r3.camera;
              scene = self.r3.scene;
              controls = self.r3.controls;
              index = self.r3.stackHelper.index;
              break;
          }

          let bbox = container.getBoundingClientRect();
          // mouse position
          let position = {
            x: ((event.clientX - bbox.left) / canvas.clientWidth) * 2 - 1,
            y: -((event.clientY - bbox.top) / canvas.clientHeight) * 2 + 1
          };
          return {
            camera,
            scene,
            controls,
            index,
            position
          };
        }

        self.mouseUpEventHandler = function(evt) {
          let container = evt.currentTarget;
          // if something hovered, exit
          for (let widget of self.widgets) {
            if (widget != null && widget.active) {
              let mouseDetail = calculateMouseDetail(evt, container);
              if (mouseDetail.camera != null) {
                let raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(
                  mouseDetail.position,
                  mouseDetail.camera
                );
                mouseDetail.camera.updateProjectionMatrix();
                let intersects = raycaster.intersectObjects(
                  mouseDetail.scene.children,
                  true
                );
                raycaster = null;
                mouseDetail = null;

                if (intersects.length > 0 && intersects[0].object != null) {
                  widget.targetMesh = intersects[0].object;
                }
              }

              widget.onEnd(evt);
              return;
            }
          }
        };

        self.mouseMoveEventHandler = function(evt) {
          // if something hovered, exit
          let container = evt.currentTarget;
          let cursor = 'default';
          for (let widget of self.widgets) {
            if (widget != null) {
              let mouseDetail = calculateMouseDetail(evt, container);
              if (mouseDetail.camera != null) {
                let raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(
                  mouseDetail.position,
                  mouseDetail.camera
                );
                mouseDetail.camera.updateProjectionMatrix();
                let intersects = raycaster.intersectObjects(
                  mouseDetail.scene.children,
                  true
                );
                raycaster = null;
                mouseDetail = null;
                if (intersects.length > 0 && intersects[0].object != null) {
                  widget.targetMesh = intersects[0].object;
                }
              }

              widget.onMove(evt);

              if (widget.hovered) {
                cursor = 'pointer';
              }
            }
          }
          container.style.cursor = cursor;
        };

        self.mouseDownEventHandler = function(evt) {
          let container = evt.currentTarget;
          let deleteWidget = null;
          // if something hovered, exit
          for (let widget of self.widgets) {
            if (widget != null && widget.hovered) {
              if (self.widgetMode === WIDGET_MODE.DELETE) {
                deleteWidget = widget;
              } else {
                widget.onStart(evt);
                return;
              }
            }
          }
          if (deleteWidget != null) {
            let index = self.widgets.indexOf(deleteWidget);
            if (index > -1) {
              self.widgets.splice(index, 1);
            }
            deleteWidget.free();
            return;
          }

          container.style.cursor = 'default';

          let mouseDetail = calculateMouseDetail(evt, container);

          let raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouseDetail.position, mouseDetail.camera);

          if (mouseDetail.scene) {
            let intersects = raycaster.intersectObjects(
              mouseDetail.scene.children,
              true
            );

            if (intersects.length <= 0) {
              return;
            }
            mouseDetail.camera.updateProjectionMatrix();
            let widget = null;
            switch (self.widgetMode) {
              case WIDGET_MODE.RULER:
                widget = new AMI.RulerWidget(null, mouseDetail.controls, {
                  lps2IJK: stack.lps2IJK,
                  pixelSpacing: stack.frame[mouseDetail.index].pixelSpacing,
                  ultrasoundRegions:
                    stack.frame[mouseDetail.index].ultrasoundRegions,
                  worldPosition: intersects[0].point
                });
                break;
              case WIDGET_MODE.ANGLE:
                widget = new AMI.AngleWidget(null, mouseDetail.controls, {
                  worldPosition: intersects[0].point
                });
                widget.worldPosition = intersects[0].point;
                break;
              case WIDGET_MODE.DELETE:
                break;
              default:
                return;
            }
            if (widget) {
              self.widgets.push(widget);
              mouseDetail.scene.add(widget);
            }
          }
          raycaster = null;
          mouseDetail = null;
        };

        for (let container of containers) {
          container.addEventListener('mouseup', self.mouseUpEventHandler);

          container.addEventListener('mousemove', self.mouseMoveEventHandler);

          container.addEventListener('mousedown', self.mouseDownEventHandler);
        }

        self.gui = new dat.GUI({
          autoPlace: false
        });

        let customContainer = document.getElementById('my-gui-container');
        customContainer.appendChild(self.gui.domElement);

        self.guiData.r1GrayData.resetGrayScale = function() {
          self.r1.stackHelper.slice.intensityAuto = true;
          this.windowWidth = self.r1.stackHelper.slice.windowWidth;
          this.windowCenter = self.r1.stackHelper.slice.windowCenter;
        };
        self.guiData.r2GrayData.resetGrayScale = function() {
          self.r2.stackHelper.slice.intensityAuto = true;
          this.windowWidth = self.r2.stackHelper.slice.windowWidth;
          this.windowCenter = self.r2.stackHelper.slice.windowCenter;
        }
        self.guiData.r3GrayData.resetGrayScale = function() {
          self.r3.stackHelper.slice.intensityAuto = true;
          this.windowWidth = self.r3.stackHelper.slice.windowWidth;
          this.windowCenter = self.r3.stackHelper.slice.windowCenter;
        }

        function setUpGrayFolder(stackFolder,stackHelper,grayData){
          let windowWidthController = stackFolder
            .add(
              grayData,
              'windowWidth',
              1,
              stack.minMax[1] - stack.minMax[0]
            )
            .name('窗宽')
            .step(1)
            .listen();
          windowWidthController.onChange(function(value) {
            grayData.windowWidth = value;
            stackHelper.slice.windowWidth = value;
          });
          windowWidthController.onFinishChange(function(value) {
            grayData.windowWidth = value;
            stackHelper.slice.windowWidth = value;
          });

          let windowCenterController = stackFolder
            .add(
              grayData,
              'windowCenter',
              stack.minMax[0], stack.minMax[1]
            )
            .name('窗位')
            .step(1)
            .listen();
          windowCenterController.onChange(function(value) {
            grayData.windowCenter = value;
            stackHelper.slice.windowCenter = value;
          });
          windowCenterController.onFinishChange(function(value) {
            grayData.windowCenter = value;
            stackHelper.slice.windowCenter = value;
          });
        }

        // Red
        let stackFolder1 = self.gui.addFolder('横切面 (红色)');
        let redChanged = stackFolder1
          .add(
            self.r1.stackHelper,
            'index',
            0,
            self.r1.stackHelper.orientationMaxIndex
          )
          .name('索引')
          .step(1)
          .listen();
        setUpGrayFolder(stackFolder1,self.r1.stackHelper,self.guiData.r1GrayData);
        stackFolder1
          .add(self.guiData.r1GrayData, 'resetGrayScale')
          .name('重置')
          .listen();
        let r12dController = stackFolder1
          .add(
            self.guiData.r1GrayData,
            'hideAxial2D')
          .name('隐藏横切面').listen();
        r12dController.onChange(function(value) {
          self.modified = true;
        });

        // Yellow
        let stackFolder2 = self.gui.addFolder('矢状面 (黄色)');
        let yellowChanged = stackFolder2
          .add(
            self.r2.stackHelper,
            'index',
            0,
            self.r2.stackHelper.orientationMaxIndex
          )
          .name('索引')
          .step(1)
          .listen();
        setUpGrayFolder(stackFolder2,self.r2.stackHelper,self.guiData.r2GrayData);
        stackFolder2
          .add(self.guiData.r2GrayData, 'resetGrayScale')
          .name('重置')
          .listen();
        let r22dController = stackFolder2
          .add(self.guiData.r2GrayData, 'hideSagittal2D')
          .name('隐藏矢状面')
          .listen();
        r22dController.onChange(function(value) {
          self.modified = true;
        });

        // Green
        let stackFolder3 = self.gui.addFolder('冠状面 (绿色)');
        let greenChanged = stackFolder3
          .add(
            self.r3.stackHelper,
            'index',
            0,
            self.r3.stackHelper.orientationMaxIndex
          )
          .name('索引')
          .step(1)
          .listen();
        setUpGrayFolder(stackFolder3,self.r3.stackHelper,self.guiData.r3GrayData);
        stackFolder3
          .add(self.guiData.r3GrayData, 'resetGrayScale')
          .name('重置')
          .listen();
        let r32dController = stackFolder3
          .add(self.guiData.r3GrayData, 'hideCoronal2D')
          .name('隐藏冠状面')
          .listen();
        r32dController.onChange(function(value) {
          self.modified = true;
        });

        /**
         * Update Layer Mix
         */
        function updateLocalizer(refObj, targetLocalizersHelpers) {
          let refHelper = refObj.stackHelper;
          let localizerHelper = refObj.localizerHelper;
          let plane = refHelper.slice.cartesianEquation();
          localizerHelper.referencePlane = plane;

          // bit of a hack... works fine for this application
          for (let i = 0; i < targetLocalizersHelpers.length; i++) {
            for (let j = 0; j < 3; j++) {
              let targetPlane = targetLocalizersHelpers[i]['plane' + (j + 1)];
              if (
                targetPlane &&
                plane.x.toFixed(6) === targetPlane.x.toFixed(6) &&
                plane.y.toFixed(6) === targetPlane.y.toFixed(6) &&
                plane.z.toFixed(6) === targetPlane.z.toFixed(6)
              ) {
                targetLocalizersHelpers[i]['plane' + (j + 1)] = plane;
              }
            }
          }

          // update the geometry will create a new mesh
          localizerHelper.geometry = refHelper.slice.geometry;
        }

        function updateClipPlane(refObj, clipPlane) {
          let stackHelper = refObj.stackHelper;
          let camera = refObj.camera;
          let vertices = stackHelper.slice.geometry.vertices;
          let p1 = new THREE.Vector3(
            vertices[0].x,
            vertices[0].y,
            vertices[0].z
          ).applyMatrix4(stackHelper._stack.ijk2LPS);
          let p2 = new THREE.Vector3(
            vertices[1].x,
            vertices[1].y,
            vertices[1].z
          ).applyMatrix4(stackHelper._stack.ijk2LPS);
          let p3 = new THREE.Vector3(
            vertices[2].x,
            vertices[2].y,
            vertices[2].z
          ).applyMatrix4(stackHelper._stack.ijk2LPS);

          clipPlane.setFromCoplanarPoints(p1, p2, p3);

          let cameraDirection = new THREE.Vector3(1, 1, 1);
          cameraDirection.applyQuaternion(camera.quaternion);

          if (cameraDirection.dot(clipPlane.normal) > 0) {
            clipPlane.negate();
          }
        }

        self.onYellowChanged = function() {
          self.modified = true;
          updateLocalizer(self.r2, [
            self.r1.localizerHelper,
            self.r3.localizerHelper
          ]);
          updateClipPlane(self.r2, self.clipPlane2);
          self.r2.stackHelper.slice.windowWidth = self.guiData.r2GrayData.windowWidth;
          self.r2.stackHelper.slice.windowCenter = self.guiData.r2GrayData.windowCenter;
        };

        yellowChanged.onChange(self.onYellowChanged);

        self.onRedChanged = function() {
          self.modified = true;
          updateLocalizer(self.r1, [
            self.r2.localizerHelper,
            self.r3.localizerHelper
          ]);
          updateClipPlane(self.r1, self.clipPlane1);

          if (self.redContourHelper) {
            self.redContourHelper.geometry = self.r1.stackHelper.slice.geometry;
          }
          self.r1.stackHelper.slice.windowWidth = self.guiData.r1GrayData.windowWidth;
          self.r1.stackHelper.slice.windowCenter = self.guiData.r1GrayData.windowCenter;
        };

        redChanged.onChange(self.onRedChanged);

        self.onGreenChanged = function() {
          self.modified = true;
          updateLocalizer(self.r3, [
            self.r1.localizerHelper,
            self.r2.localizerHelper
          ]);
          updateClipPlane(self.r3, self.clipPlane3);
          self.r3.stackHelper.slice.windowWidth = self.guiData.r3GrayData.windowWidth;
          self.r3.stackHelper.slice.windowCenter = self.guiData.r3GrayData.windowCenter;
        };

        greenChanged.onChange(self.onGreenChanged);

        self.onDoubleClick = function(event) {
          $(event.target).focus();
          let canvas = event.target.parentElement;
          let id = event.target.id;
          let bbox = canvas.getBoundingClientRect();
          let mouse = {
            x: ((event.clientX - bbox.left) / canvas.clientWidth) * 2 - 1,
            y: -((event.clientY - bbox.top) / canvas.clientHeight) * 2 + 1
          };
          //
          let camera = null;
          let stackHelper = null;
          let scene = null;
          let domElement = null;
          switch (id) {
            case '0':
              camera = self.r0.camera;
              stackHelper = self.r1.stackHelper;
              scene = self.r0.scene;
              domElement = self.r0.domElement;
              break;
            case '1':
              camera = self.r1.camera;
              stackHelper = self.r1.stackHelper;
              scene = self.r1.scene;
              domElement = self.r1.domElement;
              break;
            case '2':
              camera = self.r2.camera;
              stackHelper = self.r2.stackHelper;
              scene = self.r2.scene;
              domElement = self.r2.domElement;
              break;
            case '3':
              camera = self.r3.camera;
              stackHelper = self.r3.stackHelper;
              scene = self.r3.scene;
              domElement = self.r3.domElement;
              break;
          }
          if(domElement){$(domElement).focus()}
          let raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);

          if (scene) {
            let intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
              let ijk = AMI.UtilsCore.worldToData(
                stackHelper.stack.lps2IJK,
                intersects[0].point
              );

              self.r1.stackHelper.index = ijk.getComponent(
                (self.r1.stackHelper.orientation + 2) % 3
              );
              self.r2.stackHelper.index = ijk.getComponent(
                (self.r2.stackHelper.orientation + 2) % 3
              );
              self.r3.stackHelper.index = ijk.getComponent(
                (self.r3.stackHelper.orientation + 2) % 3
              );

              self.onGreenChanged();
              self.onRedChanged();
              self.onYellowChanged();
              // need to refresh the 3D screen to update the pane
              self.modified = true;
            }
          }
        };

        self.onClick = function(event) {
          // console.log('Click:' + event.target.id);

          let canvas = event.target.parentElement;
          let id = event.target.id;
          let bbox = canvas.getBoundingClientRect();
          let mouse = {
            x: ((event.clientX - bbox.left) / canvas.clientWidth) * 2 - 1,
            y: -((event.clientY - bbox.top) / canvas.clientHeight) * 2 + 1
          };
          //
          let camera = null;
          let stackHelper = null;
          let scene = null;
          let domElement = null;
          switch (id) {
            case '0':
              camera = self.r0.camera;
              stackHelper = self.r1.stackHelper;
              scene = self.r0.scene;
              domElement = self.r0.domElement;
              break;
            case '1':
              camera = self.r1.camera;
              stackHelper = self.r1.stackHelper;
              scene = self.r1.scene;
              domElement = self.r1.domElement;
              break;
            case '2':
              camera = self.r2.camera;
              stackHelper = self.r2.stackHelper;
              scene = self.r2.scene;
              domElement = self.r2.domElement;
              break;
            case '3':
              camera = self.r3.camera;
              stackHelper = self.r3.stackHelper;
              scene = self.r3.scene;
              domElement = self.r3.domElement;
              break;
          }
          if(domElement){$(domElement).focus()};
          if (camera && scene) {
            let raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            let intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
              if (intersects[0].object && intersects[0].object.objRef) {
                let refObject = intersects[0].object.objRef;
                refObject.selected = !refObject.selected;

                let color = refObject.color;
                if (refObject.selected) {
                  color = 0xccff00;
                }
                self.modified = true;
                // update materials colors
                refObject.material.color.setHex(color);
                refObject.materialFront.color.setHex(color);
                refObject.materialBack.color.setHex(color);
              }
            }
          }
        };

        self.onScroll = function(event) {
          let windowWidthMax = stack.minMax[1] - stack.minMax[0];
          let windowCenterMax = stack.minMax[1];
          let windowCenterMin = stack.minMax[0];
          let id = event.target.domElement.id;
          let stackHelper = null;
          let grayData = null;
          let domElement = null;
          switch (id) {
            case 'r0':
              domElement = self.r0.domElement;
              break;
            case 'r1':
              stackHelper = self.r1.stackHelper;
              grayData = self.guiData.r1GrayData;
              domElement = self.r1.domElement;
              break;
            case 'r2':
              stackHelper = self.r2.stackHelper;
              grayData = self.guiData.r2GrayData;
              domElement = self.r2.domElement;
              break;
            case 'r3':
              stackHelper = self.r3.stackHelper;
              grayData = self.guiData.r3GrayData;
              domElement = self.r3.domElement;
              break;
          }
          if(domElement){$(domElement).focus()};
          if (self.isCtrl) {
            if (event.delta > 0) {
              if (grayData.windowWidth >= windowWidthMax - 1) {
                return false;
              }
              grayData.windowWidth += 10;
            } else {
              if (grayData.windowWidth <= 0) {
                return false;
              }
              grayData.windowWidth -= 10;
            }
          } else if (self.isShift) {
            if (event.delta > 0) {
              if (grayData.windowCenter >= windowCenterMax - 1) {
                return false;
              }
              grayData.windowCenter += 10;
            } else {
              if (grayData.windowCenter <= windowCenterMin) {
                return false;
              }
              grayData.windowCenter -= 10;
            }
          } else {
            if (event.delta > 0) {
              if (stackHelper.index >= stackHelper.orientationMaxIndex - 1) {
                return false;
              }
              stackHelper.index += 1;
            } else {
              if (stackHelper.index <= 0) {
                return false;
              }
              stackHelper.index -= 1;
            }
          }
          self.modified = true;
          stackHelper.slice.windowWidth = grayData.windowWidth;
          stackHelper.slice.windowCenter = grayData.windowCenter;
          self.onGreenChanged();
          self.onRedChanged();
          self.onYellowChanged();
        };

        // event listeners
        self.r0.domElement.addEventListener('dblclick', self.onDoubleClick);
        self.r1.domElement.addEventListener('dblclick', self.onDoubleClick);
        self.r2.domElement.addEventListener('dblclick', self.onDoubleClick);
        self.r3.domElement.addEventListener('dblclick', self.onDoubleClick);

        self.r0.domElement.addEventListener('click', self.onClick);
        self.r1.domElement.addEventListener('click', self.onClick);
        self.r2.domElement.addEventListener('click', self.onClick);
        self.r3.domElement.addEventListener('click', self.onClick);

        // event listeners
        self.r1.controls.addEventListener('OnScroll', self.onScroll);
        self.r2.controls.addEventListener('OnScroll', self.onScroll);
        self.r3.controls.addEventListener('OnScroll', self.onScroll);

        function windowResize2D(rendererObj) {
          let mainScreen = $(".main-screen")[0];
          if (rendererObj && rendererObj.camera) {
            rendererObj.camera.canvas = {
              width: mainScreen.clientWidth,
              height: mainScreen.clientHeight
            };
            rendererObj.camera.fitBox(2, 1);
            rendererObj.renderer.setSize(
              rendererObj.domElement.clientWidth,
              rendererObj.domElement.clientHeight
            );

            // update info to draw borders properly
            rendererObj.stackHelper.slice.canvasWidth =
              mainScreen.clientWidth;
            rendererObj.stackHelper.slice.canvasHeight =
              mainScreen.clientHeight;

            if(rendererObj === self.r1){
              self.redTextureTarget.width = mainScreen.clientWidth;
              self.redTextureTarget.height = mainScreen.clientHeight;
              self.redContourHelper.canvasWidth = self.redTextureTarget.width;
              self.redContourHelper.canvasHeight = self.redTextureTarget.height;
            }

            rendererObj.localizerHelper.canvasWidth =
              rendererObj.domElement.clientWidth;
            rendererObj.localizerHelper.canvasHeight =
              rendererObj.domElement.clientHeight;

            // repaint all widgets
            for (let widget of self.widgets) {
              if (widget != null) {
                widget.update();
              }
            }
          }
        }

        self.onWindowResize = function() {
          self.modified = true;
          if (self.r0 && self.r0.camera) {
            // update 3D
            self.r0.camera.aspect =
              self.r0.domElement.clientWidth / self.r0.domElement.clientHeight;
            self.r0.camera.updateProjectionMatrix();
            self.r0.renderer.setSize(
              self.r0.domElement.clientWidth,
              self.r0.domElement.clientHeight
            );
          }

          // update 2d
          windowResize2D(self.r1);
          windowResize2D(self.r2);
          windowResize2D(self.r3);
        };

        self.keyPressCheck = event => {
          self.isCtrl = event.ctrlKey;
          self.isShift = event.shiftKey;
        };

        window.addEventListener('keydown', self.keyPressCheck, false);
        window.addEventListener('keyup', self.keyPressCheck, false);
        window.addEventListener('resize', self.onWindowResize, false);
        self.onWindowResize();

        // load meshes on the stack is all set
        let meshesLoaded = 0;
        function loadSTLObject(object) {
          let stlLoader = new THREE.STLLoader();
          //The average density of the human body is 985 kg/m3
          let nodeStl = new NodeStl(object.location, { density: 0.985 });
          self.stlDetails.set(object, nodeStl);
          stlLoader.load(object.location, geometry => {
            stlLoader = null;
            geometry.computeVertexNormals();
            // 3D mesh
            object.material = new THREE.MeshPhongMaterial({
              opacity: object.organ.opacity(),
              color: object.color,
              clippingPlanes: [],
              depthTest : true,
              depthWrite : true,
              alphaTest : 0.0,
              transparent: true
            });
            object.mesh = new THREE.Mesh(geometry, object.material);
            object.mesh.objRef = object;

            let RASToLPS = new THREE.Matrix4();
            RASToLPS.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
            object.mesh.applyMatrix(RASToLPS);
            self.r0.scene.add(object.mesh);

            object.scene = new THREE.Scene();

            // front
            object.materialFront = new THREE.MeshBasicMaterial({
              color: object.color,
              side: THREE.FrontSide,
              depthTest: true,
              depthWrite: true,
              opacity: 0,
              transparent: true,
              clippingPlanes: []
            });

            object.meshFront = new THREE.Mesh(geometry, object.materialFront);
            object.meshFront.applyMatrix(RASToLPS);
            object.scene.add(object.meshFront);

            // back
            object.materialBack = new THREE.MeshBasicMaterial({
              color: object.color,
              side: THREE.BackSide,
              depthTest: true,
              depthWrite: true,
              opacity: object.opacity,
              transparent: true,
              clippingPlanes: []
            });

            object.meshBack = new THREE.Mesh(geometry, object.materialBack);
            object.meshBack.applyMatrix(RASToLPS);
            object.scene.add(object.meshBack);

            // add the 3D model to 2D clipplanes.
            self.sceneClip.add(object.scene);

            object.organ.setStlColor = function(color) {
              object.material.color = new THREE.Color(color);
              object.color = parseInt(color.replace('#', ''), 16);
              self.modified = true;
            };
            object.organ.updateStlOpacity = function() {
              object.material.opacity = object.organ.opacity();
              object.material.depthWrite = object.organ.opacity() === 0 ? false : true;
              object.materialBack.opacity = object.organ.opacity();
              self.modified = true;
            };

            meshesLoaded++;

            self.onGreenChanged();
            self.onRedChanged();
            self.onYellowChanged();

            // good to go
            if (meshesLoaded === self.stlObjectList.size) {
              self.ready = true;
              self.modified = true;
              // force 1st render
              self._render();
              // notify puppeteer to take screenshot
              let puppetDiv = document.createElement('div');
              puppetDiv.setAttribute('id', 'puppeteer');
              document.body.appendChild(puppetDiv);
            }
          });
        }

        self.r0.camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        self.r0.controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

        self.stlObjectList.forEach((object, key) => {
          loadSTLObject(object);
        });

        function generateVolumeGui() {
          let volumeFolder = self.gui.addFolder(
            '体积( 基准密度 985 kg/m3)'
          );
          for (let [key, value] of self.stlDetails) {
            if (key != null && value != null) {
              let organName = key.label.match(ORGAN_NAME_REGEX)
                ? key.label.match(ORGAN_NAME_REGEX)[0]
                : key.label;
              let stackFolder = volumeFolder.addFolder(organName);
              let values = new function() {
                this.volume = value.volume.toFixed(3).toString();
                this.weight = value.weight.toFixed(3).toString();
                this.area = value.area.toFixed(3).toString();
              }();
              stackFolder.add(values, 'volume').name('体积 (cm^3)');
              stackFolder.add(values, 'weight').name('重量 (gm)');
              stackFolder.add(values, 'area').name('面积 (m)');
            }
          }
        }
        generateVolumeGui();
        global.gc();
      })
      .catch(error => {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
        log.error(error, 'Fail to load files.');
      });
  }

  /**
   * Init the quadview
   */
  _init() {
    let self = this;
    /**
     * Called on each animation frame
     */

    function animate() {
      self._render();

      // request new frame
      requestAnimationFrame(() => {
        animate();
      });
    }

    // renderers
    self._initRenderer3D(self.r0);
    self._initRenderer2D(self.r1);
    self._initRenderer2D(self.r2);
    self._initRenderer2D(self.r3);
    // start rendering loop
    animate();
  }

  switchWidgetMode(widgetMode) {
    this.widgetMode = widgetMode;
    this.r0.controls.autoRotate = this.widgetMode === WIDGET_MODE.AUTO_ROTATION;
  }

  setHide2D(hide) {
    if (this.guiData.r1GrayData.hideAxial2D !== hide ) {
      this.guiData.r1GrayData.hideAxial2D =  hide;
      this.modified = true;
    }

    if (this.guiData.r2GrayData.hideSagittal2D !== hide ) {
      this.guiData.r2GrayData.hideSagittal2D = hide;
      this.modified = true;
    }

    if (this.guiData.r3GrayData.hideCoronal2D !==  hide ) {
      this.guiData.r3GrayData.hideCoronal2D = hide;
      this.modified = true;
    }
  }

  setHideVr(hide) {
    if (this.hideVr !== hide) {
      this.hideVr = hide;
      this.modified = true;
    }
  }

  resizeWindow(){
    if(this.onWindowResize){
      this.onWindowResize();
    }
  }

  dispose() {
    this.ready = false;
    this.hide2D = true;
    this.hideVr = true;
    this.modified = false;

    this._disposeRenderer(this.r0);
    this._disposeRenderer(this.r1);
    this._disposeRenderer(this.r2);
    this._disposeRenderer(this.r3);

    this.vrHelper.dispose();
    this.vrHelper = null;
    this.lut = null;

    if (this.stlObjectList) {
      this.stlObjectList.forEach((stlObject, key) => {
        this._disposeSTLObject(stlObject);
      });
      this._disposeArray(this.stlObjectList);
      this.stlObjectList = null;
    }

    this.redContourHelper.dispose();
    this.redContourHelper = null;
    this.redTextureTarget.dispose();
    this.redTextureTarget = null;
    if (this.redContourScene) {
      this._disposeObject3D(this.redContourScene);
      this.redContourScene = null;
    }

    //
    this.widgets.forEach(element => {
      element.free();
    });
    this.widgets = [];
    //
    this.renderer2DScenes.forEach(element => {
      this._disposeObject3D(element);
    });
    this.renderer2DScenes = [];
    this.stlDetails.clear();
    // destroy gui
    this.gui.destroy();
    this.gui.domElement.remove();
    this.gui.domElement = null;
    this.gui = null;
    this.widgetMode = WIDGET_MODE.NO_SELECTION;

    // extra variables to show mesh plane intersections in 2D renderers
    this._disposeObject3D(this.sceneClip);
    this.sceneClip = new THREE.Scene();
    this.clipPlane1 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
    this.clipPlane2 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);
    this.clipPlane3 = new THREE.Plane(new THREE.Vector3(0, 0, 0), 0);

    for (let container of containers) {
      if (this.mouseUpEventHandler && container)
        container.removeEventListener('mouseup', this.mouseUpEventHandler);
      if (this.mouseMoveEventHandler && container)
        container.removeEventListener('mousemove', this.mouseMoveEventHandler);
      if (this.mouseDownEventHandler && container)
        container.removeEventListener('mousedown', this.mouseDownEventHandler);
    }

    window.removeEventListener('resize', this.onWindowResize);

    // set the event handler to null at the most end.
    this.mouseUpEventHandler = null;
    this.mouseMoveEventHandler = null;
    this.mouseDownEventHandler = null;
    this.onDoubleClick = null;
    this.onClick = null;
    this.onScroll = null;
    this.onWindowResize = null;
    this.onYellowChanged = null;
    this.onRedChanged = null;
    this.onGreenChanged = null;
    global.gc();
  }

  _disposeRenderer(rendererObj) {
    if (rendererObj.domElement) {
      rendererObj.domElement.removeEventListener(
        'dblclick',
        this.onDoubleClick
      );
      rendererObj.domElement.removeEventListener('click', this.onClick);
      rendererObj.domElement.removeEventListener('OnScroll', this.onScroll);
      rendererObj.domElement.removeEventListener('wheel', this.onWheel);
    }

    this._disposeObject3D(rendererObj.camera);
    delete rendererObj.camera;
    //
    delete rendererObj.color;
    delete rendererObj.light;
    //
    if (rendererObj.domElement) {
      this._removeCanvas(rendererObj.domElement);
      delete rendererObj.domElement;
    }

    //
    if (rendererObj.controls) {
      this._disposeControls(rendererObj.controls);
      delete rendererObj.controls;
    }
    delete rendererObj.domId;
    //
    if (rendererObj.renderer) {
      rendererObj.renderer.dispose();
      delete rendererObj.renderer.context.canvas;
      delete rendererObj.renderer.context;
      delete rendererObj.renderer.domElement;
      if (rendererObj.renderer.vr) rendererObj.renderer.vr.dispose();
      delete rendererObj.renderer.vr;
      delete rendererObj.renderer;
    }
    //
    if (rendererObj.localizerHelper) {
      rendererObj.localizerHelper.dispose();
      delete rendererObj.localizerHelper;
    }
    //
    this._disposeObject3D(rendererObj.localizerScene);
    delete rendererObj.localizerScene;
    //
    if (rendererObj.stackHelper) {
      this._disposeStack(rendererObj.stackHelper);
      rendererObj.stackHelper.dispose();
      delete rendererObj.stackHelper;
    }
    //
    this._disposeObject3D(rendererObj.scene);
    delete rendererObj.scene;
    //
    delete rendererObj.sliceColor;
    delete rendererObj.sliceOrientation;
  }

  _removeCanvas(domElement){
    if (domElement) {
      let canvasElements = domElement.getElementsByTagName("canvas");
      for (let index = canvasElements.length - 1; index >= 0; index--) {
        canvasElements[index].parentNode.removeChild(canvasElements[index]);
      }
    }
  }

  _disposeControls(controls) {
    if (controls) {
      controls.dispose();
      delete controls.domElement;
      delete controls.object;
    }
  }

  _disposeStack(stackHelper) {
    if (stackHelper && stackHelper._stack) {
      // dispose _frame
      if (stackHelper._stack._frame) {
        stackHelper._stack._frame = null;
      }
      if (stackHelper._stack._rawData) {
        this._disposeArray(stackHelper._stack._rawData);
      }
      if (stackHelper._stack._frameSegment) {
        this._disposeArray(stackHelper._stack._frameSegment);
      }
      delete stackHelper._stack;
    }
  }

  _disposeArray(arrayObject) {
    if (arrayObject) {
      for (let i = 0; i < arrayObject.length; i++) {
        if (arrayObject[i] && typeof arrayObject[i].dispose === 'function') {
          arrayObject[i].dispose();
        } else if (
          arrayObject[i] &&
          typeof arrayObject[i].free === 'function'
        ) {
          arrayObject[i].free();
        } else {
          arrayObject[i] = null;
        }
      }
    }
  }

  _disposeObject3D(object3D) {
    if (object3D) {
      while (object3D.children.length > 0) {
        this._disposeHierarchy(object3D.children[0], this._disposeNode);
        object3D.remove(object3D.children[0]);
      }
    }
  }
  _disposeSTLObject(stlObject) {
    delete stlObject.color;
    delete stlObject.label;
    delete stlObject.load;
    delete stlObject.location;
    if (stlObject.material) {
      stlObject.material.dispose();
      delete stlObject.material;
    }

    if (stlObject.materialBack) {
      stlObject.materialBack.dispose();
      delete stlObject.materialBack;
    }

    if (stlObject.materialFront) {
      stlObject.materialFront.dispose();
      delete stlObject.materialFront;
    }
    if (stlObject.mesh) {
      this._disposeHierarchy(stlObject.mesh, this._disposeNode);
      delete stlObject.mesh;
    }
    if (stlObject.meshBack) {
      this._disposeHierarchy(stlObject.meshBack, this._disposeNode);
      delete stlObject.meshBack;
    }
    if (stlObject.meshFront) {
      this._disposeHierarchy(stlObject.meshFront, this._disposeNode);
      delete stlObject.meshFront;
    }

    if (stlObject.scene) {
      this._disposeObject3D(stlObject.scene);
      delete stlObject.scene;
    }

    if (stlObject.organ) {
      delete stlObject.organ;
    }
  }

  _disposeNode(node) {
    if (node instanceof THREE.Mesh) {
      if (node.geometry) {
        node.geometry.dispose();
      }

      if (node.material) {
        if (node.material instanceof THREE.MeshFaceMaterial) {
          $.each(node.material.materials, function(idx, mtrl) {
            if (mtrl.map) mtrl.map.dispose();
            if (mtrl.lightMap) mtrl.lightMap.dispose();
            if (mtrl.bumpMap) mtrl.bumpMap.dispose();
            if (mtrl.normalMap) mtrl.normalMap.dispose();
            if (mtrl.specularMap) mtrl.specularMap.dispose();
            if (mtrl.envMap) mtrl.envMap.dispose();

            mtrl.dispose(); // disposes any programs associated with the material
          });
        } else {
          if (node.material.map) node.material.map.dispose();
          if (node.material.lightMap) node.material.lightMap.dispose();
          if (node.material.bumpMap) node.material.bumpMap.dispose();
          if (node.material.normalMap) node.material.normalMap.dispose();
          if (node.material.specularMap) node.material.specularMap.dispose();
          if (node.material.envMap) node.material.envMap.dispose();

          node.material.dispose(); // disposes any programs associated with the material
        }
      }
    }
  } // disposeNode

  _disposeHierarchy(node, callback) {
    for (let i = node.children.length - 1; i >= 0; i--) {
      let child = node.children[i];
      this._disposeHierarchy(child, callback);
      callback(child);
    }
  }
}
