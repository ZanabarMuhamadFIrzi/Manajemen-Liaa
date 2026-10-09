import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract, faPlus, faEye, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import { subscribeToContracts, deleteContract } from '../services/firebase';
import ContractFormModal from '../components/ContractFormModal';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Contracts = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToContracts((data) => {
      setContracts(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, tenantName) => {
    const result = await Swal.fire({
      title: 'Hapus Perjanjian',
      text: `Yakin ingin menghapus perjanjian dengan ${tenantName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await deleteContract(id);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Perjanjian berhasil dihapus',
          icon: 'success',
          timer: 2000
        });
      } catch (error) {
        Swal.fire({
          title: 'Gagal!',
          text: 'Gagal menghapus perjanjian',
          icon: 'error'
        });
      }
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const query = searchQuery.toLowerCase();
    return (
      contract.tenantName?.toLowerCase().includes(query) ||
      contract.tenantKTP?.includes(query) ||
      contract.unitNumber?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white safe-top">
        <div className="px-4 pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 pr-3">
              <h1 className="text-2xl font-bold">Surat Perjanjian</h1>
              <p className="text-primary-100 text-sm">Kelola dokumen perjanjian sewa</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center gap-1 px-5 py-3 bg-white text-primary-600 rounded-2xl hover:bg-white/90 transition-all active:scale-95 font-bold shadow-xl min-w-[80px]"
            >
              <FontAwesomeIcon icon={faPlus} className="text-2xl" />
              <span className="text-xs">Buat</span>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, KTP, atau unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Perjanjian</p>
              <p className="text-3xl font-bold text-gray-900">{contracts.length}</p>
            </div>
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faFileContract} className="text-primary-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="px-4 py-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredContracts.length > 0 ? (
          <div className="space-y-3">
            {filteredContracts.map((contract) => (
              <div key={contract.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faFileContract} className="text-primary-600 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{contract.tenantName}</p>
                      <p className="text-xs text-gray-500">Unit {contract.unitNumber} • Lantai {contract.unitFloor}</p>
                      <p className="text-xs text-gray-500 mt-1">KTP: {contract.tenantKTP}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(contract.contractDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Jenis Sewa:</span>
                      <span className="font-medium text-gray-900 capitalize">{contract.rentalType}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/contracts/view/${contract.id}`)}
                      className="w-full py-2 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faEye} className="mr-2" />
                      Lihat Preview
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/contracts/edit-full/${contract.id}`)}
                        className="flex-1 py-2 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" />
                        Edit Dokumen
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id, contract.tenantName)}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium text-sm hover:bg-red-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <FontAwesomeIcon icon={faFileContract} className="text-5xl text-gray-300 mb-3" />
            <p className="text-gray-500">
              {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada perjanjian'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Klik tombol + untuk membuat perjanjian baru
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button - Lebih besar dan lebih jelas */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all active:scale-95 z-50 flex items-center justify-center border-4 border-white"
        aria-label="Buat Perjanjian Baru"
        style={{ boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}
      >
        <FontAwesomeIcon icon={faPlus} className="text-2xl" />
      </button>

      {/* Alternative: Full Width Button di bawah stats (untuk yang belum ada contracts) */}
      {contracts.length === 0 && (
        <div className="px-4 mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xl" />
            <span>Buat Surat Perjanjian</span>
          </button>
        </div>
      )}

      {/* Create Modal */}
      <ContractFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Contracts;
