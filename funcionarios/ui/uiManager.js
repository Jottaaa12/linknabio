export class UIManager {
    constructor(firestoreService) {
        this.firestoreService = firestoreService;
        this.funcionarioForm = document.getElementById('funcionario-form');
        this.funcionariosTbody = document.getElementById('funcionarios-tbody');
        this.avisoForm = document.getElementById('aviso-form');
        this.avisosList = document.getElementById('avisos-list');

        this.funcionarioForm.addEventListener('submit', this.handleFuncionarioFormSubmit.bind(this));
        this.avisoForm.addEventListener('submit', this.handleAvisoFormSubmit.bind(this));
    }

    init() {
        this.firestoreService.setupFuncionariosListener((funcionarios) => {
            this.renderFuncionarios(funcionarios);
        });

        this.firestoreService.setupAvisosListener((avisos) => {
            this.renderAvisos(avisos);
        });
    }

    renderFuncionarios(funcionarios) {
        this.funcionariosTbody.innerHTML = '';
        funcionarios.forEach(funcionario => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${funcionario.nomeCompleto}</td>
                <td>${funcionario.email}</td>
                <td>${funcionario.cargo}</td>
                <td>${funcionario.chavePix}</td>
                <td>${funcionario.status}</td>
                <td>
                    <button data-id="${funcionario.id}" class="edit-btn">Editar</button>
                    <button data-id="${funcionario.id}" class="delete-btn">Excluir</button>
                </td>
            `;
            this.funcionariosTbody.appendChild(tr);
        });
    }

    renderAvisos(avisos) {
        this.avisosList.innerHTML = '';
        avisos.forEach(aviso => {
            const div = document.createElement('div');
            div.innerHTML = `
                <h3>${aviso.titulo}</h3>
                <p>${aviso.mensagem}</p>
                <small>Autor: ${aviso.autor} | Data: ${aviso.dataCriacao.toDate().toLocaleString()}</small>
            `;
            this.avisosList.appendChild(div);
        });
    }

    async handleFuncionarioFormSubmit(event) {
        event.preventDefault();
        const id = document.getElementById('funcionario-id').value;
        const nomeCompleto = document.getElementById('nome-completo').value;
        const email = document.getElementById('email').value;
        const cargo = document.getElementById('cargo').value;
        const chavePix = document.getElementById('chave-pix').value;
        const status = document.getElementById('status').value;

        const data = { nomeCompleto, email, cargo, chavePix, status };

        if (id) {
            await this.firestoreService.updateFuncionario(id, data);
        } else {
            await this.firestoreService.createFuncionario(data);
        }

        this.funcionarioForm.reset();
    }

    async handleAvisoFormSubmit(event) {
        event.preventDefault();
        const titulo = document.getElementById('aviso-titulo').value;
        const mensagem = document.getElementById('aviso-mensagem').value;
        const autor = document.getElementById('aviso-autor').value;

        const data = { titulo, mensagem, autor };

        await this.firestoreService.createAviso(data);

        this.avisoForm.reset();
    }
}