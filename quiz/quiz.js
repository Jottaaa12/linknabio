// quiz.js - Versão Simplificada

class Quiz {
    constructor() {
        // 1. Encontra todos os elementos do HTML
        this.introScreen = document.getElementById('intro-screen');
        this.quizContainer = document.getElementById('quiz-container');
        this.resultContainer = document.getElementById('result-container');
        this.questionEl = document.getElementById('question');
        this.answersContainer = document.getElementById('answers-container');
        this.scoreEl = document.getElementById('score');
        this.resultMessageEl = document.getElementById('result-message');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.querySelector('.btn-restart');
        this.backToStartBtn = document.querySelector('.btn.text-center');

        // 2. Adiciona os eventos de clique (listeners)
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => this.start());
        this.backToStartBtn.addEventListener('click', () => this.showIntroScreen());

        // 3. Define o estado inicial
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedQuestions = [];
    }

    start() {
        // Reseta o estado para um novo jogo
        this.currentQuestionIndex = 0;
        this.score = 0;

        // Esconde as outras telas e mostra a do quiz
        this.introScreen.classList.add('hidden');
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');

        // Seleciona e embaralha as perguntas
        const shuffled = [...questionsDatabase.questions].sort(() => 0.5 - Math.random());
        this.selectedQuestions = shuffled.slice(0, 10); // Pega 10 perguntas

        this.showQuestion();
    }

    showQuestion() {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        this.questionEl.textContent = question.question;
        this.answersContainer.innerHTML = ''; // Limpa as respostas antigas

        // Cria os botões de resposta
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'btn'; // Usa a classe de estilo principal
            button.textContent = option;
            button.addEventListener('click', () => this.handleAnswer(index, button));
            this.answersContainer.appendChild(button);
        });
    }

    handleAnswer(selectedIndex, selectedButton) {
        const question = this.selectedQuestions[this.currentQuestionIndex];
        const correctIndex = question.correctIndex;

        // Desabilita todos os botões
        Array.from(this.answersContainer.children).forEach(btn => {
            btn.disabled = true;
        });

        // Verifica se a resposta está correta e aplica o estilo
        if (selectedIndex === correctIndex) {
            this.score++;
            selectedButton.classList.add('correct');
        } else {
            selectedButton.classList.add('incorrect');
            // Mostra qual era a resposta correta
            this.answersContainer.children[correctIndex].classList.add('correct');
        }

        // Espera um pouco e vai para a próxima pergunta ou resultado
        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.selectedQuestions.length) {
                this.showQuestion();
            } else {
                this.showResult();
            }
        }, 1500);
    }

    showResult() {
        this.quizContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');

        const total = this.selectedQuestions.length;
        this.scoreEl.textContent = `${this.score} / ${total}`;
        this.resultMessageEl.innerHTML = `<p>Você acertou ${this.score} de ${total} perguntas!</p>`;
    }

    showIntroScreen() {
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.add('hidden');
        this.introScreen.classList.remove('hidden');
    }
}

// Ponto de entrada seguro da aplicação
document.addEventListener('DOMContentLoaded', () => {
    new Quiz();
}); 
