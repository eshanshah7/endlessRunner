// Scene variables
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container, controls, spaceship;

// Light variables
var directionalLight, pointLight, hemisphereLight, ambientLight;

//dat-gui
var gui = new dat.GUI();

window.addEventListener('load', init, false);

function init(event) {
    createScene();
    createFloor();
    createHelpers();
    createLights();
    createSpaceship();
    createDatGui();
    loop();
}

function createSpaceship() {
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('e45/');
    // mtlLoader.setTexturePath('blackhawk/');
    mtlLoader.load('e45.mtl', function(materials) {
        // console.log(materials);
        materials.preload();
        // materials.materials.Material_25.map.magFilter = THREE.NearestFilter;
        // materials.materials.Material_25.map.minFilter = THREE.LinearFilter;

        var loader = new THREE.OBJLoader();
        loader.setMaterials(materials);
        loader.setPath('e45/');
        loader.load('e45.obj', function(spaceship) {
            // object.rotation.z = 90 * Math.PI / 180.0;
            // object.rotation.x = -90 * Math.PI / 180.0;
            // object.position.y = -100;
            spaceship.scale.set(2,2,2);
            spaceship.position.set(0,5,15);
            spaceship.castShadow = true;
            // console.log(spaceship);
            scene.add(spaceship);
            var tl = new TimelineMax();
            var increment = 10;

            // Hover animation
            TweenMax.to(spaceship.position, 2, {y:"+="+"1", repeat:-1, yoyo:true, ease: Power1.easeInOut});

            window.addEventListener('keydown', function() {
                if(event.keyCode === 65) {
                    if(spaceship.position.x === 15 || spaceship.position.x === 0) {
                        // Transition Animations
                        tl.to(spaceship.position,0.2,{x:"-=15", ease: Power1.easeInOut});
                        tl.to(spaceship.rotation,0.1,{z:"+=0.2", ease: Power1.easeInOut},"-0.05");
                        tl.play();

                    }
                } else if (event.keyCode === 68) {
                    if(spaceship.position.x === -15 || spaceship.position.x === 0) {
                        tl.to(spaceship.position,0.2,{x:"+="+"15", ease: Power1.easeInOut});
                        tl.to(spaceship.rotation,0.1,{z:"-=0.2", ease: Power1.easeInOut},"-0.05");
                        tl.play();

                    }
                }
            });
        });
    });
}

var PLANE_WIDTH = 50,
    PLANE_LENGTH = 1000,
    PADDING = PLANE_WIDTH / 5 * 2,
    POWERUP_COUNT = 10;

var planeLeft, planeLeftGeometry, planeLeftMaterial, planeRight, plane, planeGeometry, planeMaterial, texture;

function createFloor() {

    texture = new THREE.TextureLoader().load("images/planet-512.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set( 1, 4 );
    texture.offset.y = 1;
    // var normalmap = new THREE.TextureLoader().load("images/normal-map-512.jpg");
    // var specmap = new THREE.TextureLoader().load("images/water-map-512.jpg");

    planeGeometry = new THREE.BoxGeometry( PLANE_WIDTH, PLANE_LENGTH + PLANE_LENGTH / 10, 1 );
    planeMaterial = new THREE.MeshPhongMaterial();
    planeMaterial.map = texture;
    // planeMaterial.specularMap = specmap;
    // planeMaterial.specular = new THREE.Color(0xff0000);
    // planeMaterial.shininess = 1;
    // planeMaterial.normalMap = normalmap;
    // planeMaterial.normalScale.set(-0.3,-0.3);
    plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = 1.570;
    plane.receiveShadow = true;

    planeLeftGeometry = new THREE.BoxGeometry( PLANE_WIDTH, PLANE_LENGTH + PLANE_LENGTH / 10, 1 );
    planeLeftMaterial = new THREE.MeshPhongMaterial();
    planeLeftMaterial.map = texture;
    planeLeft = new THREE.Mesh( planeLeftGeometry, planeLeftMaterial );
    planeLeft.receiveShadow = true;
    planeLeft.rotation.x = 1.570;
    planeLeft.position.x = -PLANE_WIDTH;
    planeLeft.position.y = 1;

    planeRight = planeLeft.clone();
    planeRight.position.x = PLANE_WIDTH;

    scene.add( planeLeft, planeRight, plane );
}

var urls = [
    'pos-x.png',
    'neg-x.png',
    'pos-y.png',
    'neg-y.png',
    'pos-z.png',
    'neg-z.png'
];

function createScene() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    scene = new THREE.Scene();
    scene.background = new THREE.CubeTextureLoader()
            .setPath('mp_bloodvalley/')
            .load(urls);
    scene.fog = new THREE.Fog(0xff1111, 10, 500);

    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;

    camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
    camera.position.set(0, 20, 55);

    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true
    });
    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;

    container = document.querySelector('#container');
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera);

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

function createBackground() {
    var planeGeometry = new THREE.PlaneGeometry(100,100);
    var planeMaterial = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
    var plane = new THREE.Mesh(planeGeometry,planeMaterial);
    plane.rotation.x = 90 * Math.PI/180;
    plane.receiveShadow = true;
    scene.add(plane);
}
function createDatGui() {
    var f1 = gui.addFolder('Camera Position');
    f1.add(camera.position, 'x', -50, 50).listen();
    f1.add(camera.position, 'y', -50, 50).listen();
    f1.add(camera.position, 'z', -50, 50).listen();
}

function createLights() {
    directionalLight = new THREE.DirectionalLight(0xffeeee, 0.9);
    directionalLight.position.set(150, 350, 350);
    directionalLight.castShadow = true;

    ambientLight = new THREE.AmbientLight(0xdc8874, .5);

    scene.add(directionalLight);
    scene.add(ambientLight);
}

function onWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}


function loop() {
    if(texture.offset.y < 0) {
        texture.offset.y = 1;
    }
    texture.offset.y -=0.01;
    // console.log(texture.offset);

    controls.update();
    renderer.render(scene, camera);

    requestAnimationFrame(loop);
}
