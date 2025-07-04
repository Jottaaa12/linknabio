class UIManager {
    static createModal(title, contentElement) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        const modalTitle = document.createElement('h2');
        modalTitle.textContent = title;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => modal.remove();

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(contentElement);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }
}

window.UIManager = UIManager; 
