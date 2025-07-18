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
        this.collectionName = 'registrosDiarios';
        this.unsubscribe = null;
        this.listeners = [];
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
                orderBy("timestamp", "desc")
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
    async createRecord(data) {
        try {
            const dataString = data.data;
            const [year, month, day] = dataString.split('-');
            const dataUTC = new Date(Date.UTC(year, month - 1, day));

            const recordData = {
                data: dataString,
                timestamp: Timestamp.fromDate(dataUTC),
                funcionario: data.funcionario,
                dinheiroEntrada: parseFloat(data.dinheiroEntrada) || 0,
                pixEntrada: parseFloat(data.pixEntrada) || 0,
                cartaoEntrada: parseFloat(data.cartaoEntrada) || 0,
                totalSaidas: parseFloat(data.totalSaidas) || 0,
                observacao: data.observacao || '',
                tipoLancamento: 'regular'
            };

            const docRef = await addDoc(collection(this.db, this.collectionName), recordData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar registro:", error);
            throw new Error("Falha ao criar registro. Tente novamente.");
        }
    }

    // Atualiza um registro existente
    async updateRecord(id, data) {
        try {
            const dataString = data.data;
            const [year, month, day] = dataString.split('-');
            const dataUTC = new Date(Date.UTC(year, month - 1, day));

            const recordData = {
                data: dataString,
                timestamp: Timestamp.fromDate(dataUTC),
                funcionario: data.funcionario,
                dinheiroEntrada: parseFloat(data.dinheiroEntrada) || 0,
                pixEntrada: parseFloat(data.pixEntrada) || 0,
                cartaoEntrada: parseFloat(data.cartaoEntrada) || 0,
                totalSaidas: parseFloat(data.totalSaidas) || 0,
                observacao: data.observacao || '',
                tipoLancamento: 'regular'
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

    // Remove o listener em tempo real
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }

    // Cria uma entrada individual
    async createIndividualEntry(data) {
        try {
            const dataString = data.data;
            const [year, month, day] = dataString.split('-');
            const dataUTC = new Date(Date.UTC(year, month - 1, day));

            // Prepara os dados baseados no tipo de entrada
            let recordData = {
                data: dataString,
                timestamp: Timestamp.fromDate(dataUTC),
                funcionario: data.funcionario,
                dinheiroEntrada: 0,
                pixEntrada: 0,
                cartaoEntrada: 0,
                totalSaidas: 0,
                observacao: data.observacao || '',
                tipoLancamento: 'individual'
            };

            // Define o valor no campo correto baseado no tipo
            switch (data.tipo) {
                case 'dinheiro':
                    recordData.dinheiroEntrada = parseFloat(data.valor) || 0;
                    break;
                case 'pix':
                    recordData.pixEntrada = parseFloat(data.valor) || 0;
                    break;
                case 'cartao':
                    recordData.cartaoEntrada = parseFloat(data.valor) || 0;
                    break;
                default:
                    throw new Error('Tipo de entrada inválido');
            }

            const docRef = await addDoc(collection(this.db, this.collectionName), recordData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar entrada individual:", error);
            throw new Error("Falha ao criar entrada individual. Tente novamente.");
        }
    }

    // Cria uma saída individual
    async createIndividualExit(data) {
        try {
            const dataString = data.data;
            const [year, month, day] = dataString.split('-');
            const dataUTC = new Date(Date.UTC(year, month - 1, day));

            // Prepara os dados baseados no tipo de saída
            let recordData = {
                data: dataString,
                timestamp: Timestamp.fromDate(dataUTC),
                funcionario: data.funcionario,
                dinheiroEntrada: 0,
                pixEntrada: 0,
                cartaoEntrada: 0,
                totalSaidas: parseFloat(data.valor) || 0,
                observacao: data.observacao || '',
                tipoLancamento: 'individual',
                tipoSaida: data.tipo
            };

            // Não preenche nenhum campo de entrada para saída individual
            // Apenas totalSaidas recebe o valor

            const docRef = await addDoc(collection(this.db, this.collectionName), recordData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar saída individual:", error);
            throw new Error("Falha ao criar saída individual. Tente novamente.");
        }
    }
} 