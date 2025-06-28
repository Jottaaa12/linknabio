import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { FirestoreService } from "./services/firestoreService.js";
import { UIManager } from "./ui/uiManager.js";

// Constantes da aplicação
const CONSTANTS = {
    COLLECTION_NAME: 'registrosDiarios',
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCyzA-QWhXZTUahk13tKhMEAt8AqLpCzDc",
        authDomain: "acai-sabordaterra-fiados.firebaseapp.com",
        projectId: "acai-sabordaterra-fiados",
        storageBucket: "acai-sabordaterra-fiados.appspot.com",
        messagingSenderId: "95507357232",
        appId: "1:95507357232:web:22d0264b98bd5ab0ff57f5"
    }
};

class PainelControleApp {
    constructor() {
        this.firestoreService = null;
        this.uiManager = null;
        this.todosOsRegistros = [];
        this.registrosFiltrados = [];
        this.isInitialized = false;
    }

    async init() {
        try {
            // Inicializa Firebase
            const app = initializeApp(CONSTANTS.FIREBASE_CONFIG);
            const auth = getAuth(app);
            const db = getFirestore(app);

            // Inicializa serviços
            this.firestoreService = new FirestoreService(db);
            this.uiManager = new UIManager();

            // Configura callbacks do UIManager
            this.setupUIManagerCallbacks();

            // Carrega filtros salvos
            this.uiManager.loadFilters();

            // Configura listener em tempo real
            this.setupRealtimeListener();

            // Configura autenticação
            await this.setupAuthentication(auth);

            this.isInitialized = true;
            console.log("Painel de Controle inicializado com sucesso");

        } catch (error) {
            console.error("Erro na inicialização:", error);
            document.getElementById('statusCarregamento').textContent = "Erro crítico na inicialização.";
        }
    }

    setupUIManagerCallbacks() {
        // Callback para criação de registro
        this.uiManager.onCreateRecord = async (formData) => {
            try {
                await this.firestoreService.createRecord(formData);
                this.uiManager.showToast('Registro criado com sucesso!', 'success');
                this.uiManager.closeEditModal();
            } catch (error) {
                throw error;
            }
        };

        // Callback para atualização de registro
        this.uiManager.onUpdateRecord = async (recordId, formData) => {
            try {
                await this.firestoreService.updateRecord(recordId, formData);
                this.uiManager.showToast('Registro atualizado com sucesso!', 'success');
                this.uiManager.closeEditModal();
            } catch (error) {
                throw error;
            }
        };

        // Callback para exclusão de registro
        this.uiManager.onDeleteRecord = async (recordId) => {
            try {
                await this.firestoreService.deleteRecord(recordId);
                this.uiManager.showToast('Registro excluído com sucesso!', 'success');
            } catch (error) {
                throw error;
            }
        };

        // Callback para mudança de filtros
        this.uiManager.onFiltersChanged = () => {
            this.aplicarFiltros();
            this.uiManager.saveFilters();
        };

        // Callback para exportação CSV
        this.uiManager.exportToCSV = (registros) => {
            this.uiManager.exportToCSV(this.registrosFiltrados);
        };

        // Callback para encontrar registro por ID
        this.uiManager.findRecordById = (id) => {
            return this.todosOsRegistros.find(registro => registro.id === id);
        };
    }

    setupRealtimeListener() {
        this.firestoreService.setupRealtimeListener((registros, error) => {
            if (error) {
                console.error("Erro no listener:", error);
                this.uiManager.showToast('Erro ao carregar dados', 'error');
                return;
            }

            this.todosOsRegistros = registros;
            this.aplicarFiltros();
            
            // Esconde o status de carregamento
            document.getElementById('statusCarregamento').style.display = 'none';
        });
    }

    async setupAuthentication(auth) {
        return new Promise((resolve, reject) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    console.log("Usuário autenticado:", user.uid);
                    resolve();
                } else {
                    try {
                        await signInAnonymously(auth);
                        resolve();
                    } catch (error) {
                        console.error("Falha na autenticação:", error);
                        reject(error);
                    }
                }
            });
        });
    }

    aplicarFiltros() {
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        const funcionario = document.getElementById('filtroFuncionario').value;

        let registrosFiltrados = [...this.todosOsRegistros];

        // Filtro por funcionário
        if (funcionario !== "Todos") {
            registrosFiltrados = registrosFiltrados.filter(registro => 
                registro.funcionario === funcionario
            );
        }

        // Filtro por data de início
        if (dataInicio) {
            const inicio = new Date(dataInicio + "T00:00:00");
            registrosFiltrados = registrosFiltrados.filter(registro => {
                const dataRegistro = registro.timestamp ? 
                    new Date(registro.timestamp.seconds * 1000) : 
                    new Date(registro.data + "T00:00:00");
                return dataRegistro >= inicio;
            });
        }

        // Filtro por data de fim
        if (dataFim) {
            const fim = new Date(dataFim + "T23:59:59");
            registrosFiltrados = registrosFiltrados.filter(registro => {
                const dataRegistro = registro.timestamp ? 
                    new Date(registro.timestamp.seconds * 1000) : 
                    new Date(registro.data + "T00:00:00");
                return dataRegistro <= fim;
            });
        }

        this.registrosFiltrados = registrosFiltrados;
        this.atualizarUI();
    }

    atualizarUI() {
        // Atualiza cards de métricas
        this.uiManager.updateMetricsCards(this.registrosFiltrados);
        
        // Renderiza lista de registros
        this.uiManager.renderRegistrosList(this.registrosFiltrados);
        
        // Renderiza gráficos
        this.uiManager.renderCharts(this.registrosFiltrados);
    }

    cleanup() {
        if (this.firestoreService) {
            this.firestoreService.cleanup();
        }
        if (this.uiManager) {
            this.uiManager.cleanup();
        }
    }
}

// Inicialização da aplicação
let app = null;

document.addEventListener('DOMContentLoaded', async () => {
    app = new PainelControleApp();
    await app.init();
});

// Cleanup quando a página for fechada
window.addEventListener('beforeunload', () => {
    if (app) {
        app.cleanup();
    }
});
