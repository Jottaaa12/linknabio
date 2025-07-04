// Sistema de Conquistas
class AchievementManager {
    constructor() {
        this.achievements = {
            first_win: {
                id: 'first_win',
                title: 'Primeira Vitória',
                description: 'Complete seu primeiro quiz!',
                icon: '🎉',
                condition: stats => stats.totalQuizzes >= 1
            },
            perfect_score: {
                id: 'perfect_score',
                title: 'Perfeição!',
                description: 'Acerte todas as perguntas em um quiz!',
                icon: '🏆',
                condition: stats => stats.hasHadPerfectScore
            },
            speed_demon: {
                id: 'speed_demon',
                title: 'Velocista',
                description: 'Responda 5 perguntas em menos de 25 segundos!',
                icon: '⚡',
                condition: stats => stats.fastAnswers >= 5
            },
            persistent: {
                id: 'persistent',
                title: 'Persistente',
                description: 'Complete 5 quizzes!',
                icon: '💪',
                condition: stats => stats.totalQuizzes >= 5
            },
            expert: {
                id: 'expert',
                title: 'Expert em Açaí',
                description: 'Mantenha uma média de 80% de acertos em 3 quizzes seguidos!',
                icon: '🎓',
                condition: stats => stats.highScoreStreak >= 3
            }
        };

        this.stats = this.loadStats();
        this.unlockedAchievements = this.loadUnlockedAchievements();
    }

    loadStats() {
        const defaultStats = {
            totalQuizzes: 0,
            totalCorrect: 0,
            totalQuestions: 0,
            hasHadPerfectScore: false,
            fastAnswers: 0,
            highScoreStreak: 0,
            lastResults: []
        };

        const savedStats = localStorage.getItem('quizStats');
        return savedStats ? JSON.parse(savedStats) : defaultStats;
    }

    loadUnlockedAchievements() {
        const saved = localStorage.getItem('unlockedAchievements');
        return saved ? JSON.parse(saved) : [];
    }

    saveStats() {
        localStorage.setItem('quizStats', JSON.stringify(this.stats));
    }

    saveUnlockedAchievements() {
        localStorage.setItem('unlockedAchievements', JSON.stringify(this.unlockedAchievements));
    }

    updateStats(quizResults) {
        const { score, totalQuestions, fastAnswers } = quizResults;
        
        this.stats.totalQuizzes++;
        this.stats.totalCorrect += score;
        this.stats.totalQuestions += totalQuestions;
        this.stats.fastAnswers += fastAnswers;
        
        // Verificar pontuação perfeita
        if (score === totalQuestions) {
            this.stats.hasHadPerfectScore = true;
        }

        // Atualizar sequência de high scores
        const percentage = (score / totalQuestions) * 100;
        if (percentage >= 80) {
            this.stats.highScoreStreak++;
        } else {
            this.stats.highScoreStreak = 0;
        }

        // Manter histórico dos últimos resultados
        this.stats.lastResults.push({ score, totalQuestions, timestamp: Date.now() });
        if (this.stats.lastResults.length > 5) {
            this.stats.lastResults.shift();
        }

        this.saveStats();
        return this.checkNewAchievements();
    }

    checkNewAchievements() {
        const newAchievements = [];

        for (const achievement of Object.values(this.achievements)) {
            if (!this.unlockedAchievements.includes(achievement.id) &&
                achievement.condition(this.stats)) {
                newAchievements.push(achievement);
                this.unlockedAchievements.push(achievement.id);
            }
        }

        if (newAchievements.length > 0) {
            this.saveUnlockedAchievements();
        }

        return newAchievements;
    }

    showAchievementNotification(achievement) {
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

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);

        // Remover após 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showAchievementsModal() {
        const modal = document.createElement('div');
        modal.className = 'achievements-modal';
        
        const content = document.createElement('div');
        content.className = 'achievements-content';
        
        const title = document.createElement('h2');
        title.textContent = '🏆 Conquistas';
        
        const grid = document.createElement('div');
        grid.className = 'achievements-grid';

        for (const achievement of Object.values(this.achievements)) {
            const isUnlocked = this.unlockedAchievements.includes(achievement.id);
            
            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            const icon = document.createElement('div');
            icon.className = 'achievement-icon';
            icon.textContent = achievement.icon;
            
            const cardTitle = document.createElement('h3');
            cardTitle.textContent = achievement.title;
            
            const description = document.createElement('p');
            description.textContent = achievement.description;
            
            card.appendChild(icon);
            card.appendChild(cardTitle);
            card.appendChild(description);
            grid.appendChild(card);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        closeBtn.textContent = 'Fechar';
        
        content.appendChild(title);
        content.appendChild(grid);
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
}

// Inicializar gerenciador de conquistas
window.achievementManager = new AchievementManager(); 
