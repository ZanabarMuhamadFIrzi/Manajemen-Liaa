import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faMapMarkerAlt, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useUnits } from '../contexts/UnitsContext';

const History = () => {
  const { units, checkoutUnit, extendBooking } = useUnits();
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [newCheckOut, setNewCheckOut] = useState('');
  const [newCheckOutTime, setNewCheckOutTime] = useState('');
  
  const bookings = units.filter(u => u.status === 'terisi');

  // Extend booking function
  const handleExtend = (unit) => {
    setSelectedUnit(unit);
    setNewCheckOut(unit.tenant?.checkOut || '');
    setNewCheckOutTime(unit.tenant?.checkOutTime || '');
    setShowExtendModal(true);
  };

  // Save extended checkout date
  const handleSaveExtend = async (e) => {
    e.preventDefault();
    
    if (!selectedUnit) return;
    
    try {
      await extendBooking(selectedUnit.firebaseId || selectedUnit.id, newCheckOut, newCheckOutTime);
      
      setShowExtendModal(false);
      setSelectedUnit(null);
      setNewCheckOut('');
      setNewCheckOutTime('');
    } catch (error) {
      console.error('Error extending booking:', error);
      alert('Gagal memperpanjang booking');
    }
  };

  // Checkout function
  const handleCheckout = async (firebaseId) => {
    if (!confirm('Yakin ingin checkout unit ini?')) return;
    
    try {
      await checkoutUnit(firebaseId);
    } catch (error) {
      console.error('Error checkout:', error);
      alert('Gagal checkout unit');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white safe-top">
        <div className="px-4 pt-6 pb-6">
          <h1 className="text-2xl font-bold mb-1">Histori Booking</h1>
          <p className="text-primary-100 text-sm">SewaApartemenByLia</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Booking Aktif</p>
              <p className="text-3xl font-bold text-primary-600">{bookings.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Bulan Ini</p>
              <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Aktif</h2>
        
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((unit) => (
              <div
                key={unit.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-3 border-b border-primary-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-lg text-primary-600" />
                      <span className="font-bold text-lg text-gray-900">
                        Unit {unit.unitNumber}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      Aktif
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faUser} className="text-xl text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Penyewa</p>
                      <p className="font-semibold text-gray-900">{unit.tenant.name || 'Tamu'}</p>
                    </div>
                  </div>

                  {unit.tenant.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faPhone} className="text-xl text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Telepon</p>
                        <p className="font-semibold text-gray-900">{unit.tenant.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-xl text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Periode</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(unit.tenant.checkIn).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {unit.tenant.checkInTime && ` ${unit.tenant.checkInTime}`}
                        {' - '}
                        {new Date(unit.tenant.checkOut).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {unit.tenant.checkOutTime && ` ${unit.tenant.checkOutTime}`}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Harga/hari</span>
                      <span className="text-xl font-bold text-primary-600">
                        Rp {((unit.tenant?.price || unit.price) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button 
                      onClick={() => alert('Detail unit: ' + unit.unitNumber)}
                      className="py-2.5 border-2 border-primary-600 text-primary-600 rounded-xl font-medium text-sm hover:bg-primary-50 transition-colors"
                    >
                      Detail
                    </button>
                    <button 
                      onClick={() => handleExtend(unit)}
                      className="py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
                    >
                      Perpanjang
                    </button>
                    <button 
                      onClick={() => handleCheckout(unit.firebaseId || unit.id)}
                      className="py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors"
                    >
                      Check-out
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-5xl text-gray-300 mb-3" />
            <p className="text-gray-500">Belum ada histori booking</p>
            <p className="text-sm text-gray-400 mt-1">Booking akan muncul di sini</p>
          </div>
        )}
      </div>

      {/* Extend Modal */}
      {showExtendModal && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Perpanjang Sewa
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Unit</div>
              <div className="font-bold text-gray-900">{selectedUnit.unitNumber}</div>
              <div className="text-sm text-gray-600 mt-2 mb-1">Penyewa</div>
              <div className="font-semibold text-gray-900">{selectedUnit.tenant?.name}</div>
            </div>

            <form onSubmit={handleSaveExtend}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Lama
                </label>
                <input
                  type="date"
                  value={selectedUnit.tenant?.checkOut || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Baru (Perpanjang)
                </label>
                <input
                  type="date"
                  value={newCheckOut}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  min={selectedUnit.tenant?.checkOut || ''}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Pilih tanggal setelah check-out lama
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtendModal(false);
                    setSelectedUnit(null);
                    setNewCheckOut('');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium"
                >
                  Simpan Perpanjangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
