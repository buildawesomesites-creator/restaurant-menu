
// auth-bridge.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export function listenToAuth(onUpdate) {
    onAuthStateChanged(auth, async (user) => {
        console.log("DEBUG: Auth State Changed. User:", user ? user.uid : "None");
        
        if (user) {
            try {
                // 1. Try to find the user in the 'admins' collection first
                let snap = await getDoc(doc(db, "admins", user.uid));
                let role = "admin"; // Assume admin if found here

                // 2. If not found in 'admins', check the 'users' collection
                if (!snap.exists()) {
                    snap = await getDoc(doc(db, "users", user.uid));
                    role = snap.exists() ? snap.data().role : "buyer";
                }
                
                if (snap.exists()) {
                    console.log("DEBUG: Document found. Role:", role);
                    onUpdate({ 
                        isLoggedIn: true, 
                        name: snap.data().name,
                        role: role
                    });
                } else {
                    console.warn("DEBUG: Authenticated but NO document found for UID:", user.uid);
                    onUpdate({ isLoggedIn: true, name: "User", role: "buyer" });
                }
            } catch (err) {
                console.error("DEBUG: Error fetching document:", err);
                onUpdate({ isLoggedIn: true, name: "User", role: "buyer" });
            }
        } else {
            console.log("DEBUG: No user detected.");
            onUpdate({ isLoggedIn: false });
        }
    });
}
