import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    confirmPasswordReset 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Helper to ensure Firebase is ready
const waitForAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
        // Timeout if Firebase takes too long
        setTimeout(resolve, 3000);
    });
};

// Sign Up & Create User Profile
export async function signUp(email, password, name, role = "buyer") {
    try {
        await waitForAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
            role: role,
            createdAt: new Date().toISOString()
        });

        return { success: true, user };
    } catch (error) {
        console.error("Sign Up Error:", error);
        return { success: false, message: error.message };
    }
}

// Login
export async function login(email, password) {
    try {
        await waitForAuth();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, message: error.message };
    }
}

// Logout
export async function logout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Logout Error:", error);
        return { success: false, message: error.message };
    }
}

// Get User Role
export async function getUserRole(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().role : null;
    } catch (error) {
        console.error("Get Role Error:", error);
        return null;
    }
}

// Password Reset
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "Check your email for the reset link." };
    } catch (error) {
        console.error("Reset Password Error:", error);
        return { success: false, message: error.message };
    }
}

// Finalize Password Reset
export async function finalizeReset(oobCode, newPassword) {
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        return { success: true, message: "Password updated successfully." };
    } catch (error) {
        console.error("Finalize Reset Error:", error);
        return { success: false, message: error.message };
    }
}

// Export Auth Listener for UI updates
export { onAuthStateChanged };

