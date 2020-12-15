import 'regenerator-runtime/runtime';  // For parcel
import * as tf from '@tensorflow/tfjs';

/***************************** DOM elements **************************************/
const clearButton = document.getElementById('clear');
const predictButton = document.getElementById('predict');
const sum = document.querySelector('.chalkboard--sum');
let canvas = document.querySelector('.canvas__paper');

/**************************** Global Variables ***********************************/
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

// Clear canvas
const clearCanvas = () => {
	ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	clickX = new Array();
	clickY = new Array();
	clickD = new Array();
};

// Load CNN-model
const loadModel = (async () => {
	model = undefined;
	model = await tf.loadLayersModel('models/model.json');
})();

// Preprocess canvas input into visual pattern
const preprocessCanvas = image => {
	let tensor = tf.browser.fromPixels(image)
		.resizeNearestNeighbor([28, 28])
		.mean(2)
		.expandDims(2)
		.expandDims()
		.toFloat();
	return tensor.div(255.0);
};

/**************************** Drawing functions **********************************/
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

/************************** Event Listeners on canvas ***************************/
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

/************************** Event Listeners on buttons ***************************/
clearButton.addEventListener('click', async (e) => {
	e.preventDefault();
	clearCanvas();
	
	const answers = sum.querySelectorAll('span');
	const lastAnswer = answers[answers.length - 1];
	sum.removeChild(lastAnswer);
});

predictButton.addEventListener('click', async (e) => {
	e.preventDefault();
	let tensor = preprocessCanvas(canvas);
	let predictions = await model.predict(tensor).data();
	let results = Array.from(predictions);
	
	displayNumber(results);
	clearCanvas();
});

/****************************** Math functions ***********************************/
// Show written number prediciton on chalkboard
const displayNumber = data => {
	let max = data[0];
	let maxIndex = 0;

	for (let i = 1; i < data.length; i++) {
		if (data[i] > max) {
			maxIndex = i;
			max = data[i];
		}
	}

	const number = document.createElement('span');
	number.innerHTML = maxIndex;
	sum.appendChild(number);

	// answer.innerHTML = `${maxIndex}`;
};

// Get random number between 0 and 9
const getRandomInt = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
};

// Return a random math excercise on chalkboard
const getMathExcercise = (() => {
	const num1 = getRandomInt(0, 10);
	const num2 = getRandomInt(0, 10);
	sum.innerHTML = `${num1} + ${num2} = `;
})();

// Check if given answer is (in)correct
const checkAnswer = (num1, num2, answer) => {
	if (num1 + num2 === answer) {
		// notify correct
	} else {
		// notify incorrect
	}
};