import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { FirestoreService } from "./services/firestoreService.js";
import { UIManager } from "./ui/uiManager.js";

document.addEventListener("DOMContentLoaded", () => {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const firestoreService = new FirestoreService(db);
    const uiManager = new UIManager(firestoreService);

    uiManager.init();
});