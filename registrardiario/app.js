import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { RegistroDiarioModule } from './registro.js';
import { Utils } from './utils.js';

// Event listener para iniciar a aplicação quando o DOM estiver pronto.
document.addEventListener('DOMContentLoaded', async () => {
    // Configuração do Firebase. Substitua pelos seus dados.
    const firebaseConfig = {
        apiKey: "AIzaSyCyzA-QWhXZTUahk13tKhMEAt8AqLpCzDc", // Chave de API
        authDomain: "acai-sabordaterra-fiados.firebaseapp.com", // Domínio de autenticação
        projectId: "acai-sabordaterra-fiados", // ID do projeto
        storageBucket: "acai-sabordaterra-fiados.appspot.com", // Bucket de armazenamento
        messagingSenderId: "95507357232", // ID do remetente de mensagens
        appId: "1:95507357232:web:22d0264b98bd5ab0ff57f5" // ID do aplicativo
    };

    // Inicializa o Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Lógica para os cards de usuário
    const userCards = document.querySelectorAll('.user-card');
    const funcionarioSelect = document.getElementById('funcionario');
    userCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove a seleção de todos os cards
            userCards.forEach(c => c.classList.remove('selected'));
            // Adiciona a seleção ao card clicado
            card.classList.add('selected');
            // Define o valor no select oculto
            funcionarioSelect.value = card.dataset.value;
        });
    });

    // Monitora o estado da autenticação.
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Se o usuário estiver autenticado, inicializa o módulo principal.
            console.log("Usuário anônimo autenticado:", user.uid);
            RegistroDiarioModule.init(db, storage);
        } else {
            console.log("Nenhum usuário autenticado.");
        }
    });

    // Tenta fazer login anônimo.
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Falha na autenticação anônima:", error);
        Utils.showToast("Falha crítica na conexão. O app não funcionará.", "error");
    }
});
