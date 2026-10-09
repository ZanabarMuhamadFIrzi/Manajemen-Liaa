import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faImage } from '@fortawesome/free-solid-svg-icons';
import { useUnits } from '../contexts/UnitsContext';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

const Booking = () => {
  const { units, bookUnit } = useUnits();
  const { user } = useAuth(); // Get current logged-in user
  const [bookingMode, setBookingMode] = useState('now'); // 'now' or 'future'
  const [formData, setFormData] = useState({
    unitId: '',
    tenantName: '',
    phone: '',
    rentalType: 'harian', // 'harian' or 'transit'
    checkIn: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOut: '',
    checkOutTime: '',
    price: '',
    ktpImage: null,
    bookedBy: '', // Who is making this booking
  });
  const [priceDisplay, setPriceDisplay] = useState(''); // For formatted display

  // Set default bookedBy to current user's name
  useEffect(() => {
    if (user && user.name) {
      setFormData(prev => {
        // Only update if bookedBy is empty
        if (!prev.bookedBy) {
          return { ...prev, bookedBy: user.name };
        }
        return prev;
      });
    }
  }, [user?.name]); // Only depend on user.name, not formData

  // Format number with thousand separator
  const formatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Remove formatting to get raw number
  const unformatNumber = (value) => {
    return value.replace(/\./g, '');
  };

  // Handle price input with formatting
  const handlePriceChange = (e) => {
    const rawValue = unformatNumber(e.target.value);
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      setFormData({ ...formData, price: rawValue });
      setPriceDisplay(formatNumber(rawValue));
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, ktpImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get selected unit
    const selectedUnit = units.find(u => (u.firebaseId || u.id).toString() === formData.unitId);
    if (!selectedUnit) return;
    
    // For 'now' mode, check if unit is available
    if (bookingMode === 'now') {
      if (selectedUnit.status === 'terisi' || selectedUnit.status === 'booking') {
        await Swal.fire({
          title: 'Unit Tidak Tersedia',
          html: `Unit ${selectedUnit.unitNumber} sedang ${selectedUnit.status === 'terisi' ? 'terisi' : 'dibooking'} sampai:<br/>
                 <strong>${new Date(selectedUnit.tenant.checkOut).toLocaleDateString('id-ID')}</strong><br/><br/>
                 Silakan pilih unit lain atau gunakan mode "Booking Mendatang".`,
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }
    
    // For 'future' mode, check if dates conflict
    if (bookingMode === 'future') {
      if ((selectedUnit.status === 'booking' || selectedUnit.status === 'terisi') && selectedUnit.tenant) {
        const checkInDate = new Date(formData.checkIn);
        const currentCheckOut = new Date(selectedUnit.tenant.checkOut);
        checkInDate.setHours(0, 0, 0, 0);
        currentCheckOut.setHours(0, 0, 0, 0);
        
        if (checkInDate <= currentCheckOut) {
          const confirmReplace = await Swal.fire({
            title: 'Unit Sudah Terisi',
            html: `Unit ${selectedUnit.unitNumber} sudah terisi/booking sampai:<br/>
                   <strong>${new Date(selectedUnit.tenant.checkOut).toLocaleDateString('id-ID')}</strong><br/><br/>
                   Pilih tanggal check-in setelah tanggal tersebut, atau batalkan booking ini.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Batalkan & Book Sekarang',
            cancelButtonText: 'Batal'
          });
          
          if (!confirmReplace.isConfirmed) return;
        }
      }
    }
    
    // Validation
    if (formData.rentalType === 'transit') {
      if (!formData.checkInTime || !formData.checkOutTime) {
        await Swal.fire({
          title: 'Data Tidak Lengkap',
          text: 'Untuk booking transit, jam check-in dan check-out harus diisi!',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
      // For transit, checkout date is same as checkin date
      if (!formData.checkOut) {
        formData.checkOut = formData.checkIn;
      }
    } else {
      // For daily rental, checkout date is required
      if (!formData.checkOut) {
        await Swal.fire({
          title: 'Data Tidak Lengkap',
          text: 'Tanggal check-out harus diisi!',
          icon: 'error',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }
    
    const tenantData = {
      name: formData.tenantName,
      phone: formData.phone,
      checkIn: formData.checkIn,
      checkInTime: formData.checkInTime || null,
      checkOut: formData.checkOut,
      checkOutTime: formData.checkOutTime || null,
      ktpImage: formData.ktpImage,
      price: parseInt(formData.price),
      rentalType: formData.rentalType,
      bookedBy: formData.bookedBy, // Add who booked this
      bookedAt: new Date().toISOString(), // Add timestamp
    };
    
    try {
      await bookUnit(selectedUnit.firebaseId || selectedUnit.id, tenantData);
      
      await Swal.fire({
        title: 'Berhasil!',
        text: 'Booking berhasil disimpan',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
      
      // Reset form
      setFormData({
        unitId: '',
        tenantName: '',
        phone: '',
        rentalType: 'harian',
        checkIn: new Date().toISOString().split('T')[0],
        checkInTime: '',
        checkOut: '',
        checkOutTime: '',
        price: '',
        ktpImage: null,
        bookedBy: user?.name || '', // Keep current user name
      });
      setPriceDisplay('');
      setBookingMode('now'); // Reset to default mode
    } catch (error) {
      console.error('Error booking unit:', error);
      await Swal.fire({
        title: 'Gagal!',
        text: 'Gagal menyimpan booking',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white safe-top">
        <div className="px-4 pt-6 pb-6">
          <h1 className="text-2xl font-bold mb-1">Booking Baru</h1>
          <p className="text-primary-100 text-sm">SewaApartemenByLia</p>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Booking Mode Selection */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Pilih Jenis Booking
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setBookingMode('now');
                  setFormData({ ...formData, checkIn: new Date().toISOString().split('T')[0] });
                }}
                className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                  bookingMode === 'now'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">🏠</div>
                <div className="text-sm">Check-in Sekarang</div>
              </button>
              <button
                type="button"
                onClick={() => setBookingMode('future')}
                className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                  bookingMode === 'future'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <div className="text-2xl mb-1">📅</div>
                <div className="text-sm">Booking Mendatang</div>
              </button>
            </div>
            
            {/* Info Box */}
            <div className={`mt-3 p-3 rounded-xl ${
              bookingMode === 'now' 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-purple-50 border border-purple-200'
            }`}>
              <p className={`text-xs ${
                bookingMode === 'now' ? 'text-blue-700' : 'text-purple-700'
              }`}>
                {bookingMode === 'now' 
                  ? '✓ Tamu langsung check-in hari ini. Unit harus dalam status kosong.'
                  : '✓ Booking untuk tanggal masa depan. Unit akan otomatis berubah status saat tanggal check-in tiba.'
                }
              </p>
            </div>
          </div>

          {/* Unit Selection */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pilih Unit
            </label>
            <select
              value={formData.unitId}
              onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">-- Pilih Unit --</option>
              {units
                .filter(unit => {
                  // For 'now' mode, only show empty units
                  if (bookingMode === 'now') {
                    return unit.status === 'kosong';
                  }
                  // For 'future' mode, show all units
                  return true;
                })
                .sort((a, b) => parseInt(a.unitNumber) - parseInt(b.unitNumber))
                .map((unit) => {
                  let label = `Unit ${unit.unitNumber}`;
                  if (unit.status === 'terisi') {
                    label += ' (Terisi)';
                  } else if (unit.status === 'booking') {
                    label += ' (📅 Booking Mendatang)';
                  }
                  return (
                    <option key={unit.firebaseId || unit.id} value={unit.firebaseId || unit.id}>
                      {label}
                    </option>
                  );
                })}
            </select>
            
            {/* Warning untuk mode now tanpa unit kosong */}
            {bookingMode === 'now' && units.filter(u => u.status === 'kosong').length === 0 && (
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Tidak ada unit kosong. Gunakan mode "Booking Mendatang" untuk booking di masa depan.
              </p>
            )}
            
            {/* Info box untuk booking mendatang */}
            {formData.unitId && units.find(u => (u.firebaseId || u.id) === formData.unitId)?.status === 'booking' && (
              <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-xs text-purple-700">
                  <strong>📅 Unit ini sudah ada booking mendatang</strong>
                  <br />
                  Check-in: {new Date(units.find(u => (u.firebaseId || u.id) === formData.unitId)?.tenant.checkIn).toLocaleDateString('id-ID')}
                  {' - '}
                  Check-out: {new Date(units.find(u => (u.firebaseId || u.id) === formData.unitId)?.tenant.checkOut).toLocaleDateString('id-ID')}
                  <br />
                  <span className="text-purple-600">💡 Pastikan tanggal check-in Anda tidak bertabrakan!</span>
                </p>
              </div>
            )}
          </div>

          {/* Tenant Info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-900">Data Penyewa</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                placeholder="Masukkan nama penyewa (opsional)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx (opsional)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dibooking oleh
              </label>
              <input
                type="text"
                value={formData.bookedBy}
                onChange={(e) => setFormData({ ...formData, bookedBy: e.target.value })}
                placeholder="Nama staff yang input booking"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-blue-50"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Otomatis terisi dengan nama Anda ({user?.name || 'User'})
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-900">Periode Sewa</h3>
            
            {/* Rental Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipe Sewa
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rentalType: 'harian', checkInTime: '', checkOutTime: '' })}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    formData.rentalType === 'harian'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Harian
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rentalType: 'transit' })}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    formData.rentalType === 'transit'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Transit/Per Jam
                </button>
              </div>
            </div>

            {/* Harian Mode */}
            {formData.rentalType === 'harian' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Masuk
                    </label>
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Keluar
                    </label>
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Transit Mode */}
            {formData.rentalType === 'transit' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value, checkOut: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Masuk
                    </label>
                    <input
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jam Keluar
                    </label>
                    <input
                      type="time"
                      value={formData.checkOutTime}
                      onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Sewa (Rp/{formData.rentalType === 'harian' ? 'hari' : 'jam'})
              </label>
              <input
                type="text"
                value={priceDisplay}
                onChange={handlePriceChange}
                placeholder={formData.rentalType === 'harian' ? 'Contoh: 140.000' : 'Contoh: 50.000'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Harga bisa berbeda setiap booking</p>
            </div>
          </div>

          {/* KTP Upload */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Foto KTP
            </label>
            
            {!formData.ktpImage ? (
              <div className="space-y-3">
                {/* Button Kamera */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary-300 rounded-xl cursor-pointer hover:bg-primary-50 transition-colors bg-primary-50/50">
                  <FontAwesomeIcon icon={faCamera} className="text-4xl text-primary-600 mb-2" />
                  <span className="text-sm text-primary-700 font-semibold">Ambil Foto</span>
                  <span className="text-xs text-primary-600 mt-1">Buka kamera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                </label>

                {/* Button Galeri */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors bg-blue-50/50">
                  <FontAwesomeIcon icon={faImage} className="text-4xl text-blue-600 mb-2" />
                  <span className="text-sm text-blue-700 font-semibold">Pilih dari Galeri</span>
                  <span className="text-xs text-blue-600 mt-1">Pilih foto yang sudah ada</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={formData.ktpImage}
                  alt="KTP Preview"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ktpImage: null })}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all active:scale-[0.98]"
          >
            Simpan Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default Booking;
