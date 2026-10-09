import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faHome, faChartLine, faDollarSign, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import StatCard from '../components/StatCard';
import UnitCard from '../components/UnitCard';
import { useUnits } from '../contexts/UnitsContext';
import { updateUnit } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { monitorCheckouts } from '../services/checkoutMonitor';

const Dashboard = () => {
  const { units, loading, error, checkoutUnit, updateBookingStatus } = useUnits();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOccupied, setShowOccupied] = useState(true);
  const [showBooking, setShowBooking] = useState(true);

  // Debug sudah tidak perlu karena di context
  // console.log('🏠 Dashboard - Units:', units.length, 'Loading:', loading, 'Error:', error);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout',
      text: 'Yakin ingin keluar dari aplikasi?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      logout();
      navigate('/login');
    }
  };

  // Update booking status & monitor checkouts on mount and every hour
  useEffect(() => {
    if (units.length === 0) return;
    
    updateBookingStatus();
    
    // Monitor checkout expired (only for admin)
    if (user?.role === 'admin') {
      monitorCheckouts(units);
    }
    
    const interval = setInterval(() => {
      updateBookingStatus();
      if (user?.role === 'admin') {
        monitorCheckouts(units);
      }
    }, 3600000);
    
    return () => clearInterval(interval);
  }, [units, updateBookingStatus, user?.role]);

  const occupiedUnits = units.filter(u => u.status === 'terisi');
  const bookingUnits = units.filter(u => u.status === 'booking');
  const emptyUnits = units.filter(u => u.status === 'kosong');
  
  // Available units = empty + booking (both can be booked for future dates)
  const availableUnits = units.filter(u => u.status === 'kosong' || u.status === 'booking');
  
  const occupancyRate = units.length > 0 
    ? ((occupiedUnits.length / units.length) * 100).toFixed(1) 
    : 0;

  // Calculate total revenue from occupied units (use booking price, not unit price)
  const totalRevenue = occupiedUnits.reduce((sum, unit) => {
    const bookingPrice = unit.tenant?.price || unit.price || 0;
    return sum + bookingPrice;
  }, 0);

  // Format revenue untuk display
  const formatRevenue = (amount) => {
    if (amount >= 1000000) {
      // Juta
      return `${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
      // Ribu
      return `${(amount / 1000).toFixed(0)}rb`;
    } else {
      return amount.toString();
    }
  };

  // Get recent bookings (occupied units) - show all
  const recentBookings = occupiedUnits;
  
  // Get upcoming bookings (booking status) - show all
  const upcomingBookings = bookingUnits;

  // Filter bookings by search query
  const filteredBookings = recentBookings.filter(unit => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const unitNumber = unit.unitNumber.toLowerCase();
    const tenantName = (unit.tenant?.name || '').toLowerCase();
    const tenantPhone = (unit.tenant?.phone || '').toLowerCase();
    
    return unitNumber.includes(query) || 
           tenantName.includes(query) || 
           tenantPhone.includes(query);
  });

  // Show detail function
  const handleShowDetail = (unit) => {
    setSelectedUnit(unit);
    setShowDetailModal(true);
  };

  // Checkout function
  const handleCheckout = async (firebaseId) => {
    const result = await Swal.fire({
      title: 'Checkout Unit',
      text: 'Yakin ingin checkout unit ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Checkout',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    try {
      await checkoutUnit(firebaseId);
      Swal.fire({
        title: 'Berhasil!',
        text: 'Unit berhasil di-checkout',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
    } catch (error) {
      console.error('Error checkout:', error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal checkout unit',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Manual check-in for future bookings
  const handleManualCheckin = async (firebaseId, unitNumber) => {
    const result = await Swal.fire({
      title: 'Check-in Sekarang',
      html: `Yakin ingin check-in Unit ${unitNumber} sekarang?<br/><br/>
             <small class="text-gray-600">Status akan berubah dari "Booking" menjadi "Terisi" dan countdown akan dimulai.</small>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Check-in',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;
    
    try {
      // Get unit data
      const unit = units.find(u => (u.firebaseId || u.id) === firebaseId);
      if (!unit || !unit.tenant) return;

      // Update status to 'terisi' (occupied)
      await updateUnit(firebaseId, {
        status: 'terisi',
        tenant: unit.tenant
      });

      Swal.fire({
        title: 'Berhasil!',
        text: `Unit ${unitNumber} berhasil di-check-in`,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
    } catch (error) {
      console.error('Error manual check-in:', error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal check-in unit',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white safe-top">
        <div className="px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
              title="Logout"
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
            </button>
          </div>
          <p className="text-primary-100 text-sm">SewaApartemenByLia</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 -mt-4 mb-6">
        {loading ? (
          <>
            {/* Skeleton Loading - Animated */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-8 bg-gray-300 rounded w-12"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-gray-300 rounded w-16"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl p-6 text-center shadow-sm border border-red-100">
            <p className="text-red-600 font-medium">❌ Gagal memuat data</p>
            <p className="text-sm text-red-500 mt-1">{error.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Muat Ulang
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <StatCard
                icon={faBuilding}
                label="Total Unit"
                value={units.length}
                color="blue"
              />
              <StatCard
                icon={faHome}
                label="Menginap"
                value={occupiedUnits.length}
                color="blue"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={faChartLine}
                label="Tingkat Hunian"
                value={`${occupancyRate}%`}
                color="blue"
              />
              <StatCard
                icon={faDollarSign}
                label="Pendapatan Hari Ini"
                value={`Rp ${formatRevenue(totalRevenue)}`}
                color="blue"
              />
            </div>
          </>
        )}
      </div>

      {/* Quick Stats - Available Units */}
      <div className="px-4 mb-6">
        {loading ? (
          <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl p-5 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/30 rounded-xl"></div>
                <div>
                  <div className="h-4 bg-white/40 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-white/30 rounded w-20"></div>
                </div>
              </div>
              <div className="w-16 h-16 bg-white/30 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faHome} className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">Unit Tersedia</p>
                  <p className="text-white text-xs">Siap untuk booking</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-white">{availableUnits.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Tampilkan:</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowOccupied(!showOccupied)}
              className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                showOccupied
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {showOccupied ? '✓' : ''} Sedang Menginap ({occupiedUnits.length})
            </button>
            <button
              onClick={() => setShowBooking(!showBooking)}
              className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${
                showBooking
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {showBooking ? '✓' : ''} Booking Mendatang ({bookingUnits.length})
            </button>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      {showOccupied && (
        <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Sedang Menginap</h2>
          <a href="/units" className="text-sm text-primary-600 font-medium">
            Lihat Semua
          </a>
        </div>

        {loading ? (
          /* Skeleton for bookings */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Search Bar */}
            {recentBookings.length > 0 && (
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari unit, nama, atau nomor HP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {filteredBookings.length > 0 ? (
              <div className="space-y-3">
                {filteredBookings.map((unit) => (
                  <UnitCard 
                    key={unit.id} 
                    unit={unit} 
                    onShowDetail={handleShowDetail}
                    onCheckout={handleCheckout}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500 mb-2">Tidak ditemukan</p>
                <p className="text-sm text-gray-400">Coba kata kunci lain</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <FontAwesomeIcon icon={faBuilding} className="text-5xl text-gray-300 mb-3" />
                <p className="text-gray-500">Belum ada unit terisi</p>
              </div>
            ) : null}
          </>
        )}
      </div>
      )}

      {/* Upcoming Bookings */}
      {showBooking && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Booking Mendatang</h2>
            <span className="text-sm text-primary-600 font-medium bg-primary-100 px-3 py-1 rounded-full">
              {upcomingBookings.length} booking
            </span>
          </div>

          {upcomingBookings.length > 0 ? (
          <div className="space-y-3">
            {upcomingBookings
              .sort((a, b) => new Date(a.tenant.checkIn) - new Date(b.tenant.checkIn))
              .map((unit) => (
              <div key={unit.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                        <FontAwesomeIcon icon={faBuilding} className="text-primary-600 text-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Unit {unit.unitNumber}</p>
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                          Booking
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleShowDetail(unit)}
                      className="text-primary-600 text-sm font-medium hover:text-primary-700"
                    >
                      Detail
                    </button>
                  </div>

                  {unit.tenant && (
                    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Nama:</span>
                        <span className="text-sm font-semibold text-gray-900">{unit.tenant.name || 'Tamu'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Check-in:</span>
                        <span className="text-sm font-semibold text-primary-700">
                          {new Date(unit.tenant.checkIn).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {unit.tenant.price && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Harga:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            Rp {unit.tenant.price.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleManualCheckin(unit.firebaseId || unit.id, unit.unitNumber);
                      }}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Check-in Sekarang
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCheckout(unit.firebaseId || unit.id);
                      }}
                      className="w-full py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium text-sm transition-colors"
                    >
                      Batalkan Booking
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <FontAwesomeIcon icon={faBuilding} className="text-5xl text-gray-300 mb-3" />
            <p className="text-gray-500">Belum ada booking mendatang</p>
            <p className="text-sm text-gray-400 mt-2">Booking dengan check-in di masa depan akan muncul di sini</p>
          </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Detail Unit {selectedUnit.unitNumber}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedUnit.status === 'terisi'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {selectedUnit.status === 'terisi' ? 'Unit Terisi' : 'Unit Kosong'}
                </span>
              </div>

              {selectedUnit.status === 'terisi' && selectedUnit.tenant && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Informasi Penyewa</h4>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Nama Penyewa</p>
                        <p className="font-semibold text-gray-900">{selectedUnit.tenant.name || 'Tamu'}</p>
                      </div>
                    </div>

                    {selectedUnit.tenant.phone && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Nomor Telepon</p>
                          <p className="font-semibold text-gray-900">{selectedUnit.tenant.phone}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">Periode Menginap</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedUnit.tenant.checkIn).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                          {selectedUnit.tenant.checkInTime && ` ${selectedUnit.tenant.checkInTime}`}
                          {' - '}
                          {new Date(selectedUnit.tenant.checkOut).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                          {selectedUnit.tenant.checkOutTime && ` ${selectedUnit.tenant.checkOutTime}`}
                        </p>
                      </div>
                    </div>

                    {selectedUnit.tenant.price && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">Harga Sewa/Hari</p>
                          <p className="font-semibold text-gray-900">
                            Rp {selectedUnit.tenant.price.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedUnit.tenant.ktpImage && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Foto KTP</h4>
                      <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={selectedUnit.tenant.ktpImage}
                          alt="KTP"
                          className="w-full h-auto"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Klik gambar untuk memperbesar
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
