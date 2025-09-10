import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BookOpen, 
  CreditCard, 
  HelpCircle, 
  FileText, 
  Calendar,
  Settings,
  BarChart3,
  Upload,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
    ];

    switch (currentUser?.role) {
      case 'student':
        return [
          ...baseItems,
          { icon: User, label: 'Profile', path: '/profile' },
          { icon: FileText, label: 'Results', path: '/results' },
          { icon: Calendar, label: 'Timetable', path: '/timetable' },
          { icon: CreditCard, label: 'Finance', path: '/finance' },
          { icon: Upload, label: 'Documents', path: '/documents' },
          { icon: HelpCircle, label: 'Helpdesk', path: '/helpdesk' },
        ];
      
      case 'lecturer':
        return [
          ...baseItems,
          { icon: Users, label: 'Students', path: '/students' },
          { icon: BookOpen, label: 'Courses', path: '/courses' },
          { icon: Calendar, label: 'Schedule', path: '/schedule' },
          { icon: FileText, label: 'Results Entry', path: '/results-entry' },
          { icon: HelpCircle, label: 'Helpdesk', path: '/helpdesk' },
        ];
      
      case 'admin':
        return [
          ...baseItems,
          { icon: Users, label: 'Student Management', path: '/student-management' },
          { icon: BookOpen, label: 'Course Management', path: '/course-management' },
          { icon: Calendar, label: 'Timetable Management', path: '/timetable-management' },
          { icon: Upload, label: 'Asset Management', path: '/asset-management' },
          { icon: BarChart3, label: 'Reports', path: '/reports' },
          { icon: HelpCircle, label: 'Helpdesk Management', path: '/helpdesk-management' },
          { icon: Settings, label: 'Settings', path: '/settings' },
        ];
      
      case 'finance':
        return [
          ...baseItems,
          { icon: CreditCard, label: 'Payment Management', path: '/payment-management' },
          { icon: Users, label: 'Student Finance', path: '/student-finance' },
          { icon: BarChart3, label: 'Financial Reports', path: '/financial-reports' },
          { icon: Upload, label: 'Payment Proofs', path: '/payment-proofs' },
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full pt-16">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="px-4 py-4 border-t border-gray-200">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-blue-800">Welcome back!</p>
              <p className="text-xs text-blue-600 mt-1">
                Role: <span className="capitalize font-medium">{currentUser?.role}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;