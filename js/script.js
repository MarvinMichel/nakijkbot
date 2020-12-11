import 'regenerator-runtime/runtime';  // For parcel
import * as tf from '@tensorflow/tfjs';

// DOM elements
const clearButton = document.getElementById('clear');
const predictButton = document.getElementById('predict');
const answer = document.getElementById('answer');
let canvas = document.getElementById('canvas');

// Global variables
let model;

const canvasWidth = canvas.clientWidth;
const canvasHeight = canvas.clientHeight;
const canvasBackground = 'white';
const canvasStrokeStyle	= 'grey';
const canvasLineJoin = 'round';
const canvasLineWidth = 10;

let clickX = new Array();
let clickY = new Array();
let clickD = new Array();
let drawing;

// Create canvas
canvas.setAttribute('width', canvasWidth);
canvas.setAttribute('height', canvasHeight);
if(typeof G_vmlCanvasManager != 'undefined') {
	canvas = G_vmlCanvasManager.initElement(canvas);
}
let ctx = canvas.getContext('2d');

// Load CNN-model
const loadModel = (async () => {
	model = undefined;
	model = await tf.loadLayersModel('models/model.json');
})();

// Drawing functions
const addUserGesture = (x, y, dragging) => {
	clickX.push(x);
	clickY.push(y);
	clickD.push(dragging);
};

const drawOnCanvas = () => {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	ctx.fillStyle = canvasBackground;
	ctx.strokeStyle = canvasStrokeStyle;
	ctx.lineJoin = canvasLineJoin;
	ctx.lineWidth = canvasLineWidth;

	for (let i = 0; i < clickX.length; i++) {
		ctx.beginPath();
		if(clickD[i] && i) {
			ctx.moveTo(clickX[i-1], clickY[i-1]);
		} else {
			ctx.moveTo(clickX[i]-1, clickY[i]);
		}
		ctx.lineTo(clickX[i], clickY[i]);
		ctx.closePath();
		ctx.stroke();
	}
};

// EventListeners on canvas
canvas.addEventListener('mousedown', e => {
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();
});

canvas.addEventListener('touchstart', (e) => {
	if (e.target === canvas) {
		e.preventDefault();
	}

	const rect = canvas.getBoundingClientRect();
	const touch = e.touches[0];

	const mouseX = touch.clientX - rect.left;
	const mouseY = touch.clientY - rect.top;

	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();

}, false);

canvas.addEventListener('mousemove', e => {
	if (drawing) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
});

canvas.addEventListener('touchmove', (e) => {
	if (e.target === canvas) {
		e.preventDefault();
	}
	if(drawing) {
		const rect = canvas.getBoundingClientRect();
		const touch = e.touches[0];

		const mouseX = touch.clientX - rect.left;
		const mouseY = touch.clientY - rect.top;

		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
}, false);

canvas.addEventListener('mouseup', () => drawing = false);

canvas.addEventListener('touchend', (e) => {
	if (e.target === canvas) {
		e.preventDefault();
	}
	drawing = false;
}, false);

canvas.addEventListener('mouseleave', () => drawing = false);

canvas.addEventListener('touchleave', (e) => {
	if (e.target === canvas) {
		e.preventDefault();
	}
	drawing = false;
}, false);

// EventListeners on buttons
clearButton.addEventListener('click', async (e) => {
	e.preventDefault();
	ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	clickX = new Array();
	clickY = new Array();
	clickD = new Array();

	answer.innerHTML = '';
});

predictButton.addEventListener('click', async (e) => {
	e.preventDefault();
	let tensor = preprocessCanvas(canvas);
	let predictions = await model.predict(tensor).data();
	let results = Array.from(predictions);
	
	displayNumber(results);
});

const preprocessCanvas = image => {
	let tensor = tf.browser.fromPixels(image)
		.resizeNearestNeighbor([28, 28])
		.mean(2)
		.expandDims(2)
		.expandDims()
		.toFloat();
	return tensor.div(255.0);
};

const displayNumber = data => {
	let max = data[0];
	let maxIndex = 0;

	for (let i = 1; i < data.length; i++) {
		if (data[i] > max) {
			maxIndex = i;
			max = data[i];
		}
	}
	console.log(`Predicting you draw ${maxIndex} with ${Math.trunc(max * 100)}% confidence`);
	answer.innerHTML = `${maxIndex}`;
};