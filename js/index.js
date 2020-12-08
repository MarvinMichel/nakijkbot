import * as tf from '@tensorflow/tfjs';

// Setup
let model;
const canvasWidth = 300;
const canvasHeight = 300;
const canvasStrokeStyle = 'black';
const canvasLineJoin = 'round';
const canvasLineWidth = 10;
const canvasBackgroundColor = 'white';
const canvasId = 'canvas';

let clickX = new Array();
let clickY = new Array();
let clickD = new Array();
let drawing;

let ctx;
const clearButton = document.getElementById('clear');
const predictButton = document.getElementById('predict');
const predictionText = document.querySelector('.prediction-text');

// Create canvas to hold drawing
const canvasContainer = document.querySelector('.canvas--container');
let canvas = document.createElement('canvas');

canvas.setAttribute('width', canvasWidth);
canvas.setAttribute('height', canvasHeight);
canvas.setAttribute('id', canvasId);
canvas.style.backgroundColor = canvasBackgroundColor;
canvasContainer.appendChild(canvas);

if (typeof G_vmlCanvasManager !== 'undefined') {
  canvas = G_vmlCanvasManager.initElement(canvas);
}

ctx = canvas.getContext('2d');

// Click function
const addUserGesture = (x, y, dragging) => {
  clickX.push(x);
  clickY.push(y);
  clickD.push(dragging);
};

// Draw function
const drawOnCanvas = () => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = canvasStrokeStyle;
  ctx.lineJoin = canvasLineJoin;
  ctx.lineWidth = canvasLineWidth;

  for (let i = 0; i < clickX.length; i++) {
    ctx.beginPath();
    if (clickD[i] && i) {
      ctx.moveTo(clickX[i - 1], clickY[i - 1]);
    } else {
      ctx.moveTo(clickX[i] - 1, clickY[i]);
    }
    ctx.lineTo(clickX[i], clickY[i]);
    ctx.closePath();
    ctx.stroke();
  }
};

// Event listeners for canvas drawing
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  drawing = true;
  addUserGesture(mouseX, mouseY);
  drawOnCanvas();
});

canvas.addEventListener('touchstart', e => {
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

    addUserGesture(mouseX, mouseY), true;
    drawOnCanvas();
  }
});

canvas.addEventListener('touchmove', e => {
  if (e.taregt === canvas) {
    e.preventDefault();
  }

  if (drawing) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    addUserGesture(mouseX, mouseY), true;
    drawOnCanvas();
  }
}, false);

canvas.addEventListener('mouseup', () => {
  drawing = false;
});

canvas.addEventListener('touchend', e => {
  if (e.target === canvas) {
    e.preventDefault();
  }
  drawing = false;
}, false);

canvas.addEventListener('mouseleave', () => {
  drawing = false;
});

canvas.addEventListener('touchcancel', e => {
  if (e.target === canvas) {
    e.preventDefault();
  }
  drawing = false;
}, false);

clearButton.addEventListener('click', async () => {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  clickX = new Array();
  clickY = new Array();
  clickD = new Array();
  predictionText.innerHTML = '';
});

// Load model
const loadModel = async () => {
  model = undefined;
  model = await tf.loadLayersModel('models/model.json');
};
loadModel();

// Preprocess canvas
const preprocessCanvas = image => {
  let tensor = tf.browser.fromPixels(image)
    .resizeNearestNeigbhor([28, 28])
    .mean(2)
    .expandDims(2)
    .expandDims()
    .toFloat();
  return tensor.div(255.0);
};

// Predict function
predictButton.addEventListener('click', async () => {
  const imageData = canvas.toDataURL();

  let tensor = preprocessCanvas(canvas);
  let predictions = await model.predict(tensor).data();
  let results = Array.from(predictions);
  displayChart(results);
  displayLabel(results);
});

// Chart display with the predictions
let chart = '';
let firstTime = 0;

const loadChart = (label, data, modelSelected) => {
  ctx = document.getElementById('myChart');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: label,
      datasets: [{
        label: modelSelected + ' prediction',
        backgroundColor: '#f50057',
        borderColor: 'rgb(255, 99, 132)',
        data: data
      }]
    },
    options: {}
  });
};