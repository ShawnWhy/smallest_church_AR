


    const createSingleSet = function(CANNON, THREE, intersects, defaultMaterial, singleGroup, scene, world, objectsToUpdate,plateArray){
        const cupbow = new CANNON.Cylinder(.155,.1,.13,8)
        const plateDrop = new CANNON.Cylinder(.3,.15,.05,8)
    
        const cupHandle = new CANNON.Cylinder(.1,.1,.01,8)
        // cupHandle.quaternion.setClearColor(new CANNON.Vec3())
        
        const cupbody = new CANNON.Body({mass:1})
        const platebody = new CANNON.Body({mass:1})
        cupbody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0),Math.PI *0.5)
        platebody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0),Math.PI *0.5)
        cupbody.position=new CANNON.Vec3(intersects[0].point.x, 1, intersects[0].point.z)
        platebody.position=new CANNON.Vec3(intersects[0].point.x, .9, intersects[0].point.z)

    
        cupbody.material=defaultMaterial;
        cupbody.addShape(cupbow,new CANNON.Vec3(0,0,0))
        cupbody.addShape(cupHandle,new CANNON.Vec3(.115,0,0))
        platebody.addShape(plateDrop,new CANNON.Vec3(0,0,0))
    
      
    
        const singleFakeCup = new THREE.Group()
        // singleplateMesh.rotation.x =  Math.PI * 0.5
        const singleCup= singleGroup.children[1].clone()
        const newsingleplate= singleGroup.children[0].clone()
        newsingleplate.rotation.x =  Math.PI * 0.5
        newsingleplate.position.z+=.03
    
        singleCup.rotation.x +=  Math.PI * 0.5
        singleCup.position.z +=.01
        singleCup.position.y-=.07;
        singleFakeCup.add(singleCup)
        const plateMesh = new THREE.Group();
        plateMesh.add(newsingleplate)
        // console.log(singleGroup)
        cupbody.sleepSpeedLimit = 1.0;
        platebody.sleepSpeedLimit = 1.0;
        plateArray.push(plateMesh)
    
        world.add(platebody)
        scene.add(plateMesh)
        world.addBody(cupbody)
        scene.add(singleFakeCup)
        objectsToUpdate.push({singleFakeCup,cupbody,plateMesh,platebody})
        
    }


    const createSingleSetProper = (CANNON, THREE, intersects, defaultMaterial, singleGroup,scene, world, objectsToUpdate,plateArray)=>{

        const cupbow = new CANNON.Cylinder(.155,.1,.13,8)
        const plateDrop = new CANNON.Cylinder(.3,.15,.05,8)
    
        const cupHandle = new CANNON.Cylinder(.1,.1,.01,8)
        // cupHandle.quaternion.setClearColor(new CANNON.Vec3())
        
        const cupbody = new CANNON.Body({mass:1})
        const platebody = new CANNON.Body({mass:1})
        cupbody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0),Math.PI *0.5)
        platebody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1,0,0),Math.PI *0.5)
        cupbody.position=new CANNON.Vec3(intersects[0].point.x, .3, intersects[0].point.z)
        platebody.position=new CANNON.Vec3(intersects[0].point.x, .2, intersects[0].point.z)
    
        cupbody.material=defaultMaterial;
        cupbody.addShape(cupbow,new CANNON.Vec3(0,0,0))
        cupbody.addShape(cupHandle,new CANNON.Vec3(.115,0,0))
        platebody.addShape(plateDrop,new CANNON.Vec3(0,0,0))
    
        const singleFakeCup = new THREE.Group()
        // singleplateMesh.rotation.x =  Math.PI * 0.5
        const singleCup= singleGroup.children[1].clone()
        const newsingleplate= singleGroup.children[0].clone()
        newsingleplate.rotation.x =  Math.PI * 0.5
        newsingleplate.position.z+=.01
    
        singleCup.rotation.x +=  Math.PI * 0.5
        // singleCup.position.z +=.01
        singleCup.position.y-=.07;
        singleFakeCup.add(singleCup)
        const plateMesh = new THREE.Group();
        plateMesh.add(newsingleplate)
        plateArray.push(newsingleplate)
        // console.log(singleGroup)
        cupbody.sleepSpeedLimit = 1.0;
        platebody.sleepSpeedLimit = 1.0;
    
        world.add(platebody)
        scene.add(plateMesh)
        world.addBody(cupbody)
        scene.add(singleFakeCup)
        objectsToUpdate.push({singleFakeCup,cupbody,plateMesh,platebody})
        
    }



module.exports ={

    createSingleSet:createSingleSet,
    createSingleSetProper:createSingleSetProper
}


    



