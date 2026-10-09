import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faBold, faItalic, faUnderline, faAlignLeft, faAlignCenter, faAlignRight } from '@fortawesome/free-solid-svg-icons';
import { subscribeToContracts, updateContract } from '../services/firebase';
import { generateContractHTML } from '../templates/contractTemplate';
import Swal from 'sweetalert2';

const ContractEditFull = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const editorRef = useRef(null);
  const contentLoadedRef = useRef(false);

  // Effect untuk load contract data
  useEffect(() => {
    const unsubscribe = subscribeToContracts((data) => {
      const found = data.find(c => c.id === id);
      if (found) {
        setContract(found);
        // Set content state
        const html = found.customHTML || generateContractHTML(found);
        setEditorContent(html);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Effect terpisah untuk set innerHTML setelah editor ready
  useEffect(() => {
    if (editorRef.current && editorContent && !contentLoadedRef.current) {
      console.log('Setting editor content:', editorContent.substring(0, 100));
      editorRef.current.innerHTML = editorContent;
      contentLoadedRef.current = true;
    }
  }, [editorContent]);

  // Reset loaded flag saat unmount
  useEffect(() => {
    return () => {
      contentLoadedRef.current = false;
    };
  }, []);

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = async () => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;

    if (!content.trim()) {
      Swal.fire({
        title: 'Konten Kosong',
        text: 'Dokumen tidak boleh kosong',
        icon: 'warning'
      });
      return;
    }

    setSaving(true);

    try {
      // Simpan custom HTML
      await updateContract(id, {
        customHTML: content,
        lastEdited: new Date().toISOString()
      });
      
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

  const handleCancel = () => {
    Swal.fire({
      title: 'Batalkan Perubahan?',
      text: 'Perubahan yang belum disimpan akan hilang',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Batalkan',
      cancelButtonText: 'Lanjut Edit'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(`/contracts/view/${id}`);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dokumen...</p>
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
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        {/* Top Bar */}
        <div className="border-b border-gray-200 px-3 py-2 flex items-center justify-between gap-2">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hidden sm:inline">Batal</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">Mode Editor</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-2 sm:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1 sm:gap-2 disabled:opacity-50 text-sm"
            >
              <FontAwesomeIcon icon={faSave} className="text-sm" />
              <span>{saving ? 'Simpan...' : 'Simpan'}</span>
            </button>
          </div>
        </div>

        {/* Formatting Toolbar - Scrollable on mobile */}
        <div className="px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <div className="flex items-center gap-0.5 sm:gap-1 border-r border-gray-300 pr-2 sm:pr-3">
            <button
              onClick={() => handleFormat('bold')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Bold (Ctrl+B)"
              type="button"
            >
              <FontAwesomeIcon icon={faBold} className="text-gray-700 text-sm" />
            </button>
            <button
              onClick={() => handleFormat('italic')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Italic (Ctrl+I)"
              type="button"
            >
              <FontAwesomeIcon icon={faItalic} className="text-gray-700 text-sm" />
            </button>
            <button
              onClick={() => handleFormat('underline')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Underline (Ctrl+U)"
              type="button"
            >
              <FontAwesomeIcon icon={faUnderline} className="text-gray-700 text-sm" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 border-r border-gray-300 pr-2 sm:pr-3">
            <button
              onClick={() => handleFormat('justifyLeft')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Rata Kiri"
              type="button"
            >
              <FontAwesomeIcon icon={faAlignLeft} className="text-gray-700 text-sm" />
            </button>
            <button
              onClick={() => handleFormat('justifyCenter')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Rata Tengah"
              type="button"
            >
              <FontAwesomeIcon icon={faAlignCenter} className="text-gray-700 text-sm" />
            </button>
            <button
              onClick={() => handleFormat('justifyRight')}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Rata Kanan"
              type="button"
            >
              <FontAwesomeIcon icon={faAlignRight} className="text-gray-700 text-sm" />
            </button>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <select
              onChange={(e) => handleFormat('fontSize', e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:ring-2 focus:ring-primary-500"
              defaultValue="3"
            >
              <option value="1">Kecil</option>
              <option value="2">Sedang</option>
              <option value="3">Normal</option>
              <option value="4">Besar</option>
              <option value="5">XL</option>
              <option value="6">XXL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="max-w-5xl mx-auto py-4 sm:py-8 px-2 sm:px-4">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* A4 Paper Simulation - Responsive */}
          <div
            ref={editorRef}
            contentEditable={true}
            suppressContentEditableWarning={true}
            className="p-4 sm:p-8 md:p-12 min-h-screen sm:min-h-[297mm] focus:outline-none"
            style={{
              fontFamily: "'Times New Roman', serif",
              lineHeight: '1.8',
              fontSize: 'clamp(10pt, 2.5vw, 12pt)', // Responsive font
              touchAction: 'manipulation' // Better touch on mobile
            }}
            dangerouslySetInnerHTML={{ __html: editorContent }}
          />
        </div>
      </div>

      {/* Styles for editor */}
      <style>
        {`
        [contenteditable]:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 4px;
        }
        
        [contenteditable] p {
          margin: 0.5em 0;
        }
        
        [contenteditable] strong {
          font-weight: bold;
        }
        
        [contenteditable] em {
          font-style: italic;
        }
        
        [contenteditable] u {
          text-decoration: underline;
        }

        /* Prevent cursor jump */
        [contenteditable] * {
          outline: none;
        }

        /* Better mobile editing */
        @media (max-width: 640px) {
          [contenteditable] {
            -webkit-user-select: text;
            user-select: text;
            -webkit-tap-highlight-color: transparent;
          }
        }

        /* Smooth scrolling for toolbar */
        .overflow-x-auto {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
        `}
      </style>
    </div>
  );
};

export default ContractEditFull;
