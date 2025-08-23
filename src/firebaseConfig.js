// Firebase config and initialization for Storage
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4ZgSoKoq_0_1-drhHfeHUR2pznR6LbDs",
  authDomain: "staff-performance-appraisal.firebaseapp.com",
  databaseURL:
    "https://staff-performance-appraisal-default-rtdb.firebaseio.com",
  projectId: "staff-performance-appraisal",
  storageBucket: "staff-performance-appraisal.appspot.com",
  messagingSenderId: "345808602944",
  appId: "1:345808602944:web:a9e30b76fdbd8892f05ca5",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
