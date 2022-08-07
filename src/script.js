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
import Stats from '../node_modules/stats.js'
import { PointerLockControls } from './PointerLockControls.js';


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

let defaultMaterial = new THREE.MeshBasicMaterial({
	color: 0x444444,
	transparent: true
});

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const onKeyDown = function ( event ) {

	// console.log(event)

	switch ( event.code ) {

		case 'ArrowUp':
		case 'KeyW':
			moveForward = true;
			break;

		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = true;
			break;

		case 'ArrowDown':
		case 'KeyS':
			moveBackward = true;
			break;

		case 'ArrowRight':
		case 'KeyD':
			moveRight = true;
			break;

		case 'Space':
			if ( canJump === true ) velocity.y += 350;
			canJump = false;
			break;

	}

};

const onKeyUp = function ( event ) {

	// console.log(event)


	switch ( event.code ) {

		case 'ArrowUp':
		case 'KeyW':
			moveForward = false;
			break;

		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = false;
			break;

		case 'ArrowDown':
		case 'KeyS':
			moveBackward = false;
			break;

		case 'ArrowRight':
		case 'KeyD':
			moveRight = false;
			break;

	}

};

document.addEventListener( 'keydown', onKeyDown );
document.addEventListener( 'keyup', onKeyUp );

const textureLoader = new THREE.TextureLoader()


var scene, camera, renderer, clock, deltaTime, totalTime, keyboard 

let stats;

var mainMover, otherMover;
var mainCamera, otherCamera, topCamera;
var portalA, portalB;
var blocker1, blocker2, blocker3;
var portalRing;

let controls

let eggIntersect = [];
let shellIntersect = []
let pearIntersect = []
let portalIntersect = []


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



const mouse = new THREE.Vector2()
mouse.x = null
mouse.y=null


window.addEventListener('mousemove', (event) =>
{
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1

    // console.log(mouse)
})












const treeButtonMaterial = new THREE.MeshBasicMaterial({map:treeButtonTexture})
const buttonGeo = new THREE.PlaneGeometry(.1, .1);
grassButtonMaterial.side = THREE.DoubleSide
treeButtonMaterial.side = THREE.DoubleSide
treeButtonMaterial.transparent= true;
grassButtonMaterial.transparent= true;

 treeButton = new THREE.Mesh(buttonGeo, treeButtonMaterial)
 grassButton = new THREE.Mesh(buttonGeo, grassButtonMaterial)
 grassButton.position.x+=.3
 treeButton.position.z -=.5
 grassButton.position.z-=.5
 grassButton.rotateY=Math.PI*.5
 treeButton.rotateY=Math.PI*.5


 scene.add(grassButton)
 scene.add(treeButton)








function init() {
  addReticleToScene()
    
  const button = ARButton.createButton(renderer, {
    requiredFeatures: ["hit-test"]
  });
  
        document.body.appendChild(button);
  
        window.addEventListener('resize', onWindowResize, false);
    }
  


    
    
   
  
    const createGrass =()=>{
  

      let randGrass= Math.floor(Math.random()*2+1)
  
      console.log(randGrass)
      let grass
    
      switch(randGrass){
        case 1: grass= new THREE.Mesh(grassgeo1, grassMaterial)
          break;
          
        case 2: grass= new THREE.Mesh(grassgeo2, grassMaterial)
          
    }
      grass.position.setFromMatrixPosition(reticle.matrix);
      grass.quaternion.setFromRotationMatrix(reticle.matrix);
      // grass.rotation.x += Math.PI*.5
      
      grass.scale.x=.1
      grass.scale.y=.1
      grass.scale.z=.1
      console.log(grass)
      console.log(reticle.matrix)
      scene.add(grass)
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




async function initializeHitTestSource() {
const session = renderer.xr.getSession();
  
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

let grassgeo1;
let grassgeo2;
let tree1;
let tree2;
let tree3;
let butterfly;
let flower;
let butterflyGroupArray = [];


controller.addEventListener('select', ()=>{

})
  








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



 



function animate() {
  renderer.setAnimationLoop(render);




  
}

let oldElapsedTime=null;

const clock = new THREE.Clock()
let previousTime = 0








init();
animate();

function render(timestamp, frame) {
const elapsedTime = clock.getElapsedTime()
const deltaTime = elapsedTime - oldElapsedTime
oldElapsedTime = elapsedTime
raycaster.setFromCamera(new THREE.Vector3(0,0,-.05).applyMatrix4(controller.matrixWorld), camera)

 intersects1 = raycaster.intersectObject(treeButton)
 intersects2 = raycaster.intersectObject(grassButton)
//  console.log("intersects1" + intersects1)

//  console.log("intersects2" + intersects2)

controller.addEventListener('select', ()=>{

  if(intersects1.length>0){

    trigger = "tree"
  }

  else if ( intersects2.length>0){

    trigger = "grass"
  }

})

if(intersects1.length>0 && treeButton){

  treeButton.rotation.z +=.1

}

if(intersects2.length>0 && grassButton){

  grassButton.rotation.z +=.1

}

if(trigger ==  "tree" && treeButton){

  treeButton.rotation.y +=.1

}
if(trigger == "grass" && grassButton){

  grassButton.rotation.y +=.1

}
if(butterflyGroupArray.length>0){

  for (let i=0; i<butterflyGroupArray.length; i++){butterflyGroupArray[i].rotation.y -=.01;
}
}
// if(mixer2)
// {
//     mixer2.update(deltaTime)
// }
// if(mixer)
// {
//     mixer.update(deltaTime)
// }
if(animations.length>0)

{
  
  animations.forEach(function(mixer){
      mixer.update(deltaTime)

  })

// for(var i=0; i>animations.length; i++){
//   animations[i].update(deltaTime)

}
  if(frame){
    
    if(!hitTestSourceInitialized){
      initializeHitTestSource();
    }
  }
  
  if(hitTestSourceInitialized){
    const hitTestResults = frame.getHitTestResults(hitTestSource);
    // console.log(hitTestResults)
    
    if(hitTestResults.length>0){
      const hit = hitTestResults[0]
      
      const pose = hit.getPose(localSpace)
      reticle.visible = true;
      reticle.matrix.fromArray(pose.transform.matrix)
    }
    else{
      reticle.visible=false
    }
  }
  
        renderer.render(scene, camera);

  

}

