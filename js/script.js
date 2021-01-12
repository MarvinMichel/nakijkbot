import 'regenerator-runtime/runtime';  // For parcel
import * as tf from '@tensorflow/tfjs';
import MathQuiz from './mathquiz';

/***************************** DOM elements **************************************/
const clearButton = document.getElementById('clear');
const fillButton = document.getElementById('fill');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const indexBox = document.querySelector('.chalkboard--index');
const sum = document.querySelector('.chalkboard--sum');
const answerBox = document.querySelector('.chalkboard--answer');
let canvas = document.querySelector('.canvas--paper');

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

let index = 0;
const numberOfQuestion = 10;

let quiz = new MathQuiz();

/**************************** Canvas functions **********************************/
// Create canvas
canvas.setAttribute('width', canvasWidth);
canvas.setAttribute('height', canvasHeight);
if(typeof G_vmlCanvasManager != 'undefined') {
	canvas = G_vmlCanvasManager.initElement(canvas);
}
let ctx = canvas.getContext('2d');

const clearCanvas = () => {
	ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	clickX = new Array();
	clickY = new Array();
	clickD = new Array();
};

// Load CNN-model, self-invoking function
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

const isCanvasBlank = canvas => {
	const context = canvas.getContext('2d');

	const pixelBuffer = new Uint32Array(
		context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
	);

	return !pixelBuffer.some(color => color !== 0);
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
	
	const answer = answerBox.innerHTML;
	const numbers = Array.from(answer.toString()).map(Number);
	numbers.pop();
	answerBox.innerHTML = [...numbers];

	quiz.changeUserAnswer(index, answerBox);
});

fillButton.addEventListener('click', async (e) => {
	e.preventDefault();
	const predictedNumber = await predictNumber();
	await displayAnswer(predictedNumber);
	quiz.changeUserAnswer(index, answerBox);
	clearCanvas();
});

nextButton.addEventListener('click', e => {
	e.preventDefault();
	if (index === 0) prevButton.removeAttribute('disabled');
	index++;
	if (index === (numberOfQuestion - 1)) nextButton.setAttribute('disabled', 'true');
	indexBox.innerHTML = `${index+1}/${numberOfQuestion}`;
	quiz.getQuestion(index, sum, answerBox);
});

prevButton.addEventListener('click', e => {
	e.preventDefault();
	quiz.currentQuestion;
	if (index === numberOfQuestion - 1) nextButton.removeAttribute('disabled');
	index--;
	if (index === 0) prevButton.setAttribute('disabled', 'true');
	indexBox.innerHTML = `${index+1}/${numberOfQuestion}`;
	quiz.getQuestion(index, sum, answerBox);
});

/****************************** Math functions ***********************************/
// Show written number prediciton on chalkboard
const displayAnswer = async(answer) => {
	if (isCanvasBlank(canvas)) return;
	answerBox.innerHTML += answer;
};

const predictNumber = async() => {
	let tensor = preprocessCanvas(canvas);
	let predictions = await model.predict(tensor).data();
	let results = Array.from(predictions);

	let max = results[0];
	let maxIndex = 0;

	for (let i = 1; i < results.length; i++) {
		if (results[i] > max) {
			maxIndex = i;
			max = results[i];
		}
	}
	return maxIndex;
};

// Self-invoked on pageload
const renderQuiz = (() => {
	for (let i = 1; i <= numberOfQuestion; i++) {
		quiz.getMathExcercise(i);
	}
	indexBox.innerHTML = `${index+1}/${numberOfQuestion}`;
	quiz.getQuestion(index, sum, answerBox);
})();