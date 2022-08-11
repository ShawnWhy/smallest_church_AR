import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { LoopOnce, SphereGeometry, TextureLoader } from 'three'
import $ from "./Jquery"
import gsap from "gsap"
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
 import {ARToolkit}  from 'artoolkit5-js';
 import {ARjs} from '@ar-js-org/ar.js';
//the threex

var THREEx = THREEx || {}

THREEx.ArBaseControls = function(object3d){
	this.id = THREEx.ArBaseControls.id++

	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	// Events to honor
	// this.dispatchEvent({ type: 'becameVisible' })
	// this.dispatchEvent({ type: 'markerVisible' })	// replace markerFound
	// this.dispatchEvent({ type: 'becameUnVisible' })
}

THREEx.ArBaseControls.id = 0

Object.assign( THREEx.ArBaseControls.prototype, THREE.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		Functions
//////////////////////////////////////////////////////////////////////////////
/**
 * error catching function for update()
 */
THREEx.ArBaseControls.prototype.update = function(){
	console.assert(false, 'you need to implement your own update')
}

/**
 * error catching function for name()
 */
THREEx.ArBaseControls.prototype.name = function(){
	console.assert(false, 'you need to implement your own .name()')
	return 'Not yet implemented - name()'
}

// var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkerControls = THREEx.ArMarkerControls = function(context, object3d, parameters){
	var _this = this

	THREEx.ArBaseControls.call(this, object3d)

	this.context = context
	// handle default parameters
	this.parameters = {
		// size of the marker in meter
		size : 1,
		// type of marker - ['pattern', 'barcode', 'unknown' ]
		type : 'unknown',
		// url of the pattern - IIF type='pattern'
		patternUrl : null,
		// value of the barcode - IIF type='barcode'
		barcodeValue : null,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : 'modelViewMatrix',
		// minimal confidence in the marke recognition - between [0, 1] - default to 1
		minConfidence: 0.6,
	}

	// sanity check
	var possibleValues = ['pattern', 'barcode', 'unknown']
	console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type)
	var possibleValues = ['modelViewMatrix', 'cameraTransformMatrix' ]
	console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode)


        // create the marker Root
	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// add this marker to artoolkitsystem
	// TODO rename that .addMarkerControls
	context.addMarker(this)

	if( _this.context.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit()
	}else if( _this.context.parameters.trackingBackend === 'aruco' ){
		// TODO create a ._initAruco
		// put aruco second
		this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
	}else if( _this.context.parameters.trackingBackend === 'tango' ){
		this._initTango()
	}else console.assert(false)
}

ARjs.MarkerControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
ARjs.MarkerControls.prototype.constructor = THREEx.ArMarkerControls;

ARjs.MarkerControls.prototype.dispose = function(){
	this.context.removeMarker(this)

	// TODO remove the event listener if needed
	// unloadMaker ???
}

//////////////////////////////////////////////////////////////////////////////
//		update controls with new modelViewMatrix
//////////////////////////////////////////////////////////////////////////////

/**
 * When you actually got a new modelViewMatrix, you need to perfom a whole bunch
 * of things. it is done here.
 */
ARjs.MarkerControls.prototype.updateWithModelViewMatrix = function(modelViewMatrix){
	var markerObject3D = this.object3d;

	// mark object as visible
	markerObject3D.visible = true

	if( this.context.parameters.trackingBackend === 'artoolkit' ){
		// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
		var tmpMatrix = new THREE.Matrix4().copy(this.context._artoolkitProjectionAxisTransformMatrix)
		tmpMatrix.multiply(modelViewMatrix)

		modelViewMatrix.copy(tmpMatrix)
	}else if( this.context.parameters.trackingBackend === 'aruco' ){
		// ...
	}else if( this.context.parameters.trackingBackend === 'tango' ){
		// ...
	}else console.assert(false)


	if( this.context.parameters.trackingBackend !== 'tango' ){

		// change axis orientation on marker - artoolkit say Z is normal to the marker - ar.js say Y is normal to the marker
		var markerAxisTransformMatrix = new THREE.Matrix4().makeRotationX(Math.PI/2)
		modelViewMatrix.multiply(markerAxisTransformMatrix)
	}

	// change markerObject3D.matrix based on parameters.changeMatrixMode
	if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
		markerObject3D.matrix.copy(modelViewMatrix)
	}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
		markerObject3D.matrix.getInverse( modelViewMatrix )
	}else {
		console.assert(false)
	}

	// decompose - the matrix into .position, .quaternion, .scale
	markerObject3D.matrix.decompose(markerObject3D.position, markerObject3D.quaternion, markerObject3D.scale)

	// dispatchEvent
	this.dispatchEvent( { type: 'markerFound' } );
}

//////////////////////////////////////////////////////////////////////////////
//		utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * provide a name for a marker
 * - silly heuristic for now
 * - should be improved
 */
ARjs.MarkerControls.prototype.name = function(){
	var name = ''
	name += this.parameters.type;
	if( this.parameters.type === 'pattern' ){
		var url = this.parameters.patternUrl
		var basename = url.replace(/^.*\//g, '')
		name += ' - ' + basename
	}else if( this.parameters.type === 'barcode' ){
		name += ' - ' + this.parameters.barcodeValue
	}else{
		console.assert(false, 'no .name() implemented for this marker controls')
	}
	return name
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initArtoolkit = function(){
	var _this = this

	var artoolkitMarkerId = null

	var delayedInitTimerId = setInterval(function(){
		// check if arController is init
		var arController = _this.context.arController
		if( arController === null )	return
		// stop looping if it is init
		clearInterval(delayedInitTimerId)
		delayedInitTimerId = null
		// launch the _postInitArtoolkit
		postInit()
	}, 1000/50)

	return

	function postInit(){
		// check if arController is init
		var arController = _this.context.arController
		console.assert(arController !== null )

		// start tracking this pattern
		if( _this.parameters.type === 'pattern' ){
	                arController.loadMarker(_this.parameters.patternUrl, function(markerId) {
				artoolkitMarkerId = markerId
	                        arController.trackPatternMarkerId(artoolkitMarkerId, _this.parameters.size);
	                });
		}else if( _this.parameters.type === 'barcode' ){
			artoolkitMarkerId = _this.parameters.barcodeValue
			arController.trackBarcodeMarkerId(artoolkitMarkerId, _this.parameters.size);
		}else if( _this.parameters.type === 'unknown' ){
			artoolkitMarkerId = null
		}else{
			console.log(false, 'invalid marker type', _this.parameters.type)
		}

		// listen to the event
		arController.addEventListener('getMarker', function(event){
			if( event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern' ){
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idPatt === artoolkitMarkerId ) onMarkerFound(event)
			}else if( event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode' ){
				// console.log('BARCODE_MARKER idMatrix', event.data.marker.idMatrix, artoolkitMarkerId )
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idMatrix === artoolkitMarkerId )  onMarkerFound(event)
			}else if( event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown'){
				onMarkerFound(event)
			}
		})

	}

	function onMarkerFound(event){
		// honor his.parameters.minConfidence
		if( event.data.type === artoolkit.PATTERN_MARKER && event.data.marker.cfPatt < _this.parameters.minConfidence )	return
		if( event.data.type === artoolkit.BARCODE_MARKER && event.data.marker.cfMatt < _this.parameters.minConfidence )	return

		var modelViewMatrix = new THREE.Matrix4().fromArray(event.data.matrix)
		_this.updateWithModelViewMatrix(modelViewMatrix)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initAruco = function(){
	this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initTango = function(){
	var _this = this
	console.log('init tango ArMarkerControls')
}

// var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Context = THREEx.ArToolkitContext = function(parameters){
	var _this = this

	_this._updatedAt = null

	// handle default parameters
	this.parameters = {
		// AR backend - ['artoolkit', 'aruco', 'tango']
		trackingBackend: 'artoolkit',
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: false,
		// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
		detectionMode: 'mono',
		// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
		matrixCodeType: '3x3',

		// url of the camera parameters
		cameraParametersUrl: ARjs.Context.baseURL + 'parameters/camera_para.dat',

		// tune the maximum rate of pose detection in the source image
		maxDetectionRate: 60,
		// resolution of at which we detect pose in the source image
		canvasWidth: 640,
		canvasHeight: 480,

		// the patternRatio inside the artoolkit marker - artoolkit only
		patternRatio: 0.5,

		// enable image smoothing or not for canvas copy - default to true
		// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
		imageSmoothingEnabled : false,
	}
	// parameters sanity check
	console.assert(['artoolkit', 'aruco', 'tango'].indexOf(this.parameters.trackingBackend) !== -1, 'invalid parameter trackingBackend', this.parameters.trackingBackend)
	console.assert(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode)

        this.arController = null;
        this.arucoContext = null;

	_this.initialized = false


	this._arMarkersControls = []

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}

Object.assign( ARjs.Context.prototype, THREE.EventDispatcher.prototype );

// ARjs.Context.baseURL = '../'
// default to github page
ARjs.Context.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/'
ARjs.Context.REVISION = '1.6.0'



/**
 * Create a default camera for this trackingBackend
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Context.createDefaultCamera = function( trackingBackend ){
	console.assert(false, 'use ARjs.Utils.createDefaultCamera instead')
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else console.assert(false)
	return camera
}


//////////////////////////////////////////////////////////////////////////////
//		init functions
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.init = function(onCompleted){
	var _this = this
	if( this.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit(done)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._initAruco(done)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._initTango(done)
	}else console.assert(false)
	return

	function done(){
		// dispatch event
		_this.dispatchEvent({
			type: 'initialized'
		});

		_this.initialized = true

		onCompleted && onCompleted()
	}

}
////////////////////////////////////////////////////////////////////////////////
//          update function
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.update = function(srcElement){

	// be sure arController is fully initialized
        if(this.parameters.trackingBackend === 'artoolkit' && this.arController === null) return false;

	// honor this.parameters.maxDetectionRate
	var present = performance.now()
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present

	// mark all markers to invisible before processing this frame
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false
	})

	// process this frame
	if(this.parameters.trackingBackend === 'artoolkit'){
		this._updateArtoolkit(srcElement)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._updateAruco(srcElement)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._updateTango(srcElement)
	}else{
		console.assert(false)
	}

	// dispatch event
	this.dispatchEvent({
		type: 'sourceProcessed'
	});


	// return true as we processed the frame
	return true;
}

////////////////////////////////////////////////////////////////////////////////
//          Add/Remove markerControls
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.addMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	this._arMarkersControls.push(arMarkerControls)
}

ARjs.Context.prototype.removeMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	// console.log('remove marker for', arMarkerControls)
	var index = this.arMarkerControlss.indexOf(artoolkitMarker);
	console.assert(index !== index )
	this._arMarkersControls.splice(index, 1)
}

//////////////////////////////////////////////////////////////////////////////
//		artoolkit specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initArtoolkit = function(onCompleted){
        var _this = this

	// set this._artoolkitProjectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
	this._artoolkitProjectionAxisTransformMatrix = new THREE.Matrix4()
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

	// get cameraParameters
        var cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function(){
        	// init controller
                var arController = new ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
                _this.arController = arController

		// honor this.parameters.imageSmoothingEnabled
		arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;

		// honor this.parameters.debug
                if( _this.parameters.debug === true ){
			arController.debugSetup();
			arController.canvas.style.position = 'absolute'
			arController.canvas.style.top = '0px'
			arController.canvas.style.opacity = '0.6'
			arController.canvas.style.pointerEvents = 'none'
			arController.canvas.style.zIndex = '-1'
		}

		// setPatternDetectionMode
		var detectionModes = {
			'color'			: artoolkit.AR_TEMPLATE_MATCHING_COLOR,
			'color_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
			'mono'			: artoolkit.AR_TEMPLATE_MATCHING_MONO,
			'mono_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
		}
		var detectionMode = detectionModes[_this.parameters.detectionMode]
		console.assert(detectionMode !== undefined)
		arController.setPatternDetectionMode(detectionMode);

		// setMatrixCodeType
		var matrixCodeTypes = {
			'3x3'		: artoolkit.AR_MATRIX_CODE_3x3,
			'3x3_HAMMING63'	: artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
			'3x3_PARITY65'	: artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
			'4x4'		: artoolkit.AR_MATRIX_CODE_4x4,
			'4x4_BCH_13_9_3': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
			'4x4_BCH_13_5_5': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
		}
		var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType]
		console.assert(matrixCodeType !== undefined)
		arController.setMatrixCodeType(matrixCodeType);

		// set the patternRatio for artoolkit
		arController.setPattRatio(_this.parameters.patternRatio);

		// set thresholding in artoolkit
		// this seems to be the default
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_MANUAL)
		// adatative consume a LOT of cpu...
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE)
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU)

		// notify
                onCompleted()
        })
	return this
}

/**
 * return the projection matrix
 */
ARjs.Context.prototype.getProjectionMatrix = function(srcElement){


// FIXME rename this function to say it is artoolkit specific - getArtoolkitProjectMatrix
// keep a backward compatibility with a console.warn

	console.assert( this.parameters.trackingBackend === 'artoolkit' )
	console.assert(this.arController, 'arController MUST be initialized to call this function')
	// get projectionMatrixArr from artoolkit
	var projectionMatrixArr = this.arController.getCameraMatrix();
	var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)

	// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
	projectionMatrix.multiply(this._artoolkitProjectionAxisTransformMatrix)

	// return the result
	return projectionMatrix
}

ARjs.Context.prototype._updateArtoolkit = function(srcElement){
	this.arController.process(srcElement)
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initAruco = function(onCompleted){
	this.arucoContext = new THREEx.ArucoContext()

	// honor this.parameters.canvasWidth/.canvasHeight
	this.arucoContext.canvas.width = this.parameters.canvasWidth
	this.arucoContext.canvas.height = this.parameters.canvasHeight

	// honor this.parameters.imageSmoothingEnabled
	var context = this.arucoContext.canvas.getContext('2d')
	// context.mozImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.webkitImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.msImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.imageSmoothingEnabled = this.parameters.imageSmoothingEnabled;


	setTimeout(function(){
		onCompleted()
	}, 0)
}


ARjs.Context.prototype._updateAruco = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
        var detectedMarkers = this.arucoContext.detect(srcElement)

	detectedMarkers.forEach(function(detectedMarker){
		var foundControls = null
		for(var i = 0; i < arMarkersControls.length; i++){
			console.assert( arMarkersControls[i].parameters.type === 'barcode' )
			if( arMarkersControls[i].parameters.barcodeValue === detectedMarker.id ){
				foundControls = arMarkersControls[i]
				break;
			}
		}
		if( foundControls === null )	return

		var tmpObject3d = new THREE.Object3D
                _this.arucoContext.updateObject3D(tmpObject3d, foundControls._arucoPosit, foundControls.parameters.size, detectedMarker);
		tmpObject3d.updateMatrix()

		foundControls.updateWithModelViewMatrix(tmpObject3d.matrix)
	})
}

//////////////////////////////////////////////////////////////////////////////
//		tango specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initTango = function(onCompleted){
	var _this = this
	// check webvr is available
	if (navigator.getVRDisplays){
		// do nothing
	} else if (navigator.getVRDevices){
		alert("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
	} else {
		alert("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
	}


	this._tangoContext = {
		vrDisplay: null,
		vrPointCloud: null,
		frameData: new VRFrameData(),
	}


	// get vrDisplay
	navigator.getVRDisplays().then(function (vrDisplays){
		if( vrDisplays.length === 0 )	alert('no vrDisplays available')
		var vrDisplay = _this._tangoContext.vrDisplay = vrDisplays[0]

		console.log('vrDisplays.displayName :', vrDisplay.displayName)

		// init vrPointCloud
		if( vrDisplay.displayName === "Tango VR Device" ){
                	_this._tangoContext.vrPointCloud = new THREE.WebAR.VRPointCloud(vrDisplay, true)
		}

		// NOTE it doesnt seem necessary and it fails on tango
		// var canvasElement = document.createElement('canvas')
		// document.body.appendChild(canvasElement)
		// _this._tangoContext.requestPresent([{ source: canvasElement }]).then(function(){
		// 	console.log('vrdisplay request accepted')
		// });

		onCompleted()
	});
}


ARjs.Context.prototype._updateTango = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
	var tangoContext= this._tangoContext
	var vrDisplay = this._tangoContext.vrDisplay

	// check vrDisplay is already initialized
	if( vrDisplay === null )	return


        // Update the point cloud. Only if the point cloud will be shown the geometry is also updated.
	if( vrDisplay.displayName === "Tango VR Device" ){
	        var showPointCloud = true
		var pointsToSkip = 0
	        _this._tangoContext.vrPointCloud.update(showPointCloud, pointsToSkip, true)
	}


	if( this._arMarkersControls.length === 0 )	return

	// TODO here do a fake search on barcode/1001 ?

	var foundControls = this._arMarkersControls[0]

	var frameData = this._tangoContext.frameData

	// read frameData
	vrDisplay.getFrameData(frameData);

	if( frameData.pose.position === null )		return
	if( frameData.pose.orientation === null )	return

	// create cameraTransformMatrix
	var position = new THREE.Vector3().fromArray(frameData.pose.position)
	var quaternion = new THREE.Quaternion().fromArray(frameData.pose.orientation)
	var scale = new THREE.Vector3(1,1,1)
	var cameraTransformMatrix = new THREE.Matrix4().compose(position, quaternion, scale)
	// compute modelViewMatrix from cameraTransformMatrix
	var modelViewMatrix = new THREE.Matrix4()
	modelViewMatrix.getInverse( cameraTransformMatrix )

	foundControls.updateWithModelViewMatrix(modelViewMatrix)

	// console.log('position', position)
	// if( position.x !== 0 ||  position.y !== 0 ||  position.z !== 0 ){
	// 	console.log('vrDisplay tracking')
	// }else{
	// 	console.log('vrDisplay NOT tracking')
	// }

}
// var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Source = THREEx.ArToolkitSource = function(parameters){	
	var _this = this

	this.ready = false
        this.domElement = null

	// handle default parameters
	this.parameters = {
		// type of source - ['webcam', 'image', 'video']
		sourceType : 'webcam',
		// url of the source - valid if sourceType = image|video
		sourceUrl : null,
		
		// resolution of at which we initialize in the source image
		sourceWidth: 640,
		sourceHeight: 480,
		// resolution displayed for the source 
		displayWidth: 640,
		displayHeight: 480,
	}
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}	
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.init = function(onReady, onError){
	var _this = this

        if( this.parameters.sourceType === 'image' ){
                var domElement = this._initSourceImage(onSourceReady, onError)                        
        }else if( this.parameters.sourceType === 'video' ){
                var domElement = this._initSourceVideo(onSourceReady, onError)                        
        }else if( this.parameters.sourceType === 'webcam' ){
                // var domElement = this._initSourceWebcamOld(onSourceReady)                        
                var domElement = this._initSourceWebcam(onSourceReady, onError)                        
        }else{
                console.assert(false)
        }

	// attach
        this.domElement = domElement
        this.domElement.style.position = 'absolute'
        this.domElement.style.top = '0px'
        this.domElement.style.left = '0px'
        this.domElement.style.zIndex = '-2'

	return this
        function onSourceReady(){
		document.body.appendChild(_this.domElement);

		_this.ready = true

		onReady && onReady()
        }
} 

////////////////////////////////////////////////////////////////////////////////
//          init image source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceImage = function(onReady) {
	// TODO make it static
        var domElement = document.createElement('img')
	domElement.src = this.parameters.sourceUrl

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.naturalWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);

	return domElement                
}

////////////////////////////////////////////////////////////////////////////////
//          init video source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceVideo = function(onReady) {
	// TODO make it static
	var domElement = document.createElement('video');
	domElement.src = this.parameters.sourceUrl

	domElement.style.objectFit = 'initial'

	domElement.autoplay = true;
	domElement.webkitPlaysinline = true;
	domElement.controls = false;
	domElement.loop = true;
	domElement.muted = true

	// trick to trigger the video on android
	document.body.addEventListener('click', function onClick(){
		document.body.removeEventListener('click', onClick);
		domElement.play()
	})

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'
	
	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.videoWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);
	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          handle webcam source
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype._initSourceWebcam = function(onReady, onError) {
	var _this = this

	// init default value
	onError = onError || function(error){	
		alert('Webcam Error\nName: '+error.name + '\nMessage: '+error.message)
	}

	var domElement = document.createElement('video');
	domElement.setAttribute('autoplay', '');
	domElement.setAttribute('muted', '');
	domElement.setAttribute('playsinline', '');
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// check API is available
	if (navigator.mediaDevices === undefined 
			|| navigator.mediaDevices.enumerateDevices === undefined 
			|| navigator.mediaDevices.getUserMedia === undefined  ){
		if( navigator.mediaDevices === undefined )				var fctName = 'navigator.mediaDevices'
		else if( navigator.mediaDevices.enumerateDevices === undefined )	var fctName = 'navigator.mediaDevices.enumerateDevices'
		else if( navigator.mediaDevices.getUserMedia === undefined )		var fctName = 'navigator.mediaDevices.getUserMedia'
		else console.assert(false)
		onError({
			name: '',
			message: 'WebRTC issue-! '+fctName+' not present in your browser'
		})
		return null
	}

	// get available devices
	navigator.mediaDevices.enumerateDevices().then(function(devices) {
                var userMediaConstraints = {
			audio: false,
			video: {
				facingMode: 'environment',
				width: {
					ideal: _this.parameters.sourceWidth,
					// min: 1024,
					// max: 1920
				},
				height: {
					ideal: _this.parameters.sourceHeight,
					// min: 776,
					// max: 1080
				}
		  	}
                }
		// get a device which satisfy the constraints
		navigator.mediaDevices.getUserMedia(userMediaConstraints).then(function success(stream) {
			// set the .src of the domElement
			domElement.srcObject = stream;
			// to start the video, when it is possible to start it only on userevent. like in android
			document.body.addEventListener('click', function(){
				domElement.play();
			})
			// domElement.play();

// TODO listen to loadedmetadata instead
			// wait until the video stream is ready
			var interval = setInterval(function() {
				if (!domElement.videoWidth)	return;
				onReady()
				clearInterval(interval)
			}, 1000/50);
		}).catch(function(error) {
			onError({
				name: error.name,
				message: error.message
			});
		});
	}).catch(function(error) {
		onError({
			message: error.message
		});
	});

	return domElement
}

//////////////////////////////////////////////////////////////////////////////
//		Handle Mobile Torch
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.hasMobileTorch = function(){
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false )	return false

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];

	// if videoTrack.getCapabilities() doesnt exist, return false now
	if( videoTrack.getCapabilities === undefined )	return false

	var capabilities = videoTrack.getCapabilities()
	
	return capabilities.torch ? true : false
}

/**
 * toggle the flash/torch of the mobile fun if applicable.
 * Great post about it https://www.oberhofer.co/mediastreamtrack-and-its-capabilities/
 */
ARjs.Source.prototype.toggleMobileTorch = function(){
	// sanity check
	console.assert(this.hasMobileTorch() === true)
		
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false ){
		alert('enabling mobile torch is available only on webcam')
		return
	}

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];
	var capabilities = videoTrack.getCapabilities()
	
	if( !capabilities.torch ){
		alert('no mobile torch is available on your camera')
		return
	}

	this._currentTorchStatus = this._currentTorchStatus === false ? true : false
	videoTrack.applyConstraints({
		advanced: [{
			torch: this._currentTorchStatus
		}]
	}).catch(function(error){
		console.log(error)
	});
}

ARjs.Source.prototype.domElementWidth = function(){
	return parseInt(this.domElement.style.width)
}
ARjs.Source.prototype.domElementHeight = function(){
	return parseInt(this.domElement.style.height)
}

////////////////////////////////////////////////////////////////////////////////
//          handle resize
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResizeElement = function(){
	var _this = this
	var screenWidth = window.innerWidth
	var screenHeight = window.innerHeight

	// sanity check
	console.assert( arguments.length === 0 )

	// compute sourceWidth, sourceHeight
	if( this.domElement.nodeName === "IMG" ){
		var sourceWidth = this.domElement.naturalWidth
		var sourceHeight = this.domElement.naturalHeight
	}else if( this.domElement.nodeName === "VIDEO" ){
		var sourceWidth = this.domElement.videoWidth
		var sourceHeight = this.domElement.videoHeight
	}else{
		console.assert(false)
	}
	
	// compute sourceAspect
	var sourceAspect = sourceWidth / sourceHeight
	// compute screenAspect
	var screenAspect = screenWidth / screenHeight

	// if screenAspect < sourceAspect, then change the width, else change the height
	if( screenAspect < sourceAspect ){
		// compute newWidth and set .width/.marginLeft
		var newWidth = sourceAspect * screenHeight
		this.domElement.style.width = newWidth+'px'
		this.domElement.style.marginLeft = -(newWidth-screenWidth)/2+'px'
		
		// init style.height/.marginTop to normal value
		this.domElement.style.height = screenHeight+'px'
		this.domElement.style.marginTop = '0px'
	}else{
		// compute newHeight and set .height/.marginTop
		var newHeight = 1 / (sourceAspect / screenWidth)
		this.domElement.style.height = newHeight+'px'
		this.domElement.style.marginTop = -(newHeight-screenHeight)/2+'px'
		
		// init style.width/.marginLeft to normal value
		this.domElement.style.width = screenWidth+'px'
		this.domElement.style.marginLeft = '0px'
	}
}
/*
ARjs.Source.prototype.copyElementSizeTo = function(otherElement){
	otherElement.style.width = this.domElement.style.width
	otherElement.style.height = this.domElement.style.height	
	otherElement.style.marginLeft = this.domElement.style.marginLeft
	otherElement.style.marginTop = this.domElement.style.marginTop
}
*/

ARjs.Source.prototype.copyElementSizeTo = function(otherElement){

	if (window.innerWidth > window.innerHeight)
	{
		//landscape
		otherElement.style.width = this.domElement.style.width
		otherElement.style.height = this.domElement.style.height
		otherElement.style.marginLeft = this.domElement.style.marginLeft
		otherElement.style.marginTop = this.domElement.style.marginTop
	}
	else {
		//portrait
		otherElement.style.height = this.domElement.style.height
		otherElement.style.width = (parseInt(otherElement.style.height) * 4/3)+"px";
		otherElement.style.marginLeft = ((window.innerWidth- parseInt(otherElement.style.width))/2)+"px";
		otherElement.style.marginTop = 0;
	}

}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.copySizeTo = function(){
	console.warn('obsolete function arToolkitSource.copySizeTo. Use arToolkitSource.copyElementSizeTo' )
	this.copyElementSizeTo.apply(this, arguments)
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResize	= function(arToolkitContext, renderer, camera){
	if( arguments.length !== 3 ){
		console.warn('obsolete function arToolkitSource.onResize. Use arToolkitSource.onResizeElement' )
		return this.onResizeElement.apply(this, arguments)
	}

	var trackingBackend = arToolkitContext.parameters.trackingBackend
	

	// RESIZE DOMELEMENT
	if( trackingBackend === 'artoolkit' ){

		this.onResizeElement()
		
		var isAframe = renderer.domElement.dataset.aframeCanvas ? true : false
		if( isAframe === false ){
			this.copyElementSizeTo(renderer.domElement)	
		}else{
			
		}

		if( arToolkitContext.arController !== null ){
			this.copyElementSizeTo(arToolkitContext.arController.canvas)	
		}
	}else if( trackingBackend === 'aruco' ){
		this.onResizeElement()
		this.copyElementSizeTo(renderer.domElement)	

		this.copyElementSizeTo(arToolkitContext.arucoContext.canvas)	
	}else if( trackingBackend === 'tango' ){
		renderer.setSize( window.innerWidth, window.innerHeight )
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)


	// UPDATE CAMERA
	if( trackingBackend === 'artoolkit' ){
		if( arToolkitContext.arController !== null ){
			camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );			
		}
	}else if( trackingBackend === 'aruco' ){	
		camera.aspect = renderer.domElement.width / renderer.domElement.height;
		camera.updateProjectionMatrix();			
	}else if( trackingBackend === 'tango' ){
		var vrDisplay = arToolkitContext._tangoContext.vrDisplay
		// make camera fit vrDisplay
		if( vrDisplay && vrDisplay.displayName === "Tango VR Device" ) THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, camera)
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)	
}

//end of Threex



let session
let portalGroup
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let lock = false;
let building;
let Eggmixer;
let shellmixer
let pearmixer
let doormixer
let skyMaterialArray2 =[]
let skyMesh2
let target = new THREE.Vector3()
let world = 1;
let reticle;

let defaultMaterial = new THREE.MeshBasicMaterial({
	color: 0x444444,
	transparent: true
});

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}


let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();


const textureLoader = new THREE.TextureLoader()

var scene, camera, otherCamera, renderer, clock, deltaTime, totalTime, keyboard 


var portalA

let eggIntersect = [];
let shellIntersect = []
let pearIntersect = []

let eggAnimation
let shellAnimation
let pearAnimation
let doorAnimation

let loader;


let arToolkitSource, arToolkitContext, smoothedControls;

let markerRoot1, markerRoot2;

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
scene = new THREE.Scene()

//raycaster
const raycaster = new THREE.Raycaster()


 const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


// function init() {
// //   addReticleToScene()
    
//   const button = ARButton.createButton(renderer, {
//     requiredFeatures: ["hit-test"]
//   });
  
//         document.body.appendChild(button);
  
//         window.addEventListener('resize', onWindowResize, false);
//     }
  

const gltfLoader = new GLTFLoader()
// gltfLoader.setDRACOLoader(dracoLoader)

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.xr.enabled = true; // we have to enable the renderer for webxr
// const controller= renderer.xr.getController(0);

// console.log("controller")
// console.log(controller)

// async function initializeHitTestSource() {
// session = renderer.xr.getSession();
  
//   // Reference spaces express relationships between an origin and the world.

//   // For hit testing, we use the "viewer" reference space,
//   // which is based on the device's pose at the time of the hit test.
//   const viewerSpace = await session.requestReferenceSpace("viewer");
//   hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

//   // We're going to use the reference space of "local" for drawing things.
//   // which gives us stability in terms of the environment.
//   // read more here: https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace
//   localSpace = await session.requestReferenceSpace("local");

//   // set this to true so we don't request another hit source for the rest of the session
//   hitTestSourceInitialized = true;
  
//   // In case we close the AR session by hitting the button "End AR"
//   session.addEventListener("end", () => {
//     hitTestSourceInitialized = false;
//     hitTestSource = null;
//   });
// }
//add reticle to scene
// function addReticleToScene(){

//   const geometry = new THREE.RingBufferGeometry(0.15,0.2,32).rotateX(-Math.PI/2);
//   const material = new THREE.MeshBasicMaterial();
//   reticle = new THREE.Mesh(geometry, material);
  
//   reticle.matrixAutoUpdate = false;
//   reticle.visible = false;
//   scene.add(reticle);
//   }

// camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);

// camera.layers.enable(1);

// otherCamera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 1000 );


controller.addEventListener('select', ()=>{

  if(shellIntersect.length>0){
		skyMaterialArray2 = [
			new THREE.MeshBasicMaterial( { map: loader.load("sea/posx.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("sea/negx.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("sea/posy.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("sea/negy.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("sea/posz.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("sea/negz.jpg"), side: THREE.BackSide } ),
		];

		skyMesh2.material = skyMaterialArray2;

		
	}

	if(pearIntersect.length>0){
		skyMaterialArray2 = [
			new THREE.MeshBasicMaterial( { map: loader.load("mountain/posx.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("mountain/negx.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("mountain/posy.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("mountain/negy.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("mountain/posz.jpg"), side: THREE.BackSide } ),
			new THREE.MeshBasicMaterial( { map: loader.load("mountain/negz.jpg"), side: THREE.BackSide } ),
		];

		skyMesh2.material = skyMaterialArray2;
	}
	if(eggIntersect.length>0){
		if(world==1){
		doorAnimation.play()
		doorAnimation.clampWhenFinished = true
		doorAnimation.timeScale=.5
		doorAnimation.setLoop( THREE.LoopOnce )
		gsap.to(portalA.scale,{duration:1,y:2})
		gsap.to(portalA.scale,{duration:1,x:1})
		gsap.to(portalA.scale,{duration:1,z:1})

		}

		else{
			
			
			doorAnimation.reset()
			doorAnimation.stop()

			gsap.to(portalA.scale,{duration:1,y:.002})
			gsap.to(portalA.scale,{duration:1,x:.001})
			gsap.to(portalA.scale,{duration:1,z:.001})
			world=1

		}
	}

})

//end click function

//lighting situation 

const ambientLight = new THREE.AmbientLight('green', .2)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight('#ebdbb7', 1)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(- 5, 5, 0)
scene.add(directionalLight)

camera = new THREE.Camera();
scene.add(camera);
  
function initialize()
{
		
	////////////////////////////////////////////////////////////
	// setup arToolkitSource
	////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});

	function onResize()
	{
		arToolkitSource.onResize()	
		arToolkitSource.copySizeTo(renderer.domElement)	
		if ( arToolkitContext.arController !== null )
		{
			arToolkitSource.copySizeTo(arToolkitContext.arController.canvas)	
		}	
	}

	arToolkitSource.init(function onReady(){
		onResize()
	});
	
	// handle resize event
	window.addEventListener('resize', function(){
		onResize()
	});
	
	////////////////////////////////////////////////////////////
	// setup arToolkitContext
	////////////////////////////////////////////////////////////	

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: 'data/camera_para.dat',
		detectionMode: 'mono'
	});
	
	// copy projection matrix to camera when initialization complete
	arToolkitContext.init( function onCompleted(){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});

	////////////////////////////////////////////////////////////
	// setup markerRoots
	////////////////////////////////////////////////////////////

	// build markerControls
	// kanjiMarker = new THREE.Group();
	// scene.add(kanjiMarker);
	
	// let markerControls1 = new THREEx.ArMarkerControls(arToolkitContext, kanjiMarker, {
	// 	type : 'pattern',
	// 	patternUrl : "data/kanji.patt",
	// })

	// interpolates from last position to create smoother transitions when moving.
	// parameter lerp values near 0 are slow, near 1 are fast (instantaneous).
	let smoothedRoot = new THREE.Group();
	scene.add(smoothedRoot);
	smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
		lerpPosition: 0.5,
		lerpQuaternion: 0.5,
		lerpScale: 1,
		// minVisibleDelay: 1,
		// minUnvisibleDelay: 1,
	});

	clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;
	
	// keyboard = new Keyboard();
	
	 loader = new THREE.TextureLoader();


	gltfLoader.load(
		'/smallest church.glb',
		(gltf) =>
		{

			building = gltf.scene;
			// building.scale.x*=.1
			// building.scale.y*=.1
			// building.scale.z*=.1

    //   building.layers.set(3);
			console.log(building.children)
			let children= building.children
			children[4].material= defaultMaterial.clone()
			children[4].material.opacity= 0.5;
			

			children[4].layers.set(1)
			scene.add(children[4])

			camera.layers.enable(1)
			


			// children.forEach(child => {
			// 	child.material = defaultMaterial.clone()
				
			// 	child.layers.set(2);
			// 	scene.add(child)
				
			// });



			// children[0].children[0].children[1].material = new THREE.MeshBasicMaterial({
			// 	color:"white"
			// })
		
		
		scene.add(building)



		Eggmixer = new THREE.AnimationMixer(children[1])
		shellmixer = new THREE.AnimationMixer(children[3])
		pearmixer = new THREE.AnimationMixer(children[2])
		doormixer = new THREE.AnimationMixer(children[0])
        // console.log(mixer)
		// console.log(gltf.animations)
    eggAnimation = Eggmixer.clipAction(gltf.animations[5]) 

    shellAnimation = shellmixer.clipAction(gltf.animations[11]) 
		pearAnimation = pearmixer.clipAction(gltf.animations[7])
		doorAnimation = doormixer.clipAction(gltf.animations[0])  

		
        // console.log(walk)
        eggAnimation.timeScale=2.5
        eggAnimation.clampWhenFinished=true
        // eggAnimation.play()

		shellAnimation.timeScale=2.5
        shellAnimation.clampWhenFinished=true
        // shellAnimation.play()

		pearAnimation.timeScale=2.5
        pearAnimation.clampWhenFinished=true
        // pearAnimation.play()

		doorAnimation.timeScale=2.5
        doorAnimation.clampWhenFinished=true
        // doorAnimation.play()
        
	
	// textures from http://www.humus.name/
	// let skyMaterialArray1 = [
	// 	new THREE.MeshBasicMaterial( { map: loader.load("/px.png"), side: THREE.BackSide } ),
	// 	new THREE.MeshBasicMaterial( { map: loader.load("/nx.png"), side: THREE.BackSide } ),
	// 	new THREE.MeshBasicMaterial( { map: loader.load("/py.png"), side: THREE.BackSide } ),
	// 	new THREE.MeshBasicMaterial( { map: loader.load("/ny.png"), side: THREE.BackSide } ),
	// 	new THREE.MeshBasicMaterial( { map: loader.load("/pz.png"), side: THREE.BackSide } ),
	// 	new THREE.MeshBasicMaterial( { map: loader.load("/nz.png"), side: THREE.BackSide } ),
	// ];
	// let skyMesh1 = new THREE.Mesh(
	// 	new THREE.BoxGeometry(50,50,50),
	// 	skyMaterialArray1 );
	// // skyMesh1.position.x = -20;
	// scene.add(skyMesh1);
	
	portalA = new THREE.Mesh(
		new THREE.SphereGeometry(1, 32),
		defaultMaterial.clone()
	);
	portalA.material.opacity = 0.5;
	portalGroup = new THREE.Group();
	portalA.position.set(0, 0.5, -3);
	portalA.scale.y *=2;
	portalA.scale.x *=.001
	portalA.scale.y *=.001
	portalA.scale.z *=.001
	portalGroup.add(portalA)
	portalGroup.rotation.y += Math.PI*.75;
	// portalA.rotation.y = Math.PI/4;
	portalA.layers.set(1);
	scene.add(portalGroup);
	scene.add(camera)

   
	camera.layers.enable(1);
	




  skyMaterialArray2 = [
		new THREE.MeshBasicMaterial( { map: loader.load("mountain/posx.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("mountain/negx.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("mountain/posy.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("mountain/negy.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("mountain/posz.jpg"), side: THREE.BackSide } ),
		new THREE.MeshBasicMaterial( { map: loader.load("mountain/negz.jpg"), side: THREE.BackSide } ),
	];
	skyMesh2 = new THREE.Mesh(
		new THREE.BoxGeometry(40,40,40),
		skyMaterialArray2 );
	// skyMesh2.position.x = 50;
	skyMesh2.layers.set(2)
	scene.add(skyMesh2);

  // scene.add(otherCamera)


})

}
//init end


function update()
{
	// portal ring color cycle
	
	// update artoolkit on every frame
	if ( arToolkitSource.ready !== false )
		arToolkitContext.update( arToolkitSource.domElement );
		
	// additional code for smoothed controls
	// smoothedControls.update(kanjiMarker);
}
	






 



function animate() {
  renderer.setAnimationLoop(render);




  
}

let oldElapsedTime=null;

let previousTime = 0








// init();
initialize();
animate();



function render(timestamp, frame) {
const elapsedTime = clock.getElapsedTime()
const deltaTime = elapsedTime - oldElapsedTime
oldElapsedTime = elapsedTime
raycaster.setFromCamera(new THREE.Vector3(0,0,-.05).applyMatrix4(controller.matrixWorld), camera)

if(portalA !=null){
		
  // console.log(portalA.getWorldPosition(target))
  // console.log(controls.getObject().position)

  // if(controller.position.z<portalA.getWorldPosition(target).z+1 &&
  // controller.position.z>portalA.getWorldPosition(target).z-1 &&
  // controller.position.x>portalA.getWorldPosition(target).x-1 &&
  // controller.position.x<portalA.getWorldPosition(target).x+1){

  //   world = 2
  //    }

}
if(building != null){
eggIntersect = raycaster.intersectObject(building.children[1])
shellIntersect = raycaster.intersectObject(building.children[3].children[0].children[1])
pearIntersect = raycaster.intersectObject(building.children[2])


  if(eggIntersect.length>0){
  eggAnimation.play()      
      }
  else{
    // doorAnimation.reset()
    eggAnimation.stop()
    // eggAnimation.reset()
  }

  if(pearIntersect.length>0){
    pearAnimation.play()
    pearAnimation.play()
    
    pearAnimation.weight=1
    pearAnimation.setEffectiveWeight(1)
    pearAnimation.clampWhenFinished = true
    pearAnimation.timeScale=3
    pearAnimation.setLoop( THREE.LoopOnce )
  }
  else{

    pearAnimation.reset()
  }

  if(shellIntersect.length>0){
    shellAnimation.play()
  
    
    shellAnimation.weight=1
    shellAnimation.setEffectiveWeight(1)
    shellAnimation.clampWhenFinished = true
    shellAnimation.timeScale=3
    shellAnimation.setLoop( THREE.LoopOnce )
  }
  else{

    shellAnimation.reset()
  }
}
  // mainCamera.position.copy(controls.getObject().position)
  prevTime = elapsedTime;
  oldElapsedTime = elapsedTime;

  if(Eggmixer)
  {
    Eggmixer.update(deltaTime)
  }

  if(shellmixer)
  {
    shellmixer.update(deltaTime)
  }

  if(pearmixer)
  {
    pearmixer.update(deltaTime)
  }

  if(doormixer)
  {
    doormixer.update(deltaTime)
  }


//   camera.layers.enable(2)

	if(world==1){

	
		let gl = renderer.context;
	
		// clear buffers now: color, depth, stencil 
		renderer.clear(true,true,true);
		// do not clear buffers before each render pass
		renderer.autoClear = false;
			
		// FIRST PASS
		// goal: using the stencil buffer, place 1's in position of first portal (layer 1)
	
		// enable the stencil buffer
		gl.enable(gl.STENCIL_TEST);
		
		// layer 1 contains only the first portal
		camera.layers.set(1); 
	
		gl.stencilFunc(gl.ALWAYS, 1, 0xff);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
		gl.stencilMask(0xff);
	
		// only write to stencil buffer (not color or depth)
		gl.colorMask(false,false,false,false);
		gl.depthMask(false);
		
		renderer.render( scene, camera );
	
		// SECOND PASS
		// goal: render skybox (layer 2) but only through portal
		
		gl.colorMask(true,true,true,true);
		gl.depthMask(true);
		
		gl.stencilFunc(gl.EQUAL, 1, 0xff);
		gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		
		camera.layers.set(2);
		renderer.render( scene, camera );
		
		// FINAL PASS
		// goal: render the rest of the scene (layer 0)
		
		// using stencil buffer simplifies drawing border around portal
		gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
		gl.colorMask(true,true,true,true);
		gl.depthMask(true);
		
		camera.layers.set(0); // layer 0 contains portal border mesh
		renderer.render( scene, camera );
		
		// set things back to normal
		renderer.autoClear = true;
		

	}

	else{

		camera.layers.enable(5);
		

		renderer.render( scene, camera );

	}

	
//   if(frame){
    
//     if(!hitTestSourceInitialized){
//       initializeHitTestSource();
//     }
//   }
  
//   if(hitTestSourceInitialized){
//     const hitTestResults = frame.getHitTestResults(hitTestSource);
//     // console.log(hitTestResults)
    
//     if(hitTestResults.length>0){
//       const hit = hitTestResults[0]
      
//       const pose = hit.getPose(localSpace)
//       reticle.visible = true;
//       reticle.matrix.fromArray(pose.transform.matrix)
//     }
//     else{
//       reticle.visible=false
//     }
//   }
  
        // renderer.render(scene, camera);

  
}


