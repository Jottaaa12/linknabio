import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCyzA-QWhXZTUahk13tKhMEAt8AqLpCzDc",
    authDomain: "acai-sabordaterra-fiados.firebaseapp.com",
    projectId: "acai-sabordaterra-fiados",
    storageBucket: "acai-sabordaterra-fiados.appspot.com",
    messagingSenderId: "95507357232",
    appId: "1:95507357232:web:22d0264b98bd5ab0ff57f5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const canvas = document.getElementById('roleta-canvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('girar-btn');
const premioModal = document.getElementById('premio-modal');
const premioTexto = document.getElementById('premio-texto');
const closeButton = document.querySelector('.close-button');

const secaoVerificacao = document.getElementById('secao-verificacao');
const roletaContainer = document.getElementById('roleta-container');
const telefoneInput = document.getElementById('telefone-input');
const verificarBtn = document.getElementById('verificar-btn');

const prizes = [
    '50% OFF',
    'Brinde Surpresa',
    'Nada :(',
    '10% OFF',
    'Frete Grátis',
    '20% OFF',
    'Nada :(',
    '30% OFF'
];

const numSlices = prizes.length;
const sliceAngle = (2 * Math.PI) / numSlices;
let currentRotation = 0;
let isSpinning = false;

// Function to draw the roulette
function drawRoulette() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10; // Adjust for border

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);

    for (let i = 0; i < numSlices; i++) {
        const startAngle = i * sliceAngle;
        const endAngle = (i + 1) * sliceAngle;

        // Alternate colors
        ctx.fillStyle = i % 2 === 0 ? '#8a2be2' : '#39ff14'; // Purple and Lime Green
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // Draw text
        ctx.save();
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1a1a2e'; // Dark text for contrast
        ctx.font = 'bold 16px Arial';
        ctx.fillText(prizes[i], radius - 20, 0);
        ctx.restore();
    }
    ctx.restore();
}

// Spin logic
function spinRoulette() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.add('pulse');

    const randomIndex = Math.floor(Math.random() * numSlices);
    // Calculate the target rotation for the selected prize.
    // We add multiple full rotations (e.g., 5 * 2 * Math.PI) to ensure the wheel spins
    // several times before landing on the prize, making the animation more visually appealing.
    // (numSlices - randomIndex - 0.5) * sliceAngle positions the prize in the middle of the pointer.
    const targetRotation = (2 * Math.PI * 5) + (numSlices - randomIndex - 0.5) * sliceAngle;

    // Apply the rotation using CSS transform
    canvas.style.transform = `rotate(${targetRotation}rad)`;

    // Listen for the end of the CSS transition
    canvas.addEventListener('transitionend', () => {
        isSpinning = false;
        spinBtn.disabled = false;
        spinBtn.classList.remove('pulse');
        showPrize(prizes[randomIndex]);
        // Reset the transform to 0 after the animation ends to allow for future spins
        // and then immediately set it to the final rotation to avoid a jump.
        // This is a common trick to restart CSS transitions.
        canvas.style.transition = 'none';
        canvas.style.transform = `rotate(${targetRotation % (2 * Math.PI)}rad)`;
        setTimeout(() => {
            canvas.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        }, 50);
    }, { once: true }); // Use { once: true } to ensure the event listener is removed after it fires
}

function showPrize(prize) {
    premioTexto.textContent = prize;
    premioModal.style.display = 'flex'; // Use flex to center
    setTimeout(() => {
        premioModal.classList.add('show');
    }, 10); // Small delay to allow display:flex to apply before transition
}

function hidePrizeModal() {
    premioModal.classList.remove('show');
    premioModal.addEventListener('transitionend', () => {
        premioModal.style.display = 'none';
    }, { once: true });
}

async function verificarAniversario() {
    const telefone = telefoneInput.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    if (telefone.length < 10) {
        alert('Por favor, insira um número de telefone válido com DDD.');
        return;
    }

    try {
        const clientesRef = collection(db, 'clientes');
        const q = query(clientesRef, where('telefone', '==', telefone));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert('Cliente não encontrado. Verifique o número de telefone.');
            return;
        }

        let isBirthday = false;
        const today = new Date();
        const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0'); // MM
        const currentDay = today.getDate().toString().padStart(2, '0'); // DD

        querySnapshot.forEach((doc) => {
            const clienteData = doc.data();
            const dataNascimento = clienteData.dataNascimento; // Expected format: YYYY-MM-DD

            if (dataNascimento) {
                const [ano, mes, dia] = dataNascimento.split('-');
                // Ensure month and day are formatted with leading zeros for comparison
                const formattedMonth = mes.padStart(2, '0');
                const formattedDay = dia.padStart(2, '0');

                if (formattedMonth === currentMonth && formattedDay === currentDay) {
                    isBirthday = true;
                }
            }
        });

        if (isBirthday) {
            secaoVerificacao.classList.add('hidden');
            roletaContainer.classList.remove('hidden');
        } else {
            alert('Não é seu aniversário hoje ou a data de nascimento não está registrada.');
        }

    } catch (error) {
        console.error("Erro ao verificar aniversário:", error);
        alert('Ocorreu um erro ao verificar seu aniversário. Tente novamente.');
    }
}

// Event Listeners
spinBtn.addEventListener('click', spinRoulette);
closeButton.addEventListener('click', hidePrizeModal);
window.addEventListener('click', (event) => {
    if (event.target === premioModal) {
        hidePrizeModal();
    }
});

verificarBtn.addEventListener('click', verificarAniversario);

// Initial draw
drawRoulette();