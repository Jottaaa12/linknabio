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
        this.funcionariosCollectionName = 'funcionarios';
        this.avisosCollectionName = 'avisos';
        this.unsubscribeFuncionarios = null;
        this.unsubscribeAvisos = null;
    }

    // Configura listener em tempo real para a coleção de funcionários
    setupFuncionariosListener(callback) {
        if (this.unsubscribeFuncionarios) {
            this.unsubscribeFuncionarios();
        }

        try {
            const q = query(
                collection(this.db, this.funcionariosCollectionName),
                orderBy("dataCriacao", "desc")
            );

            this.unsubscribeFuncionarios = onSnapshot(q, (querySnapshot) => {
                const funcionarios = [];
                querySnapshot.forEach((doc) => {
                    funcionarios.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(funcionarios);
            }, (error) => {
                console.error("Erro no listener de funcionários:", error);
                callback([], error);
            });

            return this.unsubscribeFuncionarios;
        } catch (error) {
            console.error("Erro ao configurar listener de funcionários:", error);
            callback([], error);
        }
    }

    // Cria um novo funcionário
    async createFuncionario(data) {
        try {
            const funcionarioData = {
                nomeCompleto: data.nomeCompleto,
                email: data.email,
                cargo: data.cargo,
                chavePix: data.chavePix,
                status: "pendente",
                dataCriacao: Timestamp.now()
            };

            const docRef = await addDoc(collection(this.db, this.funcionariosCollectionName), funcionarioData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar funcionário:", error);
            throw new Error("Falha ao criar funcionário. Tente novamente.");
        }
    }

    // Atualiza um funcionário existente
    async updateFuncionario(id, data) {
        try {
            const funcionarioData = {
                nomeCompleto: data.nomeCompleto,
                email: data.email,
                cargo: data.cargo,
                chavePix: data.chavePix,
                status: data.status
            };

            const docRef = doc(this.db, this.funcionariosCollectionName, id);
            await updateDoc(docRef, funcionarioData);
            return { success: true };
        } catch (error) {
            console.error("Erro ao atualizar funcionário:", error);
            throw new Error("Falha ao atualizar funcionário. Tente novamente.");
        }
    }

    // Exclui um funcionário
    async deleteFuncionario(id) {
        try {
            const docRef = doc(this.db, this.funcionariosCollectionName, id);
            await deleteDoc(docRef);
            return { success: true };
        } catch (error) {
            console.error("Erro ao excluir funcionário:", error);
            throw new Error("Falha ao excluir funcionário. Tente novamente.");
        }
    }

    // Adiciona um registro de ponto para um funcionário
    async addRegistroDePonto(funcionarioId, registroData) {
        try {
            const registroDePontoData = {
                data: registroData.data,
                tipo: registroData.tipo,
                observacao: registroData.observacao
            };

            const docRef = await addDoc(collection(this.db, this.funcionariosCollectionName, funcionarioId, 'registroDePonto'), registroDePontoData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao adicionar registro de ponto:", error);
            throw new Error("Falha ao adicionar registro de ponto. Tente novamente.");
        }
    }

    // Configura listener em tempo real para a coleção de avisos
    setupAvisosListener(callback) {
        if (this.unsubscribeAvisos) {
            this.unsubscribeAvisos();
        }

        try {
            const q = query(
                collection(this.db, this.avisosCollectionName),
                orderBy("dataCriacao", "desc")
            );

            this.unsubscribeAvisos = onSnapshot(q, (querySnapshot) => {
                const avisos = [];
                querySnapshot.forEach((doc) => {
                    avisos.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(avisos);
            }, (error) => {
                console.error("Erro no listener de avisos:", error);
                callback([], error);
            });

            return this.unsubscribeAvisos;
        } catch (error) {
            console.error("Erro ao configurar listener de avisos:", error);
            callback([], error);
        }
    }

    // Cria um novo aviso
    async createAviso(data) {
        try {
            const avisoData = {
                titulo: data.titulo,
                mensagem: data.mensagem,
                autor: data.autor,
                dataCriacao: Timestamp.now()
            };

            const docRef = await addDoc(collection(this.db, this.avisosCollectionName), avisoData);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Erro ao criar aviso:", error);
            throw new Error("Falha ao criar aviso. Tente novamente.");
        }
    }

    // Remove os listeners em tempo real
    cleanup() {
        if (this.unsubscribeFuncionarios) {
            this.unsubscribeFuncionarios();
            this.unsubscribeFuncionarios = null;
        }
        if (this.unsubscribeAvisos) {
            this.unsubscribeAvisos();
            this.unsubscribeAvisos = null;
        }
    }
}