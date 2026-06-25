
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth }      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey : "AIzaSyDyruu_qm54El5UjIofDcVOXsQ93BFMjhY",
  authDomain : "nasij-80e90.firebaseapp.com",
  projectId : "nasij-80e90",
  storageBucket : "nasij-80e90.firebasestorage.app",
  messagingSenderId : "659949075952",
  appId : "1:659949075952:web:e302b85552bb4cb49bf135",
  measurementId : "G-9GV0XWB0DB"
};

const app = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);