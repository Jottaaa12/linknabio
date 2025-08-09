import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import { Utils } from './utils.js';
import { LocalStorageModule } from './storage.js';

export const RegistroDiarioModule = {
    // --- PROPRIEDADES ---
    RASCUNHO_KEY: 'registroDiarioRascunho_AcaiSaborDaTerra_v2',
    MOTIVOS_KEY: 'motivosSaidaSalvos_AcaiSaborDaTerra_v1',
    form: null,
    dadosParaEnvio: {},
    arquivoComprovante: null,
    db: null,
    storage: null,
    currentRegistroId: null,

    // --- INICIALIZAÇÃO ---
    init(db, storage) {
        this.db = db;
        this.storage = storage;
        this.form = document.getElementById('registroForm');
        this.setupEventListeners();
        this.loadDraft();
        document.getElementById('data').value = Utils.getTodayDateString();
        this.showHideFidelidade();
        this.updateMoodOptionsStyle();
        this.loadSavedMotivos(); // Carrega motivos para autocomplete
        this.addSaidaItem(); // Adiciona o primeiro item de saída
    },

    // --- EVENT LISTENERS ---
    setupEventListeners() {
        // Função auxiliar para adicionar listeners de forma segura
        const addSafeListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Elemento com id '${id}' não encontrado para adicionar listener.`);
            }
        };

        if (this.form) {
            this.form.addEventListener('input', () => this.saveDraft());
        }

        document.querySelectorAll('input[name="fidelidade"]').forEach(radio => radio.addEventListener('change', () => this.showHideFidelidade()));
        document.querySelectorAll('.mood-option input').forEach(radio => radio.addEventListener('change', () => this.updateMoodOptionsStyle()));
        
        addSafeListener('btnAdicionarSaida', 'click', () => this.addSaidaItem());
        addSafeListener('btnRevisar', 'click', () => this.review());
        addSafeListener('btnEditar', 'click', () => this.edit());
        addSafeListener('btnConfirmar', 'click', () => this.confirmAndSave());
        addSafeListener('btnEnviarWhatsApp', 'click', () => this.sendToWhatsApp());
        addSafeListener('btnNovoRegistro', 'click', () => this.reset());
        
        addSafeListener('realDinheiro', 'input', () => this.updateAjuste());
        addSafeListener('realPix', 'input', () => this.updateAjuste());
        
        addSafeListener('btnVerLogs', 'click', () => this.showLogsModal());
        addSafeListener('closeLogsModal', 'click', () => this.hideLogsModal());
    },

    // --- MANIPULAÇÃO DO FORMULÁRIO ---
    getFormValues() {
        const formValues = {};
        new FormData(this.form).forEach((value, key) => { formValues[key] = value; });
        
        const ids = ['funcionario', 'data', 'dinheiroEntrada', 'pixEntrada', 'cartaoEntrada', 'fidelidadeQuantidade', 'observacoesDia'];
        ids.forEach(id => formValues[id] = document.getElementById(id).value);
        formValues.fraseMotivacionalArea = document.getElementById('fraseMotivacionalArea').innerText;

        // Captura saídas detalhadas
        const saidas = [];
        document.querySelectorAll('.saida-item').forEach(item => {
            const valor = parseFloat(item.querySelector('.saida-valor').value) || 0;
            const motivo = item.querySelector('.saida-motivo').value.trim();
            const metodo = item.querySelector('input[name^="metodo_"]:checked').value || 'dinheiro';
            if (valor > 0 && motivo) {
                saidas.push({ valor, motivo, metodo });
            }
        });
        formValues.saidasDetalhadas = saidas;
        formValues.totalSaidas = saidas.reduce((sum, s) => sum + s.valor, 0);

        this.arquivoComprovante = document.getElementById('comprovante').files[0] || null;
        
        return formValues;
    },

    validateForm() {
        const values = this.getFormValues();
        const totalEntradas = (parseFloat(values.dinheiroEntrada) || 0) + (parseFloat(values.pixEntrada) || 0) + (parseFloat(values.cartaoEntrada) || 0);
        
        if (!values.funcionario || !values.data) {
            Utils.showToast("Preencha Funcionário e Data.", "error");
            return false;
        }
        if (totalEntradas <= 0) {
            Utils.showToast("Pelo menos uma entrada deve ser maior que zero.", "error");
            return false;
        }
        if (!values.climaLoja) {
            Utils.showToast("Selecione o 'Termômetro da Loja'.", "error");
            return false;
        }
        if (values.fidelidade === 'sim' && (!values.fidelidadeQuantidade || parseInt(values.fidelidadeQuantidade) <= 0)) {
            Utils.showToast("Informe a quantidade de cartões fidelidade.", "error");
            return false;
        }
        return true;
    },

    // --- RASCUNHO (DRAFT) ---
    saveDraft() {
        LocalStorageModule.set(this.RASCUNHO_KEY, this.getFormValues());
    },

    loadDraft() {
        const draft = LocalStorageModule.get(this.RASCUNHO_KEY);
        if (!draft) return;

        Object.keys(draft).forEach(key => {
            const element = document.getElementById(key) || this.form.querySelector(`[name="${key}"][value="${draft[key]}"]`);
            if (element) {
                if (element.type === 'radio') {
                    element.checked = true;
                } else if (key === 'fraseMotivacionalArea') {
                    element.innerText = draft[key];
                } else if (key !== 'saidasDetalhadas') {
                    element.value = draft[key];
                }
            }
        });
        
        if (draft.saidasDetalhadas && draft.saidasDetalhadas.length > 0) {
            document.getElementById('saidasList').innerHTML = ''; // Limpa antes de carregar
            draft.saidasDetalhadas.forEach(saida => this.addSaidaItem(saida));
        } else {
            document.getElementById('saidasList').innerHTML = '';
            this.addSaidaItem(); // Garante que sempre haja um item de saída
        }
        this.updateTotalSaidas();
    },

    clearDraft() {
        LocalStorageModule.remove(this.RASCUNHO_KEY);
    },
    
    // --- LÓGICA DE UI ---
    loadSavedMotivos() {
        const motivos = LocalStorageModule.get(this.MOTIVOS_KEY) || [];
        const datalist = document.getElementById('motivosList');
        // Limpa opções antigas, exceto as que podem estar fixas no HTML
        datalist.innerHTML = ''; 
        motivos.forEach(motivo => {
            const option = document.createElement('option');
            option.value = motivo;
            datalist.appendChild(option);
        });
    },
    showHideFidelidade() {
        document.getElementById('fidelidadeDetalhes').classList.toggle('fidelidade-visivel', document.getElementById('fidelidadeSim').checked);
    },

    updateMoodOptionsStyle() {
        document.querySelectorAll('.mood-option').forEach(label => {
            label.classList.toggle('selected', label.querySelector('input').checked);
        });
    },

    addSaidaItem(saida = { valor: '', motivo: '', metodo: 'dinheiro' }) {
        const container = document.getElementById('saidasList');
        const div = document.createElement('div');
        div.className = 'saida-item saida-item-mobile-fix';
        const saidaId = `saida_${Date.now()}_${Math.random()}`; // ID único para o grupo de rádio
        div.innerHTML = `
            <input type="number" class="saida-valor" placeholder="Valor" step="0.01" min="0" value="${saida.valor}">
            <input type="text" class="saida-motivo" placeholder="Motivo" list="motivosList" value="${saida.motivo}">
            <div class="saida-metodo">
                <input type="radio" id="dinheiro_${saidaId}" name="metodo_${saidaId}" value="dinheiro" ${saida.metodo === 'dinheiro' ? 'checked' : ''}>
                <label for="dinheiro_${saidaId}">Dinheiro</label>
                <input type="radio" id="pix_${saidaId}" name="metodo_${saidaId}" value="pix" ${saida.metodo === 'pix' ? 'checked' : ''}>
                <label for="pix_${saidaId}">PIX</label>
            </div>
            <button type="button" class="btn btn-secondary btn-remover-saida">–</button>
        `;
        container.appendChild(div);

        div.querySelector('.btn-remover-saida').addEventListener('click', () => {
            div.remove();
            this.updateTotalSaidas();
            this.saveDraft();
        });
        
        div.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateTotalSaidas(); // Recalcula totais e salva o rascunho
            });
        });
    },

    updateTotalSaidas() {
        const valores = Array.from(document.querySelectorAll('.saida-valor')).map(el => parseFloat(el.value) || 0);
        const total = valores.reduce((sum, v) => sum + v, 0);
        document.getElementById('totalSaidas').textContent = Utils.formatCurrency(total);
        this.saveDraft();
    },

    // --- FLUXO PRINCIPAL (REVISÃO, SALVAMENTO) ---
    review() {
        if (!this.validateForm()) return;
        
        this.dadosParaEnvio = this.getFormValues();
        document.getElementById('resumo').innerHTML = this.generateSummaryHTML(this.dadosParaEnvio);
        
        const { saldoDinheiro, saldoPix } = this.calculateTotals(this.dadosParaEnvio);
        document.getElementById('sistemaDinheiro').textContent = Utils.formatCurrency(saldoDinheiro);
        document.getElementById('sistemaPix').textContent = Utils.formatCurrency(saldoPix);
        
        document.getElementById('realDinheiro').value = '';
        document.getElementById('realPix').value = '';
        document.getElementById('motivoAjuste').value = '';
        this.updateAjuste();

        document.getElementById('registroForm').classList.add('hidden');
        document.getElementById('confirmacao').classList.remove('hidden');
    },

    edit() {
        document.getElementById('registroForm').classList.remove('hidden');
        document.getElementById('confirmacao').classList.add('hidden');
    },

    async confirmAndSave() {
        if (!this.db || !this.storage) {
            Utils.showToast("Erro: Conexão com banco de dados não estabelecida.", "error");
            return;
        }
        const btn = document.getElementById('btnConfirmar');
        btn.disabled = true;
        btn.textContent = 'Salvando...';

        const { saldoDinheiro, saldoPix } = this.calculateTotals(this.dadosParaEnvio);
        const realDinheiro = parseFloat(document.getElementById('realDinheiro').value);
        const realPix = parseFloat(document.getElementById('realPix').value);

        const registroParaSalvar = {
            ...this.dadosParaEnvio,
            timestamp: serverTimestamp(),
            ajuste: {
                sistemaDinheiro: saldoDinheiro,
                realDinheiro: isNaN(realDinheiro) ? saldoDinheiro : realDinheiro,
                diferencaDinheiro: isNaN(realDinheiro) ? 0 : realDinheiro - saldoDinheiro,
                sistemaPix: saldoPix,
                realPix: isNaN(realPix) ? saldoPix : realPix,
                diferencaPix: isNaN(realPix) ? 0 : realPix - saldoPix,
                motivo: document.getElementById('motivoAjuste').value || ''
            },
            comprovanteURL: ''
        };
        // Remove dados que não precisam ir para o DB
        delete registroParaSalvar.saidasDetalhadas; 

        try {
            // 1. Upload do comprovante (se houver)
            if (this.arquivoComprovante) {
                Utils.showToast("Enviando comprovante...", "info");
                const storageRef = ref(this.storage, `comprovantes/${Date.now()}_${this.arquivoComprovante.name}`);
                await uploadBytes(storageRef, this.arquivoComprovante);
                registroParaSalvar.comprovanteURL = await getDownloadURL(storageRef);
            }

            // 2. Salvar registro principal
            const docRef = await addDoc(collection(this.db, "registrosDiarios"), registroParaSalvar);
            this.currentRegistroId = docRef.id;

            // 3. Salvar log de auditoria
            await addDoc(collection(this.db, "logsEdicoes"), {
                registroId: docRef.id,
                data: serverTimestamp(),
                dados: registroParaSalvar,
                acao: 'CRIACAO'
            });

            // 4. Salvar novos motivos de saída para autocomplete futuro
            this.saveNewMotivos(this.dadosParaEnvio.saidasDetalhadas);
            
            this.dadosParaEnvio.ajuste = registroParaSalvar.ajuste;
            this.clearDraft();
            document.getElementById('confirmacao').classList.add('hidden');
            document.getElementById('envio').classList.remove('hidden');
            document.getElementById('btnVerLogs').classList.remove('hidden'); // Mostra o botão de logs
            Utils.showToast("Registro salvo online com sucesso!", 'success');

        } catch (e) {
            console.error("Erro ao salvar documento: ", e);
            Utils.showToast("Falha ao salvar o registro online.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Confirmar e Salvar Online';
        }
    },

    reset() {
        this.form.reset();
        document.getElementById('fraseMotivacionalArea').innerText = '';
        document.getElementById('saidasList').innerHTML = '';
        this.addSaidaItem();
        document.getElementById('data').value = Utils.getTodayDateString();
        this.saveDraft();
        this.showHideFidelidade();
        this.updateMoodOptionsStyle();
        document.getElementById('envio').classList.add('hidden');
        document.getElementById('registroForm').classList.remove('hidden');
        document.getElementById('btnVerLogs').classList.add('hidden');
        this.currentRegistroId = null;
        this.arquivoComprovante = null;
    },
    
    // --- CÁLCULOS E GERAÇÃO DE TEXTO ---
    calculateTotals(data) {
        const dinheiroEntrada = parseFloat(data.dinheiroEntrada) || 0;
        const pixEntrada = parseFloat(data.pixEntrada) || 0;
        const cartaoEntrada = parseFloat(data.cartaoEntrada) || 0;
        
        const totalEntradas = dinheiroEntrada + pixEntrada + cartaoEntrada;
        const totalSaidas = data.totalSaidas || 0;
        const totalGeral = totalEntradas - totalSaidas;
        
        const saidasDinheiro = data.saidasDetalhadas?.filter(s => s.metodo === 'dinheiro').reduce((acc, s) => acc + s.valor, 0) || 0;
        const saidasPix = data.saidasDetalhadas?.filter(s => s.metodo === 'pix').reduce((acc, s) => acc + s.valor, 0) || 0;

        const saldoDinheiro = dinheiroEntrada - saidasDinheiro;
        const saldoPix = pixEntrada - saidasPix;

        return { totalEntradas, totalSaidas, totalGeral, saldoDinheiro, saldoPix };
    },

    generateSummaryHTML(data) {
        const { totalEntradas, totalSaidas, totalGeral } = this.calculateTotals(data);
        let html = `<strong>REGISTRO DIÁRIO - AÇAÍ SABOR DA TERRA</strong>\n`;
        html += `-------------------------------------\n`;
        html += `<strong>Funcionário(a):</strong> ${data.funcionario}\n`;
        html += `<strong>Data:</strong> ${Utils.formatDate(data.data)}\n`;
        html += `-------------------------------------\n`;
        html += `<strong>ENTRADAS:</strong>\n`;
        html += `💰 Dinheiro: ${Utils.formatCurrency(data.dinheiroEntrada)}\n`;
        html += `📱 PIX: ${Utils.formatCurrency(data.pixEntrada)}\n`;
        html += `💳 Cartão: ${Utils.formatCurrency(data.cartaoEntrada)}\n`;
        html += `<span><strong>Total Entradas: ${Utils.formatCurrency(totalEntradas)}</strong></span>\n`;
        html += `-------------------------------------`;

        if (data.saidasDetalhadas && data.saidasDetalhadas.length > 0) {
            html += `\n<strong>SAÍDAS DETALHADAS:</strong>\n`;
            data.saidasDetalhadas.forEach(s => {
                html += `– ${s.motivo} (${s.metodo.toUpperCase()}): ${Utils.formatCurrency(s.valor)}\n`;
            });
            html += `<span><strong>Total Saídas: ${Utils.formatCurrency(totalSaidas)}</strong></span>\n`;
            html += `-------------------------------------`;
        }

        if (data.fidelidade === 'sim' && (parseInt(data.fidelidadeQuantidade) || 0) > 0) {
            html += `\n<strong>FIDELIDADE:</strong>\n🎁 Cartões Utilizados: ${data.fidelidadeQuantidade}\n`;
            html += `-------------------------------------`;
        }

        html += `\n<strong>TOTAL GERAL (Sistema): ${Utils.formatCurrency(totalGeral)}</strong>\n`;
        html += `-------------------------------------\n`;
        html += `<strong>Termômetro da Loja:</strong> ${data.climaLoja}\n`;
        html += `<strong>Observações:</strong> ${data.observacoesDia || 'Nenhuma'}`;
        
        return html;
    },

    updateAjuste() {
        const { saldoDinheiro, saldoPix } = this.calculateTotals(this.dadosParaEnvio);
        
        const realDinheiroEl = document.getElementById('realDinheiro');
        const realPixEl = document.getElementById('realPix');
        
        const realDinheiro = parseFloat(realDinheiroEl.value) || saldoDinheiro;
        const realPix = parseFloat(realPixEl.value) || saldoPix;

        const diferencaDinheiro = realDinheiro - saldoDinheiro;
        const diferencaPix = realPix - saldoPix;

        const diferencaDinheiroEl = document.getElementById('diferencaDinheiro');
        diferencaDinheiroEl.textContent = Utils.formatCurrency(diferencaDinheiro);
        diferencaDinheiroEl.style.color = diferencaDinheiro !== 0 ? 'var(--danger-color)' : 'var(--success-color)';

        const diferencaPixEl = document.getElementById('diferencaPix');
        diferencaPixEl.textContent = Utils.formatCurrency(diferencaPix);
        diferencaPixEl.style.color = diferencaPix !== 0 ? 'var(--danger-color)' : 'var(--success-color)';
    },

    sendToWhatsApp() {
        const text = document.getElementById('resumo').innerText; // Usa o texto já formatado
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    },

    // --- LOGS DE AUDITORIA ---
    async showLogsModal() {
        if (!this.currentRegistroId) {
            Utils.showToast("Nenhum registro selecionado para ver o histórico.", "error");
            return;
        }

        const logsContainer = document.getElementById('logsContainer');
        logsContainer.innerHTML = '<p>Carregando histórico...</p>';
        document.getElementById('logsModal').classList.remove('hidden');

        try {
            const q = query(collection(this.db, 'logsEdicoes'), where('registroId', '==', this.currentRegistroId), orderBy('data', 'desc'));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                logsContainer.innerHTML = '<p>Nenhum histórico de edição encontrado para este registro.</p>';
                return;
            }

            logsContainer.innerHTML = '';
            querySnapshot.forEach(doc => {
                const log = doc.data();
                const logDate = log.data.toDate().toLocaleString('pt-BR');
                const logItem = document.createElement('div');
                logItem.className = 'log-item';
                logItem.innerHTML = `
                    <p class="log-date"><strong>Data:</strong> ${logDate}</p>
                    <p><strong>Ação:</strong> ${log.acao || 'CRIACAO'}</p>
                    <details>
                        <summary>Ver Dados Salvos</summary>
                        <pre>${JSON.stringify(log.dados, null, 2)}</pre>
                    </details>
                `;
                logsContainer.appendChild(logItem);
            });

        } catch (error) {
            console.error("Erro ao buscar logs:", error);
            logsContainer.innerHTML = '<p>Ocorreu um erro ao carregar o histórico.</p>';
            Utils.showToast("Erro ao buscar histórico.", "error");
        }
    },

    hideLogsModal() {
        document.getElementById('logsModal').classList.add('hidden');
    },

    // --- LÓGICA DE AUTOCOMPLETE ---
    saveNewMotivos(saidas) {
        if (!saidas || saidas.length === 0) return;

        const savedMotivos = LocalStorageModule.get(this.MOTIVOS_KEY) || [];
        const novosMotivos = saidas.map(s => s.motivo.trim()).filter(m => m);
        
        let updated = false;
        novosMotivos.forEach(novoMotivo => {
            if (!savedMotivos.includes(novoMotivo)) {
                savedMotivos.push(novoMotivo);
                updated = true;
            }
        });

        if (updated) {
            LocalStorageModule.set(this.MOTIVOS_KEY, savedMotivos);
            this.loadSavedMotivos(); // Atualiza o datalist na UI
        }
    }
};
