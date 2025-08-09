import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Event Listeners ---

// Registration Form
const registroForm = document.getElementById('registro-form');
if (registroForm) {
    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeCompleto = document.getElementById('registro-nome').value;
        const email = document.getElementById('registro-email').value;
        const password = document.getElementById('registro-password').value;
        const cargo = document.getElementById('registro-cargo').value;
        const chavePix = document.getElementById('registro-chave-pix').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "funcionarios", user.uid), {
                nomeCompleto: nomeCompleto,
                email: email,
                cargo: cargo,
                chavePix: chavePix,
                status: 'pendente',
                dataCriacao: new Date()
            });

            alert('Cadastro realizado com sucesso! Faça o login para continuar.');
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Erro no registro: ", error);
            alert("Falha no registro: " + error.message);
        }
    });
}

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

// --- Auth State & Dashboard Management ---

onAuthStateChanged(auth, (user) => {
    const isDashboardPage = window.location.pathname.includes('dashboard.html');
    if (user) {
        if (isDashboardPage) {
            loadDashboardData(user);
        }
    } else {
        if (isDashboardPage) {
            window.location.href = 'index.html';
        }
    }
});

async function loadDashboardData(user) {
    // Fetch and display user profile
    const userDocRef = doc(db, "funcionarios", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        document.getElementById('perfil-nome').value = userData.nomeCompleto;
        document.getElementById('perfil-cargo').value = userData.cargo;
        document.getElementById('pagamento-chave-pix').value = userData.chavePix;
    } else {
        console.log("Dados do funcionário não encontrados!");
        alert("Não foi possível carregar os dados do perfil.");
    }

    // Setup form listeners for profile and payment updates
    setupProfileForms(userDocRef);

    // Fetch and display announcements
    loadAnnouncements();
}

function setupProfileForms(userDocRef) {
    const perfilForm = document.getElementById('perfil-form');
    perfilForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('perfil-nome').value;
        const cargo = document.getElementById('perfil-cargo').value;
        try {
            await updateDoc(userDocRef, { nomeCompleto: nome, cargo: cargo });
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error("Erro ao atualizar perfil: ", error);
            alert('Falha ao atualizar o perfil.');
        }
    });

    const pagamentoForm = document.getElementById('pagamento-form');
    pagamentoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const chavePix = document.getElementById('pagamento-chave-pix').value;
        try {
            await updateDoc(userDocRef, { chavePix: chavePix });
            alert('Chave PIX atualizada com sucesso!');
        } catch (error) {
            console.error("Erro ao atualizar Chave PIX: ", error);
            alert('Falha ao atualizar a Chave PIX.');
        }
    });
}

async function loadAnnouncements() {
    const avisosContainer = document.getElementById('avisos-container');
    avisosContainer.innerHTML = ''; // Clear previous content
    const q = query(collection(db, "avisos"), orderBy("dataCriacao", "desc"));

    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            avisosContainer.innerHTML = '<p>Nenhum aviso no momento.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const aviso = doc.data();
            const avisoCard = document.createElement('div');
            avisoCard.className = 'aviso-card';
            avisoCard.innerHTML = `
                <h3>${aviso.titulo}</h3>
                <p>${aviso.mensagem}</p>
                <small>Autor: ${aviso.autor} | Data: ${aviso.dataCriacao.toDate().toLocaleString()}</small>
            `;
            avisosContainer.appendChild(avisoCard);
        });
    } catch (error) {
        console.error("Erro ao buscar avisos: ", error);
        avisosContainer.innerHTML = '<p>Erro ao carregar avisos.</p>';
    }
}