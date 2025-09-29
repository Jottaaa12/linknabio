import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class FirestoreService {
    constructor(db) {
        this.db = db;
        this.collectionName = 'registrosDiarios';
        this.unsubscribe = null;
    }

    // Configura listener em tempo real para a coleção
    setupRealtimeListener(callback) {
        // Remove listener anterior se existir
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        try {
            const q = query(
                collection(this.db, this.collectionName),
                orderBy("data", "desc")
            );

            this.unsubscribe = onSnapshot(q, (querySnapshot) => {
                const registros = [];
                querySnapshot.forEach((doc) => {
                    registros.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(registros);
            }, (error) => {
                console.error("Erro no listener do Firestore:", error);
                callback([], error);
            });

            return this.unsubscribe;
        } catch (error) {
            console.error("Erro ao configurar listener:", error);
            callback([], error);
        }
    }

    // Cria um novo registro
    async createRecord(formData) {
        try {
            const recordData = {
                data: formData.data,
                funcionario: formData.funcionario,
                dinheiroEntrada: parseFloat(formData.dinheiroEntrada) || 0,
                pixEntrada: parseFloat(formData.pixEntrada) || 0,
                cartaoEntrada: parseFloat(formData.cartaoEntrada) || 0,
                totalSaidas: parseFloat(formData.totalSaidas) || 0,
                observacao: formData.observacao || '',
                timestamp: Timestamp.now()
            };

            const docRef = await addDoc(collection(this.db, this.collectionName), recordData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar registro:", error);
            throw new Error("Falha ao criar registro. Tente novamente.");
        }
    }

    // Atualiza um registro existente
    async updateRecord(id, formData) {
        try {
            const recordData = {
                data: formData.data,
                funcionario: formData.funcionario,
                dinheiroEntrada: parseFloat(formData.dinheiroEntrada) || 0,
                pixEntrada: parseFloat(formData.pixEntrada) || 0,
                cartaoEntrada: parseFloat(formData.cartaoEntrada) || 0,
                totalSaidas: parseFloat(formData.totalSaidas) || 0,
                observacao: formData.observacao || '',
                timestamp: Timestamp.now()
            };

            const docRef = doc(this.db, this.collectionName, id);
            await updateDoc(docRef, recordData);
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar registro:", error);
            throw new Error("Falha ao atualizar registro. Tente novamente.");
        }
    }

    // Exclui um registro
    async deleteRecord(id) {
        try {
            const docRef = doc(this.db, this.collectionName, id);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            console.error("Erro ao excluir registro:", error);
            throw new Error("Falha ao excluir registro. Tente novamente.");
        }
    }

    // Cria entrada individual
    async createIndividualEntry(formData) {
        try {
            const individualData = {
                data: formData.data,
                funcionario: formData.funcionario,
                tipoLancamento: 'individual',
                tipoEntrada: formData.tipo,
                dinheiroEntrada: formData.tipo === 'dinheiro' ? parseFloat(formData.valor) : 0,
                pixEntrada: formData.tipo === 'pix' ? parseFloat(formData.valor) : 0,
                cartaoEntrada: formData.tipo === 'cartao' ? parseFloat(formData.valor) : 0,
                totalSaidas: 0,
                observacao: formData.observacao || '',
                timestamp: Timestamp.now()
            };

            const docRef = await addDoc(collection(this.db, this.collectionName), individualData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar entrada individual:", error);
            throw new Error("Falha ao registrar entrada individual. Tente novamente.");
        }
    }

    // Cria saída individual
    async createIndividualExit(formData) {
        try {
            const individualData = {
                data: formData.data,
                funcionario: formData.funcionario,
                tipoLancamento: 'individual',
                tipoSaida: formData.tipo,
                dinheiroEntrada: 0,
                pixEntrada: 0,
                cartaoEntrada: 0,
                totalSaidas: parseFloat(formData.valor),
                observacao: formData.observacao || '',
                timestamp: Timestamp.now()
            };

            const docRef = await addDoc(collection(this.db, this.collectionName), individualData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar saída individual:", error);
            throw new Error("Falha ao registrar saída individual. Tente novamente.");
        }
    }

    // Remove o listener em tempo real
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}
