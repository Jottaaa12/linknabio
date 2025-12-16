export const Utils = {
    /**
     * Mostra uma notificação toast na tela.
     * @param {string} message A mensagem a ser exibida.
     * @param {'info'|'success'|'error'} type O tipo de notificação.
     * @param {number} duration A duração em milissegundos.
     */
    showToast(message, type = 'info', duration = 3000) {
        const colorMap = {
            success: "linear-gradient(to right, #00b09b, #96c93d)",
            error: "linear-gradient(to right, #ff5f6d, #ffc371)",
            info: "linear-gradient(to right, #4A0E68, #9370DB)"
        };

        Toastify({
            text: message,
            duration: duration,
            close: true,
            gravity: "bottom", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: colorMap[type] || colorMap.info,
                borderRadius: "8px"
            },
        }).showToast();
    },

    /**
     * Formata um valor numérico como moeda brasileira (BRL).
     * @param {number|string} value O valor a ser formatado.
     * @returns {string} O valor formatado.
     */
    formatCurrency(value) {
        return parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    /**
     * Formata uma string de data (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY).
     * @param {string} dateString A data no formato YYYY-MM-DD.
     * @returns {string} A data formatada.
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        // Adiciona o fuso horário para evitar problemas de data "um dia antes"
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
    },

    /**
     * Retorna a data de hoje no formato YYYY-MM-DD.
     * @returns {string} A data de hoje.
     */
    getTodayDateString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};
