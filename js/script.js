import 'regenerator-runtime/runtime';  // For parcel
import * as tf from '@tensorflow/tfjs';
import MathQuiz from './mathquiz';

/***************************** DOM elements **************************************/
const clearButton = document.getElementById('clear');
const fillButton = document.getElementById('fill');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const doneButton = document.getElementById('done');

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
const numberOfQuestion = 3;

/************************** Initiate Application *********************************/
// Create quiz
let quiz = new MathQuiz();

// Create canvas
canvas.setAttribute('width', canvasWidth);
canvas.setAttribute('height', canvasHeight);
if(typeof G_vmlCanvasManager != 'undefined') {
	canvas = G_vmlCanvasManager.initElement(canvas);
}
let ctx = canvas.getContext('2d');

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

// Predict wirtten number
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
	quiz.getMathExcercises(numberOfQuestion);
	quiz.displayQuestion(sum, answerBox, indexBox);
})();

/**************************** Canvas functions **********************************/
const clearCanvas = () => {
	ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	clickX = new Array();
	clickY = new Array();
	clickD = new Array();
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

/************************** Mouse Events on Canvas ***************************/
canvas.addEventListener('mousedown', e => {
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;
	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();
});

canvas.addEventListener('mousemove', e => {
	if (drawing) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;
		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
});

canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseleave', () => drawing = false);

/************************** Touch Events on Canvas ***************************/
canvas.addEventListener('touchstart', (e) => {
	if (e.target === canvas) e.preventDefault();

	const rect = canvas.getBoundingClientRect();
	const touch = e.touches[0];
	const mouseX = touch.clientX - rect.left;
	const mouseY = touch.clientY - rect.top;

	drawing = true;
	addUserGesture(mouseX, mouseY);
	drawOnCanvas();
}, false);

canvas.addEventListener('touchmove', (e) => {
	if (e.target === canvas) e.preventDefault();

	if(drawing) {
		const rect = canvas.getBoundingClientRect();
		const touch = e.touches[0];
		const mouseX = touch.clientX - rect.left;
		const mouseY = touch.clientY - rect.top;

		addUserGesture(mouseX, mouseY, true);
		drawOnCanvas();
	}
}, false);

canvas.addEventListener('touchend', (e) => {
	if (e.target === canvas) e.preventDefault();
	drawing = false;
}, false);

canvas.addEventListener('touchleave', (e) => {
	if (e.target === canvas) e.preventDefault();
	drawing = false;
}, false);

/************************** Event Listeners on buttons ***************************/
clearButton.addEventListener('click', async (e) => {
	e.preventDefault();
	clearCanvas();
	
	const answer = answerBox.innerHTML;
	const numbers = Array.from(answer.toString()).map(Number);
	numbers.pop();
	if (numbers.length === 0) {
		answerBox.innerHTML = '';
	} else {
		answerBox.innerHTML = [...numbers];
	}

	quiz.changeUserAnswer(answerBox);
});

fillButton.addEventListener('click', async (e) => {
	e.preventDefault();
	const predictedNumber = await predictNumber();
	await displayAnswer(predictedNumber);
	quiz.changeUserAnswer(answerBox);
	clearCanvas();
});

nextButton.addEventListener('click', e => {
	e.preventDefault();
	quiz.index++;
	if (quiz.index > 0) prevButton.removeAttribute('disabled');
	if (quiz.index === (numberOfQuestion - 1)) {
		nextButton.setAttribute('disabled', 'true');
		doneButton.style.display = 'block';
	}
	quiz.displayQuestion(sum, answerBox, indexBox);
});

prevButton.addEventListener('click', e => {
	e.preventDefault();
	if (quiz.index === numberOfQuestion - 1) nextButton.removeAttribute('disabled');
	quiz.index--;
	if (quiz.index < numberOfQuestion - 1) doneButton.style.display = 'none';
	if (quiz.index === 0) prevButton.setAttribute('disabled', 'true');
	quiz.displayQuestion(sum, answerBox, indexBox);
});

doneButton.addEventListener('click', e => {
	e.preventDefault();
	
	let unanswered = 0;
	quiz.questions.forEach(question => {
		console.log(question);
		if (question.userAnswer === undefined || question.userAnswer === '') {
			unanswered++;
		}
	});

	if (unanswered === 0) {
		const final = quiz.checkAnswers();
		createModal(done, final);
	} else {
		createModal(confirm, undefined, unanswered);
	}
});

// Show written number prediciton on chalkboard
const displayAnswer = async(answer) => {
	if (isCanvasBlank(canvas)) return;
	answerBox.innerHTML += answer;
};

const createModal = (type, final, unanswered) => {
	const modal = document.createElement('div');
	const modalContent = document.createElement('div');
	const controls = document.createElement('div');
	const buttonCancel = document.createElement('button');
	const buttonConfirm = document.createElement('button');
	const header = document.createElement('h1');
	const message = document.createElement('p');

	modal.classList.add('modal');
	modalContent.classList.add('modal--content');
	header.classList.add('modal--content__header');
	message.classList.add('modal--content__message');
	controls.classList.add('modal--content__controls');

	modal.appendChild(modalContent);
	modalContent.appendChild(header);
	modalContent.appendChild(message);
	modalContent.appendChild(controls);
	controls.appendChild(buttonConfirm);

	modal.addEventListener('click', () => modal.remove());
	modal.childNodes.forEach(child => child.addEventListener('click', e => e.stopPropagation()));

	if (type === confirm) {
		header.innerText = `Je hebt ${unanswered} vragen niet ingevuld`;
		message.innerText = 'Weet je zeker dat je wilt stoppen?';
		buttonCancel.innerText = 'Nee';
		buttonConfirm.innerText = 'Ja';
		controls.appendChild(buttonCancel);
		buttonConfirm.addEventListener('click', () => {
			modal.remove();
			const final = quiz.checkAnswers();
			createModal(done, final);
		});
		buttonCancel.addEventListener('click', () => modal.remove());
	} else {
		header.innerText = `Je hebt een ${final.mark}`;
		message.innerText = `Je had ${final.correctAnswers} van de ${final.questionCount} goed beantwoord.`;
		buttonConfirm.innerText = 'Opnieuw';
		buttonConfirm.addEventListener('click', () => location.reload());
	}

	document.body.appendChild(modal);
};