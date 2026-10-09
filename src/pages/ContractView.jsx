import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPrint, faArrowLeft, faEdit } from '@fortawesome/free-solid-svg-icons';
import { subscribeToContracts } from '../services/firebase';
import { generateContractHTML } from '../templates/contractTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ContractView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToContracts((data) => {
      const found = data.find(c => c.id === id);
      setContract(found);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const getContractHTML = () => {
    if (!contract) return '';
    // Gunakan customHTML jika ada (hasil edit), kalau tidak ada pakai template default
    return contract.customHTML || generateContractHTML(contract);
  };

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Use jsPDF's html method with better settings
      await pdf.html(contentRef.current, {
        callback: function (doc) {
          doc.save(`Perjanjian_${contract.tenantName}_${contract.unitNumber}.pdf`);
        },
        margin: [15, 15, 15, 15], // top, left, bottom, right
        autoPaging: 'text', // Better page breaking for text content
        x: 0,
        y: 0,
        width: 170, // A4 width (210mm) minus margins (15mm each side)
        windowWidth: 650, // Smaller window for better text rendering
        html2canvas: {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false,
          letterRendering: true, // Better text rendering
          allowTaint: true,
          removeContainer: true
        }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat perjanjian...</p>
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
      {/* Action Bar - Hide on print */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Kembali</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/contracts/edit-full/${id}`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>Edit Dokumen</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPrint} />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faDownload} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contract Content */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div 
          className="bg-white shadow-lg print:shadow-none"
          style={{
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          <div
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: getContractHTML() }}
            style={{
              pageBreakInside: 'auto',
              fontSize: '12pt',
              lineHeight: '1.8',
              fontFamily: "'Times New Roman', serif"
            }}
          />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>
    </div>
  );
};

export default ContractView;
