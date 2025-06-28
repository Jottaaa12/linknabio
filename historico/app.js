import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const PainelControleModule = {
    db: null,
    todosOsRegistros: [], // Guarda todos os registros para não precisar buscar no DB toda hora

    // Função de inicialização
    init(db) {
        if (!db) {
            console.error("Instância do Firestore não fornecida.");
            document.getElementById('statusCarregamento').textContent = "Erro crítico na inicialização.";
            return;
        }
        this.db = db;
        this.setupEventListeners();
        this.carregarRegistros();
    },

    // Configura os listeners dos filtros
    setupEventListeners() {
        document.getElementById('dataInicio').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('dataFim').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtroFuncionario').addEventListener('change', () => this.aplicarFiltros());
        // Adicionar listener para o botão de exportar CSV aqui se necessário
    },

    // Carrega os registros do Firestore
    async carregarRegistros() {
        try {
            const querySnapshot = await getDocs(collection(this.db, "registrosDiarios"));
            this.todosOsRegistros = querySnapshot.docs;
            
            // Ordena os registros de forma segura, tratando registros antigos e novos
            this.todosOsRegistros.sort((a, b) => {
                const dataA = a.data();
                const dataB = b.data();

                // Pega o timestamp em segundos se existir, senão, tenta converter a data antiga para um valor numérico
                const timeA = dataA.timestamp?.seconds || new Date(dataA.data).getTime() / 1000 || 0;
                const timeB = dataB.timestamp?.seconds || new Date(dataB.data).getTime() / 1000 || 0;

                return timeB - timeA; // Ordena do mais recente para o mais antigo
            });

            this.aplicarFiltros(); // Aplica os filtros (que inicialmente mostrarão tudo)
            document.getElementById('statusCarregamento').style.display = 'none';

        } catch (error) {
            console.error("Erro ao carregar registros: ", error);
            document.getElementById('statusCarregamento').textContent = "Falha ao carregar os registros.";
        }
    },

    // Aplica os filtros de data e funcionário
    aplicarFiltros() {
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        const funcionario = document.getElementById('filtroFuncionario').value;

        let registrosFiltrados = this.todosOsRegistros;

        // Filtra por funcionário
        if (funcionario !== "Todos") {
            registrosFiltrados = registrosFiltrados.filter(doc => doc.data().funcionario === funcionario);
        }

        // Filtra por data
        if (dataInicio) {
            const inicio = new Date(dataInicio + "T00:00:00");
            registrosFiltrados = registrosFiltrados.filter(doc => {
                const dataRegistro = doc.data().timestamp?.toDate() || new Date(doc.data().data + "T00:00:00");
                return dataRegistro >= inicio;
            });
        }
        if (dataFim) {
            const fim = new Date(dataFim + "T23:59:59");
             registrosFiltrados = registrosFiltrados.filter(doc => {
                const dataRegistro = doc.data().timestamp?.toDate() || new Date(doc.data().data + "T00:00:00");
                return dataRegistro <= fim;
            });
        }

        this.atualizarCards(registrosFiltrados);
        this.renderizarLista(registrosFiltrados);
    },

    // Atualiza os cards com os totais
    atualizarCards(registros) {
        let faturamentoBruto = 0;
        let totalSaidas = 0;

        registros.forEach(doc => {
            const data = doc.data();
            const entradas = (parseFloat(data.dinheiroEntrada) || 0) + (parseFloat(data.pixEntrada) || 0) + (parseFloat(data.cartaoEntrada) || 0);
            faturamentoBruto += entradas;
            totalSaidas += data.totalSaidas || (parseFloat(data.dinheiroSaida) || 0) + (parseFloat(data.pixSaida) || 0);
        });

        const saldoLiquido = faturamentoBruto - totalSaidas;
        const mediaDiaria = registros.length > 0 ? saldoLiquido / registros.length : 0;

        document.getElementById('faturamentoBruto').textContent = this.formatCurrency(faturamentoBruto);
        document.getElementById('totalSaidas').textContent = this.formatCurrency(totalSaidas);
        document.getElementById('saldoLiquido').textContent = this.formatCurrency(saldoLiquido);
        document.getElementById('mediaDiaria').textContent = this.formatCurrency(mediaDiaria);
    },

    // Renderiza a lista de registros na tela (MODIFICADA)
    renderizarLista(registros) {
        const listaEl = document.getElementById('listaRegistros');
        listaEl.innerHTML = ''; // Limpa a lista

        if (registros.length === 0) {
            listaEl.innerHTML = '<p>Nenhum registro encontrado para os filtros selecionados.</p>';
            return;
        }

        registros.forEach(doc => {
            const data = doc.data();
            const dataFormatada = data.timestamp ? data.timestamp.toDate().toLocaleDateString('pt-BR') : new Date(data.data + "T00:00:00").toLocaleDateString('pt-BR');
            
            const cardEl = document.createElement('div');
            cardEl.className = 'registro-card'; // Usa a nova classe para o card
            
            const entradas = (parseFloat(data.dinheiroEntrada) || 0) + (parseFloat(data.pixEntrada) || 0) + (parseFloat(data.cartaoEntrada) || 0);
            const saidas = data.totalSaidas || (parseFloat(data.dinheiroSaida) || 0) + (parseFloat(data.pixSaida) || 0);
            const saldo = entradas - saidas;

            // Estrutura HTML interna do card, mais organizada e semântica
            cardEl.innerHTML = `
                <div class="card-header">
                    <h4>${dataFormatada}</h4>
                    <p class="funcionario">${data.funcionario}</p>
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span>Entradas</span>
                        <span class="valor-positivo">${this.formatCurrency(entradas)}</span>
                    </div>
                    <div class="info-row">
                        <span>Saídas</span>
                        <span class="valor-negativo">${this.formatCurrency(saidas)}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <span>Saldo do Dia</span>
                    <strong>${this.formatCurrency(saldo)}</strong>
                </div>
            `;
            listaEl.appendChild(cardEl);
        });
    },

    // Função utilitária para formatar moeda
    formatCurrency(value) {
        return parseFloat(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
};

// --- INICIALIZAÇÃO DO FIREBASE E DO MÓDULO ---
document.addEventListener('DOMContentLoaded', async () => {
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
    const db = getFirestore(app);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuário autenticado no painel:", user.uid);
            PainelControleModule.init(db);
        }
    });

    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Falha na autenticação anônima do painel:", error);
    }
});
