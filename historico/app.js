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
                console.error('Erro ao criar registro:', error);
                this.uiManager.showToast('Erro ao criar registro: ' + (error.message || 'Erro desconhecido'), 'error');
            }
        };

        // Callback para atualização de registro
        this.uiManager.onUpdateRecord = async (recordId, formData) => {
            try {
                await this.firestoreService.updateRecord(recordId, formData);
                this.uiManager.showToast('Registro atualizado com sucesso!', 'success');
                this.uiManager.closeEditModal();
            } catch (error) {
                console.error('Erro ao atualizar registro:', error);
                this.uiManager.showToast('Erro ao atualizar registro: ' + (error.message || 'Erro desconhecido'), 'error');
            }
        };

        // Callback para exclusão de registro
        this.uiManager.onDeleteRecord = async (recordId) => {
            try {
                await this.firestoreService.deleteRecord(recordId);
                this.uiManager.showToast('Registro excluído com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao excluir registro:', error);
                this.uiManager.showToast('Erro ao excluir registro: ' + (error.message || 'Erro desconhecido'), 'error');
            }
        };

        // Callback para mudança de filtros
        this.uiManager.onFiltersChanged = () => {
            try {
                this.aplicarFiltros();
                this.uiManager.saveFilters();
            } catch (error) {
                console.error('Erro ao aplicar filtros:', error);
                this.uiManager.showToast('Erro ao aplicar filtros', 'error');
            }
        };

        // Callback para exportação CSV
        this.uiManager.exportToCSV = (registros) => {
            try {
                this.uiManager.exportToCSV(this.registrosFiltrados);
            } catch (error) {
                console.error('Erro ao exportar CSV:', error);
                this.uiManager.showToast('Erro ao exportar dados', 'error');
            }
        };

        // Callback para encontrar registro por ID
        this.uiManager.findRecordById = (id) => {
            try {
                const registro = this.todosOsRegistros.find(registro => registro.id === id);
                if (!registro) {
                    throw new Error('Registro não encontrado');
                }
                return registro;
            } catch (error) {
                console.error('Erro ao buscar registro:', error);
                this.uiManager.showToast('Erro ao buscar registro', 'error');
                return null;
            }
        };

        // Callback para entrada individual
        this.uiManager.onCreateEntradaIndividual = async (formData) => {
            try {
                await this.firestoreService.createIndividualEntry(formData);
                this.uiManager.showToast('Entrada individual registrada com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao registrar entrada:', error);
                this.uiManager.showToast('Erro ao registrar entrada: ' + (error.message || 'Erro desconhecido'), 'error');
            }
        };

        // Callback para saída individual
        this.uiManager.onCreateSaidaIndividual = async (formData) => {
            try {
                await this.firestoreService.createIndividualExit(formData);
                this.uiManager.showToast('Saída individual registrada com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao registrar saída:', error);
                this.uiManager.showToast('Erro ao registrar saída: ' + (error.message || 'Erro desconhecido'), 'error');
            }
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
        try {
            const dataInicio = document.getElementById('dataInicio').value;
            const dataFim = document.getElementById('dataFim').value;
            const funcionario = document.getElementById('filtroFuncionario').value;

            if (!this.todosOsRegistros) {
                console.warn('Nenhum registro disponível para filtrar');
                this.registrosFiltrados = [];
                return;
            }

            let registrosFiltrados = [...this.todosOsRegistros];

            // Filtro por funcionário
            if (funcionario && funcionario !== "Todos") {
                registrosFiltrados = registrosFiltrados.filter(registro => 
                    registro.funcionario === funcionario
                );
            }

            // Filtro por data de início
            if (dataInicio) {
                try {
                    const inicio = new Date(dataInicio + "T00:00:00");
                    if (isNaN(inicio.getTime())) {
                        throw new Error('Data de início inválida');
                    }
                    registrosFiltrados = registrosFiltrados.filter(registro => {
                        const dataRegistro = registro.timestamp ? 
                            new Date(registro.timestamp.seconds * 1000) : 
                            new Date(registro.data + "T00:00:00");
                        return dataRegistro >= inicio;
                    });
                } catch (error) {
                    console.error('Erro ao filtrar por data de início:', error);
                    this.uiManager.showToast('Data de início inválida', 'error');
                }
            }

            // Filtro por data de fim
            if (dataFim) {
                try {
                    const fim = new Date(dataFim + "T23:59:59");
                    if (isNaN(fim.getTime())) {
                        throw new Error('Data de fim inválida');
                    }
                    registrosFiltrados = registrosFiltrados.filter(registro => {
                        const dataRegistro = registro.timestamp ? 
                            new Date(registro.timestamp.seconds * 1000) : 
                            new Date(registro.data + "T00:00:00");
                        return dataRegistro <= fim;
                    });
                } catch (error) {
                    console.error('Erro ao filtrar por data de fim:', error);
                    this.uiManager.showToast('Data de fim inválida', 'error');
                }
            }

            // Validação de período
            if (dataInicio && dataFim) {
                const inicio = new Date(dataInicio);
                const fim = new Date(dataFim);
                if (fim < inicio) {
                    this.uiManager.showToast('A data final não pode ser menor que a data inicial', 'error');
                    return;
                }
            }

            this.registrosFiltrados = registrosFiltrados;
            this.atualizarUI();
        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            this.uiManager.showToast('Erro ao aplicar filtros', 'error');
            this.registrosFiltrados = [];
            this.atualizarUI();
        }
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
        try {
            // Limpa serviço do Firestore
            if (this.firestoreService) {
                this.firestoreService.cleanup();
                this.firestoreService = null;
            }

            // Limpa UI Manager
            if (this.uiManager) {
                this.uiManager.cleanup();
                this.uiManager = null;
            }

            // Limpa arrays de dados
            this.todosOsRegistros = [];
            this.registrosFiltrados = [];
            
            // Remove event listeners
            window.removeEventListener('beforeunload', this.cleanup);
            
            this.isInitialized = false;
            
            console.log('Recursos limpos com sucesso');
        } catch (error) {
            console.error('Erro ao limpar recursos:', error);
        }
    }
}

// Inicialização da aplicação
let app = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (app) {
            console.warn('Aplicação já inicializada, limpando recursos...');
            app.cleanup();
        }
        
        app = new PainelControleApp();
        await app.init();
        
        // Adiciona listener para limpeza ao fechar
        window.addEventListener('beforeunload', () => {
            if (app) {
                app.cleanup();
            }
        });
        
    } catch (error) {
        console.error('Erro fatal na inicialização:', error);
        document.getElementById('statusCarregamento').textContent = 'Erro crítico na inicialização. Por favor, recarregue a página.';
    }
});
