import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { RegistroDiarioModule } from './registro.js';
import { Utils } from './utils.js';
import { firebaseConfig } from '../shared/firebase-config.js';

// Event listener para iniciar a aplicação quando o DOM estiver pronto.
document.addEventListener('DOMContentLoaded', async () => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // Lógica para os cards de usuário (Nova Classe .employee-option)
    const employeeOptions = document.querySelectorAll('.employee-option');
    const funcionarioSelect = document.getElementById('funcionario');

    employeeOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove a seleção de todos os cards
            employeeOptions.forEach(opt => opt.classList.remove('selected'));
            // Adiciona a seleção ao card clicado
            option.classList.add('selected');
            // Define o valor no select oculto
            funcionarioSelect.value = option.dataset.value;
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
