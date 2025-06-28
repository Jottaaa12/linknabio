/**
 * Módulo para interagir com o localStorage de forma segura.
 */
export const LocalStorageModule = {
    /**
     * Salva um valor no localStorage.
     * @param {string} key A chave para o item.
     * @param {any} value O valor a ser salvo (será convertido para JSON).
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error("Erro ao salvar no localStorage:", error);
        }
    },

    /**
     * Obtém um valor do localStorage.
     * @param {string} key A chave do item.
     * @returns {any|null} O valor parseado ou null se não existir ou houver erro.
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error("Erro ao carregar do localStorage:", error);
            // Limpa a chave corrompida para evitar erros futuros
            localStorage.removeItem(key);
            return null;
        }
    },

    /**
     * Remove um item do localStorage.
     * @param {string} key A chave do item a ser removido.
     */
    remove(key) {
        localStorage.removeItem(key);
    }
};
