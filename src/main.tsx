import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import './index.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import RegionsPage from './pages/RegionsPage';
import EnvironmentsPage from './pages/EnvironmentsPage';
import ComponentsPage from './pages/ComponentsPage';
import ServicesPage from './pages/ServicesPage';
import ModulesPage from './pages/ModulesPage';
import SettingsPage from './pages/SettingsPage';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { S3Provider } from './context/S3Context';
import { RegistryProvider } from './context/RegistryContext';

// Set up theme from localStorage
const theme = localStorage.getItem('theme');
if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: 'accounts',
        element: <AccountsPage />
      },
      {
        path: 'regions',
        element: <RegionsPage />
      },
      {
        path: 'environments',
        element: <EnvironmentsPage />
      },
      {
        path: 'components',
        element: <ComponentsPage />
      },
      {
        path: 'services',
        element: <ServicesPage />
      },
      {
        path: 'modules',
        element: <ModulesPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'login',
        element: <LoginPage />
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <S3Provider>
        <RegistryProvider>
          <RouterProvider router={router} />
        </RegistryProvider>
      </S3Provider>
    </AuthProvider>
  </React.StrictMode>
);
