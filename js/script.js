import 'regenerator-runtime/runtime';  // For parcel
import * as tf from '@tensorflow/tfjs';
import Chart from 'chart.js';

// Global variables
let model;

const canvasWidth = 300;
const canvasHeight = 300;
const canvasStrokeStyle	= 'white';
const canvasLineJoin = 'round';
const canvasLineWidth = 10;

let clickX = new Array();
let clickY = new Array();
let clickD = new Array();
let drawing;

// DOM elements
const clearButton = document.getElementById('clear');
const predictButton = document.getElementById('predict');

let chalkboard = document.getElementById('chalkboard');

const chartBox = document.getElementById('chart');
const predictionText = document.querySelector('.prediction--text');
const predictionBox = document.querySelector('.prediction--box');

// Make prediction chart invisible on first load
chartBox.innerHTML = '';
chartBox.style.display = 'none';

// Create canvas
chalkboard.setAttribute('width', canvasWidth);
chalkboard.setAttribute('height', canvasHeight);
if(typeof G_vmlCanvasManager != 'undefined') {
	chalkboard = G_vmlCanvasManager.initElement(chalkboard);
}
let ctx = chalkboard.getContext('2d');

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
chalkboard.addEventListener('mousedown', e => {
	const rect = chalkboard.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();
});

chalkboard.addEventListener('touchstart', (e) => {
	if (e.target === chalkboard) {
		e.preventDefault();
	}

	const rect = chalkboard.getBoundingClientRect();
	const touch = e.touches[0];

	const mouseX = touch.clientX - rect.left;
	const mouseY = touch.clientY - rect.top;

	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();

}, false);

chalkboard.addEventListener('mousemove', e => {
	if (drawing) {
		const rect = chalkboard.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
});

chalkboard.addEventListener('touchmove', (e) => {
	if (e.target === chalkboard) {
		e.preventDefault();
	}
	if(drawing) {
		const rect = chalkboard.getBoundingClientRect();
		const touch = e.touches[0];

		const mouseX = touch.clientX - rect.left;
		const mouseY = touch.clientY - rect.top;

		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
}, false);

chalkboard.addEventListener('mouseup', () => drawing = false);

chalkboard.addEventListener('touchend', (e) => {
	if (e.target === chalkboard) {
		e.preventDefault();
	}
	drawing = false;
}, false);

chalkboard.addEventListener('mouseleave', () => drawing = false);

chalkboard.addEventListener('touchleave', (e) => {
	if (e.target === chalkboard) {
		e.preventDefault();
	}
	drawing = false;
}, false);

// EventListeners on buttons
clearButton.addEventListener('click', async () => {
	ctx = chalkboard.getContext('2d');
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	clickX = new Array();
	clickY = new Array();
	clickD = new Array();

	predictionText.innerHTML = '';
	predictionBox.style.display = 'none';
});

predictButton.addEventListener('click', async () => {
	let tensor = preprocessCanvas(chalkboard);
	let predictions = await model.predict(tensor).data();
	let results = Array.from(predictions);

	predictionBox.style.display = 'block';
	
	displayChart(results);
	displayLabel(results);
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

let chart = '';
let firstTime = 0;
const loadChart = (label, data, modelSelected) => {
	ctx = document.getElementById('chart').getContext('2d');
	chart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: label,
			datasets: [{
				label: modelSelected + ' prediction',
				backgroundColor: '#f50057',
				borderColor: 'rgb(255, 99, 132)',
				data: data,
			}]
		},
		options: {}
	});
};

const displayChart = data => {
	const select_option = 'CNN';

	const label = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
	if (firstTime === 0) {
		loadChart(label, data, select_option);
		firstTime = 1;
	} else {
		chart.destroy();
		loadChart(label, data, select_option);
	}
	document.getElementById('chart').style.display = 'block';
};

const displayLabel = data => {
	let max = data[0];
	let maxIndex = 0;

	for (let i = 1; i < data.length; i++) {
		if (data[i] > max) {
			maxIndex = i;
			max = data[i];
		}
	}
	predictionText.innerHTML = `Predicting you draw <b>${maxIndex}</b> with <b>${Math.trunc(max * 100)}%</b> confidence`;
};