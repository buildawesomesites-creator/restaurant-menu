import { collection, getDocs, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export async function fetchAllOrders() {
    const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ ...d.data(), docId: d.id }));
}

export async function markOrderSuccess(orderId) {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: "success" });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
