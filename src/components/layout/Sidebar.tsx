import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderTree, 
  Layers, 
  Settings, 
  Package, 
  Server, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  Globe,
  Map
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed?: boolean;
  children?: { to: string; label: string }[];
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, collapsed = false, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  if (children) {
    return (
      <div className="space-y-1">
        <button
          className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={`${collapsed ? '' : 'mr-3'} h-5 w-5`}>{icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{label}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </>
          )}
        </button>
        {isOpen && !collapsed && (
          <div className="pl-10 space-y-1">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
        }`
      }
      title={collapsed ? label : undefined}
    >
      <span className={`${collapsed ? '' : 'mr-3'} h-5 w-5`}>{icon}</span>
      {!collapsed && label}
    </NavLink>
  );
};

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-center'} h-16 px-4 border-b border-gray-200 dark:border-gray-700`}>
        {collapsed ? (
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">CC</span>
        ) : (
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">CloudComposer</h1>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <SidebarItem to="/dashboard" icon={<LayoutDashboard />} label="Dashboard" collapsed={collapsed} />
        
        <SidebarItem 
          to="/structure" 
          icon={<FolderTree />} 
          label="Structure" 
          collapsed={collapsed}
          children={[
            { to: "/structure/accounts", label: "Accounts" },
            { to: "/structure/regions", label: "Regions" },
            { to: "/structure/environments", label: "Environments" },
          ]}
        />
        
        <SidebarItem to="/components" icon={<Layers />} label="Components" collapsed={collapsed} />
        <SidebarItem to="/services" icon={<Server />} label="Services" collapsed={collapsed} />
        <SidebarItem to="/modules" icon={<Package />} label="Modules" collapsed={collapsed} />
        <SidebarItem to="/settings" icon={<Settings />} label="Settings" collapsed={collapsed} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className={`flex items-center ${collapsed ? 'justify-center' : 'w-full'} px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className={`${collapsed ? '' : 'mr-3'} h-5 w-5`} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
