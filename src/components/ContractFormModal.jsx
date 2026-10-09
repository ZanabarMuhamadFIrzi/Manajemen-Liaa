import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract, faTimes } from '@fortawesome/free-solid-svg-icons';
import { addContract } from '../services/firebase';
import Swal from 'sweetalert2';

const ContractFormModal = ({ isOpen, onClose, initialData = {} }) => {
  const [formData, setFormData] = useState({
    // Pihak Pertama (Pemilik Unit - Manual Input)
    ownerName: initialData.ownerName || '',
    ownerAddress: initialData.ownerAddress || '',
    
    // Pihak Kedua (Penyewa - Manual Input)
    tenantName: initialData.tenantName || '',
    tenantKTP: initialData.tenantKTP || '',
    tenantAddress: initialData.tenantAddress || '',
    
    // Detail Unit
    contractDate: new Date().toISOString().split('T')[0],
    unitNumber: initialData.unitNumber || '',
    unitFloor: initialData.unitFloor || '',
    unitSize: '36',
    
    // Tarif
    rentalType: initialData.rentalType || 'bulanan',
    monthlyRate: 2500000,
    dailyRate: 200000,
    
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }

    return () => {
      // Cleanup
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi Pihak Pertama (Pemilik)
    if (!formData.ownerName || !formData.ownerAddress) {
      Swal.fire({
        title: 'Data Tidak Lengkap',
        text: 'Mohon lengkapi data pemilik unit (Pihak Pertama)',
        icon: 'warning'
      });
      return;
    }
    
    // Validasi Pihak Kedua (Penyewa)
    if (!formData.tenantName || !formData.tenantKTP || !formData.tenantAddress) {
      Swal.fire({
        title: 'Data Tidak Lengkap',
        text: 'Mohon lengkapi data penyewa (Pihak Kedua)',
        icon: 'warning'
      });
      return;
    }

    if (!formData.unitNumber) {
      Swal.fire({
        title: 'Data Tidak Lengkap',
        text: 'Mohon masukkan nomor unit',
        icon: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      const contractId = await addContract(formData);
      
      Swal.fire({
        title: 'Berhasil!',
        text: 'Surat perjanjian berhasil dibuat',
        icon: 'success',
        timer: 2000
      });

      onClose();
      
      // Buka preview di tab baru
      window.open(`/contracts/view/${contractId}`, '_blank');
    } catch (error) {
      console.error('Error creating contract:', error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal membuat surat perjanjian',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <FontAwesomeIcon icon={faFileContract} className="text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Buat Surat Perjanjian</h3>
              <p className="text-sm text-gray-500">Isi data untuk generate perjanjian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data Pemilik (Pihak Pertama) */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Data Pemilik Unit (Pihak Pertama)</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap Pemilik *
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Contoh: Danu Umbara"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap Pemilik *
                </label>
                <textarea
                  name="ownerAddress"
                  value={formData.ownerAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Alamat lengkap pemilik unit"
                  required
                />
              </div>
            </div>
          </div>

          {/* Data Penyewa (Pihak Kedua) */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Data Penyewa (Pihak Kedua)</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap Penyewa *
                </label>
                <input
                  type="text"
                  name="tenantName"
                  value={formData.tenantName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nama penyewa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor KTP Penyewa *
                </label>
                <input
                  type="text"
                  name="tenantKTP"
                  value={formData.tenantKTP}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="16 digit nomor KTP"
                  maxLength={16}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap Penyewa *
                </label>
                <textarea
                  name="tenantAddress"
                  value={formData.tenantAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Alamat lengkap sesuai KTP"
                  required
                />
              </div>
            </div>
          </div>

          {/* Data Unit */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Data Unit Apartemen</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Unit *
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Contoh: 1502"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lantai
                </label>
                <input
                  type="text"
                  name="unitFloor"
                  value={formData.unitFloor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Contoh: 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ukuran (m²)
                </label>
                <input
                  type="text"
                  name="unitSize"
                  value={formData.unitSize}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="36"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Perjanjian
                </label>
                <input
                  type="date"
                  name="contractDate"
                  value={formData.contractDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Jenis Sewa */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Jenis Sewa</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rentalType: 'bulanan' }))}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formData.rentalType === 'bulanan'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, rentalType: 'harian' }))}
                className={`py-3 px-4 rounded-xl font-medium transition-all ${
                  formData.rentalType === 'harian'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Harian
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Membuat...' : 'Buat Perjanjian'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ContractFormModal;
