import React from 'react';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import S3BucketConfig from '../components/terragrunt/S3BucketConfig';
import RegistryConfig from '../components/terragrunt/RegistryConfig';
import Switch from '../components/ui/Switch';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('general');
  
  const tabs = [
    {
      id: 'general',
      label: 'General',
      content: (
        <div className="space-y-6">
          <Card title="Application Settings">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Configure general application settings.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enable dark mode for the application
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={document.documentElement.classList.contains('dark')}
                  onChange={(checked) => {
                    if (checked) {
                      document.documentElement.classList.add('dark');
                      localStorage.setItem('theme', 'dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      localStorage.setItem('theme', 'light');
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Auto-save</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically save changes
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={localStorage.getItem('autoSave') !== 'false'}
                  onChange={(checked) => {
                    localStorage.setItem('autoSave', checked.toString());
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'storage',
      label: 'Storage',
      content: (
        <div className="space-y-6">
          <S3BucketConfig />
        </div>
      )
    },
    {
      id: 'registries',
      label: 'Registries',
      content: (
        <div className="space-y-6">
          <RegistryConfig />
        </div>
      )
    },
    {
      id: 'terragrunt',
      label: 'Terragrunt',
      content: (
        <div className="space-y-6">
          <Card title="Terragrunt Settings">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Configure Terragrunt behavior and default settings.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Auto-generate root terragrunt.hcl</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Automatically generate root configuration file
                  </p>
                </div>
                <Switch
                  id="auto-generate-root"
                  checked={localStorage.getItem('autoGenerateRoot') !== 'false'}
                  onChange={(checked) => {
                    localStorage.setItem('autoGenerateRoot', checked.toString());
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Dependency Validation</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Validate dependencies between components and services
                  </p>
                </div>
                <Switch
                  id="dependency-validation"
                  checked={localStorage.getItem('dependencyValidation') !== 'false'}
                  onChange={(checked) => {
                    localStorage.setItem('dependencyValidation', checked.toString());
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Use remote_state blocks</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Generate remote_state blocks for dependencies
                  </p>
                </div>
                <Switch
                  id="use-remote-state"
                  checked={localStorage.getItem('useRemoteState') !== 'false'}
                  onChange={(checked) => {
                    localStorage.setItem('useRemoteState', checked.toString());
                  }}
                />
              </div>
            </div>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      <Tabs 
        tabs={tabs.map(tab => ({ id: tab.id, label: tab.label }))} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />
      
      <div className="mt-6">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default SettingsPage;
