import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnq60rIqon8qXhSC57RZkyt-DV5TY-RLk",
  authDomain: "awesomefoodmenu.firebaseapp.com",
  projectId: "awesomefoodmenu",
  storageBucket: "awesomefoodmenu.firebasestorage.app",
  messagingSenderId: "192451509645",
  appId: "1:192451509645:web:655fbfe1b57663f0d111c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export initialized services
export const db = getFirestore(app);
export const auth = getAuth(app);
