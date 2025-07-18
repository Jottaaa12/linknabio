import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    Timestamp,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class FirestoreService {
    constructor(db) {
        this.db = db;
        this.collectionName = 'fiados';
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
                const fiados = [];
                querySnapshot.forEach((doc) => {
                    fiados.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(fiados);
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

    // Cria um novo fiado
    async createFiado(data) {
        try {
            const fiadoData = {
                cliente: data.cliente,
                telefone: data.telefone || '',
                data: data.data,
                valor: parseFloat(data.valor) || 0,
                produto: data.produto || '',
                observacoes: data.observacoes || '',
                status: data.status || 'Pendente',
                dataPagamento: data.dataPagamento || null,
                dataCriacao: Timestamp.now(),
                dataAtualizacao: Timestamp.now()
            };

            const docRef = await addDoc(collection(this.db, this.collectionName), fiadoData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar fiado:", error);
            throw new Error("Falha ao criar fiado. Tente novamente.");
        }
    }

    // Atualiza um fiado existente
    async updateFiado(id, data) {
        try {
            const fiadoData = {
                cliente: data.cliente,
                telefone: data.telefone || '',
                data: data.data,
                valor: parseFloat(data.valor) || 0,
                produto: data.produto || '',
                observacoes: data.observacoes || '',
                status: data.status || 'Pendente',
                dataPagamento: data.dataPagamento || null,
                dataAtualizacao: Timestamp.now()
            };

            const docRef = doc(this.db, this.collectionName, id);
            await updateDoc(docRef, fiadoData);
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar fiado:", error);
            throw new Error("Falha ao atualizar fiado. Tente novamente.");
        }
    }

    // Exclui um fiado
    async deleteFiado(id) {
        try {
            const docRef = doc(this.db, this.collectionName, id);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            console.error("Erro ao excluir fiado:", error);
            throw new Error("Falha ao excluir fiado. Tente novamente.");
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