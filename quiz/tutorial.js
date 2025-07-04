class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                target: '.difficulty-selector',
                title: 'Escolha a Dificuldade',
                content: 'Selecione entre Fácil, Médio ou Difícil. Cada nível tem um tempo diferente para resposta e pontuação.',
                position: 'bottom'
            },
            {
                target: '.timer-container',
                title: 'Timer',
                content: 'Fique de olho no tempo! A barra mostra quanto tempo resta para responder.',
                position: 'bottom'
            },
            {
                target: '.powerups-container',
                title: 'Power-ups',
                content: 'Use 50/50 para eliminar duas opções erradas, ou Pular para ir à próxima pergunta.',
                position: 'bottom'
            },
            {
                target: '#theme-toggle',
                title: 'Tema',
                content: 'Alterne entre tema claro e escuro para melhor conforto visual.',
                position: 'left'
            },
            {
                target: '#sound-toggle',
                title: 'Som',
                content: 'Ative ou desative os efeitos sonoros do quiz.',
                position: 'left'
            }
        ];
    }

    start() {
        // Se já completou o tutorial, não mostrar
        if (localStorage.getItem('tutorialCompleted')) return;

        // Criar elementos do tutorial
        this.createElements();
        
        // Mostrar primeiro passo
        this.showStep(0);

        // Tocar som
        if (window.soundManager) {
            window.soundManager.play('achievement');
        }
    }

    createElements() {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'tutorial-overlay';
        document.body.appendChild(this.overlay);

        // Tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tutorial-tooltip';
        document.body.appendChild(this.tooltip);

        // Botões de navegação
        this.navigation = document.createElement('div');
        this.navigation.className = 'tutorial-navigation';
        this.tooltip.appendChild(this.navigation);
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];
        const target = document.querySelector(step.target);
        
        if (!target) {
            this.showStep(index + 1);
            return;
        }

        // Posicionar tooltip
        const targetRect = target.getBoundingClientRect();
        const tooltipHeight = 150; // altura estimada
        const tooltipWidth = 300; // largura estimada
        
        let top, left;
        
        switch (step.position) {
            case 'bottom':
                top = targetRect.bottom + 10;
                left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
                break;
            case 'top':
                top = targetRect.top - tooltipHeight - 10;
                left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
                left = targetRect.left - tooltipWidth - 10;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
                left = targetRect.right + 10;
                break;
        }

        // Manter tooltip dentro da janela
        top = Math.max(10, Math.min(window.innerHeight - tooltipHeight - 10, top));
        left = Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, left));

        // Atualizar conteúdo
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        
        // Limpar conteúdo anterior
        this.tooltip.textContent = '';
        
        // Criar elementos de forma segura
        const title = document.createElement('h3');
        title.textContent = step.title;
        
        const content = document.createElement('p');
        content.textContent = step.content;
        
        const navigation = document.createElement('div');
        navigation.className = 'tutorial-navigation';
        
        if (index > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn-prev';
            prevBtn.textContent = 'Anterior';
            navigation.appendChild(prevBtn);
        }
        
        const nextBtnElement = document.createElement('button');
        nextBtnElement.className = index < this.steps.length - 1 ? 'btn-next' : 'btn-finish';
        nextBtnElement.textContent = index < this.steps.length - 1 ? 'Próximo' : 'Finalizar';
        navigation.appendChild(nextBtnElement);
        
        const skipBtnElement = document.createElement('button');
        skipBtnElement.className = 'btn-skip';
        skipBtnElement.textContent = 'Pular Tutorial';
        navigation.appendChild(skipBtnElement);
        
        this.tooltip.appendChild(title);
        this.tooltip.appendChild(content);
        this.tooltip.appendChild(navigation);

        // Destacar elemento atual
        target.classList.add('tutorial-highlight');
        
        // Event listeners
        const prevBtn = this.tooltip.querySelector('.btn-prev');
        const nextBtnQuery = this.tooltip.querySelector('.btn-next') || this.tooltip.querySelector('.btn-finish');
        const skipBtnQuery = this.tooltip.querySelector('.btn-skip');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                target.classList.remove('tutorial-highlight');
                this.showStep(index - 1);
            });
        }

        if (nextBtnQuery) {
            nextBtnQuery.addEventListener('click', () => {
                target.classList.remove('tutorial-highlight');
                this.showStep(index + 1);
            });
        }

        if (skipBtnQuery) {
            skipBtnQuery.addEventListener('click', () => this.complete());
        }
    }

    complete() {
        // Remover highlight de qualquer elemento
        const highlighted = document.querySelector('.tutorial-highlight');
        if (highlighted) {
            highlighted.classList.remove('tutorial-highlight');
        }

        // Animar saída
        this.overlay.classList.add('fade-out');
        this.tooltip.classList.add('fade-out');

        // Remover após animação
        setTimeout(() => {
            this.overlay.remove();
            this.tooltip.remove();
        }, 300);

        // Marcar como completo
        localStorage.setItem('tutorialCompleted', 'true');
    }
}

// Inicializar tutorial quando a página carregar
window.addEventListener('load', () => {
    window.tutorial = new Tutorial();
    window.tutorial.start();
}); 
