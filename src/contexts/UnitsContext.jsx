import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { subscribeToUnits, addUnit, updateUnit, deleteUnit } from '../services/firebase';
import { clearNotificationFlag } from '../services/checkoutMonitor';

const UnitsContext = createContext();

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (!context) {
    throw new Error('useUnits must be used within UnitsProvider');
  }
  return context;
};

export const UnitsProvider = ({ children }) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const isInitializedRef = useRef(false);
  const loadingTimeoutRef = useRef(null);

  useEffect(() => {
    // Only subscribe once
    if (isInitializedRef.current) {
      console.log('⏭️ Already initialized, skipping');
      return;
    }
    
    isInitializedRef.current = true;
    let mounted = true;
    
    // Try to load from localStorage first (instant!)
    try {
      const cachedData = localStorage.getItem('units_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - (localStorage.getItem('units_cache_time') || 0);
        
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          console.log('⚡ Loaded from cache:', parsed.length, 'units');
          if (mounted) {
            setUnits(parsed);
            setLoading(false);
          }
        }
      }
    } catch (err) {
      console.warn('Cache load failed:', err);
    }
    
    console.log('🔄 Subscribing to Firebase...');
    console.time('Firebase Connection');
    
    // AGGRESSIVE TIMEOUT - 5 seconds max
    loadingTimeoutRef.current = setTimeout(() => {
      if (!mounted) return;
      
      console.timeEnd('Firebase Connection');
      console.error('⏰ Firebase timeout after 5 seconds');
      setLoading(false);
      setError(new Error('Connection timeout - Firebase tidak merespon dalam 5 detik'));
    }, 5000);
    
    try {
      // Subscribe to realtime updates (will update cache)
      unsubscribeRef.current = subscribeToUnits(
        (data) => {
          if (!mounted) {
            console.log('⚠️ Component unmounted, ignoring data');
            return;
          }
          
          console.timeEnd('Firebase Connection');
          console.log('✅ Units loaded from Firebase:', data.length);
          
          // Clear timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          
          // Save to localStorage for next time
          try {
            localStorage.setItem('units_cache', JSON.stringify(data));
            localStorage.setItem('units_cache_time', Date.now().toString());
            console.log('💾 Saved to cache');
          } catch (err) {
            console.warn('Cache save failed:', err);
          }
          
          setUnits(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          if (!mounted) return;
          
          console.timeEnd('Firebase Connection');
          console.error('❌ Firebase error:', err);
          
          // Clear timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          
          setError(err);
          setLoading(false);
        }
      );
    } catch (err) {
      if (!mounted) return;
      
      console.timeEnd('Firebase Connection');
      console.error('❌ Failed to subscribe:', err);
      
      // Clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      setError(err);
      setLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleanup called');
      mounted = false;
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // DON'T unsubscribe on React Strict Mode double mount
      // Only unsubscribe on real unmount
      if (unsubscribeRef.current && !isInitializedRef.current) {
        console.log('🔌 Unsubscribing from Firebase');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Add new unit
  const createUnit = async (unitData) => {
    try {
      const firebaseId = await addUnit(unitData);
      return firebaseId;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Update existing unit
  const modifyUnit = async (firebaseId, updates) => {
    try {
      await updateUnit(firebaseId, updates);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Delete unit
  const removeUnit = async (firebaseId) => {
    try {
      await deleteUnit(firebaseId);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Checkout unit (set to empty and save to history)
  const checkoutUnit = async (firebaseId) => {
    try {
      // Get unit data before checkout
      const unit = units.find(u => u.firebaseId === firebaseId);
      
      if (unit && unit.tenant) {
        // Clear notification flag
        clearNotificationFlag(firebaseId, unit.tenant.checkOut);
        
        // Save current tenant to history
        const currentHistory = unit.history || [];
        const updatedHistory = [...currentHistory, unit.tenant];
        
        // Update unit: set to empty and add to history
        await updateUnit(firebaseId, {
          status: 'kosong',
          tenant: null,
          history: updatedHistory
        });
        
        console.log('✅ Checkout successful, saved to history:', unit.tenant.name);
      } else {
        // No tenant, just set to empty
        await updateUnit(firebaseId, {
          status: 'kosong',
          tenant: null
        });
      }
    } catch (err) {
      console.error('❌ Checkout error:', err);
      setError(err);
      throw err;
    }
  };

  // Book unit (set tenant)
  const bookUnit = async (firebaseId, tenantData) => {
    try {
      // Check if check-in date is in the future
      const checkInDate = new Date(tenantData.checkIn);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      checkInDate.setHours(0, 0, 0, 0);
      
      // If check-in is today or past, status = 'terisi'
      // If check-in is future, status = 'booking'
      const status = checkInDate <= today ? 'terisi' : 'booking';
      
      await updateUnit(firebaseId, {
        status: status,
        tenant: tenantData
      });
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Extend booking
  const extendBooking = async (firebaseId, newCheckOut, newCheckOutTime) => {
    try {
      const unit = units.find(u => u.firebaseId === firebaseId);
      if (unit && unit.tenant) {
        await updateUnit(firebaseId, {
          tenant: {
            ...unit.tenant,
            checkOut: newCheckOut,
            checkOutTime: newCheckOutTime || unit.tenant.checkOutTime
          }
        });
      }
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Check and update booking status (convert 'booking' to 'terisi' if check-in date has arrived)
  const updateBookingStatus = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const bookingUnits = units.filter(u => u.status === 'booking' && u.tenant);
    
    for (const unit of bookingUnits) {
      const checkInDate = new Date(unit.tenant.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      
      // If check-in date has arrived or passed, change status to 'terisi'
      if (checkInDate <= today) {
        try {
          await updateUnit(unit.firebaseId, {
            status: 'terisi',
            tenant: unit.tenant
          });
          console.log(`✅ Unit ${unit.unitNumber} status updated from 'booking' to 'terisi'`);
        } catch (err) {
          console.error(`❌ Failed to update unit ${unit.unitNumber}:`, err);
        }
      }
    }
  };

  // Clear history for a specific unit
  const clearUnitHistory = async (firebaseId) => {
    try {
      await updateUnit(firebaseId, {
        history: []
      });
      console.log(`✅ History cleared for unit`);
    } catch (err) {
      console.error(`❌ Failed to clear history:`, err);
      setError(err);
      throw err;
    }
  };

  const value = {
    units,
    loading,
    error,
    createUnit,
    modifyUnit,
    removeUnit,
    checkoutUnit,
    bookUnit,
    extendBooking,
    updateBookingStatus,
    clearUnitHistory
  };

  return (
    <UnitsContext.Provider value={value}>
      {children}
    </UnitsContext.Provider>
  );
};
