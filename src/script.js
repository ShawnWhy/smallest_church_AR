import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { LoopOnce, SphereGeometry, TextureLoader } from 'three'
import $ from "./Jquery"
// import gsap from "gsap"
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

// app.js
// ======
// var tools = require('./tools');
// console.log(typeof tools.foo); // => 'function'
// console.log(typeof tools.bar); // => 'function'
// console.log(typeof tools.zemba); // => undefined

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


function init() {
//   addReticleToScene()
    
  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"]
  });
  
        document.body.appendChild(button);
  
        window.addEventListener('resize', onWindowResize, false);
    }
  

const gltfLoader = new GLTFLoader()
// gltfLoader.setDRACOLoader(dracoLoader)

let hitTestSource = null;
let localSpace = null;
let hitTestSourceInitialized = false;

renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // we have to enable the renderer for webxr
const controller= renderer.xr.getController(0);

// console.log("controller")
// console.log(controller)

async function initializeHitTestSource() {
session = renderer.xr.getSession();
  
  // Reference spaces express relationships between an origin and the world.

  // For hit testing, we use the "viewer" reference space,
  // which is based on the device's pose at the time of the hit test.
  const viewerSpace = await session.requestReferenceSpace("viewer");
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  // We're going to use the reference space of "local" for drawing things.
  // which gives us stability in terms of the environment.
  // read more here: https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace
  localSpace = await session.requestReferenceSpace("local");

  // set this to true so we don't request another hit source for the rest of the session
  hitTestSourceInitialized = true;
  
  // In case we close the AR session by hitting the button "End AR"
  session.addEventListener("end", () => {
    hitTestSourceInitialized = false;
    hitTestSource = null;
  });
}
//add reticle to scene
function addReticleToScene(){

  const geometry = new THREE.RingBufferGeometry(0.15,0.2,32).rotateX(-Math.PI/2);
  const material = new THREE.MeshBasicMaterial();
  reticle = new THREE.Mesh(geometry, material);
  
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  }

camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);

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
		// gsap.to(portalA.scale,{duration:1,y:2})
		// gsap.to(portalA.scale,{duration:1,x:1})
		// gsap.to(portalA.scale,{duration:1,z:1})
			world=2

		}

		else{
			
			skyMesh2.material = new THREE.MeshBasicMaterial({color:"white"},{opacity:0})
				 
			doorAnimation.reset()
			doorAnimation.stop()

			// gsap.to(portalA.scale,{duration:1,y:.002})
			// gsap.to(portalA.scale,{duration:1,x:.001})
			// gsap.to(portalA.scale,{duration:1,z:.001})
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
  
function initialize()
{
	

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
			// children[4].material= defaultMaterial.clone()
			// children[4].material.opacity= 0.5;
			

			// children[4].layers.set(2)
			// // children[4].layers.set(2)

			// scene.add(children[4])

			// camera.layers.enable(1)
			// camera.layers.set(4)


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
	
	// portalA = new THREE.Mesh(
	// 	new THREE.SphereGeometry(1, 32),
	// 	defaultMaterial.clone()
	// );
	// portalA.material.opacity = 0.5;
	// portalGroup = new THREE.Group();
	// portalA.position.set(0, 0.5, -3);
	// portalA.scale.y *=2;
	// portalA.scale.x *=.001
	// portalA.scale.y *=.001
	// portalA.scale.z *=.001
	// portalGroup.add(portalA)
	// portalGroup.rotation.y += Math.PI*.75;
	// portalA.rotation.y = Math.PI/4;
	// portalA.layers.set(4);
	// scene.add(portalGroup);
	scene.add(camera)

    // camera.layers.enable(4);
	// camera.layers.enable(5);
	




//   skyMaterialArray2 = [
// 		new THREE.MeshBasicMaterial( { map: loader.load("mountain/posx.jpg"), side: THREE.BackSide } ),
// 		new THREE.MeshBasicMaterial( { map: loader.load("mountain/negx.jpg"), side: THREE.BackSide } ),
// 		new THREE.MeshBasicMaterial( { map: loader.load("mountain/posy.jpg"), side: THREE.BackSide } ),
// 		new THREE.MeshBasicMaterial( { map: loader.load("mountain/negy.jpg"), side: THREE.BackSide } ),
// 		new THREE.MeshBasicMaterial( { map: loader.load("mountain/posz.jpg"), side: THREE.BackSide } ),
// 		new THREE.MeshBasicMaterial( { map: loader.load("mountain/negz.jpg"), side: THREE.BackSide } ),
// 	];
	skyMesh2 = new THREE.Mesh(
		new THREE.BoxGeometry(40,40,40),
		new THREE.MeshBasicMaterial({color:"white"},{opacity:0}),
		 );
	// skyMesh2.position.x = 50;
	// skyMesh2.layers.set(5)
	scene.add(skyMesh2);

  // scene.add(otherCamera)


})

}
//init end


	






 



function animate() {
  renderer.setAnimationLoop(render);




  
}

let oldElapsedTime=null;

let previousTime = 0








init();
initialize();
animate();



function render(timestamp, frame) {
const elapsedTime = clock.getElapsedTime()
const deltaTime = elapsedTime - oldElapsedTime
oldElapsedTime = elapsedTime
raycaster.setFromCamera(new THREE.Vector3(0,0,-.05).applyMatrix4(controller.matrixWorld), camera)

// if(portalA !=null){
		
  // console.log(portalA.getWorldPosition(target))
  // console.log(controls.getObject().position)

  // if(controller.position.z<portalA.getWorldPosition(target).z+1 &&
  // controller.position.z>portalA.getWorldPosition(target).z-1 &&
  // controller.position.x>portalA.getWorldPosition(target).x-1 &&
  // controller.position.x<portalA.getWorldPosition(target).x+1){

  //   world = 2
  //    }

// }
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

	// if(world==1){

	// 	let gl = renderer.getContext();
		
		
	// 	// clear buffers now: color, depth, stencil 
	// 	// renderer.clear(true,true,true);
	// 	// // do not clear buffers before each render pass
	// 	// renderer.autoClear = false;
		
		
	// 	// // FIRST PASS
	// 	// // goal: using the stencil buffer, place 1's in position of first portal

	// 	// // enable the stencil buffer
	// 	// gl.enable(gl.STENCIL_TEST);
		
	// 	// // layer 1 contains only the first portal
		
	// 	// camera.layers.set(4); 
			
	// 	// gl.stencilFunc(gl.ALWAYS, 4, 0xff);
	// 	// gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
	// 	// gl.stencilMask(0xff);

	// 	// // only write to stencil buffer (not color or depth)
	// 	// gl.colorMask(false,false,false,false);
	// 	// gl.depthMask(false);
		
	// 	// renderer.render( scene, camera );
		
		
	// 	// // SECOND PASS
	// 	// // goal: draw from the portal camera perspective (which is aligned relative to the second portal)
	// 	// //   in the first portal region (set by the stencil in the previous pass)
		
	// 	// // set up a clipping plane, so that portal camera does not see anything between
	// 	// //   the portal camera and the second portal
		
	// 	// // default normal of a plane is 0,0,1. apply mesh rotation to it.
	
		
	// 	// // determine which side of the plane camera is on, for clipping plane orientation.
	// 	// // if(portalA){
	// 	// // let portalToCamera = new THREE.Vector3().subVectors( mainCamera.position.clone(), portalA.position.clone() ); //  applyQuaternion( mainMover.quaternion );
	// 	// // let normalPortal = new THREE.Vector3(0,0,1).applyQuaternion( portalA.quaternion );
	// 	// // let clipSide = -Math.sign( portalToCamera.dot(normalPortal) );
		
	// 	// // let clipNormal = new THREE.Vector3(0, 0, clipSide).applyQuaternion( portalB.quaternion );
	// 	// // let clipPoint = portalB.position;
	// 	// // let clipPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(clipNormal, clipPoint);
	// 	// // // renderer.clippingPlanes = [clipPlane];
	// 	// // }
	// 	// gl.colorMask(true,true,true,true);
	// 	// gl.depthMask(true);
		
	// 	// gl.stencilFunc(gl.EQUAL, 4, 0xff);
	// 	// gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
		
		
	// 	// camera.layers.set(5);
		
	// 	// renderer.render( scene, camera );
				
	// 	// // disable clipping planes
	// 	// renderer.clippingPlanes = [];
		
	// 	// // THIRD PASS
	// 	// // goal: set the depth buffer data for the first portal,
	// 	// //   so that it can be occluded by other objects
		
	// 	// // finished with stencil
	// 	// gl.disable(gl.STENCIL_TEST);
		
	// 	// gl.colorMask(false,false,false,false);
	// 	// gl.depthMask(true);
	// 	// // need to clear the depth buffer, in case of occlusion
	// 	// renderer.clear(false, true, false);
	// 	// renderer.render( scene, camera );
		
	// 	// // FINAL PASS
	// 	// // goal: draw the rest of the scene

	// 	// gl.colorMask(true,true,true,true);
	// 	// gl.depthMask(true);
		
		
	// 	camera.layers.set(4); // layer 0 contains everything but portals
	// 	renderer.render( scene, camera );
		

	// }

	// else{

	// 	camera.layers.enable(5);
		

		renderer.render( scene, camera );

	// }

	
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


