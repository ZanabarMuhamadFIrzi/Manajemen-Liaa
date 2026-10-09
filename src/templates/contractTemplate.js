// Template Surat Perjanjian Kerja Sama

export const generateContractHTML = (data) => {
  const {
    // Pihak Pertama (Pemilik)
    ownerName = 'Danu Umbara',
    ownerAddress = 'JL. Delta Barat 13 Blok C No.150 Delta Pakayon Jaya Rt004 Rw 007 Kec. Bekasi Selatan',
    
    // Pihak Kedua (Penyewa)
    tenantName,
    tenantKTP,
    tenantAddress,
    
    // Detail Unit & Sewa
    contractDate,
    unitNumber,
    unitFloor,
    unitSize = '36',
    rentalType, // 'bulanan' atau 'harian'
    monthlyRate = 2500000,
    dailyRate = 200000,
    startDate,
    endDate,
  } = data;

  // Format tanggal Indonesia
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  return `
    <div style="font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 12pt;">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0; font-size: 14pt; font-weight: bold;">PERJANJIAN KERJA SAMA</h2>
      </div>

      <!-- Bismillah -->
      <div style="text-align: center; margin-bottom: 20px; font-style: italic;">
        <p>Bismillaahirrahmaanirrahiim</p>
      </div>

      <!-- Pembukaan -->
      <p style="text-align: justify;">
        Pada hari ini, <strong>${formatDate(contractDate)}</strong>, kami yang bertanda tangan di bawah ini:
      </p>

      <!-- Pihak Pertama -->
      <div style="margin: 20px 0; padding-left: 20px;">
        <p style="margin: 5px 0;">
          <strong>1. ${ownerName}</strong>, beralamat di ${ownerAddress}, selanjutnya disebut sebagai <strong>PIHAK PERTAMA</strong>
        </p>
      </div>

      <!-- Pihak Kedua -->
      <div style="margin: 20px 0; padding-left: 20px;">
        <p style="margin: 5px 0;">
          <strong>2. ${tenantName}</strong>, pribadi dengan nomor KTP <strong>${tenantKTP}</strong>, beralamat di ${tenantAddress}, selanjutnya disebut sebagai <strong>PIHAK KEDUA</strong>
        </p>
      </div>

      <p style="text-align: justify;">
        bersepakat membuat kerjasama penyewaan unit apartemen dengan ketentuan-ketentuan sebagai berikut:
      </p>

      <!-- Pasal 1 -->
      <div style="margin: 25px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">Pasal 1: Bentuk Kerjasama</p>
        <p style="text-align: justify; padding-left: 20px;">
          PIHAK PERTAMA sebagai pemilik unit apartemen di <strong>The Edge Superblock lantai ${unitFloor} nomor ${unitNumber}</strong> berukuran <strong>${unitSize} meter persegi semi gross</strong> memberikan kuasa kepada PIHAK KEDUA untuk memasarkan dan menyewakan unit apartemen kepada pihak ketiga.
        </p>
      </div>

      <!-- Pasal 2 -->
      <div style="margin: 25px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">Pasal 2: Jangka Waktu Sewa</p>
        <p style="text-align: justify; padding-left: 20px;">
          Jangka waktu kerja sama tidak ditentukan untuk jangka waktu tertentu. Masa kerja sama mengikuti masa sewa unit oleh penyewa, baik harian maupun bulanan. Perpanjangan kerja sama dapat dilakukan berdasarkan kesepakatan KEDUA PIHAK.
        </p>
      </div>

      <!-- Pasal 3 -->
      <div style="margin: 25px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">Pasal 3: Tarif</p>
        <p style="text-align: justify; padding-left: 20px;">
          PIHAK PERTAMA menyediakan dua alternatif skema sewa dengan ketentuan masing-masing sebagai berikut:
        </p>
        <div style="padding-left: 40px; margin-top: 15px;">
          <p style="margin: 10px 0;"><strong>a. Sewa Bulanan</strong></p>
          <ul style="list-style-type: disc; padding-left: 20px;">
            <li>Tarif sewa per kamar per bulan <strong>Rp ${formatCurrency(monthlyRate)}</strong> dan dibayarkan dimuka</li>
            <li>Tarif tidak termasuk service charge dan listrik</li>
          </ul>
          
          <p style="margin: 10px 0; margin-top: 15px;"><strong>b. Sewa Harian</strong></p>
          <ul style="list-style-type: disc; padding-left: 20px;">
            <li>Tarif sewa harian <strong>Rp ${formatCurrency(dailyRate)}</strong></li>
            <li>Tarif termasuk service charge dan listrik</li>
          </ul>
        </div>
      </div>

      <!-- Pasal 4 -->
      <div style="margin: 25px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">Pasal 4: Hak dan Kewajiban Pihak Kedua</p>
        
        <p style="padding-left: 20px; margin-top: 15px;"><strong>Hak-hak PIHAK KEDUA:</strong></p>
        <ol style="padding-left: 40px;">
          <li style="margin: 5px 0;">Berhak memasarkan dan menentukan tarif bagi tamu sehingga mendapat keuntungan yang layak dengan tidak melakukan perbuatan yang melanggar hukum</li>
          <li style="margin: 5px 0;">Berhak untuk memanfaatkan rumah/unit beserta segala fasilitas di dalamnya untuk kepentingannya</li>
        </ol>

        <p style="padding-left: 20px; margin-top: 15px;"><strong>Kewajiban PIHAK KEDUA:</strong></p>
        <ol style="padding-left: 40px;">
          <li style="margin: 5px 0;">Memelihara unit apartemen beserta seluruh fasilitas yang dipergunakan agar hingga dikembalikan kepada PIHAK PERTAMA dalam keadaan baik seperti semula</li>
          <li style="margin: 5px 0;">Membayarkan total penerimaan bagi pihak pertama sesuai tarif yang tercantum di pasal 3</li>
          <li style="margin: 5px 0;">Membayarkan tagihan listrik setiap bulan untuk sewa bulanan</li>
          <li style="margin: 5px 0;">Membayarkan service charge setiap bulan untuk sewa bulanan</li>
        </ol>
      </div>

      <!-- Pasal 5 -->
      <div style="margin: 25px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">Pasal 5: Cara Pembayaran</p>
        <ol style="padding-left: 40px;">
          <li style="margin: 5px 0;">Biaya sewa dibayarkan secara tunai atau transfer oleh PIHAK KEDUA dan diterima PIHAK PERTAMA</li>
          <li style="margin: 5px 0;">Pembayaran dilakukan di awal bulan untuk sewa bulanan</li>
        </ol>
      </div>

      <!-- Pasal 6 -->
      <div style="margin: 25px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">Pasal 6: Penyelesaian Perselisihan</p>
        <ol style="padding-left: 40px;">
          <li style="margin: 5px 0;">Jika terdapat perselisihan di kemudian hari tentang perjanjian ini, maka KEDUA PIHAK akan melakukan musyawarah</li>
        </ol>
      </div>

      <!-- Pasal 7 -->
      <div style="margin: 25px 0;">
        <p style="font-weight: bold; margin-bottom: 10px;">Pasal 7: Penutup</p>
        <p style="text-align: justify; padding-left: 20px;">
          Perjanjian ini dibuat rangkap dua untuk masing-masing pihak. Jika di kemudian hari ditemukan kekurangan dalam perjanjian ini, maka akan dibuat amandemen untuk penyempurnaannya.
        </p>
      </div>

      <!-- Tanda Tangan -->
      <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 45%;">
          <p style="margin-bottom: 80px;"><strong>PIHAK PERTAMA</strong></p>
          <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
            <strong>(${ownerName})</strong>
          </p>
        </div>
        
        <div style="text-align: center; width: 45%;">
          <p style="margin-bottom: 80px;"><strong>PIHAK KEDUA</strong></p>
          <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
            <strong>(${tenantName})</strong>
          </p>
        </div>
      </div>

    </div>
  `;
};
