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
   Video Overlay Rendering
  ===================*/
var overlayTexture = new THREE.Texture(null); // Instantiate

var overlayGeometry = new THREE.SphereGeometry(0.502, 60, 60);
var overlayMaterial = new THREE.MeshPhongMaterial({
  map     	  : overlayTexture,
  side        : THREE.DoubleSide,
  opacity     : 0.5,
  transparent : true,
  depthWrite  : false
});
var overlayMesh = new THREE.Mesh(overlayGeometry, overlayMaterial);
earth.add(overlayMesh);

// Hack to ensure that all textures are pre-updated before being inserted in the frames array
var loaderGeometry = new THREE.SphereGeometry(0.502, 60, 60);
var loaderMaterial = new THREE.MeshPhongMaterial({
  map     	  : overlayTexture,
  side        : THREE.DoubleSide,
  opacity     : 0.0,
  transparent : true,
  depthWrite  : false
});
var loaderMesh = new THREE.Mesh(loaderGeometry, loaderMaterial);
scene.add(loaderMesh);

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

	// Begin extracting the frames
	var mask = new Image();
	mask.src = "assets/videos/mask.png";
	extractFrames("assets/videos/currents.mp4", mask, "currentsFrames");

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
   Overlay Options
  ===================*/
var overlayFrames = {
	currentsFrames: []
};

/*===================
   Extract Frames from Video
  ===================*/
var video;
function extractFrames(src, mask, frameType) {
	var i = 0;

 video = document.createElement('video');
	var canvasFrames = [];
	var width = 0;
	var height = 0;

	console.log("Extracting frames.");

	video.addEventListener('loadedmetadata', function() {
		width = this.videoWidth;
		height = this.videoHeight;

		video.currentTime = i;

		console.log(video.duration);
	}, false);

	video.src = src;

	video.addEventListener('seeked', function() {
		// Generate canvas drawing
		var tempCanvas = document.createElement('canvas');
		tempCanvas.width = width;
		tempCanvas.height = height;
		var tempCTX = tempCanvas.getContext('2d');
		tempCTX.drawImage(this, 0, 0);
		tempCTX.drawImage(this, 0, 0);
		if (mask != null) {
			tempCTX.globalCompositeOperation = "destination-out";
			tempCTX.drawImage(mask, 0, 0);
			tempCTX.globalCompositeOperation = "source-over";
		}

		// Generate THREE.js texture from canvas
		var tempTexture = new THREE.Texture(tempCanvas);
		tempTexture.minFilter = THREE.LinearFilter;
		tempTexture.magFilter = THREE.LinearFilter;
		tempTexture.wrapS = THREE.RepeatWrapping;
		tempTexture.offset.x = 0.5;

		// Pre-updates texture using secondary (hidden) material
		tempTexture.needsUpdate = true;
		loaderMaterial.map = tempTexture;

		// Add pre-rendered texture to array
		canvasFrames.push(tempTexture);

		i += 1;
		console.log(i);
		if (i <= this.duration) {
			video.currentTime = i;
		} else {
			overlayFrames[frameType] = canvasFrames;
			console.log("Finished");
		}
	}, false);
}

/*===================
   Render Code
  ===================*/
var frame = 0;
var rendered = 0;
var firstRun = true;
var frameUpdateSpeed = 3;

function render() {
	rendered = (rendered + 1) % frameUpdateSpeed;
	stats.begin();
	// Request a new frame
	requestAnimationFrame(render);

	// Rotate the earth automatically
	earth.rotation.y += 0.0005;

	controls.update();

	// Update overlay
	if (overlayFrames["currentsFrames"].length > 0 && rendered == 0) {
		// Update the overlay frame
		overlayMaterial.map = overlayFrames["currentsFrames"][frame];
		frame = (frame + 1) % overlayFrames["currentsFrames"].length;
	}

	renderer.render(scene, camera);

	stats.end();
};

render();