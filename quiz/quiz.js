// Configuração do Quiz
const TRANSITION_DELAY = 1000; // Tempo de transição entre perguntas em ms
const HIGH_SCORE_KEY = 'quiz_high_score';

// Classe principal do Quiz
class Quiz {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.resetState();
        this.highScore = this.getHighScore();
        this.updateHighScoreDisplay();

        // Define as configurações iniciais
        this.setDifficulty('facil');
        this.setMode('competition');
    }

    initializeElements() {
        // Elementos principais
        this.introScreen = document.getElementById('intro-screen');
        this.quizContainer = document.getElementById('quiz-container');
        this.resultContainer = document.getElementById('result-container');
        this.questionEl = document.getElementById('question');
        this.answersContainer = document.getElementById('answers-container');
        this.scoreEl = document.getElementById('score');
        this.resultIconEl = document.getElementById('result-icon');
        this.resultMessageEl = document.getElementById('result-message');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.highScoreEl = document.getElementById('high-score');

        // Elementos do timer
        this.timerContainer = document.getElementById('timer-container');
        this.timerBar = document.getElementById('timer-bar');
        this.timerCount = document.getElementById('timer-count');

        // Botões
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.querySelector('.btn-restart');
        this.backToStartBtn = document.querySelector('.btn.text-center'); // Botão "Voltar ao Início"
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.powerupFiftyFiftyBtn = document.getElementById('powerup-fiftyfifty');
        this.powerupSkipBtn = document.getElementById('powerup-skip');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => this.start());
        this.backToStartBtn.addEventListener('click', () => this.showIntroScreen());

        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setDifficulty(btn.dataset.difficulty));
        });
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
        });

        if (this.powerupFiftyFiftyBtn) {
            this.powerupFiftyFiftyBtn.addEventListener('click', () => this.useFiftyFifty());
        }
        if (this.powerupSkipBtn) {
            this.powerupSkipBtn.addEventListener('click', () => this.useSkip());
        }
    }

    resetState() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.selectedQuestions = [];
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = null;
        this.isAnswered = false;
        this.powerUps = { fiftyFifty: 1, skip: 1 };
    }
    
    showIntroScreen() {
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.add('hidden');
        this.introScreen.classList.remove('hidden');
        this.resetState();
    }

    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.difficultyButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.difficulty === difficulty);
            btn.setAttribute('aria-pressed', btn.dataset.difficulty === difficulty);
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
             btn.setAttribute('aria-pressed', btn.dataset.mode === mode);
        });
    }

    start() {
        this.resetState();
        this.introScreen.classList.add('hidden');
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
        
        if (this.powerupFiftyFiftyBtn) {
            this.updatePowerUpsUI();
        }

        const filteredQuestions = questionsDatabase.questions.filter(q => q.difficulty === this.currentDifficulty);
        const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
        this.selectedQuestions = shuffled.slice(0, questionsDatabase.config.questionsPerQuiz);
        
        if (this.selectedQuestions.length === 0) {
            alert('Não há perguntas disponíveis para esta dificuldade.');
            this.showIntroScreen();
            return;
        }

        this.showQuestion();
    }

    showQuestion() {
        this.isAnswered = false;
        const question = this.selectedQuestions[this.currentQuestionIndex];
        
        this.quizContainer.classList.add('changing-question');
        
        setTimeout(() => {
            this.questionEl.textContent = question.question;
            this.answersContainer.innerHTML = '';

            const options = question.options.map((text, originalIndex) => ({ text, originalIndex }));
            const shuffledOptions = options.sort(() => Math.random() - 0.5);

            shuffledOptions.forEach(option => {
                const button = document.createElement('button');
                button.className = 'btn'; 
                button.textContent = option.text;
                button.addEventListener('click', () => this.handleAnswer(option.originalIndex, button));
                this.answersContainer.appendChild(button);
            });
            
            this.updateProgress();
            this.startTimer();
            
            this.quizContainer.classList.remove('changing-question');
            this.quizContainer.classList.add('question-enter');
            setTimeout(() => this.quizContainer.classList.remove('question-enter'), 300);

        }, 300);
    }

    handleAnswer(selectedIndex, selectedButton) {
        if (this.isAnswered) return;
        this.isAnswered = true;
        clearInterval(this.timerId);

        const question = this.selectedQuestions[this.currentQuestionIndex];
        const correctIndex = question.correctIndex;

        const correctButtonText = question.options[correctIndex];
        const correctButton = Array.from(this.answersContainer.children).find(btn => btn.textContent === correctButtonText);

        if (selectedIndex === correctIndex) {
            this.score++;
            selectedButton.classList.add('correct');
        } else {
            if(selectedButton) selectedButton.classList.add('incorrect');
            if(correctButton) correctButton.classList.add('correct');
        }

        Array.from(this.answersContainer.children).forEach(btn => {
            btn.disabled = true;
        });

        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.selectedQuestions.length) {
                this.showQuestion();
            } else {
                this.showResult();
            }
        }, 1500);
    }

    startTimer() {
        if (this.mode === 'training' || !this.timerContainer) {
            if(this.timerContainer) this.timerContainer.classList.add('hidden');
            return;
        }
        this.timerContainer.classList.remove('hidden');
        clearInterval(this.timerId);
        let time = questionsDatabase.config.difficulties[this.currentDifficulty].time;
        
        const update = () => {
            this.timerCount.textContent = time;
            const percentage = (time / questionsDatabase.config.difficulties[this.currentDifficulty].time) * 100;
            this.timerBar.style.width = `${percentage}%`;
            
            if (percentage < 30) this.timerBar.style.backgroundColor = '#ef4444';
            else if (percentage < 60) this.timerBar.style.backgroundColor = '#f59e0b';
            else this.timerBar.style.backgroundColor = 'var(--accent-green)';

            if (time === 0) {
                clearInterval(this.timerId);
                this.handleAnswer(-1, null);
            }
            time--;
        };
        
        update();
        this.timerId = setInterval(update, 1000);
    }

    updateProgress() {
        const totalQuestions = this.selectedQuestions.length;
        const progress = ((this.currentQuestionIndex + 1) / totalQuestions) * 100;
        this.progressBar.style.width = `${progress}%`;
        this.progressText.textContent = `Pergunta ${this.currentQuestionIndex + 1}/${totalQuestions}`;
    }
    
    useFiftyFifty() {
        if (!this.powerupFiftyFiftyBtn || this.powerUps.fiftyFifty <= 0 || this.isAnswered) return;
        this.powerUps.fiftyFifty--;
        this.updatePowerUpsUI();

        const question = this.selectedQuestions[this.currentQuestionIndex];
        const correctIndex = question.correctIndex;
        let removedCount = 0;
        const buttons = Array.from(this.answersContainer.children);
        
        const buttonIndices = buttons.map(btn => question.options.indexOf(btn.textContent));

        while(removedCount < 2) {
            const randomIndex = Math.floor(Math.random() * buttons.length);
            if (buttonIndices[randomIndex] !== correctIndex && !buttons[randomIndex].disabled) {
                buttons[randomIndex].disabled = true;
                buttons[randomIndex].style.opacity = '0.3';
                removedCount++;
            }
        }
    }

    useSkip() {
        if (!this.powerupSkipBtn || this.powerUps.skip <= 0 || this.isAnswered) return;
        this.powerUps.skip--;
        this.updatePowerUpsUI();
        clearInterval(this.timerId);
        
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.selectedQuestions.length) {
            this.showQuestion();
        } else {
            this.showResult();
        }
    }

    updatePowerUpsUI() {
        this.powerupFiftyFiftyBtn.textContent = `50/50 (${this.powerUps.fiftyFifty}x)`;
        this.powerupSkipBtn.textContent = `Pular (${this.powerUps.skip}x)`;
        this.powerupFiftyFiftyBtn.disabled = this.powerUps.fiftyFifty <= 0;
        this.powerupSkipBtn.disabled = this.powerUps.skip <= 0;
    }

    showResult() {
        this.quizContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');

        const total = this.selectedQuestions.length;
        const percentage = total > 0 ? Math.round((this.score / total) * 100) : 0;

        this.scoreEl.textContent = `${this.score} / ${total}`;
        
        if (percentage > this.getHighScore()) {
            this.setHighScore(percentage);
        }
        this.updateHighScoreDisplay();

        let message = "";
        let icon = "";
        // CORREÇÃO: Mensagem de vitória sem o cupom.
        if (this.score >= questionsDatabase.config.minCorrectForReward) {
            icon = '🏆';
            message = `<h3>Parabéns, Embaixador(a) Sabor da Terra!</h3><p>Seu conhecimento é impressionante! Você é um verdadeiro expert em nosso açaí!</p>`;
        } else if (this.score >= total / 2) {
            icon = '👍';
            message = `<h3>Você conhece bem a gente!</h3><p>Mandou bem! Que tal passar na nossa loja pra comemorar com o seu açaí preferido?</p>`;
        } else {
            icon = '�';
            message = `<h3>Valeu a tentativa!</h3><p>Agora que você sabe mais sobre nós, venha viver a experiência Sabor da Terra e se tornar um expert!</p>`;
        }
        this.resultIconEl.textContent = icon;
        this.resultMessageEl.innerHTML = message;
    }
    
    getHighScore() {
        return parseFloat(localStorage.getItem(HIGH_SCORE_KEY) || 0);
    }

    setHighScore(score) {
        localStorage.setItem(HIGH_SCORE_KEY, score.toString());
        this.highScore = score;
    }
    
    updateHighScoreDisplay() {
        if(this.highScoreEl) {
            this.highScoreEl.textContent = `Melhor pontuação: ${this.getHighScore()}%`;
        }
    }
}

// Função global para reiniciar o quiz (usada pelo botão no HTML antigo)
function restartQuiz() {
    if(window.quiz) {
        window.quiz.start();
    }
}

// Inicialização centralizada
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o quiz
    window.quiz = new Quiz();
});
