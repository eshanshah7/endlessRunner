// Scene variables
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container, controls, spaceship;

// Light variables
var directionalLight, pointLight, hemisphereLight, ambientLight;

//dat-gui
// var gui = new dat.GUI();
// gui.closed = true;

// Scoring
var score = 0,
    high_scores = {},
    lives = 3;

// Settings
var settings = {
    firstPerson: false
};

var isSettingsVisible = false;

var progress, progressBar;

var animationFrame = {};

var guiOptions = {
    firstPerson: false
};

var firstPerson;

//Game state
var isPaused = false;
var isGameOver = true;
var isRunning = false;
var scoreContainer, livesContainer, pauseContainer, settingsIconContainer, settingsOverlay, highScoresContainer;


// Loading Manager
THREE.DefaultLoadingManager.onStart = function(url, itemsLoaded, itemsTotal) {
    progress = document.createElement('div');
    progressBar = document.createElement('div');
    progress.id = 'progress';
    progressBar.id = 'progressBar';
    progress.appendChild(progressBar);
    document.body.appendChild(progress);
    // console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');

};

THREE.DefaultLoadingManager.onLoad = function() {
    console.log('Loading Complete!');
    document.body.removeChild(progress);
    loop();
    splashScreen();
};

THREE.DefaultLoadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {

    progressBar.style.width = (itemsLoaded / itemsTotal * 100) + '%';
    // console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');

};

window.addEventListener('load', init, false);

function init(event) {
    createOverlays();
    createScene();
    createFloor();
    for (var i = 0; i < 60; i += 1) {
        var isEast = false;
        if (i > 29) {
            isEast = true;
        }
        createMountain(i, isEast);
    }
    // createHelpers();
    createLights();
    textureLoaders();
    createSpaceship();
    // startPowerupLogic();
    createDatGui();
    createSettings();
}

var cubeMaterial;

function textureLoaders() {
    var loader = new THREE.TextureLoader();

    loader.load('images/blue-rock.jpg', function(texture) {
        cubeMaterial = new THREE.MeshLambertMaterial({
            map: texture
        });
    })
}

function createSettings() {
    // document.querySelector('#settingsIcon').addEventListener('click', toggleSettings);
}

function toggleSettings() {
    var settingsOverlay = document.querySelector('#settings-overlay');
    if(isSettingsVisible) {
        settingsOverlay.style.visibility = 'hidden';
        isSettingsVisible = false;
    }
    else {
        settingsOverlay.style.visibility = 'visible';
        isSettingsVisible = true;
    }
}

function splashScreen() {
    document.querySelector('#splash-container').style.opacity = '1';
    document.querySelector('#playIcon').addEventListener('click', startGame);
}

function startGame() {
    isGameOver = false;
    document.querySelector('#splash-screen').style.visibility = 'hidden';
    startPowerupLogic();
}

function createOverlays() {
    // Score
    scoreContainer = document.querySelector('#score-overlay');
    highScoresContainer = document.querySelector('#high-scores');

    // Lives
    livesContainer = document.querySelectorAll('.lives');

    // Pause Screen
    pauseContainer = document.querySelector('#pause-screen');
    settingsIconContainer = document.querySelector('#settingsIconContainer');
    settingsOverlay = document.querySelector('#settings-overlay');

    document.addEventListener('keydown', function(e) {
        if (!isGameOver) {
            if (e.keyCode == 27) {
                if (isPaused) {
                    resumeGame();
                } else {
                    pauseGame();
                }
            }
            else {
                e.stopPropogation();
            }
        }
    });

    document.querySelector('#firstPersonbox').addEventListener('change', firstPersonToggle);

    document.addEventListener('dblclick', recenterCamera);
}

function firstPersonToggle(e) {
    if (!e.path[0].checked) {
        firstPerson = false;
        recenterCamera();
    } else {
        TweenMax.to(camera.position, 0.5, {
            x: spaceship.position.x,
            y: spaceship.position.y + 2,
            z: spaceship.position.z - 3,
            ease: Power1.easeInOut
        }).eventCallback("onComplete", animComplete);
    }
}

function pauseGame() {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener('keydown', moveSpaceship);
    isRunning = false;
    isPaused = true;
    pauseContainer.style.visibility = 'visible';
    settingsIconContainer.style.visibility = 'visible';
    settingsOverlay.style.visibility = 'visible';
}

function resumeGame() {
    settingsOverlay.style.visibility = 'hidden';
    settingsIconContainer.style.visibility = 'hidden';
    pauseContainer.style.visibility = 'hidden';
    isPaused = false;
    isRunning = true;
    window.addEventListener('keydown', moveSpaceship);
    loop();
}

function cameraShake(objectToShake) {
    TweenMax.fromTo(objectToShake.position, 0.2, {x: objectToShake.position.x -1},
        {
            x: objectToShake.position.x,
            ease: RoughEase.ease.config({
                template: Power0.easeNone,
                strength: 10,
                points: 20,
                taper: "none",
                randomize: true,
                clamp: false
            })
        }
    );
}

function createSpaceship() {
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('assets/e45/');
    // mtlLoader.setTexturePath('blackhawk/');
    mtlLoader.load('e45.mtl', function(materials) {
        // console.log(materials);
        materials.preload();
        // materials.materials.Material_25.map.magFilter = THREE.NearestFilter;
        // materials.materials.Material_25.map.minFilter = THREE.LinearFilter;

        var loader = new THREE.OBJLoader();
        loader.setMaterials(materials);
        loader.setPath('assets/e45/');
        loader.load('e45.obj', function(obj) {
            spaceship = obj;
            // object.rotation.z = 90 * Math.PI / 180.0;
            // object.rotation.x = -90 * Math.PI / 180.0;
            // object.position.y = -100;
            spaceship.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    // child.material.map = texture;
                    child.castShadow = true;
                }
            });
            spaceship.scale.set(2, 2, 2);
            spaceship.position.set(0, 5, 15);
            spaceship.castShadow = true;

            // var spaceshipShadow = new THREE.ShadowMesh(spaceship);
            // console.log(spaceship);
            // spaceshipMesh.position.set(0,6,0);
            // spaceship.add(spaceshipMesh);
            scene.add(spaceship);
            // scene.add(spaceshipShadow);

            // Hover animation
            TweenMax.to(spaceship.position, 2, {
                y: "+=1",
                repeat: -1,
                yoyo: true,
                ease: Power1.easeInOut
            });

            window.addEventListener('keydown', moveSpaceship);
        });
    });
}

function moveSpaceship(e) {
    console.log(e);
    var tl = new TimelineMax();
    // var increment = 10;
    if (e.keyCode === 65) {
        if (spaceship.position.x === 15 || spaceship.position.x === 0) {
            // Transition Animations
            tl.to(spaceship.position, 0.15, {
                x: "-=15",
                ease: Power1.easeInOut
            });
            // tl.to(spaceship.rotation,0.1,{z:"+=0.2", ease: Power1.easeInOut},"-0.05");
            tl.play();

        }
    } else if (e.keyCode === 68) {
        if (spaceship.position.x === -15 || spaceship.position.x === 0) {
            tl.to(spaceship.position, 0.15, {
                x: "+=" + "15",
                ease: Power1.easeInOut
            });
            // tl.to(spaceship.rotation,0.1,{z:"-=0.2", ease: Power1.easeInOut},"-0.05");
            tl.play();

        }
    }
}

function PowerUp() {
    var object, objectDimension, objectGeometry, objectMaterial, xPosition, yPosition, zPosition, xPositionValues, yPositionValues, zPositionValues;

    objectDimension = 2;

    xPositionValues = [-(PLANE_WIDTH - PADDING) / 2, 0, (PLANE_WIDTH - PADDING) / 2];
    yPositionValues = [objectDimension + 4];
    zPositionValues = [-(PLANE_LENGTH - PADDING) / 2];

    xPosition = xPositionValues[getRandomInteger(0, xPositionValues.length - 1)];
    yPosition = yPositionValues[getRandomInteger(0, yPositionValues.length - 1)];
    zPosition = zPositionValues[getRandomInteger(0, zPositionValues.length - 1)];

    objectGeometry = new THREE.BoxGeometry(objectDimension, objectDimension, objectDimension, objectDimension);
    objectMaterial = new THREE.MeshLambertMaterial({
        color: 0x29B6F6,
        shading: THREE.FlatShading
    });
    object = new THREE.Mesh(objectGeometry, cubeMaterial);
    object.position.set(xPosition, yPosition, zPosition);
    object.rotation.z = 45 * Math.PI / 180;
    // console.log(object.position);
    object.castShadow = true;
    object.receiveShadow = true;

    object.animate = function() {
        object.rotation.y += 0.05;

        if (object.position.z < PLANE_LENGTH / 2 + PLANE_LENGTH / 10) {
            object.position.z += 5;
        } else {
            if (detectCollisions(object, powerups)) {
                console.log('Object collides');
            }
            object.position.x = xPositionValues[getRandomInteger(0, xPositionValues.length - 1)];
            object.position.z = -PLANE_LENGTH / 2;
            object.visible = true;
        }
    }

    return object;
}

var powerup = {},
    powerups = [],
    powerupSpawnIntervalID = {},
    powerupCounterIntervalID = {};

function startPowerupLogic() {
    isRunning = true;
    powerupSpawnIntervalID = window.setInterval(function() {

        if (powerups.length < POWERUP_COUNT) {
            powerup = new PowerUp();
            powerups.push(powerup);
            scene.add(powerup);
        }

    }, 3000);

    powerupCounterIntervalID = window.setInterval(function() {
        POWERUP_COUNT += 1;
    }, 30000);
}

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var PLANE_WIDTH = 50,
    PLANE_LENGTH = 1000,
    PADDING = PLANE_WIDTH / 5 * 2,
    POWERUP_COUNT = 10;

var planeLeft, planeLeftGeometry, planeLeftMaterial, planeRight, plane, planeGeometry, planeMaterial, texture;

function createFloor() {

    // texture = new THREE.TextureLoader().load("images/planet-512.jpg");
    texture = new THREE.TextureLoader().load("assets/mountain/rock2.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 4);
    texture.offset.y = 1;
    // var normalmap = new THREE.TextureLoader().load("images/normal-map-512.jpg");
    // var specmap = new THREE.TextureLoader().load("images/water-map-512.jpg");

    planeGeometry = new THREE.BoxGeometry(PLANE_WIDTH, PLANE_LENGTH + PLANE_LENGTH / 10, 1);
    planeMaterial = new THREE.MeshPhongMaterial();
    planeMaterial.map = texture;
    // planeMaterial.specularMap = specmap;
    // planeMaterial.specular = new THREE.Color(0xff0000);
    // planeMaterial.shininess = 1;
    // planeMaterial.normalMap = normalmap;
    // planeMaterial.normalScale.set(-0.3,-0.3);
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = 1.570;
    plane.receiveShadow = true;

    planeLeftGeometry = new THREE.BoxGeometry(PLANE_WIDTH, PLANE_LENGTH + PLANE_LENGTH / 10, 1);
    planeLeftMaterial = new THREE.MeshPhongMaterial();
    planeLeftMaterial.map = texture;
    planeLeft = new THREE.Mesh(planeLeftGeometry, planeLeftMaterial);
    planeLeft.receiveShadow = true;
    planeLeft.rotation.x = 1.570;
    planeLeft.position.x = -PLANE_WIDTH;
    // planeLeft.position.y = 1;

    planeRight = planeLeft.clone();
    planeRight.position.x = PLANE_WIDTH;

    scene.add(planeLeft, planeRight, plane);
}

var mountain = {},
    mountains = [];

function createMountain(i, isEast) {
    var loader = {},
        prototype = {},
        object = {},
        objectDimensionX = {},
        objectDimensionY = {},
        objectDimensionZ = {};

    // loader = new THREE.ColladaLoader();

    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('assets/mountain/');
    // mtlLoader.setTexturePath('blackhawk/');
    mtlLoader.load('mountain.mtl', function(materials) {
        // console.log(materials);
        materials.preload();
        // materials.materials.Material_25.map.magFilter = THREE.NearestFilter;
        // materials.materials.Material_25.map.minFilter = THREE.LinearFilter;

        var loader = new THREE.OBJLoader();
        loader.setMaterials(materials);
        loader.setPath('assets/mountain/');
        loader.load('mountain.obj', function(obj) {
            prototype = obj;
            prototype.visible = false;
            createObject();
        });
    });


    function createObject() {
        object = prototype.clone();
        objectDimensionX = 10 + Math.random() * 15;
        objectDimensionY = 10 + Math.random() * 15;
        objectDimensionZ = objectDimensionX;
        object.scale.set(objectDimensionX, objectDimensionY, objectDimensionZ);
        // object.rotation.y = 45 * Math.PI/180;
        if (isEast === true) {
            object.position.x = (PLANE_WIDTH + objectDimensionX) * 1.6;
            object.position.z = (i * PLANE_LENGTH / 27) - (1.5 * PLANE_LENGTH);
            object.rotation.y = 90 * Math.PI / 180;
        } else {
            object.position.x = -(PLANE_WIDTH + objectDimensionX) * 1.6;
            object.position.z = (i * PLANE_LENGTH / 27) - (PLANE_LENGTH / 2);
            object.rotation.y = -90 * Math.PI / 180;
        }

        object.visible = true;

        object.animate = function() {

            if (object.position.z < PLANE_LENGTH / 2 - PLANE_LENGTH / 10) {
                object.position.z += 2.75;
            } else {
                object.position.z = -PLANE_LENGTH / 2;
            }
        }

        mountains.push(object);
        scene.add(object);
    }
    // createObject();
    // loader.load(
    //   'https://s3-us-west-2.amazonaws.com/s.cdpn.io/26757/mountain.dae',
    //   function ( collada ) {
    //     prototype = collada.scene;
    //     prototype.visible = false;
    //     createObject();
    //   } );

}

var urls = [
    'pos-x.png',
    'neg-x.png',
    'pos-y.png',
    'neg-y.png',
    'pos-z.png',
    'neg-z.png'
];
var skyBox;

function createScene() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    scene = new THREE.Scene();

    // Skybox
    var materialArray = [];
    for (var i = 0; i < 6; i++)
        materialArray.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('assets/mp_bloodvalley/' + urls[i]),
            side: THREE.BackSide
        }));
    var skyGeometry = new THREE.CubeGeometry(5000, 5000, 5000);
    var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
    skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
    skyBox.rotation.y = 3;
    skyBox.position.y = 300;
    // var f5 = gui.addFolder('Sky Box Position');
    // f5.add(skyBox.rotation, 'y');
    // f5.add(skyBox.position, 'y');
    scene.add(skyBox);
    // scene.background = new THREE.CubeTextureLoader()
    //     .setPath('mp_bloodvalley/')
    //     .load(urls);
    // scene.fog = new THREE.Fog(0xff1111, 10, 1000);
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;

    camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
    camera.position.set(0, 15, 55);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container = document.querySelector('#container');
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera);
    // Dont let camera go below ground
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minDistance = 50;
    controls.maxDistance = 100;

    window.addEventListener('resize', onWindowResize, false);
}


function createHelpers() {
    var size = 100;
    var divisions = 100;

    var gridHelper = new THREE.GridHelper(size, divisions);
    // scene.add(gridHelper);

    var axisHelper = new THREE.AxisHelper(size / 2);
    scene.add(axisHelper);
}

// function createBackground() {
//     var planeGeometry = new THREE.PlaneGeometry(100,100);
//     var planeMaterial = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
//     var plane = new THREE.Mesh(planeGeometry,planeMaterial);
//     plane.rotation.x = 90 * Math.PI/180;
//     plane.receiveShadow = true;
//     scene.add(plane);
// }

function createDatGui() {
    // var f1 = gui.addFolder('Camera Position');
    // f1.add(camera.position, 'x', -50, 50).listen();
    // f1.add(camera.position, 'y', -50, 50).listen();
    // f1.add(camera.position, 'z', -50, 50).listen();

    // var camController = gui.add(guiOptions, 'firstPerson');
    // camController.onFinishChange(function(value) {
    //     if (!value) {
    //         firstPerson = false;
    //         recenterCamera();
    //     } else {
    //         TweenMax.to(camera.position, 0.5, {
    //             x: spaceship.position.x,
    //             y: spaceship.position.y + 2,
    //             z: spaceship.position.z - 3,
    //             ease: Power1.easeInOut
    //         }).eventCallback("onComplete", animComplete);
    //     }
    // });
}



function animComplete() {
    firstPerson = true;
    camera.rotation.set(0, 0, 0);
}

function recenterCamera() {
    TweenMax.to(camera.position, 0.5, {
        x: 0,
        y: 15,
        z: 55,
        ease: Power1.easeInOut
    });
    camera.rotation.set(0, 0, 0);
}

function createLights() {
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-32, 78, 76);
    directionalLight.castShadow = true;

    //Set up shadow properties for the light
    directionalLight.shadow.mapSize.width = 4096; // default
    directionalLight.shadow.mapSize.height = 4096; // default
    // console.log(directionalLight);
    directionalLight.shadow.camera.near = 10; // default
    directionalLight.shadow.camera.far = 400; // default
    directionalLight.shadow.camera.top = 300; // default
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.left = 35; // default
    directionalLight.shadow.camera.right = -200;
    // directionalLight.shadowCameraVisible = true;

    var helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add( helper );

    // var spotlight = new THREE.SpotLight(0xffffff, 1, 200, 0.75, 0, 0);
    // spotlight.position.set( 0, 10, 10 );
    // spotlight.castShadow = true;

    // var f3 = gui.addFolder('Directional Light Shadow');
    // f3.add(directionalLight.shadow.camera, 'left');
    // f3.add(directionalLight.shadow.camera, 'right');
    // f3.add(directionalLight.shadow.camera, 'top');
    // f3.add(directionalLight.shadow.camera, 'bottom');
    // f3.add(directionalLight.shadow.camera, 'near');
    // f3.add(directionalLight.shadow.camera, 'far');
    //
    // var f2 = gui.addFolder('DirectionalLight Position');
    // f2.add(directionalLight.position, 'x').step(1);
    // f2.add(directionalLight.position, 'y').step(1);
    // f2.add(directionalLight.position, 'z').step(1);
    //
    // var f4 = gui.addFolder('DirectionalLight Rotation');
    // f4.add(directionalLight.rotation, 'x', -1, 1);
    // f4.add(directionalLight.rotation, 'y', -1, 1);
    // f4.add(directionalLight.rotation, 'z', -1, 1);

    ambientLight = new THREE.AmbientLight(0xdc8874, .5);

    scene.add(directionalLight);
    // scene.add(spotlight);
    scene.add(ambientLight);
}

function onWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

var collisionCounter = 0;

function detectCollisions(objToCheck, objects) {
    // console.log(spaceshipMesh);
    var origin = objToCheck.position.clone();

    var matrix = new THREE.Matrix4();
    matrix.extractRotation(objToCheck.matrix);

    var direction = new THREE.Vector3(0, 0, 1);
    direction = direction.applyMatrix4(matrix);

    var ray = new THREE.Raycaster(origin, direction);
    // console.log(ray);
    var intersections = ray.intersectObjects(objects);

    if (intersections.length > 0 && intersections[0].distance <= 5) {
        intersections[0].object.visible = false;
        return true;
    }
    return false;
}

function highScores() {
    if(typeof(Storage)!=="undefined"){
        var scores = false;
        if(localStorage["high-scores"]) {
            highScoresContainer.style.visibility = 'visible';
            highScoresContainer.innerHTML = '';
            scores = JSON.parse(localStorage["high-scores"]);
            scores = scores.sort(function(a,b){return parseInt(b)-parseInt(a)});
            var orderedList = highScoresContainer.appendChild(document.createElement('ol'))
            for(var i = 0; i < 10; i++){
                var s = scores[i];
                var fragment = document.createElement('li');
                fragment.innerHTML = (typeof(s) != "undefined" ? s : "" );
                orderedList.appendChild(fragment);
            }
        }
    } else {
        highScoresContainer.style.visibility = 'hidden';
    }
}

function updateScore() {
    if(typeof(Storage)!=="undefined"){
        var current = parseInt(score);
        console.log(current);
        var scores = false;
        if(localStorage["high-scores"]) {

            scores = JSON.parse(localStorage["high-scores"]);
            scores = scores.sort(function(a,b){return parseInt(b)-parseInt(a)});

            for(var i = 0; i < 10; i++){
                var s = parseInt(scores[i]);

                var val = (!isNaN(s) ? s : 0 );
                if(current > val)
                {
                    val = current;
                    scores.splice(i, 0, parseInt(current));
                    break;
                }
            }

            scores.length = 10;
            localStorage["high-scores"] = JSON.stringify(scores);

        } else {
            var scores = new Array();
            scores[0] = current;
            localStorage["high-scores"] = JSON.stringify(scores);
        }

        highScores();
    }
}

function updateName() {
    var nameModal = document.querySelector('#nameModal');
    nameModal.style.display = 'block';
    document.querySelector('.nameInput').focus();
    window.onclick = function(e) {
        if(e.target == nameModal) {
            nameModal.style.display = 'none';
        }
        if(e.target == document.querySelector('.nameInput')) {
            e.target.focus();
        }
        if(e.target == document.querySelector('.nameButton')) {
            updateScore();
            nameModal.style.display = 'none';
        }
    }
}

function gameOver() {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener('keydown', moveSpaceship);
    updateName();
    updateScore();
    isGameOver = true;
    window.clearInterval(powerupSpawnIntervalID);
    window.clearInterval(powerupCounterIntervalID);
    var gameoverOverlay = document.querySelector('#gameover-overlay');
    var restartButton = document.querySelector('#replayIcon');
    var gameOverScore = document.querySelector('#gameOverScore');
    var scoreOverlay = document.querySelector('#score-overlay');
    scoreOverlay.style.visibility = 'hidden';

    gameOverScore.innerHTML = `Score : ${score}`;
    gameoverOverlay.style.visibility = 'visible';

    restartButton.addEventListener('click', function(e) {
        e.target.removeEventListener(e.type, arguments.callee);
        gameoverOverlay.style.visibility = 'hidden';
        scoreOverlay.style.visibility = 'visible';
        highScoresContainer.style.visibility = 'hidden';
        window.addEventListener('keydown', moveSpaceship);
        POWERUP_COUNT = 10;
        powerups.forEach(function(element, index) {
            scene.remove(powerups[index]);
        });
        powerups = [];
        collisionCounter = 0;
        score = 0;
        spaceship.position.set(0, 5, 15);
        isGameOver = false;
        for (var i = 0; i < livesContainer.length; i++) {
            livesContainer[i].style.visibility = 'visible';
        }
        loop();
        startPowerupLogic();
    });
    // console.log('Game over!');
}

function loop() {
    animationFrame = requestAnimationFrame(loop);

    if (texture.offset.y < 0) {
        texture.offset.y = 1;
    }
    texture.offset.y -= 0.01;

    // console.log(texture.offset);

    powerups.forEach(function(element, index) {
        powerups[index].animate();
    });

    mountains.forEach(function(element, index) {
        mountains[index].animate();
    });

    // Collision Detection
    if (spaceship) {
        // console.log(spaceship);
        if (detectCollisions(spaceship, powerups) === true) {
            if (firstPerson) {
                cameraShake(spaceship);
            } else {
                cameraShake(camera);
            }
            if (livesContainer.length > 0) {
                livesContainer[2 - collisionCounter].style.visibility = 'hidden';
            }
            if (++collisionCounter > 2) {
                gameOver();
            }
            // console.log('Hit : ' + (collisionCounter));
        }
    }

    if (firstPerson) {
        controls.enabled = false;
        camera.position.x = spaceship.position.x;
        camera.position.y = spaceship.position.y + 2;
        camera.position.z = spaceship.position.z - 3;

    } else {
        controls.enabled = true;
        controls.update();
    }

    // Scoring
    if (isRunning) {
        score += 10;
    }
    scoreContainer.innerHTML = score;

    renderer.render(scene, camera);

}
