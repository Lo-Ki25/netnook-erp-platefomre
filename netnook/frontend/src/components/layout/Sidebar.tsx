import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  BanknotesIcon,
  CalendarIcon,
  DocumentIcon,
  CubeIcon,
  ChartBarIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Projets', href: '/projects', icon: FolderIcon },
    { name: 'Clients', href: '/clients', icon: UserGroupIcon },
    { name: 'Tâches', href: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Finance', href: '/finance', icon: BanknotesIcon },
    { name: 'Planning', href: '/planning', icon: CalendarIcon },
    { name: 'Documents', href: '/documents', icon: DocumentIcon },
    { name: 'Ressources', href: '/resources', icon: CubeIcon },
    { name: 'Inventaire', href: '/inventory', icon: CubeIcon },
    { name: 'Analytique', href: '/analytics', icon: ChartBarIcon },
    { name: 'RH', href: '/hr', icon: UserIcon },
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-primary-700 text-white">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-800">
            <h1 className="text-xl font-bold">Netnook ERP</h1>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-primary-800 text-white'
                        : 'text-primary-100 hover:bg-primary-600'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className="mr-3 flex-shrink-0 h-6 w-6 text-primary-300"
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
