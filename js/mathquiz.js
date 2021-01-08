class MathQuiz {
	constructor() {
		this.questions = [];
		this.currentQuestion = {};
	}

	getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min) + min);
	}

	getMathExcercise(index) {
		const num1 = this.getRandomInt(0, 10);
		const num2 = this.getRandomInt(0, 10);
		const question = {
			id: index,
			sum: `${num1} + ${num2}`,
			correctAnswer: num1 + num2,
			userAnswer: undefined
		};
		this.questions.push(question);
	}

	getQuestion(index, element) {
		this.currentQuestion = this.questions[index];
		element.innerHTML = `${this.currentQuestion.sum} = `;
	}

	changeUserAnswer(element) {
		let userAnswer;
		element.innerHTML === ''
			? userAnswer = undefined
			: userAnswer = Number(element.innerHTML);
		this.currentQuestion.userAnswer = userAnswer;
	}

	checkAnswer() {
		const answer = this.currentQuestion.correctAnswer;
		const input = this.currentQuestion.userAnswer;

		if (answer === input) {
			console.log(`Correct! The right answer is ${input}.`);
		} else {
			console.error(`The right answer should be ${answer}. You guessed ${input}.`);
		}
	}
}

export { MathQuiz as default };