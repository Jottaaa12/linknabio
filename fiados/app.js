import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { FirestoreService } from "./services/firestoreService.js";
import { UIManager } from "./ui/uiManager.js";

class FiadosApp {
    constructor() {
        this.db = null;
        this.firestoreService = null;
        this.uiManager = null;
        this.allFiados = [];
        this.filteredFiados = [];
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            await this.initializeFirebase();
        } catch (error) {
            console.error("Erro na inicialização:", error);
            this.showError("Falha na inicialização do sistema");
        }
    }

    async initializeFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyCyzA-QWhXZTUahk13tKhMEAt8AqLpCzDc",
            authDomain: "acai-sabordaterra-fiados.firebaseapp.com",
            projectId: "acai-sabordaterra-fiados",
            storageBucket: "acai-sabordaterra-fiados.appspot.com",
            messagingSenderId: "95507357232",
            appId: "1:95507357232:web:22d0264b98bd5ab0ff57f5"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        this.db = getFirestore(app);

        // Aguarda autenticação anônima
        return new Promise((resolve, reject) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    try {
                        await this.setupServices();
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }
            });

            // Inicia autenticação anônima
            signInAnonymously(auth).catch(reject);
        });
    }

    async setupServices() {
        // Inicializa serviços
        this.firestoreService = new FirestoreService(this.db);
        this.uiManager = new UIManager();

        // Configura callbacks do UIManager
        this.uiManager.onCreateFiado = (data) => this.handleCreateFiado(data);
        this.uiManager.onUpdateFiado = (id, data) => this.handleUpdateFiado(id, data);
        this.uiManager.onDeleteFiado = (id) => this.handleDeleteFiado(id);
        this.uiManager.onFiltersChanged = () => this.handleFiltersChanged();
        this.uiManager.findFiadoById = (id) => this.findFiadoById(id);

        // Carrega filtros salvos
        this.uiManager.loadFilters();

        // Configura listener em tempo real
        this.setupRealtimeListener();

        this.isInitialized = true;
        this.showToast('Sistema carregado com sucesso!', 'success');
    }

    setupRealtimeListener() {
        this.firestoreService.setupRealtimeListener((fiados, error) => {
            if (error) {
                console.error("Erro no listener:", error);
                this.showToast('Erro ao carregar dados', 'error');
                return;
            }

            this.allFiados = fiados;
            this.applyFilters();
            this.updateUI();
        });
    }

    // Handlers de CRUD
    async handleCreateFiado(data) {
        try {
            await this.firestoreService.createFiado(data);
            this.uiManager.showToast('Fiado criado com sucesso!', 'success');
            this.uiManager.closeEditModal();
        } catch (error) {
            throw error;
        }
    }

    async handleUpdateFiado(id, data) {
        try {
            await this.firestoreService.updateFiado(id, data);
            this.uiManager.showToast('Fiado atualizado com sucesso!', 'success');
            this.uiManager.closeEditModal();
        } catch (error) {
            throw error;
        }
    }

    async handleDeleteFiado(id) {
        try {
            await this.firestoreService.deleteFiado(id);
            this.uiManager.showToast('Fiado excluído com sucesso!', 'success');
        } catch (error) {
            throw error;
        }
    }

    // Filtros
    handleFiltersChanged() {
        this.applyFilters();
        this.updateUI();
        this.uiManager.saveFilters();
    }

    applyFilters() {
        let filtered = [...this.allFiados];

        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        const status = document.getElementById('filtroStatus').value;
        const cliente = document.getElementById('filtroCliente').value.toLowerCase();

        // Filtro por data
        if (dataInicio) {
            filtered = filtered.filter(fiado => fiado.data >= dataInicio);
        }
        if (dataFim) {
            filtered = filtered.filter(fiado => fiado.data <= dataFim);
        }

        // Filtro por status
        if (status && status !== 'Todos') {
            filtered = filtered.filter(fiado => fiado.status === status);
        }

        // Filtro por cliente
        if (cliente) {
            filtered = filtered.filter(fiado => 
                fiado.cliente.toLowerCase().includes(cliente)
            );
        }

        this.filteredFiados = filtered;
    }

    // Atualização da UI
    updateUI() {
        // Atualiza status de carregamento
        const statusEl = document.getElementById('statusCarregamento');
        if (statusEl) {
            statusEl.style.display = 'none';
        }

        // Atualiza métricas
        this.uiManager.updateMetricsCards(this.allFiados);

        // Renderiza lista filtrada
        this.uiManager.renderFiadosList(this.filteredFiados);
    }

    // Funções auxiliares
    findFiadoById(id) {
        return this.allFiados.find(fiado => fiado.id === id);
    }

    showToast(message, type = 'success') {
        if (this.uiManager) {
            this.uiManager.showToast(message, type);
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    // Cleanup ao sair da página
    cleanup() {
        if (this.firestoreService) {
            this.firestoreService.cleanup();
        }
    }
}

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const app = new FiadosApp();
    
    // Cleanup ao sair da página
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });
});