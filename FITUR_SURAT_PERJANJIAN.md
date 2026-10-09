# 📄 Fitur Surat Perjanjian Kerja Sama

## ✅ Status: IMPLEMENTASI SELESAI

Fitur surat perjanjian telah berhasil diimplementasikan ke dalam aplikasi Manajemen Apartemen!

---

## 🎯 Fitur yang Sudah Ada

### 1. **Halaman Daftar Perjanjian** (`/contracts`)
- ✅ Lihat semua surat perjanjian yang pernah dibuat
- ✅ Search perjanjian by nama, KTP, atau nomor unit
- ✅ Total perjanjian counter
- ✅ Preview singkat data perjanjian
- ✅ Hapus perjanjian

### 2. **Form Buat Perjanjian Baru**
- ✅ Modal form yang user-friendly
- ✅ Auto-fill data pemilik (Pihak Pertama)
- ✅ Input data penyewa:
  - Nama lengkap
  - Nomor KTP
  - Alamat lengkap
- ✅ Input data unit:
  - Nomor unit
  - Lantai
  - Ukuran (default 36m²)
- ✅ Pilih jenis sewa (Bulanan/Harian)
- ✅ Tanggal perjanjian
- ✅ Validasi form
- ✅ Simpan ke Firebase

### 3. **Preview & PDF Generator** (`/contracts/view/:id`)
- ✅ Preview perjanjian dengan format resmi
- ✅ Template sesuai format asli Anda
- ✅ Download sebagai PDF
- ✅ Print langsung
- ✅ Responsive design

### 4. **Template Profesional**
- ✅ Format sesuai surat perjanjian asli
- ✅ Bismillah di awal
- ✅ 7 Pasal lengkap:
  - Pasal 1: Bentuk Kerjasama
  - Pasal 2: Jangka Waktu Sewa
  - Pasal 3: Tarif (Bulanan & Harian)
  - Pasal 4: Hak dan Kewajiban
  - Pasal 5: Cara Pembayaran
  - Pasal 6: Penyelesaian Perselisihan
  - Pasal 7: Penutup
- ✅ Tanda tangan kedua pihak
- ✅ Format tanggal Indonesia

### 5. **Navigasi**
- ✅ Menu "Perjanjian" di bottom navigation
- ✅ Icon surat kontrak (📄)
- ✅ Route lengkap

---

## 📋 Cara Menggunakan

### **Membuat Perjanjian Baru:**

1. Buka menu **Perjanjian** di bottom nav
2. Klik tombol **+** di kanan atas
3. Isi form:
   - Data penyewa (nama, KTP, alamat)
   - Nomor unit & lantai
   - Pilih jenis sewa (bulanan/harian)
4. Klik **"Buat Perjanjian"**
5. Perjanjian otomatis terbuka di tab baru untuk preview

### **Melihat & Download Perjanjian:**

1. Di halaman Perjanjian, klik tombol **"Lihat"** pada perjanjian
2. Preview perjanjian akan terbuka
3. Pilih:
   - **Print** untuk cetak langsung
   - **Download PDF** untuk simpan sebagai file PDF

### **Menghapus Perjanjian:**

1. Di halaman Perjanjian, klik icon **🗑️** (trash)
2. Konfirmasi penghapusan
3. Perjanjian akan terhapus dari database

---

## 🎨 Contoh Use Case

### **Skenario 1: Penyewa Baru Bulanan**
```
1. Client booking unit baru
2. Perlu buat surat perjanjian
3. Buka menu Perjanjian → + Buat Baru
4. Isi data penyewa: "Emiliawati"
5. KTP: 3277016108800027
6. Unit: 1502, Lantai 15
7. Pilih: Bulanan
8. Klik Buat → PDF siap di-download!
```

### **Skenario 2: Penyewa Harian (Tanpa Perjanjian)**
```
- Client booking harian singkat
- TIDAK perlu buat perjanjian
- Langsung booking saja via menu Booking
```

### **Skenario 3: Review Perjanjian Lama**
```
1. Buka menu Perjanjian
2. Search nama penyewa
3. Klik "Lihat"
4. Review detail perjanjian
```

---

## 💾 Data yang Tersimpan

Setiap perjanjian menyimpan:
```javascript
{
  id: "auto-generated-id",
  
  // Pihak Pertama (Pemilik)
  ownerName: "Danu Umbara",
  ownerAddress: "JL. Delta Barat 13...",
  
  // Pihak Kedua (Penyewa)
  tenantName: "Emiliawati",
  tenantKTP: "3277016108800027",
  tenantAddress: "Jl. Baros Utama...",
  
  // Detail Unit
  unitNumber: "1502",
  unitFloor: "15",
  unitSize: "36",
  
  // Detail Sewa
  contractDate: "2026-07-22",
  rentalType: "bulanan", // atau "harian"
  monthlyRate: 2500000,
  dailyRate: 200000,
  
  // Metadata
  createdAt: "2026-07-22T10:30:00.000Z"
}
```

---

## 🔧 File yang Dibuat/Diubah

### **Files Baru:**
1. `/src/pages/Contracts.jsx` - Halaman daftar perjanjian
2. `/src/pages/ContractView.jsx` - Preview & PDF generator
3. `/src/components/ContractFormModal.jsx` - Form buat perjanjian
4. `/src/templates/contractTemplate.js` - Template HTML perjanjian

### **Files Diupdate:**
1. `/src/services/firebase.js` - Tambah contract CRUD functions
2. `/src/routes/index.jsx` - Tambah route contracts
3. `/src/components/BottomNav.jsx` - Tambah menu Perjanjian

---

## 🚀 Next Steps (Optional Enhancements)

### **Fitur Tambahan yang Bisa Ditambahkan:**

1. **Quick Create dari Booking**
   - Checkbox "Buat Perjanjian?" saat booking
   - Auto-fill data dari form booking

2. **Settings Pemilik**
   - Edit data Pihak Pertama (nama, alamat)
   - Custom tarif default

3. **Template Custom**
   - Multiple template perjanjian
   - Edit pasal-pasal

4. **Digital Signature**
   - Upload tanda tangan digital
   - E-sign di aplikasi

5. **Email Perjanjian**
   - Kirim PDF via email ke penyewa
   - Auto-reminder perpanjangan

6. **Status Perjanjian**
   - Aktif, Berakhir, Diperpanjang
   - Alert menjelang expired

7. **Export Bulk**
   - Export semua perjanjian sekaligus
   - Zip file untuk backup

---

## 💡 Tips Penggunaan

1. **Tidak Semua Booking Perlu Perjanjian**
   - Harian singkat: Skip perjanjian
   - Bulanan/long-term: Buat perjanjian

2. **Simpan PDF**
   - Download PDF untuk arsip
   - Print & minta tanda tangan basah

3. **Data Akurat**
   - Pastikan KTP 16 digit benar
   - Alamat lengkap sesuai KTP

4. **Backup Regular**
   - Data tersimpan di Firebase
   - Export PDF untuk backup lokal

---

## 📞 Support

Jika ada pertanyaan atau butuh modifikasi:
1. Cek dokumentasi ini dulu
2. Test di aplikasi
3. Request perubahan jika perlu

**Fitur siap digunakan!** 🎉
