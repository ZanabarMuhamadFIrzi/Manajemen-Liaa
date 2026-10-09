import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';
import UnitCard from '../components/UnitCard';
import { useUnits } from '../contexts/UnitsContext';

const Units = () => {
  const { units, loading, error, createUnit, removeUnit } = useUnits();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, terisi, booking, kosong
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnitNumber, setNewUnitNumber] = useState('');

  // Debug sudah tidak perlu karena di context
  // console.log('🔍 Units in component:', units.length, 'Loading:', loading, 'Error:', error);
  
  // Add new unit
  const handleAddUnit = async (e) => {
    e.preventDefault();
    
    const newUnit = {
      id: Date.now(),
      unitNumber: newUnitNumber,
      status: 'kosong',
      tenant: null,
      price: 0,
      pricePerMonth: 0,
    };
    
    try {
      await createUnit(newUnit);
      setShowAddModal(false);
      setNewUnitNumber('');
    } catch (error) {
      console.error('Error adding unit:', error);
      alert('Gagal menambah unit');
    }
  };

  // Checkout function
  
  // Delete unit function
  const handleDeleteUnit = async (firebaseId) => {
    const unit = units.find(u => u.firebaseId === firebaseId);
    
    // Check if unit is occupied
    if (unit && unit.status === 'terisi') {
      alert('Unit sedang terisi! Checkout dulu sebelum menghapus.');
      return;
    }
    
    if (!confirm(`Yakin ingin menghapus Unit ${unit?.unitNumber}?`)) return;
    
    try {
      await removeUnit(firebaseId);
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert('Gagal menghapus unit');
    }
  };

  // Filter units based on search and status
  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (unit.tenant?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || unit.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white safe-top">
        <div className="px-4 pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Daftar Unit</h1>
              <p className="text-primary-100 text-sm">SewaApartemenByLia</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-2xl" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari unit atau nama penyewa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="px-4 py-3">
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`py-2 px-3 rounded-lg font-medium text-xs transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua<br/>({units.length})
              </button>
              <button
                onClick={() => setFilterStatus('terisi')}
                className={`py-2 px-3 rounded-lg font-medium text-xs transition-colors ${
                  filterStatus === 'terisi'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Terisi<br/>({units.filter(u => u.status === 'terisi').length})
              </button>
              <button
                onClick={() => setFilterStatus('booking')}
                className={`py-2 px-3 rounded-lg font-medium text-xs transition-colors ${
                  filterStatus === 'booking'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Booking<br/>({units.filter(u => u.status === 'booking').length})
              </button>
              <button
                onClick={() => setFilterStatus('kosong')}
                className={`py-2 px-3 rounded-lg font-medium text-xs transition-colors ${
                  filterStatus === 'kosong'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Kosong<br/>({units.filter(u => u.status === 'kosong').length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Units Grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                    <div>
                      <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-2xl p-8 text-center shadow-sm border border-red-100 mt-8">
            <p className="text-red-600 font-medium">❌ Gagal memuat data</p>
            <p className="text-sm text-red-500 mt-1">{error.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Muat Ulang
            </button>
          </div>
        ) : filteredUnits.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredUnits.map((unit) => (
              <UnitCard 
                key={unit.firebaseId || unit.id} 
                unit={unit} 
                onDelete={handleDeleteUnit}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 mt-8">
            <FontAwesomeIcon icon={faFilter} className="text-5xl text-gray-300 mb-3" />
            <p className="text-gray-500">Tidak ada unit ditemukan</p>
            <p className="text-sm text-gray-400 mt-1">
              {units.length === 0 
                ? 'Belum ada unit. Klik tombol + untuk menambah unit baru.' 
                : 'Coba ubah filter atau kata kunci pencarian'}
            </p>
          </div>
        )}
      </div>

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tambah Unit Baru</h3>
            <form onSubmit={handleAddUnit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Unit
                </label>
                <input
                  type="text"
                  value={newUnitNumber}
                  onChange={(e) => setNewUnitNumber(e.target.value)}
                  placeholder="Contoh: 1088, 2011"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUnitNumber('');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Units;
