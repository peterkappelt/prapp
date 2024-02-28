import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBV2QeJYu44suzhebbPCyY6-LjQ3AFQ6EM",
  authDomain: "prapp-a04b0.firebaseapp.com",
  projectId: "prapp-a04b0",
  storageBucket: "prapp-a04b0.appspot.com",
  messagingSenderId: "997063427666",
  appId: "1:997063427666:web:908ef1c4c856d9ddbd018b",
};

const app = initializeApp(firebaseConfig);

export { app };
