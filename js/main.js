/*===================
   Scene and Camera
  ===================*/
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 1;

/*===================
   Renderer
  ===================*/
var renderer = new THREE.WebGLRenderer({
	antialias: true
});
window.addEventListener('resize', function () {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

renderer.setSize(window.innerWidth, window.innerHeight);

/*===================
   Lights
  ===================*/
scene.add(new THREE.AmbientLight(0x888888));

var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5,1,5);
scene.add(light);

/*===================
   Texture Loading
  ===================*/
var loader = new THREE.TextureLoader();
var map = loader.load("assets/earth/map.jpg");
var bump_map = loader.load("assets/earth/bump.png");
var specular_map = loader.load("assets/earth/specular.png");
var star_field = loader.load("assets/earth/star_field.png");

/*===================
   Earth
  ===================*/
var earthGeometry = new THREE.SphereGeometry(0.5, 60, 60);
var earthMaterial = new THREE.MeshPhongMaterial({
  map        :  map,
  bumpMap    :  bump_map,
  bumpScale  :  0.05,
  specularMap:  specular_map,
  specular   :  new THREE.Color("rgb(20, 20, 20)")
});

var earth = new THREE.Mesh(earthGeometry, earthMaterial);

/*===================
   Video Currents Rendering
  ===================*/

var currentsVideo = document.createElement('video');

currentsVideo.src = "assets/videos/currents.mp4";
currentsVideo.loop = true;
currentsVideo.play();

var currentsCanvas = document.createElement('canvas');
currentsCanvas.width = 4096;
currentsCanvas.height = 2048;

var currentsContext = currentsCanvas.getContext('2d');

var currentsTexture = new THREE.Texture(currentsCanvas);
currentsTexture.minFilter = THREE.LinearFilter;
currentsTexture.magFilter = THREE.LinearFilter;
currentsTexture.wrapS = THREE.RepeatWrapping;
currentsTexture.offset.x = 0.5;

var mask = new Image(currentsCanvas.width, currentsCanvas.height);
mask.src = "assets/videos/mask.png";

var currentsGeometry = new THREE.SphereGeometry(0.502, 60, 60);
var currentsMaterial = new THREE.MeshPhongMaterial({
  map     	  : currentsTexture,
  side        : THREE.DoubleSide,
  opacity     : 0.5,
  transparent : true,
  depthWrite  : false
});
var currentsMesh = new THREE.Mesh(currentsGeometry, currentsMaterial);
earth.add(currentsMesh);

scene.add(earth);

/*===================
   Star Field
  ===================*/
var starfield = new THREE.Mesh(
  new THREE.SphereGeometry(90, 64, 64), 
  new THREE.MeshBasicMaterial({
    map: star_field,
    side: THREE.BackSide
  })
);
scene.add(starfield);
 
/*===================
   Rotation Controls
  ===================*/
var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enablePan = false;
controls.minDistance = 0.61;
controls.maxDistance = 2.5;

/*===================
   Statistics Code
  ===================*/
var stats = new Stats();
stats.showPanel(0);

/*===================
   GUI Controls
  ===================*/
// Set up GUI controls
var guiController = new function() {
	this.currents = true;
	this.currentsOpacity = 0.5;
}();

window.onload = function() {
	// Append renderer element
	document.body.appendChild(renderer.domElement);

	// Append stats element
	document.body.appendChild(stats.dom);

	var gui = new dat.GUI();
	var currentsFolder = gui.addFolder('Currents');
	currentsFolder.add(guiController, 'currents', false).onChange(function() {
		if (guiController.currents)
			currentsMaterial.opacity = guiController.currentsOpacity;
		else
			currentsMaterial.opacity = 0;
	});
	currentsFolder.add(guiController, 'currentsOpacity', 0.0, 0.6).onChange(function() {
		currentsMaterial.opacity = guiController.currentsOpacity;
	});
};

/*===================
   Render Code
  ===================*/
function render() {
	stats.begin();
	// Request a new frame
	requestAnimationFrame(render);

	// Rotate the earth automatically
	earth.rotation.y += 0.0005;
	//clouds.rotation.y += 0.0005;

	controls.update();

	// Update video
	//currentsContext.drawImage(currentsVideo, 0, 0);
	//currentsContext.globalCompositeOperation = "destination-out";
	//currentsContext.drawImage(mask, 0, 0);
	//currentsContext.globalCompositeOperation = "source-over";
	if (currentsTexture) {
		currentsTexture.needsUpdate = true;
	}

	renderer.render(scene, camera);

	stats.end();
};

render();