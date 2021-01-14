class MathQuiz {
	constructor() {
		this.questions = [];
		this.index = 0;
	}

	getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min) + min);
	}

	getMathExcercises(questionCount) {
		for (let i = 0; i < questionCount; i++) {
			const num1 = this.getRandomInt(0, 10);
			const num2 = this.getRandomInt(0, 10);
			const question = {
				sum: `${num1} + ${num2}`,
				correctAnswer: num1 + num2,
				userAnswer: undefined
			};
			this.questions.push(question);
		}
	}

	displayQuestion(question, answer, indexCount) {
		indexCount.innerHTML = `${this.index+1}/${this.questions.length}`;
		question.innerHTML = `${this.questions[this.index].sum} = `;
		if (this.questions[this.index].userAnswer) {
			answer.innerHTML = this.questions[this.index].userAnswer;
		} else {
			answer.innerHTML = '';
		}
	}

	changeUserAnswer(element) {
		if (element.innerText === '') {
			this.questions[this.index].userAnswer = undefined;
		} else {
			this.questions[this.index].userAnswer = Number(element.innerText);
		}
	}

	checkAnswers() {
		let correctAnswers = 0;
		this.questions.forEach(question => {
			if (question.userAnswer === question.correctAnswer) {
				correctAnswers++;
			}
		});
		const final = {
			questionCount: this.questions.length,
			correctAnswers: correctAnswers,
			mark: Math.round((10 / (this.questions.length / correctAnswers)) * 10) / 10
		};
		return final;
	}
}

export { MathQuiz as default };