import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faCalendar, 
  faDollarSign, 
  faBuilding,
  faChevronDown,
  faChevronUp,
  faFileExport,
  faChartBar,
  faMoneyBillWave,
  faCalendarCheck,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useUnits } from '../contexts/UnitsContext';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

const Reports = () => {
  const { units, loading, clearUnitHistory } = useUnits();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedUnit, setExpandedUnit] = useState(null);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'daily'
  const [showDetailStats, setShowDetailStats] = useState(false);

  // Generate list of months
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Generate years (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  // Get all bookings from history (including all past bookings)
  const getAllBookings = () => {
    const bookings = [];
    const seenBookings = new Set(); // Track unique bookings
    
    units.forEach(unit => {
      // Current tenant - ONLY if status is 'terisi' (not 'booking')
      if (unit.tenant && unit.status === 'terisi') {
        const bookingKey = `${unit.unitNumber}-${unit.tenant.name}-${unit.tenant.checkIn}-${unit.tenant.checkOut}`;
        if (!seenBookings.has(bookingKey)) {
          bookings.push({
            ...unit.tenant,
            unitNumber: unit.unitNumber,
            unitId: unit.id,
            firebaseId: unit.firebaseId,
            isCurrent: true
          });
          seenBookings.add(bookingKey);
        }
      }
      
      // History - only completed bookings
      if (unit.history && unit.history.length > 0) {
        unit.history.forEach(hist => {
          const bookingKey = `${unit.unitNumber}-${hist.name}-${hist.checkIn}-${hist.checkOut}`;
          if (!seenBookings.has(bookingKey)) {
            bookings.push({
              ...hist,
              unitNumber: unit.unitNumber,
              unitId: unit.id,
              firebaseId: unit.firebaseId,
              isCurrent: false
            });
            seenBookings.add(bookingKey);
          }
        });
      }
    });
    
    console.log('Total bookings found (excluding future bookings):', bookings.length);
    return bookings;
  };

  // Get ALL units with their booking history (not filtered by month)
  const getAllUnitsWithHistory = () => {
    const allBookings = getAllBookings();
    
    // Group all bookings by unit
    const bookingsByUnit = {};
    
    // Initialize all units (even those without bookings)
    units.forEach(unit => {
      bookingsByUnit[unit.unitNumber] = {
        unitNumber: unit.unitNumber,
        bookings: [],
        totalRevenue: 0,
        totalBookings: 0
      };
    });
    
    // Add bookings to their respective units
    allBookings.forEach(booking => {
      const unitNumber = booking.unitNumber;
      if (bookingsByUnit[unitNumber]) {
        // Check if this booking already exists (avoid duplicates)
        const isDuplicate = bookingsByUnit[unitNumber].bookings.some(b => 
          b.name === booking.name && 
          b.checkIn === booking.checkIn && 
          b.checkOut === booking.checkOut
        );
        
        if (!isDuplicate) {
          bookingsByUnit[unitNumber].bookings.push(booking);
          bookingsByUnit[unitNumber].totalRevenue += (booking.price || 0);
          bookingsByUnit[unitNumber].totalBookings += 1;
        }
      }
    });
    
    // Convert to array and sort by total revenue (highest first)
    return Object.values(bookingsByUnit).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };

  const allUnitsWithHistory = getAllUnitsWithHistory();
  
  // Debug: Log untuk melihat data
  useEffect(() => {
    console.log('All units with history:', allUnitsWithHistory);
    console.log('Total units:', units.length);
  }, [allUnitsWithHistory, units]);

  // Filter bookings by month and year
  const getMonthlyBookings = () => {
    const allBookings = getAllBookings();
    
    return allBookings.filter(booking => {
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);
      
      // Check if booking overlaps with selected month
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const monthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      return (
        (checkInDate <= monthEnd && checkOutDate >= monthStart)
      );
    });
  };

  const monthlyBookings = getMonthlyBookings();

  // Get units for selected month (including units without bookings)
  const getUnitsForSelectedMonth = () => {
    // Group monthly bookings by unit
    const bookingsByUnit = {};
    
    // Initialize ALL units first
    units.forEach(unit => {
      bookingsByUnit[unit.unitNumber] = {
        unitNumber: unit.unitNumber,
        bookings: [],
        totalRevenue: 0,
        totalBookings: 0
      };
    });
    
    // Add bookings for this month
    monthlyBookings.forEach(booking => {
      const unitNumber = booking.unitNumber;
      if (bookingsByUnit[unitNumber]) {
        // Check if this booking already exists (avoid duplicates)
        const isDuplicate = bookingsByUnit[unitNumber].bookings.some(b => 
          b.name === booking.name && 
          b.checkIn === booking.checkIn && 
          b.checkOut === booking.checkOut
        );
        
        if (!isDuplicate) {
          bookingsByUnit[unitNumber].bookings.push(booking);
          bookingsByUnit[unitNumber].totalRevenue += (booking.price || 0);
          bookingsByUnit[unitNumber].totalBookings += 1;
        }
      }
    });
    
    // Convert to array and sort: units with bookings first (by revenue), then units without bookings (by unit number)
    return Object.values(bookingsByUnit).sort((a, b) => {
      if (a.totalBookings > 0 && b.totalBookings === 0) return -1;
      if (a.totalBookings === 0 && b.totalBookings > 0) return 1;
      if (a.totalBookings > 0 && b.totalBookings > 0) return b.totalRevenue - a.totalRevenue;
      return parseInt(a.unitNumber) - parseInt(b.unitNumber);
    });
  };

  const unitsForSelectedMonth = getUnitsForSelectedMonth();

  // Calculate statistics
  const totalRevenue = monthlyBookings.reduce((sum, booking) => {
    return sum + (booking.price || 0);
  }, 0);

  const totalBookings = monthlyBookings.length;

  const uniqueUnits = new Set(monthlyBookings.map(b => b.unitNumber)).size;

  // Calculate daily revenue breakdown
  const getDailyRevenue = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Find all bookings that overlap with this date
      const dayBookings = monthlyBookings.filter(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        return currentDate >= checkIn && currentDate <= checkOut;
      });
      
      const dayRevenue = dayBookings.reduce((sum, b) => {
        // Calculate daily rate
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const dailyRate = (b.price || 0) / (totalDays || 1);
        return sum + dailyRate;
      }, 0);
      
      dailyData.push({
        day,
        date: currentDate,
        dateStr,
        revenue: dayRevenue,
        bookings: dayBookings.length,
        bookingDetails: dayBookings
      });
    }
    
    return dailyData;
  };

  const dailyRevenue = getDailyRevenue();

  // Calculate detailed statistics
  const getDetailedStats = () => {
    const stats = {
      avgRevenuePerBooking: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      avgRevenuePerUnit: uniqueUnits > 0 ? totalRevenue / uniqueUnits : 0,
      avgBookingsPerUnit: uniqueUnits > 0 ? totalBookings / uniqueUnits : 0,
      highestRevenueDay: dailyRevenue.reduce((max, day) => day.revenue > max.revenue ? day : max, dailyRevenue[0] || { revenue: 0 }),
      lowestRevenueDay: dailyRevenue.reduce((min, day) => day.revenue > 0 && day.revenue < min.revenue ? day : min, dailyRevenue.find(d => d.revenue > 0) || { revenue: 0 }),
      daysWithRevenue: dailyRevenue.filter(d => d.revenue > 0).length,
      daysWithoutRevenue: dailyRevenue.filter(d => d.revenue === 0).length,
      avgDailyRevenue: dailyRevenue.reduce((sum, d) => sum + d.revenue, 0) / dailyRevenue.length,
      totalDays: dailyRevenue.length
    };
    
    // Calculate occupancy rate
    const totalPossibleUnitDays = units.length * stats.totalDays;
    const totalOccupiedDays = dailyRevenue.reduce((sum, day) => sum + day.bookings, 0);
    stats.occupancyRate = totalPossibleUnitDays > 0 ? (totalOccupiedDays / totalPossibleUnitDays) * 100 : 0;
    
    return stats;
  };

  const detailedStats = getDetailedStats();

  // Group bookings by unit
  const bookingsByUnit = monthlyBookings.reduce((acc, booking) => {
    const unit = booking.unitNumber;
    if (!acc[unit]) {
      acc[unit] = [];
    }
    acc[unit].push(booking);
    return acc;
  }, {});

  // Calculate revenue per unit
  const revenueByUnit = Object.entries(bookingsByUnit).map(([unitNumber, bookings]) => {
    const revenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
    return {
      unitNumber,
      bookings: bookings.length,
      revenue
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format short currency
  const formatShortCurrency = (amount) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}rb`;
    } else {
      return `Rp ${amount}`;
    }
  };

  // Clear history for a unit
  const handleClearHistory = async (unitNumber, firebaseId) => {
    const result = await Swal.fire({
      title: 'Hapus History?',
      html: `Yakin ingin menghapus semua history booking dari Unit ${unitNumber}?<br/><br/>
             <strong>⚠️ Tindakan ini tidak bisa dibatalkan!</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      await clearUnitHistory(firebaseId);
      await Swal.fire({
        title: 'Berhasil!',
        text: `History Unit ${unitNumber} berhasil dihapus`,
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        timer: 2000
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      await Swal.fire({
        title: 'Gagal!',
        text: 'Gagal menghapus history',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  // Export to PDF
  const exportReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('LAPORAN PENDAPATAN DETAIL', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('SewaApartemenByLia', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Periode: ${months[selectedMonth]} ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 6;
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, yPos, { align: 'center' });
    
    // Line separator
    yPos += 8;
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    // Summary
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RINGKASAN PENDAPATAN', 15, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Total Pendapatan: ${formatCurrency(totalRevenue)}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Total Booking: ${totalBookings}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Unit Aktif: ${uniqueUnits}`, 20, yPos);
    
    // Line separator
    yPos += 8;
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    // Detailed Statistics
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('STATISTIK DETAIL', 15, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Rata-rata per Booking: ${formatCurrency(detailedStats.avgRevenuePerBooking)}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Rata-rata per Unit: ${formatCurrency(detailedStats.avgRevenuePerUnit)}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Tingkat Hunian: ${detailedStats.occupancyRate.toFixed(1)}%`, 20, yPos);
    
    yPos += 6;
    doc.text(`Pendapatan Rata-rata Harian: ${formatCurrency(detailedStats.avgDailyRevenue)}`, 20, yPos);
    
    yPos += 6;
    doc.text(`Hari dengan Pendapatan: ${detailedStats.daysWithRevenue} dari ${detailedStats.totalDays} hari`, 20, yPos);
    
    yPos += 6;
    const highestDay = detailedStats.highestRevenueDay?.date ? 
      new Date(detailedStats.highestRevenueDay.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : '-';
    doc.text(`Hari Tertinggi: ${highestDay} (${formatCurrency(detailedStats.highestRevenueDay?.revenue || 0)})`, 20, yPos);
    
    // Line separator
    yPos += 8;
    doc.line(15, yPos, pageWidth - 15, yPos);
    
    // Detail per unit
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DETAIL PER UNIT', 15, yPos);
    
    yPos += 8;
    
    unitsForSelectedMonth.forEach((item, index) => {
      // Check if need new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Unit header
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. Unit ${item.unitNumber}`, 15, yPos);
      
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      if (item.totalBookings > 0) {
        doc.text(`Total: ${item.totalBookings} booking | ${formatCurrency(item.totalRevenue)}`, 20, yPos);
        yPos += 6;
        
        // Bookings detail
        item.bookings
          .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
          .forEach((booking, idx) => {
            // Check if need new page
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = 20;
            }
            
            doc.setFontSize(9);
            doc.text(`   ${idx + 1}) ${booking.name || 'Tamu'}`, 20, yPos);
            
            yPos += 5;
            doc.setFontSize(8);
            doc.text(`      ${new Date(booking.checkIn).toLocaleDateString('id-ID')} - ${new Date(booking.checkOut).toLocaleDateString('id-ID')}`, 20, yPos);
            
            yPos += 5;
            doc.text(`      ${formatCurrency(booking.price || 0)} | ${booking.isCurrent ? 'Sedang Menginap' : 'Selesai'}`, 20, yPos);
            
            yPos += 6;
          });
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text(`Tidak ada booking di ${months[selectedMonth]}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 6;
      }
      
      yPos += 4;
    });
    
    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Dokumen ini dibuat secara otomatis oleh sistem SewaApartemenByLia', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    doc.save(`Laporan_Detail_${months[selectedMonth]}_${selectedYear}.pdf`);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white safe-top">
        <div className="px-4 pt-6 pb-8">
          <h1 className="text-2xl font-bold mb-1">Laporan Pendapatan</h1>
          <p className="text-primary-100 text-sm">SewaApartemenByLia</p>
        </div>
      </div>

      {/* Month & Year Selector */}
      <div className="px-4 -mt-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-2">Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-1 gap-3">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <FontAwesomeIcon icon={faDollarSign} className="text-2xl opacity-80" />
              <span className="text-sm opacity-90">Total Pendapatan</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm opacity-90 mt-1">{months[selectedMonth]} {selectedYear}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faCalendar} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Booking</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Unit Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">{uniqueUnits}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="px-4 mb-6">
        <button
          onClick={exportReport}
          className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faFileExport} />
          Export Laporan
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex gap-2">
          <button
            onClick={() => setViewMode('summary')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
              viewMode === 'summary'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FontAwesomeIcon icon={faChartBar} className="mr-2" />
            Ringkasan
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`flex-1 py-2 px-4 rounded-xl font-medium transition-colors ${
              viewMode === 'daily'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
            Per Hari
          </button>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowDetailStats(!showDetailStats)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600" />
              </div>
              <span className="font-bold text-gray-900">Statistik Detail</span>
            </div>
            <FontAwesomeIcon 
              icon={showDetailStats ? faChevronUp : faChevronDown} 
              className="text-gray-400"
            />
          </button>

          {showDetailStats && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Average per Booking */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-600 mb-1">Rata-rata per Booking</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatShortCurrency(detailedStats.avgRevenuePerBooking)}
                  </p>
                </div>

                {/* Average per Unit */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3">
                  <p className="text-xs text-purple-600 mb-1">Rata-rata per Unit</p>
                  <p className="text-lg font-bold text-purple-700">
                    {formatShortCurrency(detailedStats.avgRevenuePerUnit)}
                  </p>
                </div>

                {/* Occupancy Rate */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
                  <p className="text-xs text-green-600 mb-1">Tingkat Hunian</p>
                  <p className="text-lg font-bold text-green-700">
                    {detailedStats.occupancyRate.toFixed(1)}%
                  </p>
                </div>

                {/* Average Daily Revenue */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3">
                  <p className="text-xs text-orange-600 mb-1">Rata-rata Harian</p>
                  <p className="text-lg font-bold text-orange-700">
                    {formatShortCurrency(detailedStats.avgDailyRevenue)}
                  </p>
                </div>

                {/* Days with Revenue */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-3">
                  <p className="text-xs text-teal-600 mb-1">Hari Ada Pendapatan</p>
                  <p className="text-lg font-bold text-teal-700">
                    {detailedStats.daysWithRevenue} hari
                  </p>
                </div>

                {/* Highest Revenue Day */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-3">
                  <p className="text-xs text-pink-600 mb-1">Hari Tertinggi</p>
                  <p className="text-lg font-bold text-pink-700">
                    {formatShortCurrency(detailedStats.highestRevenueDay?.revenue || 0)}
                  </p>
                  <p className="text-xs text-pink-600 mt-1">
                    {detailedStats.highestRevenueDay?.date ? 
                      new Date(detailedStats.highestRevenueDay.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Revenue View */}
      {viewMode === 'daily' && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Pendapatan Per Hari - {months[selectedMonth]} {selectedYear}
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              {dailyRevenue.map((day) => (
                <div 
                  key={day.day} 
                  className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                    day.revenue > 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        day.revenue > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {day.day}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {day.bookings} unit {day.bookings !== 1 ? 'terisi' : 'terisi'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${day.revenue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {day.revenue > 0 ? formatShortCurrency(day.revenue) : 'Rp 0'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Show booking details if any */}
                  {day.bookings > 0 && (
                    <div className="mt-2 pl-13 space-y-1">
                      {day.bookingDetails.map((booking, idx) => (
                        <div key={idx} className="text-xs text-gray-600 flex items-center justify-between">
                          <span>• Unit {booking.unitNumber} - {booking.name}</span>
                          <span className="text-green-600 font-medium">
                            {formatShortCurrency(
                              (booking.price || 0) / 
                              Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue by Unit - Only in Summary Mode */}
      {viewMode === 'summary' && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Semua Unit - {months[selectedMonth]} {selectedYear}
          </h2>
        
        {unitsForSelectedMonth.length > 0 ? (
          <div className="space-y-3">
            {unitsForSelectedMonth.map((item) => (
              <div key={item.unitNumber} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {item.totalBookings > 0 ? (
                  // Unit with bookings - clickable
                  <>
                    <button
                      onClick={() => setExpandedUnit(expandedUnit === item.unitNumber ? null : item.unitNumber)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <FontAwesomeIcon icon={faBuilding} className="text-primary-600 text-lg" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-gray-900">Unit {item.unitNumber}</p>
                          <p className="text-sm text-gray-500">{item.totalBookings} booking</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatShortCurrency(item.totalRevenue)}</p>
                        </div>
                        <FontAwesomeIcon 
                          icon={expandedUnit === item.unitNumber ? faChevronUp : faChevronDown} 
                          className="text-gray-400"
                        />
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {expandedUnit === item.unitNumber && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="py-3 border-b border-gray-100 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">
                            Total: {item.totalBookings} booking • {formatCurrency(item.totalRevenue)}
                          </p>
                          <button
                            onClick={() => {
                              const unit = units.find(u => u.unitNumber === item.unitNumber);
                              if (unit) handleClearHistory(item.unitNumber, unit.firebaseId);
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Hapus History
                          </button>
                        </div>
                        <div className="space-y-3 mt-3">
                          {item.bookings
                            .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
                            .map((booking, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-gray-900">{booking.name || 'Tamu'}</p>
                                  <p className="text-xs text-gray-500">{booking.phone || '-'}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  booking.isCurrent 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {booking.isCurrent ? 'Sedang Menginap' : 'Selesai'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  {new Date(booking.checkIn).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  {' - '}
                                  {new Date(booking.checkOut).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(booking.price || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Unit without bookings - not clickable
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-lg" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">Unit {item.unitNumber}</p>
                        <p className="text-sm text-gray-500">Tidak ada booking di {months[selectedMonth]}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <FontAwesomeIcon icon={faChartLine} className="text-5xl text-gray-300 mb-3" />
            <p className="text-gray-500">Tidak ada data unit</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default Reports;
