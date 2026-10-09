import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faBuilding, faChartLine, faCirclePlus, faUserCheck, faFileContract } from '@fortawesome/free-solid-svg-icons';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: faHome, label: 'Home' },
    { path: '/units', icon: faBuilding, label: 'Units' },
    { path: '/booking', icon: faCirclePlus, label: 'Booking' },
    { path: '/contracts', icon: faFileContract, label: 'Perjanjian' },
    { path: '/reports', icon: faChartLine, label: 'Laporan' },
    { path: '/admin-attendance', icon: faUserCheck, label: 'Absensi' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive 
                    ? 'text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FontAwesomeIcon 
                  icon={item.icon} 
                  className={`text-xl ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
                />
                <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
