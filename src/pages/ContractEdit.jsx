import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';
import { subscribeToContracts, updateContract } from '../services/firebase';
import Swal from 'sweetalert2';

const ContractEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    ownerName: '',
    ownerAddress: '',
    tenantName: '',
    tenantKTP: '',
    tenantAddress: '',
    contractDate: '',
    unitNumber: '',
    unitFloor: '',
    unitSize: '',
    rentalType: '',
    monthlyRate: '',
    dailyRate: '',
  });

  useEffect(() => {
    const unsubscribe = subscribeToContracts((data) => {
      const found = data.find(c => c.id === id);
      if (found) {
        setContract(found);
        setFormData({
          ownerName: found.ownerName || '',
          ownerAddress: found.ownerAddress || '',
          tenantName: found.tenantName || '',
          tenantKTP: found.tenantKTP || '',
          tenantAddress: found.tenantAddress || '',
          contractDate: found.contractDate || '',
          unitNumber: found.unitNumber || '',
          unitFloor: found.unitFloor || '',
          unitSize: found.unitSize || '',
          rentalType: found.rentalType || '',
          monthlyRate: found.monthlyRate || '',
          dailyRate: found.dailyRate || '',
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Validasi
    if (!formData.ownerName || !formData.tenantName || !formData.unitNumber) {
      Swal.fire({
        title: 'Data Tidak Lengkap',
        text: 'Mohon lengkapi data yang diperlukan',
        icon: 'warning'
      });
      return;
    }

    setSaving(true);

    try {
      await updateContract(id, formData);
      
      Swal.fire({
        title: 'Berhasil!',
        text: 'Perubahan berhasil disimpan',
        icon: 'success',
        timer: 2000
      });

      navigate(`/contracts/view/${id}`);
    } catch (error) {
      console.error('Error updating contract:', error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Gagal menyimpan perubahan',
        icon: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Perjanjian tidak ditemukan</p>
          <button
            onClick={() => navigate('/contracts')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/contracts/view/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Batal</span>
          </button>

          <h1 className="text-lg font-bold text-gray-900">Edit Perjanjian</h1>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSave} />
            <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
          
          {/* Pihak Pertama */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pihak Pertama (Pemilik Unit)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap
                </label>
                <textarea
                  name="ownerAddress"
                  value={formData.ownerAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Pihak Kedua */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pihak Kedua (Penyewa)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="tenantName"
                  value={formData.tenantName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor KTP
                </label>
                <input
                  type="text"
                  name="tenantKTP"
                  value={formData.tenantKTP}
                  onChange={handleChange}
                  maxLength={16}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat Lengkap
                </label>
                <textarea
                  name="tenantAddress"
                  value={formData.tenantAddress}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Data Unit */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Data Unit</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Unit
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

          <hr className="border-gray-200" />

          {/* Tarif */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tarif Sewa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarif Bulanan (Rp)
                </label>
                <input
                  type="number"
                  name="monthlyRate"
                  value={formData.monthlyRate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarif Harian (Rp)
                </label>
                <input
                  type="number"
                  name="dailyRate"
                  value={formData.dailyRate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Sewa
                </label>
                <select
                  name="rentalType"
                  value={formData.rentalType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="bulanan">Bulanan</option>
                  <option value="harian">Harian</option>
                </select>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Tips:</strong> Perubahan akan diterapkan pada template perjanjian. 
              Pasal-pasal dalam perjanjian akan otomatis ter-update dengan data baru.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContractEdit;
