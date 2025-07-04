// Configuração do Quiz
const TRANSITION_DELAY = 1000; // Tempo de transição entre perguntas em ms
const HIGH_SCORE_KEY = 'quiz_high_score';
const CORRECT_SOUND = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAABQAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMwAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAAIABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMwAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAAIABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
const INCORRECT_SOUND = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEyLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABAAAABgAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMwAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAAIABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');

// Classe principal do Quiz
class Quiz {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.highScore = this.getHighScore();
        this.selectedQuestions = [];
        // A validação será feita apenas quando o quiz começar
    }

    initializeElements() {
        // Elementos principais
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

        // Validar elementos
        if (!this.validateElements()) {
            throw new Error('Elementos necessários não encontrados no DOM');
        }
    }

    validateElements() {
        return this.quizContainer && this.resultContainer && this.questionEl &&
               this.answersContainer && this.scoreEl && this.resultIconEl &&
               this.resultMessageEl && this.progressBar && this.progressText;
    }

    validateQuestions() {
        const isValid = questionsDatabase.questions.every(q => 
            q.answers.length === 4 && 
            q.answers.filter(a => a.correct).length === 1
        );
        if (!isValid) {
            throw new Error('Formato inválido nas perguntas do quiz');
        }
    }

    selectRandomQuestions() {
        const allQuestions = [...questionsDatabase.questions];
        const numQuestions = questionsDatabase.config.questionsPerQuiz;
        const selected = [];
        
        // Garantir pelo menos uma pergunta de cada categoria disponível
        const categories = Object.keys(questionsDatabase.categories);
        
        for (const category of categories) {
            const categoryQuestions = allQuestions.filter(q => q.category === category);
            if (categoryQuestions.length > 0) {
                const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
                selected.push(categoryQuestions[randomIndex]);
                // Remover a pergunta selecionada do pool
                const index = allQuestions.indexOf(categoryQuestions[randomIndex]);
                allQuestions.splice(index, 1);
            }
        }
        
        // Preencher o resto com perguntas aleatórias
        while (selected.length < numQuestions && allQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * allQuestions.length);
            selected.push(allQuestions[randomIndex]);
            allQuestions.splice(randomIndex, 1);
        }
        
        // Embaralhar a ordem final das perguntas
        return this.shuffleArray(selected);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    handleKeyboardNavigation(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedElement = document.activeElement;
            if (focusedElement.classList.contains('btn')) {
                focusedElement.click();
                e.preventDefault();
            }
        }
    }

    start() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.validateQuestions();
        this.selectedQuestions = this.selectRandomQuestions();
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
        this.showQuestion();
    }

    async showQuestion() {
        this.resetState();
        const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
        this.questionEl.innerText = currentQuestion.question;
        
        // Atualizar progresso
        this.updateProgress();

        // Embaralhar respostas
        const shuffledAnswers = this.shuffleArray([...currentQuestion.answers]);

        // Criar botões de resposta com acessibilidade
        shuffledAnswers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.innerText = answer.text;
            button.classList.add('btn', 'fade-in');
            button.style.animationDelay = `${index * 100}ms`;
            
            // Atributos de acessibilidade
            button.setAttribute('role', 'button');
            button.setAttribute('aria-pressed', 'false');
            
            if (answer.correct) {
                button.dataset.correct = answer.correct;
            }
            
            button.addEventListener('click', () => this.selectAnswer(button));
            this.answersContainer.appendChild(button);
        });
    }

    updateProgress() {
        const totalQuestions = questionsDatabase.config.questionsPerQuiz;
        const progressPercentage = ((this.currentQuestionIndex + 1) / totalQuestions) * 100;
        this.progressBar.style.width = `${progressPercentage}%`;
        this.progressText.innerText = `Pergunta ${this.currentQuestionIndex + 1}/${totalQuestions}`;
        
        // ARIA para acessibilidade
        this.progressBar.setAttribute('aria-valuenow', progressPercentage);
        this.progressBar.setAttribute('aria-valuemin', '0');
        this.progressBar.setAttribute('aria-valuemax', '100');
    }

    resetState() {
        this.showLoading();
        while (this.answersContainer.firstChild) {
            this.answersContainer.removeChild(this.answersContainer.firstChild);
        }
    }

    showLoading() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-spinner';
        loadingEl.setAttribute('role', 'status');
        loadingEl.setAttribute('aria-label', 'Carregando próxima pergunta');
        this.answersContainer.appendChild(loadingEl);
    }

    async selectAnswer(selectedButton) {
        const isCorrect = selectedButton.dataset.correct === 'true';
        
        // Feedback sonoro
        this.playSound(isCorrect);

        if (isCorrect) {
            this.score++;
        }

        // Desabilitar todos os botões e mostrar feedback
        Array.from(this.answersContainer.children).forEach(button => {
            this.setStatusClass(button, button.dataset.correct === 'true');
            button.disabled = true;
        });

        // Aguardar antes de mostrar próxima pergunta
        await this.delay(TRANSITION_DELAY);
        
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.selectedQuestions.length) {
            this.showQuestion();
        } else {
            this.showResult();
        }
    }

    setStatusClass(element, correct) {
        if (correct) {
            element.classList.add('correct');
            element.setAttribute('aria-label', 'Resposta correta');
        } else {
            element.classList.add('incorrect');
            element.setAttribute('aria-label', 'Resposta incorreta');
        }
    }

    showResult() {
        this.quizContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');
        
        const totalQuestions = this.selectedQuestions.length;
        this.scoreEl.innerText = `${this.score} / ${totalQuestions}`;
        
        const scorePercentage = (this.score / totalQuestions) * 100;
        
        // Atualizar high score se necessário
        if (scorePercentage > this.highScore) {
            this.highScore = scorePercentage;
            this.setHighScore(scorePercentage);
        }

        let message = "";
        let icon = "";

        const minCorrectForReward = questionsDatabase.config.minCorrectForReward;
        if (this.score >= minCorrectForReward) {
            icon = '🏆';
            message = `<h3>Parabéns, Embaixador(a) Sabor da Terra!</h3>
                      <p>Seu conhecimento é impressionante! Como recompensa, use o cupom 
                      <span class="visually-hidden">BITUPITA15</span>
                      <strong aria-hidden="true">BITUPITA15</strong> 
                      e ganhe 15% de desconto no seu próximo pedido!</p>`;
        } else if (this.score >= totalQuestions / 2) {
            icon = '👍';
            message = `<h3>Você conhece bem a gente!</h3>
                      <p>Mandou bem! Que tal passar na nossa loja pra comemorar com o seu açaí preferido?</p>`;
        } else {
            icon = '😉';
            message = `<h3>Valeu a tentativa!</h3>
                      <p>Agora que você sabe mais sobre nós, venha viver a experiência Sabor da Terra e se tornar um expert!</p>`;
        }
        
        this.resultIconEl.innerText = icon;
        this.resultMessageEl.innerHTML = message;
        
        // Mostrar high score
        if (this.highScoreEl) {
            this.highScoreEl.innerText = `Melhor pontuação: ${Math.round(this.highScore)}%`;
        }
    }

    // Utilitários
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    playSound(isCorrect) {
        const sound = isCorrect ? CORRECT_SOUND : INCORRECT_SOUND;
        sound.play().catch(() => {}); // Ignorar erros de reprodução (alguns navegadores bloqueiam)
    }

    getHighScore() {
        return parseFloat(localStorage.getItem(HIGH_SCORE_KEY) || 0);
    }

    setHighScore(score) {
        localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.quiz = new Quiz();
        window.quiz.start();
    } catch (error) {
        console.error('Erro ao inicializar o quiz:', error);
        document.body.innerHTML = `
            <div class="quiz-wrapper">
                <h1>Erro ao carregar o quiz</h1>
                <p>Por favor, recarregue a página ou entre em contato com o suporte.</p>
            </div>
        `;
    }
});

// Função global para reiniciar o quiz
function restartQuiz() {
    window.quiz.start();
} 
