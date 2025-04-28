import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBsTaSX17CSom91bda5v_T6_R2sdpiMVYU",
    authDomain: "strokicalendar.firebaseapp.com",
    projectId: "strokicalendar",
    storageBucket: "strokicalendar.firebasestorage.app",
    messagingSenderId: "640294886848",
    appId: "1:640294886848:web:b73ce08a65791671e03c25",
    measurementId: "G-G7PBTXLX0T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);