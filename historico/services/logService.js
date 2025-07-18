import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export class LogService {
    constructor(db) {
        this.db = db;
        this.collectionName = 'systemLogs';
    }

    async addLog(action, details, status = 'info') {
        try {
            const logData = {
                timestamp: Timestamp.now(),
                action: action,
                details: details,
                status: status, // 'info', 'success', 'warning', 'error'
                userAgent: navigator.userAgent,
                page: window.location.pathname
            };

            await addDoc(collection(this.db, this.collectionName), logData);
        } catch (error) {
            console.error("Erro ao adicionar log:", error);
        }
    }

    async getLogs(maxLogs = 100) {
        try {
            const q = query(
                collection(this.db, this.collectionName),
                orderBy("timestamp", "desc"),
                limit(maxLogs)
            );

            const querySnapshot = await getDocs(q);
            const logs = [];
            
            querySnapshot.forEach((doc) => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return logs;
        } catch (error) {
            console.error("Erro ao buscar logs:", error);
            return [];
        }
    }

    formatLogTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString('pt-BR', { 
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
} 