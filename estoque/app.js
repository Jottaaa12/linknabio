import { firebaseConfig } from '../shared/firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estado da Aplicação
let currentCategories = []; // Para armazenar dados locais
let isEditMode = false;
let pendingWhatsappMessage = ""; // Para armazenar a mensagem do preview

// Estado do Inventário Rápido
let inventoryData = {}; // { itemId: countedQty }

// Elementos DOM
const loginOverlay = document.getElementById('loginOverlay');
const appContainer = document.getElementById('appContainer');
const loginForm = document.getElementById('loginForm');
const senhaInput = document.getElementById('senhaInput');
const loginError = document.getElementById('loginError');
const togglePasswordBtn = document.getElementById('togglePassword');
const categoriesContainer = document.getElementById('categoriesContainer');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');

// Novos Elementos UI
const toggleEditBtn = document.getElementById('toggleEditBtn');
const whatsappBtn = document.getElementById('whatsappBtn');
const addCategoryFab = document.getElementById('addCategoryFab');
const previewModal = document.getElementById('previewModal');
const whatsappPreviewArea = document.getElementById('whatsappPreviewArea');
const confirmSendWhatsapp = document.getElementById('confirmSendWhatsapp');

// Elementos Inventário Rápido
const toggleInventoryBtn = document.getElementById('toggleInventoryBtn');
const inventoryOverlay = document.getElementById('inventoryOverlay');
const inventoryList = document.getElementById('inventoryList');
const countedItemsSpan = document.getElementById('countedItems');
const cancelInventoryBtn = document.getElementById('cancelInventoryBtn');
const finishInventoryBtn = document.getElementById('finishInventoryBtn');
const inventorySearchInput = document.getElementById('inventorySearchInput');

// Tutorial
const tutorialBtn = document.getElementById('tutorialBtn');
const tutorialModal = document.getElementById('tutorialModal');

// Tour Interativo
const tourOverlay = document.getElementById('tourOverlay');
const tourSpotlight = document.querySelector('.tour-spotlight');
const tourTooltip = document.querySelector('.tour-tooltip');
const tourTitle = document.getElementById('tourTitle');
const tourDescription = document.getElementById('tourDescription');
const tourCurrentStep = document.getElementById('tourCurrentStep');
const tourTotalSteps = document.getElementById('tourTotalSteps');
const tourPrev = document.getElementById('tourPrev');
const tourNext = document.getElementById('tourNext');
const tourSkip = document.getElementById('tourSkip');

let currentTourStep = 0;
const tourSteps = [
    {
        selector: '#searchInput',
        title: '🔍 Barra de Busca',
        description: 'Digite o nome de qualquer produto aqui para encontrar rapidamente. A lista filtra conforme você digita!',
        position: 'bottom'
    },
    {
        selector: '.stock-item',
        title: '📦 Card de Produto',
        description: 'Cada produto fica em um card. Você vê o nome e a quantidade atual. Use os botões + e - para ajustar.',
        position: 'bottom'
    },
    {
        selector: '.quantity-control',
        title: '➕ Controlede Quantidade',
        description: 'Clique no + para aumentar e no - para diminuir. Vendeu 3? Clique 3x no menos!',
        position: 'left'
    },
    {
        selector: '#toggleInventoryBtn',
        title: '⚡ Inventário Rápido',
        description: 'O MAIS IMPORTANTE! Clique aqui para fazer a contagem diária. Digite só o que contou - o resto será zerado.',
        position: 'bottom'
    },
    {
        selector: '#toggleEditBtn',
        title: '✏️ Modo Edição',
        description: 'Precisa adicionar ou remover produtos? Ative o modo edição aqui. Cuidado: só use se souber o que está fazendo!',
        position: 'bottom'
    },
    {
        selector: '#whatsappBtn',
        title: '📱 Relatório WhatsApp',
        description: 'Gera um relatório completo do estoque para enviar no WhatsApp. Mostra tudo que está em falta!',
        position: 'top'
    }
];

tutorialBtn.addEventListener('click', () => {
    // Mostra opção: tutorial estático ou interativo
    showConfirmModal(
        'Como quer aprender?',
        '📚 <b>Texto</b>: Leia as instruções completas<br><br>🎯 <b>Interativo</b>: Veja ao vivo cada função',
        '📚',
        () => {
            tutorialModal.classList.remove('hidden');
        }
    );
    // Adiciona botão interativo no modal de confirmação
    setTimeout(() => {
        const actionsDiv = confirmationModal.querySelector('.modal-actions');
        if (!document.getElementById('btnTourStart')) {
            const tourBtn = document.createElement('button');
            tourBtn.id = 'btnTourStart';
            tourBtn.className = 'btn-confirm';
            tourBtn.style.background = 'var(--success-color)';
            tourBtn.textContent = '🎯 Interativo';
            tourBtn.onclick = () => {
                confirmationModal.classList.add('hidden');
                startTour();
            };
            actionsDiv.appendChild(tourBtn);
        }
    }, 50);
});

function startTour() {
    currentTourStep = 0;
    tourTotalSteps.textContent = tourSteps.length;
    tourOverlay.classList.remove('hidden');
    showTourStep();
}

function showTourStep() {
    const step = tourSteps[currentTourStep];
    const element = document.querySelector(step.selector);

    if (!element) {
        // Skip if element not found
        if (currentTourStep < tourSteps.length - 1) {
            currentTourStep++;
            showTourStep();
        } else {
            endTour();
        }
        return;
    }

    // Update content
    tourTitle.textContent = step.title;
    tourDescription.textContent = step.description;
    tourCurrentStep.textContent = currentTourStep + 1;

    // Position spotlight
    const rect = element.getBoundingClientRect();
    const padding = 8;

    tourSpotlight.style.top = (rect.top - padding) + 'px';
    tourSpotlight.style.left = (rect.left - padding) + 'px';
    tourSpotlight.style.width = (rect.width + padding * 2) + 'px';
    tourSpotlight.style.height = (rect.height + padding * 2) + 'px';

    // Position tooltip
    positionTooltip(rect, step.position);

    // Update buttons
    tourPrev.style.visibility = currentTourStep === 0 ? 'hidden' : 'visible';
    tourNext.textContent = currentTourStep === tourSteps.length - 1 ? 'Finalizar ✓' : 'Próximo →';

    // Add highlight
    element.classList.add('tour-highlight');
}

function positionTooltip(rect, position) {
    // Force bottom position on mobile for better UX
    const isMobile = window.innerWidth <= 600;
    if (isMobile) position = 'bottom';

    const gap = 20; // Space between element and tooltip
    let top, left;

    // First, set initial position based on preference
    switch (position) {
        case 'bottom':
            top = rect.bottom + gap;
            left = Math.max(15, rect.left + (rect.width / 2) - 175); // 175 = half of max-width
            break;
        case 'top':
            top = rect.top - 200 - gap; // Estimate tooltip height
            left = Math.max(15, rect.left + (rect.width / 2) - 175);
            break;
        case 'left':
            top = rect.top;
            left = rect.left - 360 - gap;
            break;
        case 'right':
            top = rect.top;
            left = rect.right + gap;
            break;
    }

    // Keep within viewport bounds
    if (left < 15) left = 15;
    if (left > window.innerWidth - 365) left = window.innerWidth - 365;
    if (top < 15) top = 15;

    // If tooltip would go below viewport, move it above the element
    if (top + 200 > window.innerHeight) {
        top = Math.max(15, rect.top - 220);
    }

    tourTooltip.style.top = top + 'px';
    tourTooltip.style.left = left + 'px';
}

function endTour() {
    // Remove all highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
    });
    tourOverlay.classList.add('hidden');
    showAlertModal('Tutorial Concluído! 🎉', 'Agora você já sabe usar o sistema!<br>Qualquer dúvida, clique no ❓ de novo.', 'success');
}

tourPrev.addEventListener('click', () => {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    if (currentTourStep > 0) {
        currentTourStep--;
        showTourStep();
    }
});

tourNext.addEventListener('click', () => {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
    if (currentTourStep < tourSteps.length - 1) {
        currentTourStep++;
        showTourStep();
    } else {
        endTour();
    }
});

tourSkip.addEventListener('click', endTour);

// ==========================================
// AUTENTICAÇÃO
// ==========================================

togglePasswordBtn.addEventListener('click', () => {
    const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
    senhaInput.setAttribute('type', type);
    togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
});

async function checkLogin(password) {
    try {
        const configRef = doc(db, "config", "estoque");
        const configSnap = await getDoc(configRef);
        let correctPassword = "admin";

        if (configSnap.exists()) {
            correctPassword = configSnap.data().senha;
        } else {
            // Cria config inicial se não existir
            await setDoc(configRef, { senha: "admin123" });
            correctPassword = "admin123";
        }

        if (password === correctPassword) {
            sessionStorage.setItem('estoqueAuth', 'true');
            return true;
        }
        return false;
    } catch (error) {
        console.error("Erro ao verificar login:", error);
        throw error;
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = senhaInput.value;
    loginError.textContent = "Verificando...";
    try {
        const isValid = await checkLogin(password);
        if (isValid) {
            showApp();
        } else {
            loginError.textContent = "Senha incorreta!";
            senhaInput.value = "";
            senhaInput.focus();
        }
    } catch (error) {
        loginError.textContent = "Erro ao conectar. Tente novamente.";
    }
});

function showApp() {
    loginOverlay.classList.add('hidden');
    appContainer.classList.remove('hidden');
    initializeStockSystem();
}

if (sessionStorage.getItem('estoqueAuth') === 'true') {
    showApp();
}

// ==========================================
// SISTEMA DE ESTOQUE
// ==========================================

async function initializeStockSystem() {
    const q = query(collection(db, "estoque"), orderBy("order"));

    onSnapshot(q, (querySnapshot) => {
        currentCategories = [];
        querySnapshot.forEach(doc => {
            currentCategories.push({ id: doc.id, ...doc.data() });
        });

        if (currentCategories.length === 0 && !isEditMode) {
            showConfirmModal(
                "Tabela Vazia",
                "Deseja criar os itens iniciais padrão?",
                "📦",
                () => seedDatabase()
            );
        }

        renderApp();
        // Re-aplica filtro de busca se houver algo digitado
        if (searchInput.value) triggerSearch();

        document.querySelector('.loading-state').style.display = 'none';
    });
}

function renderApp() {
    categoriesContainer.innerHTML = '';

    currentCategories.forEach((category, catIndex) => {
        const template = document.getElementById('categoryTemplate');
        const clone = template.content.cloneNode(true);
        const section = clone.querySelector('.category-section');

        // Cabeçalho da Categoria
        clone.querySelector('.category-name').textContent = category.title;

        // Ações da Categoria (Modo Edição)
        const catActions = clone.querySelector('.category-actions');
        if (isEditMode) {
            catActions.classList.remove('hidden');
            clone.querySelector('.btn-add-item').onclick = () => openItemModal(category.id);
            clone.querySelector('.btn-delete-cat').onclick = () => deleteCategory(category.id);

            // Reorder Categories
            clone.querySelector('.btn-move-up').onclick = () => moveCategory(catIndex, -1);
            clone.querySelector('.btn-move-down').onclick = () => moveCategory(catIndex, 1);
        } else {
            catActions.classList.add('hidden');
        }

        const itemsGrid = clone.querySelector('.items-grid');

        // Itens
        if (category.items) {
            category.items.forEach((item, index) => {
                const itemTemplate = document.getElementById('itemTemplate');
                const itemClone = itemTemplate.content.cloneNode(true);
                const stockItem = itemClone.querySelector('.stock-item');

                itemClone.querySelector('.item-name').textContent = item.name;
                // Formatação simples (sem parênteses na UI principal conforme pedido user)
                itemClone.querySelector('.qty-value').textContent = item.qty;

                // Status Baixo
                if (item.qty === 0) {
                    stockItem.setAttribute('data-status', 'critical');
                } else if (item.qty === 1) {
                    stockItem.setAttribute('data-status', 'low');
                } else {
                    stockItem.removeAttribute('data-status');
                }

                // Controles Quantidade
                const minusBtn = itemClone.querySelector('.minus');
                const plusBtn = itemClone.querySelector('.plus');

                minusBtn.onclick = () => updateQuantity(category.id, index, item.qty - (item.step || 1));
                plusBtn.onclick = () => updateQuantity(category.id, index, item.qty + (item.step || 1));

                // Ações do Item (Modo Edição)
                const itemActions = itemClone.querySelector('.item-edit-actions');
                const qtyControl = itemClone.querySelector('.quantity-control');
                const itemAlert = itemClone.querySelector('.item-alert');

                if (isEditMode) {
                    itemActions.classList.remove('hidden');
                    qtyControl.classList.add('hidden');
                    itemAlert.classList.add('hidden');

                    itemClone.querySelector('.btn-edit-item').onclick = () => openItemModal(category.id, index, item);
                    itemClone.querySelector('.btn-delete-item').onclick = () => deleteItem(category.id, index);

                    // Reorder Items
                    itemClone.querySelector('.btn-move-left').onclick = () => moveItem(category.id, index, -1);
                    itemClone.querySelector('.btn-move-right').onclick = () => moveItem(category.id, index, 1);
                } else {
                    itemActions.classList.add('hidden');
                    qtyControl.classList.remove('hidden');
                }

                itemsGrid.appendChild(itemClone);
            });
        }
        categoriesContainer.appendChild(clone);
    });
}

// ==========================================
// GERENCIAMENTO & UI (CRUD, Search, Reorder)
// ==========================================

// Toggle Edit Mode
toggleEditBtn.addEventListener('click', () => {
    isEditMode = !isEditMode;
    toggleEditBtn.classList.toggle('active');
    addCategoryFab.classList.toggle('hidden');
    renderApp();
});

// Update Quantity
async function updateQuantity(categoryId, itemIndex, newQty) {
    if (newQty < 0) newQty = 0;
    try {
        const catRef = doc(db, "estoque", categoryId);
        const category = currentCategories.find(c => c.id === categoryId);

        if (category) {
            const newItems = [...category.items];
            newItems[itemIndex].qty = newQty;
            await updateDoc(catRef, { items: newItems });
        }
    } catch (error) {
        console.error("Erro ao atualizar:", error);
    }
}

// --- SEARCH ---
searchInput.addEventListener('input', triggerSearch);

function triggerSearch() {
    const term = searchInput.value.toLowerCase().trim();
    const categories = document.querySelectorAll('.category-section');

    categories.forEach(cat => {
        const items = cat.querySelectorAll('.stock-item');
        let hasVisible = false;

        items.forEach(item => {
            const name = item.querySelector('.item-name').textContent.toLowerCase();
            if (name.includes(term)) {
                item.style.display = 'flex';
                hasVisible = true;
            } else {
                item.style.display = 'none';
            }
        });

        // Se match na categoria ou itens visíveis
        const catName = cat.querySelector('.category-name').textContent.toLowerCase();
        if (hasVisible || catName.includes(term)) {
            cat.style.display = 'block';
            if (catName.includes(term) && !hasVisible) {
                items.forEach(i => i.style.display = 'flex');
            }
        } else {
            cat.style.display = 'none';
        }
    });
}

// --- REORDER ---
async function moveCategory(cuurentIndex, direction) {
    const targetIndex = cuurentIndex + direction;
    if (targetIndex < 0 || targetIndex >= currentCategories.length) return;

    const currentCat = currentCategories[cuurentIndex];
    const targetCat = currentCategories[targetIndex];

    try {
        const batch = writeBatch(db);
        batch.update(doc(db, "estoque", currentCat.id), { order: targetCat.order });
        batch.update(doc(db, "estoque", targetCat.id), { order: currentCat.order });
        await batch.commit();
    } catch (e) { console.error("Erro ao reordenar categoria", e); }
}

async function moveItem(categoryId, itemIndex, direction) {
    const category = currentCategories.find(c => c.id === categoryId);
    if (!category || !category.items) return;

    const targetIndex = itemIndex + direction;
    if (targetIndex < 0 || targetIndex >= category.items.length) return;

    const newItems = [...category.items];
    const temp = newItems[itemIndex];
    newItems[itemIndex] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    try {
        await updateDoc(doc(db, "estoque", categoryId), { items: newItems });
    } catch (e) { console.error("Erro ao reordenar item", e); }
}

// ==========================================
// INVENTÁRIO RÁPIDO ⚡
// ==========================================

toggleInventoryBtn.addEventListener('click', openInventory);
cancelInventoryBtn.addEventListener('click', closeInventory);
finishInventoryBtn.addEventListener('click', finishInventory);

function openInventory() {
    inventoryData = {};
    countedItemsSpan.textContent = "0";
    inventorySearchInput.value = ""; // Limpa busca ao abrir
    inventoryOverlay.classList.remove('hidden');
    renderInventory();
    setTimeout(() => inventorySearchInput.focus(), 100); // Foco no input
}

inventorySearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const items = inventoryList.querySelectorAll('.inventory-item');
    const headers = inventoryList.querySelectorAll('h3');

    items.forEach(item => {
        const name = item.querySelector('.inventory-item-name').textContent.toLowerCase();
        if (name.includes(term)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });

    // Esconde headers vazios
    headers.forEach(header => {
        let next = header.nextElementSibling;
        let hasVisibleItems = false;

        while (next && !next.tagName.match(/^H/)) {
            if (next.style.display !== 'none') {
                hasVisibleItems = true;
                break;
            }
            next = next.nextElementSibling;
        }

        if (hasVisibleItems) {
            header.style.display = 'block';
        } else {
            header.style.display = 'none';
        }
    });
});



function renderInventory() {
    inventoryList.innerHTML = '';

    currentCategories.forEach(cat => {
        if (!cat.items || cat.items.length === 0) return;

        // Cabeçalho categoria na lista
        const header = document.createElement('h3');
        header.textContent = cat.title;
        header.style.color = '#666';
        header.style.marginTop = '1rem';
        header.style.marginBottom = '0.5rem';
        header.style.paddingLeft = '0.5rem';
        inventoryList.appendChild(header);

        cat.items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            div.innerHTML = `
                <span class="inventory-item-name">${item.name}</span>
                <div class="inventory-controls">
                    <input type="number" inputmode="numeric" min="0" class="inventory-input" 
                        id="inv_${cat.id}_${index}" placeholder="-">
                    <button class="inventory-btn-plus" title="Adicionar 1">+</button>
                </div>
            `;

            const input = div.querySelector('input');
            const plusBtn = div.querySelector('.inventory-btn-plus');

            // UX: Clicar no card foca no input (exceto se clicar no botão)
            div.addEventListener('click', (e) => {
                if (e.target !== input && e.target !== plusBtn) {
                    input.focus();
                }
            });

            // Botão Mais (+)
            plusBtn.addEventListener('click', (e) => {
                e.preventDefault();
                let currentVal = parseInt(input.value) || 0;
                input.value = currentVal + 1;
                input.dispatchEvent(new Event('input')); // Dispara evento para salvar
            });

            input.addEventListener('input', (e) => {
                // Prevenir negativos
                if (e.target.value < 0) e.target.value = Math.abs(e.target.value);

                const val = e.target.value;
                if (val !== "") {
                    inventoryData[`${cat.id}_${index}`] = parseInt(val);
                    div.classList.add('counted');
                } else {
                    delete inventoryData[`${cat.id}_${index}`];
                    div.classList.remove('counted');
                }
                countedItemsSpan.textContent = Object.keys(inventoryData).length;
            });

            inventoryList.appendChild(div);
        });
    });
}



// ==========================================
// MODAIS COMUNS
// ==========================================

const confirmationModal = document.getElementById('confirmationModal');
const btnConfirmYes = document.getElementById('btnConfirmYes');
const btnConfirmCancel = document.getElementById('btnConfirmCancel');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const startIcon = document.querySelector('.modal-icon');

let currentConfirmCallback = null;

function showConfirmModal(title, message, icon = "??", onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.innerHTML = message.replace(/\n/g, '<br>');
    startIcon.textContent = icon;
    currentConfirmCallback = onConfirm;

    confirmationModal.classList.remove('hidden');
}

btnConfirmYes.onclick = () => {
    if (currentConfirmCallback) currentConfirmCallback();
    confirmationModal.classList.add('hidden');
    currentConfirmCallback = null;
};

btnConfirmCancel.onclick = () => {
    confirmationModal.classList.add('hidden');
    currentConfirmCallback = null;
};

// Alert Modal (Success/Error/Info)
const alertModal = document.getElementById('alertModal');
const alertIcon = document.getElementById('alertIcon');
const alertTitle = document.getElementById('alertTitle');
const alertMessage = document.getElementById('alertMessage');
const btnAlertOk = document.getElementById('btnAlertOk');

function showAlertModal(title, message, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    alertIcon.textContent = icons[type] || icons.info;
    alertTitle.textContent = title;
    alertMessage.innerHTML = message.replace(/\n/g, '<br>');

    // Change button color based on type
    btnAlertOk.className = 'btn-confirm';
    if (type === 'success') btnAlertOk.style.background = 'var(--success-color)';
    else if (type === 'error') btnAlertOk.style.background = 'var(--danger-color)';
    else btnAlertOk.style.background = 'var(--primary-color)';

    alertModal.classList.remove('hidden');
}

btnAlertOk.onclick = () => {
    alertModal.classList.add('hidden');
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.add('hidden');
    if (modalId === 'categoryModal' || modalId === 'itemModal') {
        document.getElementById(modalId).querySelector('form').reset();
    }
};

// ... (Restante do codigo de Item/Categoria Modal igual) ...
// Adicionar/Editar Item
const itemModal = document.getElementById('itemModal');
const itemForm = document.getElementById('itemForm');
// ... 

// ... SUBSTITUIR EM closeInventory ...
function closeInventory() {
    if (Object.keys(inventoryData).length > 0) {
        showConfirmModal(
            "Cancelar Inventário?",
            "Você vai perder toda a contagem atual.\nTem certeza?",
            "🗑️",
            () => {
                inventoryOverlay.classList.add('hidden');
            }
        );
    } else {
        inventoryOverlay.classList.add('hidden');
    }
}

// ... SUBSTITUIR EM finishInventory ...
async function finishInventory() {
    const totalCounted = Object.keys(inventoryData).length;
    let totalItems = 0;
    currentCategories.forEach(c => totalItems += (c.items ? c.items.length : 0));
    const toZero = totalItems - totalCounted;

    showConfirmModal(
        "Finalizar Contagem?",
        `✅ <b>${totalCounted}</b> itens contados\n🗑️ <b>${toZero}</b> itens serão ZERADOS.\n\nConfirmar atualização?`,
        "⚡",
        async () => {
            await executeInventoryBatch(totalCounted, toZero);
        }
    );
}

async function executeInventoryBatch(totalCounted, toZero) {
    try {
        const batch = writeBatch(db);
        let updates = {}; // catId -> newItemsArray

        // Prepara estruturas para update
        currentCategories.forEach(cat => {
            if (cat.items) {
                // Cria cópia dos items
                updates[cat.id] = cat.items.map(i => ({ ...i }));
            }
        });

        // Aplica lógica: Se contou, atualiza. Se não, zera.
        currentCategories.forEach(cat => {
            if (cat.items) {
                cat.items.forEach((item, index) => {
                    const key = `${cat.id}_${index}`;
                    if (inventoryData[key] !== undefined) {
                        updates[cat.id][index].qty = inventoryData[key];
                    } else {
                        updates[cat.id][index].qty = 0;
                    }
                });
            }
        });

        // Adiciona ao batch
        for (const [catId, items] of Object.entries(updates)) {
            const ref = doc(db, "estoque", catId);
            batch.update(ref, { items: items });
        }

        await batch.commit();
        showAlertModal("Sucesso!", "Inventário finalizado com sucesso!", "success");
        inventoryOverlay.classList.add('hidden');

    } catch (e) {
        console.error(e);
        showAlertModal("Erro", "Erro ao salvar inventário.", "error");
    }
}

// Adicionar/Editar Item (Já declarado acima)
// const itemModal = document.getElementById('itemModal');
// const itemForm = document.getElementById('itemForm');

function openItemModal(categoryId, index = null, itemData = null) {
    document.getElementById('itemCategoryId').value = categoryId;
    document.getElementById('itemIndex').value = index !== null ? index : '';
    document.getElementById('modalTitle').textContent = index !== null ? 'Editar Item' : 'Adicionar Item';

    document.getElementById('itemNameInput').value = itemData ? itemData.name : '';
    document.getElementById('itemQtyInput').value = itemData ? itemData.qty : '0';

    itemModal.classList.remove('hidden');
    setTimeout(() => document.getElementById('itemNameInput').focus(), 100);
}

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoryId = document.getElementById('itemCategoryId').value;
    const index = document.getElementById('itemIndex').value;
    const name = document.getElementById('itemNameInput').value;
    const qty = Number(document.getElementById('itemQtyInput').value);

    try {
        const catRef = doc(db, "estoque", categoryId);
        const category = currentCategories.find(c => c.id === categoryId);
        let newItems = [...category.items];

        if (index !== '') {
            newItems[index] = { ...newItems[index], name, qty };
        } else {
            newItems.push({ id: Date.now().toString(), name, qty });
        }

        await updateDoc(catRef, { items: newItems });
        closeModal('itemModal');
    } catch (error) {
        showAlertModal("Erro", "Erro ao salvar item.", "error");
    }
});

async function deleteItem(categoryId, index) {
    showConfirmModal(
        "Excluir Item?",
        "Tem certeza que deseja remover este item?",
        "🗑️",
        async () => {
            try {
                const catRef = doc(db, "estoque", categoryId);
                const category = currentCategories.find(c => c.id === categoryId);
                let newItems = category.items.filter((_, i) => i !== index);
                await updateDoc(catRef, { items: newItems });
            } catch (e) {
                showAlertModal("Erro", "Erro ao deletar item.", "error");
            }
        }
    );
}

// Adicionar Categoria
addCategoryFab.addEventListener('click', () => {
    document.getElementById('categoryModal').classList.remove('hidden');
    setTimeout(() => document.getElementById('categoryNameInput').focus(), 100);
});

document.getElementById('categoryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('categoryNameInput').value;
    try {
        const id = title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15) + '_' + Date.now();
        const order = currentCategories.length + 1;

        await setDoc(doc(db, "estoque", id), {
            title,
            order,
            items: []
        });
        closeModal('categoryModal');
    } catch (e) {
        showAlertModal("Erro", "Erro ao criar categoria.", "error");
    }
});

async function deleteCategory(categoryId) {
    showConfirmModal(
        "Excluir Categoria?",
        "⚠️ <b>ATENÇÃO:</b> Isso apagará a categoria e TODOS os itens nela.\n\nContinuar?",
        "🗑️",
        async () => {
            try {
                await deleteDoc(doc(db, "estoque", categoryId));
            } catch (e) {
                showAlertModal("Erro", "Erro ao deletar categoria.", "error");
            }
        }
    );
}

// ==========================================
// WHATSAPP REPORT (COM PREVIEW)
// ==========================================

whatsappBtn.addEventListener('click', prepareWhatsAppReport);
confirmSendWhatsapp.addEventListener('click', sendWhatsAppReport);

function prepareWhatsAppReport() {
    const today = new Date();
    const dataStr = today.toLocaleDateString('pt-BR');
    let message = `📝 *RELATÓRIO DE ESTOQUE - ${dataStr}*\n`;
    const hora = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    message += `⏰ Gerado às: ${hora}\n\n`;

    message += "*RESUMO GERAL DO ESTOQUE:*\n";

    let hasItems = false;
    let criticalItems = [];

    currentCategories.forEach(cat => {
        if (cat.items && cat.items.length > 0) {
            hasItems = true;
            message += `\n📂 *${cat.title}*\n`;

            cat.items.forEach(item => {
                const alertEmoji = item.qty === 0 ? " 🔴" : (item.qty === 1 ? " ⚠️" : "");
                // Format (X) apenas no relatório
                message += `   • ${item.name}: (${item.qty})${alertEmoji}\n`;

                if (item.qty <= 1) {
                    criticalItems.push({ name: item.name, qty: item.qty });
                }
            });
        }
    });

    if (!hasItems) message += "\n(Nenhum item cadastrado)";

    if (criticalItems.length > 0) {
        message += "\n\n🚨 *ITENS PARA COMPRA / REPOSIÇÃO (<= 1):*\n";
        criticalItems.forEach(item => {
            const statusIcon = item.qty === 0 ? "❌" : "⚠️";
            message += `   ${statusIcon} ${item.name} (${item.qty})\n`;
        });
    }

    message += "\n\n------------------\n_açai sabor da terra_";

    // Mostra Preview
    pendingWhatsappMessage = message;
    whatsappPreviewArea.textContent = message;
    previewModal.classList.remove('hidden');
}

function sendWhatsAppReport() {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(pendingWhatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    closeModal('previewModal');
}

// --- Seed Backup ---
async function seedDatabase() {
    const INITIAL_DATA = {
        "chocolates": {
            title: "🍫 Chocolates e Doces",
            order: 1,
            items: [
                { id: "mm", name: "M&M", qty: 4 },
                { id: "marshmallow", name: "Marshmallow", qty: 3 },
                { id: "chocoball", name: "Chocoball", qty: 2 }
            ]
        }
    };
}

refreshBtn.addEventListener('click', () => location.reload());
