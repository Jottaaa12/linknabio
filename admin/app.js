import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    onSnapshot,
    doc,
    getDoc, // Import getDoc
    updateDoc,
    addDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Event Listeners & Global Functions ---

// Make functions globally accessible for inline event handlers
window.updateStatus = updateStatus;
window.showDetails = showDetails;
window.deleteAviso = deleteAviso;

// Login Form
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Erro no login: ", error);
            alert("Falha no login: " + error.message);
        }
    });
}

// Logout Button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Erro ao sair: ", error);
        }
    });
}

// --- Auth State Management ---
onAuthStateChanged(auth, (user) => {
    const isDashboardPage = window.location.pathname.includes('dashboard.html');
    if (user) {
        if (isDashboardPage) {
            loadDashboard();
        }
    } else {
        if (isDashboardPage) {
            window.location.href = 'index.html';
        }
    }
});

// --- Dashboard Loading ---
function loadDashboard() {
    loadFuncionarios();
    loadAvisos();
    setupAvisoForm();
    setupRegistroPontoForm();
    setupModal();
}

function loadFuncionarios() {
    const funcionariosTbody = document.getElementById('funcionarios-tbody');
    const q = query(collection(db, "funcionarios"), orderBy("nomeCompleto"));

    onSnapshot(q, (querySnapshot) => {
        funcionariosTbody.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const funcionario = { id: doc.id, ...doc.data() };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td onclick="showDetails('${funcionario.id}')" style="cursor: pointer;">${funcionario.nomeCompleto}</td>
                <td>${funcionario.email}</td>
                <td>${funcionario.cargo}</td>
                <td>${funcionario.status}</td>
                <td>
                    <button onclick="updateStatus('${funcionario.id}', 'aprovado')">Aprovar</button>
                    <button onclick="updateStatus('${funcionario.id}', 'reprovado')">Reprovar</button>
                </td>
            `;
            funcionariosTbody.appendChild(tr);
        });
    });
}

function loadAvisos() {
    const avisosList = document.getElementById('avisos-list');
    const q = query(collection(db, "avisos"), orderBy("dataCriacao", "desc"));

    onSnapshot(q, (snapshot) => {
        avisosList.innerHTML = '<h3>Avisos Publicados</h3>';
        snapshot.forEach((doc) => {
            const aviso = { id: doc.id, ...doc.data() };
            const div = document.createElement('div');
            div.className = 'aviso-item';
            div.innerHTML = `
                <h4>${aviso.titulo}</h4>
                <p>${aviso.mensagem}</p>
                <small>Autor: ${aviso.autor} | Data: ${aviso.dataCriacao.toDate().toLocaleString()}</small>
                <button onclick="deleteAviso('${aviso.id}')">Excluir</button>
            `;
            avisosList.appendChild(div);
        });
    });
}

// --- Form & Modal Setup ---

function setupAvisoForm() {
    const avisoForm = document.getElementById('aviso-form');
    avisoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('aviso-titulo').value;
        const mensagem = document.getElementById('aviso-mensagem').value;

        try {
            await addDoc(collection(db, 'avisos'), {
                titulo: titulo,
                mensagem: mensagem,
                dataCriacao: new Date(),
                autor: auth.currentUser.email
            });
            avisoForm.reset();
            alert('Aviso publicado com sucesso!');
        } catch (error) {
            console.error("Erro ao criar aviso: ", error);
            alert('Falha ao publicar aviso.');
        }
    });
}

function setupRegistroPontoForm() {
    const registroPontoForm = document.getElementById('registro-ponto-form');
    registroPontoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const funcionarioId = document.getElementById('registro-ponto-funcionario-id').value;
        const data = document.getElementById('registro-ponto-data').value;
        const tipo = document.getElementById('registro-ponto-tipo').value;
        const observacao = document.getElementById('registro-ponto-obs').value;

        if (!funcionarioId || !data || !tipo) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            await addDoc(collection(db, 'funcionarios', funcionarioId, 'registroDePonto'), {
                data: new Date(data),
                tipo: tipo,
                observacao: observacao
            });
            registroPontoForm.reset();
            alert('Registro de ponto adicionado com sucesso!');
            // Refresh the attendance list in the modal
            showDetails(funcionarioId);
        } catch (error) {
            console.error("Erro ao adicionar registro de ponto: ", error);
            alert('Falha ao adicionar registro.');
        }
    });
}

function setupModal() {
    const modal = document.getElementById('funcionario-modal');
    const closeBtn = document.querySelector('.close-btn');
    closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

// --- Core Functions ---

async function updateStatus(id, status) {
    const funcionarioRef = doc(db, "funcionarios", id);
    try {
        await updateDoc(funcionarioRef, { status: status });
        alert(`Status do funcionário atualizado para ${status}.`);
    } catch (error) {
        console.error("Erro ao atualizar status: ", error);
    }
}

async function deleteAviso(id) {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;
    try {
        await deleteDoc(doc(db, "avisos", id));
        alert('Aviso excluído com sucesso.');
    } catch (error) {
        console.error("Erro ao excluir aviso: ", error);
    }
}

async function showDetails(employeeId) {
    const modal = document.getElementById('funcionario-modal');
    try {
        // Fetch employee data
        const docRef = doc(db, "funcionarios", employeeId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const funcionario = docSnap.data();
            document.getElementById('modal-nome').textContent = funcionario.nomeCompleto;
            document.getElementById('modal-email').textContent = funcionario.email;
            document.getElementById('modal-cargo').textContent = funcionario.cargo;
            document.getElementById('modal-status').textContent = funcionario.status;
            document.getElementById('modal-chave-pix').textContent = funcionario.chavePix;
            document.getElementById('registro-ponto-funcionario-id').value = employeeId;
        } else {
            console.log("Funcionário não encontrado!");
            return;
        }

        // Fetch and display attendance records
        const registroPontoDiv = document.getElementById('modal-registro-ponto');
        const qRegistro = query(collection(db, 'funcionarios', employeeId, 'registroDePonto'), orderBy('data', 'desc'));
        
        onSnapshot(qRegistro, (snapshot) => {
            registroPontoDiv.innerHTML = '<h4>Histórico:</h4>';
            if (snapshot.empty) {
                registroPontoDiv.innerHTML += '<p>Nenhum registro encontrado.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const registro = doc.data();
                const p = document.createElement('p');
                p.textContent = `${registro.data.toDate().toLocaleDateString()} - ${registro.tipo} - ${registro.observacao || 'Sem observação'}`;
                registroPontoDiv.appendChild(p);
            });
        });

        modal.style.display = 'block';

    } catch (error) {
        console.error("Erro ao buscar detalhes do funcionário: ", error);
        alert('Não foi possível carregar os detalhes.');
    }
}