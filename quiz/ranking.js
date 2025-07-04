class RankingManager {
    constructor() {
        this.ranking = this.loadRanking();
    }

    loadRanking() {
        const saved = localStorage.getItem('quizRanking');
        return saved ? JSON.parse(saved) : [];
    }

    saveRanking() {
        localStorage.setItem('quizRanking', JSON.stringify(this.ranking));
    }

    addScore(score, totalQuestions, difficulty, weightedScore) {
        const entry = {
            score,
            totalQuestions,
            difficulty,
            weightedScore,
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

    showModal() {
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
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                
                const row = document.createElement('tr');
                if (index === 0) row.className = 'first';
                else if (index === 1) row.className = 'second';
                else if (index === 2) row.className = 'third';
                
                [medal + ' ' + (index + 1) + 'º', entry.weightedScore, difficulty, date].forEach(text => {
                    const td = document.createElement('td');
                    td.textContent = text;
                    row.appendChild(td);
                });
                
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            list.appendChild(table);
        }
        
        content.appendChild(title);
        content.appendChild(list);

        UIManager.createModal('🏆 Ranking', content);

        // Tocar som
        if (window.soundManager) {
            window.soundManager.play('achievement');
        }
    }
}

// Inicializar gerenciador de ranking
window.rankingManager = new RankingManager(); 
