import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// Importações atualizadas para incluir doc e updateDoc
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

    // Configura os listeners de eventos
    setupEventListeners() {
        // Filtros
        document.getElementById('dataInicio').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('dataFim').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtroFuncionario').addEventListener('change', () => this.aplicarFiltros());
        
        // Delegação de evento para os botões de editar na lista
        document.getElementById('listaRegistros').addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-editar')) {
                const recordId = event.target.dataset.id;
                this.abrirModalEdicao(recordId);
            }
        });

        // Listeners do Modal
        document.getElementById('closeModalBtn').addEventListener('click', () => this.fecharModalEdicao());
        document.getElementById('btnCancelarEdicao').addEventListener('click', () => this.fecharModalEdicao());
        document.getElementById('editModal').addEventListener('click', (event) => {
            // Fecha o modal se clicar no overlay (fundo)
            if (event.target.id === 'editModal') {
                this.fecharModalEdicao();
            }
        });
        document.getElementById('formEdicao').addEventListener('submit', (event) => {
            this.salvarAlteracoes(event);
        });
    },

    // Carrega os registros do Firestore
    async carregarRegistros() {
        try {
            const querySnapshot = await getDocs(collection(this.db, "registrosDiarios"));
            this.todosOsRegistros = querySnapshot.docs;
            
            this.todosOsRegistros.sort((a, b) => {
                const dataA = a.data();
                const dataB = b.data();
                const timeA = dataA.timestamp?.seconds || new Date(dataA.data).getTime() / 1000 || 0;
                const timeB = dataB.timestamp?.seconds || new Date(dataB.data).getTime() / 1000 || 0;
                return timeB - timeA;
            });

            this.aplicarFiltros();
            document.getElementById('statusCarregamento').style.display = 'none';

        } catch (error) {
            console.error("Erro ao carregar registros: ", error);
            document.getElementById('statusCarregamento').textContent = "Falha ao carregar os registros.";
        }
    },

    // Aplica os filtros e renderiza a lista
    aplicarFiltros() {
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        const funcionario = document.getElementById('filtroFuncionario').value;

        let registrosFiltrados = this.todosOsRegistros;

        if (funcionario !== "Todos") {
            registrosFiltrados = registrosFiltrados.filter(doc => doc.data().funcionario === funcionario);
        }

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

    // Renderiza a lista de registros na tela
    renderizarLista(registros) {
        const listaEl = document.getElementById('listaRegistros');
        listaEl.innerHTML = '';

        if (registros.length === 0) {
            listaEl.innerHTML = '<p>Nenhum registro encontrado para os filtros selecionados.</p>';
            return;
        }

        registros.forEach(doc => {
            const data = doc.data();
            const dataObj = data.timestamp ? data.timestamp.toDate() : new Date(data.data + "T00:00:00");
            const dataFormatada = dataObj.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            
            const cardEl = document.createElement('div');
            cardEl.className = 'registro-card';
            
            const entradas = (parseFloat(data.dinheiroEntrada) || 0) + (parseFloat(data.pixEntrada) || 0) + (parseFloat(data.cartaoEntrada) || 0);
            const saidas = data.totalSaidas || (parseFloat(data.dinheiroSaida) || 0) + (parseFloat(data.pixSaida) || 0);
            const saldo = entradas - saidas;

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
                    <div class="card-footer-total">
                        <span>Saldo do Dia</span>
                        <strong>${this.formatCurrency(saldo)}</strong>
                    </div>
                    <button class="btn-editar" data-id="${doc.id}">Ver Detalhes / Editar</button>
                </div>
            `;
            listaEl.appendChild(cardEl);
        });
    },

    // --- NOVAS FUNÇÕES PARA O MODAL DE EDIÇÃO ---

    abrirModalEdicao(id) {
        const registroDoc = this.todosOsRegistros.find(doc => doc.id === id);
        if (!registroDoc) {
            console.error("Registro não encontrado!");
            alert("Erro: Registro não encontrado.");
            return;
        }
        const data = registroDoc.data();
        
        // Converte data do Firestore (timestamp ou string) para o formato YYYY-MM-DD
        const dataObj = data.timestamp ? data.timestamp.toDate() : new Date(data.data + "T00:00:00");
        const dataISO = dataObj.toISOString().split('T')[0];

        // Preenche os campos do formulário
        document.getElementById('editRecordId').value = id;
        document.getElementById('editData').value = dataISO;
        document.getElementById('editFuncionario').value = data.funcionario || '';
        document.getElementById('editDinheiroEntrada').value = data.dinheiroEntrada || 0;
        document.getElementById('editPixEntrada').value = data.pixEntrada || 0;
        document.getElementById('editCartaoEntrada').value = data.cartaoEntrada || 0;
        document.getElementById('editTotalSaidas').value = data.totalSaidas || 0;

        // Exibe o modal
        document.getElementById('editModal').style.display = 'flex';
    },

    fecharModalEdicao() {
        document.getElementById('editModal').style.display = 'none';
        document.getElementById('formEdicao').reset(); // Limpa o formulário
    },

    async salvarAlteracoes(event) {
        event.preventDefault(); // Impede o recarregamento da página
        const id = document.getElementById('editRecordId').value;

        // Coleta os dados do formulário
        const dataString = document.getElementById('editData').value;
        const [year, month, day] = dataString.split('-');
        const dataUTC = new Date(Date.UTC(year, month - 1, day));

        const dadosAtualizados = {
            data: dataString, // Mantém o formato YYYY-MM-DD para consistência
            timestamp: Timestamp.fromDate(dataUTC), // Usa o timestamp para ordenação
            funcionario: document.getElementById('editFuncionario').value,
            dinheiroEntrada: parseFloat(document.getElementById('editDinheiroEntrada').value) || 0,
            pixEntrada: parseFloat(document.getElementById('editPixEntrada').value) || 0,
            cartaoEntrada: parseFloat(document.getElementById('editCartaoEntrada').value) || 0,
            totalSaidas: parseFloat(document.getElementById('editTotalSaidas').value) || 0,
        };

        try {
            const docRef = doc(this.db, "registrosDiarios", id);
            await updateDoc(docRef, dadosAtualizados);
            
            alert("Registro atualizado com sucesso!"); // Substituir por um toast/notificação melhor no futuro
            this.fecharModalEdicao();
            await this.carregarRegistros(); // Recarrega os dados para refletir a alteração

        } catch (error) {
            console.error("Erro ao atualizar o documento: ", error);
            alert("Falha ao salvar as alterações. Verifique o console para mais detalhes.");
        }
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
