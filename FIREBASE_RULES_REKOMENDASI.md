# 🔥 Firebase Realtime Database Rules - Optimasi

## 🚨 Masalah yang Mungkin Terjadi

Jika loading data sangat lambat (lebih dari 5 detik), kemungkinan:

1. **Firebase Rules terlalu kompleks** - Validasi yang rumit memperlambat query
2. **Indexing tidak optimal** - Query tanpa index bisa sangat lambat
3. **Network latency** - Koneksi ke server Firebase Asia-Southeast

## ✅ Rules yang Direkomendasikan (Fast & Secure)

Buka Firebase Console → Realtime Database → Rules, lalu gunakan:

```json
{
  "rules": {
    "units": {
      ".read": true,
      ".write": true,
      ".indexOn": ["status", "unitNumber"]
    },
    "employees": {
      ".read": true,
      ".write": true,
      ".indexOn": ["name", "employeeId"]
    },
    "users": {
      ".read": true,
      ".write": true
    },
    "attendance": {
      ".read": true,
      ".write": true,
      ".indexOn": ["date", "employeeId"]
    }
  }
}
```

### 📝 Penjelasan:

- **`.read: true`** - Semua user bisa baca (cepat, no auth check)
- **`.write: true`** - Semua user bisa tulis (untuk development)
- **`.indexOn`** - Index untuk query cepat berdasarkan field tertentu

### 🔐 Production Rules (Lebih Aman)

Untuk production, gunakan rules yang lebih strict:

```json
{
  "rules": {
    "units": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.admin === true",
      ".indexOn": ["status", "unitNumber"]
    },
    "employees": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.admin === true",
      ".indexOn": ["name", "employeeId"]
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "attendance": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["date", "employeeId"]
    }
  }
}
```

## 🎯 Cara Update Rules:

1. Buka https://console.firebase.google.com/
2. Pilih project: **apartemen-management**
3. Sidebar → **Realtime Database** → Tab **Rules**
4. Copy-paste rules di atas
5. Klik **Publish**

## 🧪 Test Setelah Update Rules:

1. Buka file `debug-firebase.html` di browser
2. Lihat hasilnya - seharusnya < 2 detik

## ⚡ Tips Performance:

1. **Gunakan indexOn** untuk field yang sering di-query
2. **Hindari deep nesting** di struktur data
3. **Limit data size** - jangan store base64 image yang besar
4. **Use pagination** untuk list yang panjang

## 📊 Monitoring Performance:

Di Firebase Console → Realtime Database → Usage, cek:
- **Concurrent connections** - max 100 untuk free tier
- **Storage** - max 1GB untuk free tier
- **Downloads** - max 10GB/bulan untuk free tier

Jika mendekati limit, loading akan lambat.
