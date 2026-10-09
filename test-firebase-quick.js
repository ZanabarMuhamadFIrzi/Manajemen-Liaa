#!/usr/bin/env node

// Quick Firebase test - langsung dari terminal
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDLZmMzODVnZCDQZT8iLWFYYWQtNjQzN2ZYTYzYTAz",
  authDomain: "apartemen-management.firebaseapp.com",
  databaseURL: "https://apartemen-management-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "apartemen-management",
  storageBucket: "apartemen-management.firebasestorage.app",
  messagingSenderId: "1097966180816",
  appId: "1:1097966180816:web:8098f2dd75cfed9659b1d5"
};

console.log('🔄 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log('📡 Database URL:', firebaseConfig.databaseURL);
console.log('');

// Test dengan get()
console.log('📥 Testing get() method...');
const startTime = Date.now();

const unitsRef = ref(database, 'units');

get(unitsRef)
  .then((snapshot) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const count = Object.keys(data).length;
      console.log(`✅ SUCCESS! Loaded ${count} units in ${elapsed} seconds`);
      console.log('');
      
      // Show first 3 units
      const sample = Object.entries(data).slice(0, 3);
      console.log('📋 Sample data:');
      sample.forEach(([id, unit]) => {
        console.log(`  - Unit ${unit.unitNumber}: ${unit.status}`);
      });
      
      if (elapsed > 2) {
        console.log('');
        console.log('⚠️  WARNING: Loading took more than 2 seconds!');
        console.log('   This could indicate:');
        console.log('   1. Slow internet connection');
        console.log('   2. Firebase server issues');
        console.log('   3. Complex Firebase Rules');
      }
    } else {
      console.log(`❌ Database is empty (${elapsed}s)`);
    }
    
    process.exit(0);
  })
  .catch((error) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ FAILED after ${elapsed} seconds`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log('');
    console.log('Possible causes:');
    console.log('1. No internet connection');
    console.log('2. Firebase Rules blocking access');
    console.log('3. Invalid Firebase configuration');
    console.log('4. Network firewall blocking Firebase');
    
    process.exit(1);
  });

// Timeout after 10 seconds
setTimeout(() => {
  console.log('');
  console.log('❌ TIMEOUT after 10 seconds');
  console.log('   Firebase tidak merespon!');
  console.log('');
  console.log('Action items:');
  console.log('1. Cek koneksi internet');
  console.log('2. Coba pakai VPN jika ada firewall');
  console.log('3. Cek Firebase Console untuk status server');
  process.exit(1);
}, 10000);
