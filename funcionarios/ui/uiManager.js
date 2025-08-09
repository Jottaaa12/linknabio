"""export class UIManager {
    constructor(firestoreService) {
        this.firestoreService = firestoreService;
        this.funcionarios = []; // Store funcionarios data
        this.funcionarioForm = document.getElementById('funcionario-form');
        this.funcionariosTbody = document.getElementById('funcionarios-tbody');
        this.avisoForm = document.getElementById('aviso-form');
        this.avisosList = document.getElementById('avisos-list');

        this.funcionarioForm.addEventListener('submit', this.handleFuncionarioFormSubmit.bind(this));
        this.avisoForm.addEventListener('submit', this.handleAvisoFormSubmit.bind(this));
        // Add a single event listener to the table body for delegation
        this.funcionariosTbody.addEventListener('click', this.handleTableClick.bind(this));
    }

    init() {
        this.firestoreService.setupFuncionariosListener((funcionarios) => {
            this.funcionarios = funcionarios; // Update local cache
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
            tr.setAttribute('data-id', funcionario.id); // Set data-id on the row
            tr.innerHTML = `
                <td>${funcionario.nomeCompleto}</td>
                <td>${funcionario.email}</td>
                <td>${funcionario.cargo}</td>
                <td>${funcionario.chavePix}</td>
                <td>${funcionario.status}</td>
                <td>
                    <button class="edit-btn">Editar</button>
                    <button class="delete-btn">Excluir</button>
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

        try {
            if (id) {
                await this.firestoreService.updateFuncionario(id, data);
                alert('Funcionário atualizado com sucesso!');
            } else {
                await this.firestoreService.createFuncionario(data);
                alert('Funcionário criado com sucesso!');
            }
            this.funcionarioForm.reset();
            document.getElementById('funcionario-id').value = ''; // Clear hidden id
        } catch (error) {
            console.error("Erro ao salvar funcionário:", error);
            alert(`Erro ao salvar funcionário: ${error.message}`);
        }
    }

    async handleAvisoFormSubmit(event) {
        event.preventDefault();
        const titulo = document.getElementById('aviso-titulo').value;
        const mensagem = document.getElementById('aviso-mensagem').value;
        const autor = document.getElementById('aviso-autor').value;

        const data = { titulo, mensagem, autor };

        try {
            await this.firestoreService.createAviso(data);
            alert('Aviso enviado com sucesso!');
            this.avisoForm.reset();
        } catch (error) {
            console.error("Erro ao criar aviso:", error);
            alert(`Erro ao criar aviso: ${error.message}`);
        }
    }

    handleTableClick(event) {
        const target = event.target;
        const row = target.closest('tr');
        if (!row) return;

        const id = row.dataset.id;

        if (target.classList.contains('edit-btn')) {
            this.handleEditFuncionario(id);
        } else if (target.classList.contains('delete-btn')) {
            this.handleDeleteFuncionario(id);
        }
    }

    handleEditFuncionario(id) {
        const funcionario = this.getFuncionarioById(id);
        if (funcionario) {
            document.getElementById('funcionario-id').value = funcionario.id;
            document.getElementById('nome-completo').value = funcionario.nomeCompleto;
            document.getElementById('email').value = funcionario.email;
            document.getElementById('cargo').value = funcionario.cargo;
            document.getElementById('chave-pix').value = funcionario.chavePix;
            document.getElementById('status').value = funcionario.status;
            window.scrollTo(0, 0); // Scroll to top to see the form
        }
    }

    async handleDeleteFuncionario(id) {
        if (confirm('Tem certeza que deseja excluir este funcionário?')) {
            try {
                await this.firestoreService.deleteFuncionario(id);
                alert('Funcionário excluído com sucesso!');
            } catch (error) {
                console.error("Erro ao excluir funcionário:", error);
                alert(`Erro ao excluir funcionário: ${error.message}`);
            }
        }
    }

    getFuncionarioById(id) {
        return this.funcionarios.find(f => f.id === id);
    }
}
""