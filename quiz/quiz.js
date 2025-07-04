// Configuração do Quiz
const TRANSITION_DELAY = 1000; // Tempo de transição entre perguntas em ms
const HIGH_SCORE_KEY = 'quiz_high_score';
const CORRECT_SOUND = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAABQAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMwAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAAIABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMwAAAAAAAAAAAAASW5mbwAAAA8AAAAIAAAAIABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');
const INCORRECT_SOUND = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEyLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABAAAABgAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMwAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAAIABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV');

// Função utilitária para sanitizar HTML
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Validações de dados
class DataValidator {
    static validateQuestion(question) {
        const errors = [];
        
        if (!question || typeof question !== 'object') {
            errors.push('Pergunta deve ser um objeto válido');
            return errors;
        }
        
        if (!question.question || typeof question.question !== 'string' || question.question.trim().length === 0) {
            errors.push('Pergunta deve ter um texto válido');
        }
        
        if (!Array.isArray(question.options) || question.options.length !== 4) {
            errors.push('Pergunta deve ter exatamente 4 opções');
        } else {
            question.options.forEach((option, index) => {
                if (!option || typeof option !== 'string' || option.trim().length === 0) {
                    errors.push(`Opção ${index + 1} deve ter um texto válido`);
                }
            });
        }
        
        if (typeof question.correctIndex !== 'number' || question.correctIndex < 0 || question.correctIndex >= 4) {
            errors.push('Índice correto deve ser um número entre 0 e 3');
        }
        
        if (!question.category || typeof question.category !== 'string') {
            errors.push('Pergunta deve ter uma categoria válida');
        }
        
        if (!question.difficulty || !['facil', 'medio', 'dificil'].includes(question.difficulty)) {
            errors.push('Dificuldade deve ser: facil, medio ou dificil');
        }
        
        return errors;
    }
    
    static validateQuestionsDatabase(database) {
        const errors = [];
        
        if (!database || typeof database !== 'object') {
            errors.push('Database deve ser um objeto válido');
            return errors;
        }
        
        if (!Array.isArray(database.questions) || database.questions.length === 0) {
            errors.push('Database deve ter um array de perguntas não vazio');
            return errors;
        }
        
        if (!database.config || typeof database.config !== 'object') {
            errors.push('Database deve ter configurações válidas');
            return errors;
        }
        
        // Validar cada pergunta
        database.questions.forEach((question, index) => {
            const questionErrors = this.validateQuestion(question);
            if (questionErrors.length > 0) {
                errors.push(`Pergunta ${index + 1}: ${questionErrors.join(', ')}`);
            }
        });
        
        return errors;
    }
    
    static validateUserInput(input, type) {
        switch (type) {
            case 'difficulty':
                return ['facil', 'medio', 'dificil'].includes(input);
            case 'mode':
                return ['competition', 'training'].includes(input);
            case 'score':
                return typeof input === 'number' && input >= 0 && Number.isInteger(input);
            case 'time':
                return typeof input === 'number' && input > 0 && input <= 300;
            default:
                return false;
        }
    }
    
    static sanitizeUserInput(input) {
        if (typeof input === 'string') {
            return input.trim().replace(/[<>]/g, '');
        }
        return input;
    }
}

// Classe principal do Quiz
class Quiz {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.highScore = this.getHighScore();
        this.selectedQuestions = [];
        // Timer properties
        this.timerId = null;
        this.timeLeft = 15; // 15 segundos por pergunta
        this.timerContainer = document.getElementById('timer-container');
        this.timerBar = document.getElementById('timer-bar');
        this.timerText = document.getElementById('timer-text');
        this.timerCount = document.getElementById('timer-count');
        // Achievement tracking
        this.fastAnswers = 0;
        this.achievementsButton = document.getElementById('achievements-button');
        this.achievementsButton.addEventListener('click', () => {
            window.achievementManager.showAchievementsModal();
        });
        
        // Dificuldade
        this.currentDifficulty = 'facil';
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setDifficulty(btn.dataset.difficulty));
        });
        
        // Verificar se há resultado compartilhado na URL
        this.checkSharedResult();

        // Sons
        this.sounds = {
            achievement: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbvth1KAAAAAAD/+9DEAAAKmP159PKAA0A3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA'),
            difficulty: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbUwHc6AAAAAAD/+9DEAAAKmQF79PAAA0o3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA'),
            timerWarning: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbNhxy6AAAAAAD/+9DEAAAKmQF79PAAA0o3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA')
        };

        // Configurar volume
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3;
        });

        // Ranking
        this.ranking = this.loadRanking();

        // Power-ups
        this.powerUps = this.loadPowerUps();

        // Modo de jogo
        this.mode = 'competition'; // 'competition' ou 'training'
        
        // Validar dados na inicialização
        this.validateInitialData();
    }

    validateInitialData() {
        try {
            // Validar database de perguntas
            const dbErrors = DataValidator.validateQuestionsDatabase(questionsDatabase);
            if (dbErrors.length > 0) {
                console.error('Erros na validação do database:', dbErrors);
                throw new Error('Database de perguntas inválido');
            }
            
            // Validar configurações
            if (!questionsDatabase.config.difficulties) {
                throw new Error('Configurações de dificuldade não encontradas');
            }
            
            // Validar power-ups
            this.validatePowerUpsState();
            
        } catch (error) {
            console.error('Erro na validação inicial:', error);
            this.showErrorMessage('Erro na inicialização do quiz. Recarregue a página.');
        }
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 9999;
            font-weight: 600;
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    validatePowerUpsState() {
        if (!this.powerUps || typeof this.powerUps !== 'object') {
            this.powerUps = { fiftyFifty: 1, skip: 1 };
            this.savePowerUps();
        }
        
        // Garantir que os valores são números válidos
        if (typeof this.powerUps.fiftyFifty !== 'number' || this.powerUps.fiftyFifty < 0) {
            this.powerUps.fiftyFifty = 1;
        }
        if (typeof this.powerUps.skip !== 'number' || this.powerUps.skip < 0) {
            this.powerUps.skip = 1;
        }
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
               this.resultMessageEl && this.progressBar && this.progressText &&
               this.timerContainer && this.timerBar && this.timerText && this.timerCount;
    }

    validateQuestions() {
        const isValid = questionsDatabase.questions.every(q => 
            q.options && q.options.length === 4 && 
            typeof q.correctIndex === 'number' && 
            q.correctIndex >= 0 && q.correctIndex < 4
        );
        if (!isValid) {
            throw new Error('Formato inválido nas perguntas do quiz');
        }
    }

    setDifficulty(difficulty) {
        // Validar entrada
        if (!DataValidator.validateUserInput(difficulty, 'difficulty')) {
            console.error('Dificuldade inválida:', difficulty);
            return;
        }
        
        this.currentDifficulty = difficulty;
        this.difficultyButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.difficulty === difficulty);
        });
        
        // Atualizar tempo limite com validação
        const config = questionsDatabase.config.difficulties[difficulty];
        if (config && typeof config.timeLimit === 'number') {
            this.timeLeft = config.timeLimit;
        } else {
            this.timeLeft = 15; // valor padrão
        }

        // Tocar som e adicionar animação
        this.sounds.difficulty.play();
        const btn = Array.from(this.difficultyButtons).find(b => b.dataset.difficulty === difficulty);
        if (btn) {
            btn.classList.add('pulse');
            setTimeout(() => btn.classList.remove('pulse'), 300);
        }
    }

    selectRandomQuestions() {
        const allQuestions = questionsDatabase.questions;
        const categories = [...new Set(allQuestions.map(q => q.category))];
        const selectedQuestions = [];
        
        // Garantir pelo menos uma pergunta de cada categoria
        categories.forEach(category => {
            const questionsInCategory = allQuestions.filter(q => 
                q.category === category && 
                q.difficulty === this.currentDifficulty
            );
            if (questionsInCategory.length > 0) {
                const randomIndex = Math.floor(Math.random() * questionsInCategory.length);
                selectedQuestions.push(questionsInCategory[randomIndex]);
            }
        });
        
        // Preencher o resto com perguntas aleatórias da dificuldade selecionada
        const remainingQuestions = allQuestions.filter(q => 
            !selectedQuestions.includes(q) && 
            q.difficulty === this.currentDifficulty
        );
        
        while (selectedQuestions.length < questionsDatabase.config.questionsPerQuiz && remainingQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
            selectedQuestions.push(remainingQuestions.splice(randomIndex, 1)[0]);
        }
        
        return this.shuffleArray(selectedQuestions);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    handleKeyboardNavigation(e) {
        // Navegação por teclado melhorada
        switch (e.key) {
            case 'Enter':
            case ' ':
                const focusedElement = document.activeElement;
                if (focusedElement.classList.contains('btn') || focusedElement.classList.contains('answer-btn')) {
                    focusedElement.click();
                    e.preventDefault();
                }
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                this.navigateAnswers(-1);
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                this.navigateAnswers(1);
                e.preventDefault();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                const answerIndex = parseInt(e.key) - 1;
                this.handleAnswer(answerIndex);
                e.preventDefault();
                break;
        }
    }

    navigateAnswers(direction) {
        const answerButtons = document.querySelectorAll('.answer-btn');
        const currentIndex = Array.from(answerButtons).findIndex(btn => btn === document.activeElement);
        
        if (currentIndex === -1) {
            // Se nenhum botão está focado, focar no primeiro
            if (answerButtons.length > 0) {
                answerButtons[0].focus();
            }
        } else {
            const nextIndex = (currentIndex + direction + answerButtons.length) % answerButtons.length;
            answerButtons[nextIndex].focus();
        }
    }

    start(difficulty = 'facil', mode = 'competition') {
        // Validar parâmetros
        if (!DataValidator.validateUserInput(difficulty, 'difficulty')) {
            console.error('Dificuldade inválida:', difficulty);
            return;
        }
        
        if (!DataValidator.validateUserInput(mode, 'mode')) {
            console.error('Modo inválido:', mode);
            return;
        }
        
        this.currentDifficulty = difficulty;
        this.mode = mode;

        // Limpar timers anteriores
        this.clearAllTimers();

        // Resetar estado
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.answeredQuestions = [];
        this.selectedQuestions = this.selectRandomQuestions();

        // Validar se temos perguntas suficientes
        if (!this.selectedQuestions || this.selectedQuestions.length === 0) {
            this.showErrorMessage('Não há perguntas disponíveis para esta dificuldade.');
            return;
        }

        // Atualizar UI
        this.startContainer.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
        this.resultContainer.classList.add('hidden');

        // Mostrar primeira pergunta
        this.showQuestion();

        // Tocar som
        if (window.soundManager) {
            window.soundManager.play('start');
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();
    }

    updateTimer() {
        if (!this.currentQuestion) return;
        
        const timeLimit = questionsDatabase.config.difficulties[this.currentDifficulty].time;
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, timeLimit - elapsed);
        const percentage = (remaining / timeLimit) * 100;

        // Atualizar barra de progresso
        this.timerBar.style.width = `${percentage}%`;
        
        // Mudar cor baseado no tempo restante
        if (percentage > 60) {
            this.timerBar.style.backgroundColor = 'var(--accent-color)';
        } else if (percentage > 30) {
            this.timerBar.style.backgroundColor = '#ffd700';
        } else {
            this.timerBar.style.backgroundColor = '#ff4444';
        }

        // Atualizar contador numérico
        this.timerCount.textContent = Math.ceil(remaining);

        if (this.timerTimeout) clearTimeout(this.timerTimeout);
        if (remaining > 0) {
            this.timerTimeout = setTimeout(() => this.updateTimer(), 100);
        } else {
            this.handleTimeout();
        }
    }

    handleTimeout() {
        this.stopTimer();
        // Tratar como resposta errada
        const buttons = Array.from(this.answersContainer.children);
        const correctButton = buttons.find(button => button.dataset.correct === 'true');
        
        if (correctButton) {
            this.setStatusClass(correctButton, true);
        }
        
        // Desabilitar todos os botões
        buttons.forEach(button => {
            button.disabled = true;
        });
        
        // Aguardar um pouco antes de mostrar próxima pergunta
        setTimeout(() => {
            this.currentQuestionIndex++;
            if (this.currentQuestionIndex < this.selectedQuestions.length) {
                this.showQuestion();
            } else {
                this.showResult();
            }
        }, TRANSITION_DELAY);
    }

    async showQuestion() {
        // Limpar timer anterior se existir
        this.stopTimer();
        
        const currentQuestion = this.selectedQuestions[this.currentQuestionIndex];
        this.currentQuestion = currentQuestion;
        
        // Adicionar classe para animação de fade
        this.quizContainer.classList.add('changing-question');
        setTimeout(() => {
            // Atualizar conteúdo
            this.questionEl.textContent = currentQuestion.question;
            this.answersContainer.textContent = '';
            
            // Embaralhar opções
            const options = [...currentQuestion.options];
            const correctIndex = currentQuestion.correctIndex;
            const shuffled = options.map((opt, i) => ({ opt, i })).sort(() => Math.random() - 0.5);
            
            shuffled.forEach(({ opt, i }, idx) => {
                const button = document.createElement('button');
                button.className = 'answer-btn';
                button.textContent = typeof opt === 'string' ? opt : opt.text;
                button.dataset.correct = (i === correctIndex).toString();
                button.setAttribute('aria-label', `Opção ${idx + 1}: ${typeof opt === 'string' ? opt : opt.text}`);
                button.setAttribute('role', 'button');
                button.setAttribute('tabindex', '0');
                button.onclick = () => this.handleAnswer(i);
                button.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        this.handleAnswer(i);
                        e.preventDefault();
                    }
                });
                this.answersContainer.appendChild(button);
            });
            
            // Atualizar progresso
            const progress = ((this.currentQuestionIndex + 1) / this.selectedQuestions.length) * 100;
            this.progressBar.style.width = `${progress}%`;
            this.progressBar.setAttribute('aria-valuenow', progress);
            this.progressText.textContent = `Pergunta ${this.currentQuestionIndex + 1}/${this.selectedQuestions.length}`;
            
            // Iniciar timer apenas no modo competição
            if (this.mode === 'competition') {
                this.startTimer();
            } else {
                // No modo treino, esconder timer
                this.timerContainer.classList.add('hidden');
            }
            
            // Remover classe de animação e adicionar classe de entrada
            this.quizContainer.classList.remove('changing-question');
            this.quizContainer.classList.add('question-enter');
            
            // Remover classe de entrada após a animação
            setTimeout(() => {
                this.quizContainer.classList.remove('question-enter');
            }, 300);
            
            // Focar na primeira resposta para acessibilidade
            const firstAnswer = this.answersContainer.querySelector('.answer-btn');
            if (firstAnswer) {
                setTimeout(() => firstAnswer.focus(), 100);
            }
            
            // Anunciar nova pergunta para leitores de tela
            this.announceToScreenReader(`Pergunta ${this.currentQuestionIndex + 1} de ${this.selectedQuestions.length}: ${currentQuestion.question}`);
        }, 300);

        // Resetar estado dos power-ups
        const buttons = this.answersContainer.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.style.opacity = '1';
            btn.disabled = false;
        });

        this.updatePowerUpsUI();
    }

    announceToScreenReader(message) {
        // Criar elemento temporário para anunciar mudanças
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remover após o anúncio
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
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

    handleAnswer(optionIndex) {
        if (!this.currentQuestion || this.answering) return;
        this.answering = true;
        if (this.mode === 'competition') {
            clearTimeout(this.timerTimeout);
        }
        const correct = optionIndex === this.currentQuestion.correctIndex;
        
        // Atualizar pontuação apenas no modo competição
        if (this.mode === 'competition' && correct) {
            this.score++;
        }

        // Tocar som
        window.soundManager.play(correct ? 'correct' : 'wrong');

        // Salvar resposta
        this.answeredQuestions.push({
            ...this.currentQuestion,
            timeSpent: this.mode === 'competition' ? (Date.now() - this.startTime) / 1000 : 0,
            correct,
            userAnswer: optionIndex
        });

        // Destacar resposta correta e incorreta
        const buttons = this.answersContainer.querySelectorAll('button');
        
        buttons.forEach((btn, index) => {
            btn.disabled = true;
            if (index === this.currentQuestion.correctIndex) {
                btn.classList.add('correct');
            } else if (index === optionIndex && !correct) {
                btn.classList.add('wrong');
            }
        });

        // No modo treino, mostrar explicação
        if (this.mode === 'training' && this.currentQuestion.explanation) {
            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.textContent = this.currentQuestion.explanation;
            this.answersContainer.appendChild(explanation);
        }

        // Aguardar mais tempo no modo treino para o usuário ler a explicação
        const delay = this.mode === 'training' ? 3000 : 1000;

        setTimeout(() => {
            // Remover classes de feedback
            buttons.forEach(btn => {
                btn.classList.remove('correct', 'wrong');
                btn.disabled = false;
            });

            // Remover explicação se existir
            const explanation = this.answersContainer.querySelector('.explanation');
            if (explanation) {
                explanation.remove();
            }

            // Próxima pergunta ou finalizar
            if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
                this.currentQuestionIndex++;
                this.showQuestion();
            } else {
                this.showResult();
            }

            this.answering = false;
        }, delay);
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

    checkSharedResult() {
        const params = new URLSearchParams(window.location.search);
        const sharedScore = params.get('score');
        const sharedTotal = params.get('total');
        
        if (sharedScore && sharedTotal) {
            const percentage = Math.round((parseInt(sharedScore) / parseInt(sharedTotal)) * 100);
            this.showSharedResult(parseInt(sharedScore), parseInt(sharedTotal), percentage);
        }
    }

    showSharedResult(score, total, percentage) {
        const sharedContainer = document.createElement('div');
        sharedContainer.className = 'shared-result fade-in';
        
        // Criar elementos de forma segura
        const content = document.createElement('div');
        content.className = 'shared-result-content';
        
        const title = document.createElement('h2');
        title.textContent = '🎯 Resultado Compartilhado';
        
        const scoreEl = document.createElement('p');
        scoreEl.className = 'shared-score';
        scoreEl.textContent = `${score}/${total}`;
        
        const percentageEl = document.createElement('p');
        percentageEl.className = 'shared-percentage';
        percentageEl.textContent = `${percentage}%`;
        
        const messageEl = document.createElement('p');
        messageEl.className = 'shared-message';
        messageEl.textContent = 'Será que você consegue fazer melhor?';
        
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.innerHTML = '<i class="fas fa-play"></i> Tentar Agora';
        button.addEventListener('click', () => window.quiz.start());
        
        content.appendChild(title);
        content.appendChild(scoreEl);
        content.appendChild(percentageEl);
        content.appendChild(messageEl);
        content.appendChild(button);
        
        sharedContainer.appendChild(content);
        document.getElementById('intro-screen').appendChild(sharedContainer);
    }

    generateShareLink() {
        const baseUrl = window.location.href.split('?')[0];
        const shareUrl = `${baseUrl}?score=${this.score}&total=${this.selectedQuestions.length}`;
        return shareUrl;
    }

    async shareResult() {
        const shareUrl = this.generateShareLink();
        const shareText = `🎯 Fiz ${this.score}/${this.selectedQuestions.length} pontos no Quiz do Açaí Sabor da Terra! Tente superar:`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Quiz Açaí Sabor da Terra',
                    text: shareText,
                    url: shareUrl
                });
            } catch (err) {
                this.fallbackShare(shareUrl, shareText);
            }
        } else {
            this.fallbackShare(shareUrl, shareText);
        }
    }

    fallbackShare(url, text) {
        // Criar elemento temporário para copiar o link
        const el = document.createElement('textarea');
        el.value = `${text}\n${url}`;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        
        // Mostrar mensagem de sucesso
        const notification = document.createElement('div');
        notification.className = 'share-notification';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-check';
        
        const text = document.createTextNode(' Link copiado para a área de transferência!');
        
        notification.appendChild(icon);
        notification.appendChild(text);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }

    showResult() {
        // Limpar todos os timers ativos
        this.clearAllTimers();
        
        this.quizContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');
        
        const totalQuestions = this.selectedQuestions.length;
        const weightedScore = this.calculateScore();
        const maxPossibleScore = totalQuestions * questionsDatabase.config.difficulties[this.currentDifficulty].points;
        const scorePercentage = (weightedScore / maxPossibleScore) * 100;
        
        // Adicionar ao ranking e obter posição
        const rankingPosition = window.rankingManager.addScore(
            this.score,
            totalQuestions,
            this.currentDifficulty,
            weightedScore
        );
        
        // Gerar feedback detalhado
        const feedback = this.generateDetailedFeedback();
        
        this.scoreEl.innerHTML = `
            <div class="score-details">
                <p>Acertos: ${this.score} / ${totalQuestions}</p>
                <p>Dificuldade: ${this.currentDifficulty.charAt(0).toUpperCase() + this.currentDifficulty.slice(1)}</p>
                <p>Pontuação: ${weightedScore} pontos</p>
                ${rankingPosition <= 10 ? `
                <p class="ranking-position">
                    ${rankingPosition === 1 ? '🥇 Novo recorde!' : `${rankingPosition}ª melhor pontuação!`}
                    <button class="btn btn-small" onclick="window.rankingManager.showModal()">
                        Ver Ranking
                    </button>
                </p>` : ''}
            </div>
            
            <div class="feedback-section">
                <h3>Análise do Desempenho</h3>
                <div class="feedback-stats">
                    <div class="stat">
                        <span class="stat-label">Taxa de Acerto</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${scorePercentage}%"></div>
                        </div>
                        <span class="stat-value">${scorePercentage.toFixed(1)}%</span>
                    </div>
                    
                    <div class="stat">
                        <span class="stat-label">Tempo Médio por Pergunta</span>
                        <span class="stat-value">${feedback.averageTime}s</span>
                    </div>
                </div>
                
                <div class="feedback-categories">
                    <h4>Desempenho por Categoria</h4>
                    ${feedback.categories.map(cat => `
                        <div class="category-stat">
                            <span class="category-name">${cat.name}</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${cat.percentage}%"></div>
                            </div>
                            <span class="stat-value">${cat.correct}/${cat.total}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="feedback-message">
                    <h4>Recomendações</h4>
                    <ul>
                        ${feedback.recommendations.map(rec => `
                            <li>${rec}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
        
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

        // Adicionar botão de compartilhamento
        const shareButton = document.createElement('button');
        shareButton.className = 'btn btn-share';
        
        const shareIcon = document.createElement('i');
        shareIcon.className = 'fas fa-share-alt';
        
        const shareText = document.createTextNode(' Compartilhar Resultado');
        
        shareButton.appendChild(shareIcon);
        shareButton.appendChild(shareText);
        shareButton.addEventListener('click', () => this.shareResult());
        this.resultContainer.appendChild(shareButton);

        // Verificar conquistas
        const quizResults = {
            score: this.score,
            totalQuestions: totalQuestions,
            fastAnswers: this.fastAnswers,
            difficulty: this.currentDifficulty
        };

        const newAchievements = window.achievementManager.updateStats(quizResults);
        
        // Mostrar notificações de novas conquistas
        if (newAchievements.length > 0) {
            let delay = 0;
            newAchievements.forEach(achievement => {
                setTimeout(() => {
                    this.showAchievementNotification(achievement);
                }, delay);
                delay += 1500; // Espaçar notificações
            });
        }

        // Removido código redundante de ranking, pois já está implementado acima
    }

    generateDetailedFeedback() {
        const feedback = {
            averageTime: 0,
            categories: [],
            recommendations: []
        };

        // Calcular tempo médio
        const totalTime = this.answeredQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
        feedback.averageTime = (totalTime / this.answeredQuestions.length).toFixed(1);

        // Análise por categoria
        const categories = {};
        this.answeredQuestions.forEach(q => {
            const cat = q.category || 'Geral';
            if (!categories[cat]) {
                categories[cat] = { correct: 0, total: 0 };
            }
            categories[cat].total++;
            if (q.correct) categories[cat].correct++;
        });

        feedback.categories = Object.entries(categories).map(([name, stats]) => ({
            name,
            correct: stats.correct,
            total: stats.total,
            percentage: (stats.correct / stats.total) * 100
        }));

        // Gerar recomendações
        const weakCategories = feedback.categories.filter(cat => cat.percentage < 70);
        if (weakCategories.length > 0) {
            feedback.recommendations.push(
                `Foque em estudar mais sobre ${weakCategories.map(c => c.name).join(', ')}.`
            );
        }

        if (parseFloat(feedback.averageTime) > 15) {
            feedback.recommendations.push(
                'Tente responder mais rapidamente para melhorar sua pontuação.'
            );
        }

        const scorePercentage = (this.score / this.selectedQuestions.length) * 100;
        if (scorePercentage < 60) {
            feedback.recommendations.push(
                'Considere tentar novamente em uma dificuldade menor para praticar.'
            );
        } else if (scorePercentage > 90) {
            feedback.recommendations.push(
                'Excelente! Você está pronto para tentar uma dificuldade maior.'
            );
        }

        return feedback;
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

    calculateScore() {
        const difficultyPoints = questionsDatabase.config.difficulties[this.currentDifficulty].points;
        return this.score * difficultyPoints;
    }

    showAchievementNotification(achievement) {
        // Tocar som de conquista
        this.sounds.achievement.play();

        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        
        const icon = document.createElement('div');
        icon.className = 'achievement-icon';
        icon.textContent = achievement.icon;
        
        const text = document.createElement('div');
        text.className = 'achievement-text';
        
        const title = document.createElement('h3');
        title.textContent = achievement.title;
        
        const description = document.createElement('p');
        description.textContent = achievement.description;
        
        text.appendChild(title);
        text.appendChild(description);
        notification.appendChild(icon);
        notification.appendChild(text);
        
        document.body.appendChild(notification);
        
        // Animar entrada com efeito de bounce
        requestAnimationFrame(() => {
            notification.classList.add('show', 'bounce');
            setTimeout(() => notification.classList.remove('bounce'), 1000);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        });
    }

    loadRanking() {
        const saved = localStorage.getItem('quizRanking');
        return saved ? JSON.parse(saved) : [];
    }

    saveRanking() {
        localStorage.setItem('quizRanking', JSON.stringify(this.ranking));
    }

    addToRanking(score, totalQuestions, difficulty) {
        const entry = {
            score,
            totalQuestions,
            difficulty,
            weightedScore: this.calculateScore(),
            date: new Date().toISOString(),
            id: Date.now()
        };

        this.ranking.push(entry);
        this.ranking.sort((a, b) => b.weightedScore - a.weightedScore);
        
        // Manter apenas os top 10
        if (this.ranking.length > 10) {
            this.ranking.pop();
        }

        this.saveRanking();
        return this.getRankingPosition(entry);
    }

    getRankingPosition(entry) {
        return this.ranking.findIndex(r => r.id === entry.id) + 1;
    }

    showRankingModal() {
        const modal = document.createElement('div');
        modal.className = 'ranking-modal';
        
        const content = document.createElement('div');
        content.className = 'ranking-content';
        
        const title = document.createElement('h2');
        title.textContent = '🏆 Ranking';
        
        const list = document.createElement('div');
        list.className = 'ranking-list';
        
        if (this.ranking.length === 0) {
            const noEntries = document.createElement('p');
            noEntries.className = 'no-entries';
            noEntries.textContent = 'Ainda não há pontuações registradas.';
            list.appendChild(noEntries);
        } else {
            const table = document.createElement('table');
            
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Pos.', 'Pontos', 'Dificuldade', 'Data'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            this.ranking.forEach((entry, index) => {
                const date = new Date(entry.date).toLocaleDateString('pt-BR');
                const difficulty = entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1);
                
                const row = document.createElement('tr');
                if (index === 0) row.className = 'first';
                else if (index === 1) row.className = 'second';
                else if (index === 2) row.className = 'third';
                
                [index + 1 + 'º', entry.weightedScore, difficulty, date].forEach(text => {
                    const td = document.createElement('td');
                    td.textContent = text;
                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            list.appendChild(table);
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        closeBtn.textContent = 'Fechar';
        
        content.appendChild(title);
        content.appendChild(list);
        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Animar entrada
        setTimeout(() => modal.classList.add('show'), 100);

        // Fechar modal
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }

    stopTimer() {
        if (this.timerTimeout) {
            clearTimeout(this.timerTimeout);
            this.timerTimeout = null;
        }
    }

    // Método para limpar todos os timers ativos
    clearAllTimers() {
        this.stopTimer();
        // Limpar qualquer outro timer que possa estar ativo
        if (this.startTime) {
            this.startTime = null;
        }
    }

    loadPowerUps() {
        try {
            const saved = localStorage.getItem('powerUps');
            if (!saved) {
                return { fiftyFifty: 1, skip: 1 };
            }
            
            const powerUps = JSON.parse(saved);
            
            // Validar estrutura dos power-ups
            if (!powerUps || typeof powerUps !== 'object') {
                console.warn('Estrutura de power-ups inválida, resetando...');
                return { fiftyFifty: 1, skip: 1 };
            }
            
            // Validar valores dos power-ups
            const validatedPowerUps = {
                fiftyFifty: this.validatePowerUpValue(powerUps.fiftyFifty, 'fiftyFifty'),
                skip: this.validatePowerUpValue(powerUps.skip, 'skip')
            };
            
            // Salvar versão validada
            localStorage.setItem('powerUps', JSON.stringify(validatedPowerUps));
            
            return validatedPowerUps;
        } catch (error) {
            console.error('Erro ao carregar power-ups:', error);
            return { fiftyFifty: 1, skip: 1 };
        }
    }

    validatePowerUpValue(value, powerUpName) {
        // Validar se é um número válido
        if (typeof value !== 'number' || isNaN(value)) {
            console.warn(`Valor inválido para ${powerUpName}, resetando para 1`);
            return 1;
        }
        
        // Validar limites (0 a 5)
        if (value < 0) {
            console.warn(`${powerUpName} com valor negativo, resetando para 0`);
            return 0;
        }
        
        if (value > 5) {
            console.warn(`${powerUpName} com valor muito alto, limitando para 5`);
            return 5;
        }
        
        return Math.floor(value); // Garantir que é um inteiro
    }

    savePowerUps() {
        try {
            // Validar antes de salvar
            const validatedPowerUps = {
                fiftyFifty: this.validatePowerUpValue(this.powerUps.fiftyFifty, 'fiftyFifty'),
                skip: this.validatePowerUpValue(this.powerUps.skip, 'skip')
            };
            
            localStorage.setItem('powerUps', JSON.stringify(validatedPowerUps));
            this.powerUps = validatedPowerUps;
        } catch (error) {
            console.error('Erro ao salvar power-ups:', error);
        }
    }

    useFiftyFifty() {
        // Validar estado antes de usar
        if (!this.validatePowerUpUsage('fiftyFifty')) {
            return;
        }
        
        if (this.powerUps.fiftyFifty > 0) {
            this.powerUps.fiftyFifty--;
            this.savePowerUps();
            
            // Encontrar a resposta correta e uma incorreta aleatória para manter
            const correctIndex = this.currentQuestion.correctIndex;
            const incorrectOptions = Array.from({length: 4}, (_, i) => i)
                .filter(i => i !== correctIndex);
            
            // Escolher aleatoriamente uma opção incorreta para manter
            const keepIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
            
            // Esconder as outras duas opções
            const buttons = this.answersContainer.querySelectorAll('button');
            buttons.forEach((btn, index) => {
                if (index !== correctIndex && index !== keepIncorrect) {
                    btn.style.opacity = '0.3';
                    btn.disabled = true;
                    btn.setAttribute('aria-label', btn.getAttribute('aria-label') + ' - Removida pelo 50/50');
                }
            });

            this.updatePowerUpsUI();

            // Tocar som
            if (window.soundManager) {
                window.soundManager.play('powerup');
            }
            
            // Anunciar uso do power-up
            this.announceToScreenReader('Power-up 50/50 usado. Duas opções incorretas foram removidas.');
        }
    }

    useSkip() {
        // Validar estado antes de usar
        if (!this.validatePowerUpUsage('skip')) {
            return;
        }
        
        if (this.powerUps.skip > 0) {
            this.powerUps.skip--;
            this.savePowerUps();
            
            this.updatePowerUpsUI();

            // Tocar som
            if (window.soundManager) {
                window.soundManager.play('powerup');
            }

            // Pular para próxima pergunta
            if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
                this.currentQuestionIndex++;
                this.showQuestion();
            } else {
                this.showResult();
            }
            
            // Anunciar uso do power-up
            this.announceToScreenReader('Power-up Pular usado. Passando para próxima pergunta.');
        }
    }

    validatePowerUpUsage(powerUpName) {
        // Verificar se o quiz está ativo
        if (!this.currentQuestion) {
            console.warn('Tentativa de usar power-up sem pergunta ativa');
            return false;
        }
        
        // Verificar se já respondeu
        if (this.answering) {
            console.warn('Tentativa de usar power-up após resposta');
            return false;
        }
        
        // Verificar se o power-up está disponível
        if (this.powerUps[powerUpName] <= 0) {
            console.warn(`Power-up ${powerUpName} não disponível`);
            this.showPowerUpError(`${powerUpName} não disponível`);
            return false;
        }
        
        return true;
    }

    showPowerUpError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'powerup-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            z-index: 9999;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                errorDiv.remove();
            }
        }, 3000);
    }

    updatePowerUpsUI() {
        const fiftyBtn = document.getElementById('powerup-fiftyfifty');
        const skipBtn = document.getElementById('powerup-skip');

        if (fiftyBtn) {
            fiftyBtn.textContent = `50/50 (${this.powerUps.fiftyFifty}x)`;
            fiftyBtn.disabled = this.powerUps.fiftyFifty <= 0;
            fiftyBtn.setAttribute('aria-label', 
                `Usar 50/50 - Remove duas opções incorretas. ${this.powerUps.fiftyFifty} restantes`);
        }

        if (skipBtn) {
            skipBtn.textContent = `Pular (${this.powerUps.skip}x)`;
            skipBtn.disabled = this.powerUps.skip <= 0;
            skipBtn.setAttribute('aria-label', 
                `Pular pergunta - Passa para a próxima pergunta. ${this.powerUps.skip} restantes`);
        }
    }

    // Método para resetar power-ups (útil para testes)
    resetPowerUps() {
        this.powerUps = { fiftyFifty: 1, skip: 1 };
        this.savePowerUps();
        this.updatePowerUpsUI();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.quiz = new Quiz();
        window.quiz.start();
    } catch (error) {
        console.error('Erro ao inicializar o quiz:', error);
        const errorWrapper = document.createElement('div');
        errorWrapper.className = 'quiz-wrapper';
        
        const errorTitle = document.createElement('h1');
        errorTitle.textContent = 'Erro ao carregar o quiz';
        
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Por favor, recarregue a página ou entre em contato com o suporte.';
        
        errorWrapper.appendChild(errorTitle);
        errorWrapper.appendChild(errorMessage);
        document.body.appendChild(errorWrapper);
    }
});

// Função global para reiniciar o quiz
function restartQuiz() {
    window.quiz.start();
} 
