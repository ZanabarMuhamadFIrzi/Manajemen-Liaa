import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove, update } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLZmMzODVnZCDQZT8iLWFYYWQtNjQzN2ZYTYzYTAz",
  authDomain: "apartemen-management.firebaseapp.com",
  databaseURL: "https://apartemen-management-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "apartemen-management",
  storageBucket: "apartemen-management.firebasestorage.app",
  messagingSenderId: "1097966180816",
  appId: "1:1097966180816:web:8098f2dd75cfed9659b1d5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Enable offline persistence & faster queries
if (typeof window !== 'undefined') {
  // This will cache data in IndexedDB for faster loading
  console.log('🔥 Firebase Realtime Database initialized with caching');
}

// Initialize Firebase Cloud Messaging (optional, hanya jika browser support)
let messaging = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Messaging not supported:', error);
}

// Database references
export const unitsRef = ref(database, 'units');
export const employeesRef = ref(database, 'employees');
export const usersRef = ref(database, 'users');
export const contractsRef = ref(database, 'contracts');

// Get all units with realtime listener
export const subscribeToUnits = (callback, errorCallback) => {
  return onValue(
    unitsRef, 
    (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array
        const unitsArray = Object.keys(data).map(key => ({
          ...data[key],
          firebaseId: key
        }));
        console.log('✅ Firebase data loaded:', unitsArray.length, 'units');
        callback(unitsArray);
      } else {
        console.log('⚠️ No units found in Firebase');
        callback([]);
      }
    },
    (error) => {
      console.error('❌ Firebase error:', error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
};

// Add new unit
export const addUnit = async (unit) => {
  const newUnitRef = push(unitsRef);
  await set(newUnitRef, unit);
  return newUnitRef.key;
};

// Update unit
export const updateUnit = async (firebaseId, updates) => {
  const unitRef = ref(database, `units/${firebaseId}`);
  await update(unitRef, updates);
};

// Delete unit
export const deleteUnit = async (firebaseId) => {
  const unitRef = ref(database, `units/${firebaseId}`);
  await remove(unitRef);
};

// Set all units (for initial data)
export const setAllUnits = async (units) => {
  await set(unitsRef, units);
};

// Employee management
export const subscribeToEmployees = (callback) => {
  return onValue(employeesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const employeesArray = Object.keys(data).map(key => ({
        ...data[key],
        id: key
      }));
      callback(employeesArray);
    } else {
      callback([]);
    }
  });
};

export const addEmployee = async (employee) => {
  const newEmployeeRef = push(employeesRef);
  await set(newEmployeeRef, employee);
  return newEmployeeRef.key;
};

export const updateEmployee = async (id, updates) => {
  const employeeRef = ref(database, `employees/${id}`);
  await update(employeeRef, updates);
};

export const deleteEmployee = async (id) => {
  const employeeRef = ref(database, `employees/${id}`);
  await remove(employeeRef);
};

// User account management
export const addUser = async (userData) => {
  const newUserRef = push(usersRef);
  await set(newUserRef, {
    ...userData,
    createdAt: new Date().toISOString()
  });
  return newUserRef.key;
};

// Contract management
export const subscribeToContracts = (callback) => {
  return onValue(contractsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const contractsArray = Object.keys(data).map(key => ({
        ...data[key],
        id: key
      }));
      callback(contractsArray);
    } else {
      callback([]);
    }
  });
};

export const addContract = async (contractData) => {
  const newContractRef = push(contractsRef);
  await set(newContractRef, {
    ...contractData,
    createdAt: new Date().toISOString()
  });
  return newContractRef.key;
};

export const updateContract = async (id, updates) => {
  const contractRef = ref(database, `contracts/${id}`);
  await update(contractRef, updates);
};

export const deleteContract = async (id) => {
  const contractRef = ref(database, `contracts/${id}`);
  await remove(contractRef);
};

export { database };
export { database as db, app, messaging };
