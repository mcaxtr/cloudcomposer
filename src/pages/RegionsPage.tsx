import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { Plus, Edit, Trash2, Globe, AlertTriangle } from 'lucide-react';
import { Account, Region } from '../types';

const RegionsPage: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    accountId: '',
    provider: ''
  });

  // Load accounts and regions from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      // Load accounts
      const storedAccounts = localStorage.getItem('accounts');
      if (storedAccounts) {
        try {
          const parsedAccounts = JSON.parse(storedAccounts);
          setAccounts(parsedAccounts);
          
          // Set default account if available
          if (parsedAccounts.length > 0 && formData.accountId === '') {
            setFormData(prev => ({
              ...prev,
              accountId: parsedAccounts[0].id,
              provider: parsedAccounts[0].provider
            }));
          }
        } catch (error) {
          console.error('Failed to parse accounts from localStorage:', error);
        }
      }
      
      // Load regions
      const storedRegions = localStorage.getItem('regions');
      if (storedRegions) {
        try {
          setRegions(JSON.parse(storedRegions));
        } catch (error) {
          console.error('Failed to parse regions from localStorage:', error);
        }
      }
      
      // Load environments to check dependencies
      const storedEnvironments = localStorage.getItem('environments');
      if (storedEnvironments) {
        try {
          setEnvironments(JSON.parse(storedEnvironments));
        } catch (error) {
          console.error('Failed to parse environments from localStorage:', error);
        }
      }
    };
    
    loadData();
    
    // Add event listener for storage changes
    window.addEventListener('storage', loadData);
    
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // Save regions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('regions', JSON.stringify(regions));
  }, [regions]);

  const openCreateModal = () => {
    if (accounts.length === 0) {
      alert('Please create at least one account before adding regions.');
      return;
    }
    
    const defaultAccount = accounts[0];
    
    setCurrentRegion(null);
    setFormData({ 
      name: '', 
      code: '', 
      accountId: defaultAccount.id,
      provider: defaultAccount.provider
    });
    setIsModalOpen(true);
  };

  const openEditModal = (region: Region) => {
    setCurrentRegion(region);
    setFormData({
      name: region.name,
      code: region.code,
      accountId: region.accountId,
      provider: region.provider
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (currentRegion) {
      // Edit existing region
      setRegions(regions.map(reg => 
        reg.id === currentRegion.id ? { ...reg, ...formData } : reg
      ));
    } else {
      // Create new region
      const newRegion: Region = {
        id: Date.now().toString(),
        name: formData.name,
        code: formData.code,
        accountId: formData.accountId,
        provider: formData.provider
      };
      setRegions([...regions, newRegion]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    // Check if any environments depend on this region
    const dependentEnvironments = environments.filter(env => env.regionId === id);
    
    if (dependentEnvironments.length > 0) {
      alert(`Cannot delete this region because ${dependentEnvironments.length} environment(s) depend on it. Please delete those environments first.`);
      return;
    }
    
    if (confirm('Are you sure you want to delete this region? This action cannot be undone.')) {
      setRegions(regions.filter(reg => reg.id !== id));
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown';
  };

  // Common region codes by provider
  const getRegionOptions = (provider: string) => {
    switch (provider) {
      case 'aws':
        return [
          { value: 'us-east-1', label: 'US East (N. Virginia)' },
          { value: 'us-east-2', label: 'US East (Ohio)' },
          { value: 'us-west-1', label: 'US West (N. California)' },
          { value: 'us-west-2', label: 'US West (Oregon)' },
          { value: 'eu-west-1', label: 'EU West (Ireland)' },
          { value: 'eu-west-2', label: 'EU West (London)' },
          { value: 'eu-central-1', label: 'EU Central (Frankfurt)' },
          { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
          { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
          { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
          { value: 'sa-east-1', label: 'South America (São Paulo)' }
        ];
      case 'azure':
        return [
          { value: 'eastus', label: 'East US' },
          { value: 'eastus2', label: 'East US 2' },
          { value: 'westus', label: 'West US' },
          { value: 'westus2', label: 'West US 2' },
          { value: 'centralus', label: 'Central US' },
          { value: 'northeurope', label: 'North Europe' },
          { value: 'westeurope', label: 'West Europe' },
          { value: 'uksouth', label: 'UK South' },
          { value: 'southeastasia', label: 'Southeast Asia' },
          { value: 'eastasia', label: 'East Asia' },
          { value: 'japaneast', label: 'Japan East' },
          { value: 'brazilsouth', label: 'Brazil South' }
        ];
      case 'gcp':
        return [
          { value: 'us-central1', label: 'Iowa (us-central1)' },
          { value: 'us-east1', label: 'South Carolina (us-east1)' },
          { value: 'us-east4', label: 'Northern Virginia (us-east4)' },
          { value: 'us-west1', label: 'Oregon (us-west1)' },
          { value: 'us-west2', label: 'Los Angeles (us-west2)' },
          { value: 'europe-west1', label: 'Belgium (europe-west1)' },
          { value: 'europe-west2', label: 'London (europe-west2)' },
          { value: 'europe-west3', label: 'Frankfurt (europe-west3)' },
          { value: 'asia-east1', label: 'Taiwan (asia-east1)' },
          { value: 'asia-southeast1', label: 'Singapore (asia-southeast1)' },
          { value: 'asia-northeast1', label: 'Tokyo (asia-northeast1)' },
          { value: 'southamerica-east1', label: 'São Paulo (southamerica-east1)' }
        ];
      default:
        return [];
    }
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setFormData({
        ...formData,
        accountId,
        provider: account.provider
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Regions</h1>
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="h-5 w-5" />}
          disabled={accounts.length === 0}
        >
          Add Region
        </Button>
      </div>
      
      {accounts.length === 0 && (
        <Alert 
          variant="warning" 
          title="Prerequisites Required"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          <p>You need to create at least one account before adding regions. Go to the <a href="#/accounts" className="text-amber-700 underline">Accounts page</a> to create one.</p>
        </Alert>
      )}
      
      {regions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No regions yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add regions to organize your infrastructure by geographic location.
          </p>
          <Button
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-5 w-5" />}
            disabled={accounts.length === 0}
          >
            Add Region
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map((region) => (
            <Card
              key={region.id}
              title={region.name}
              subtitle={`Account: ${getAccountName(region.accountId)}`}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="mt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium mr-2">Code:</span> {region.code}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span className="font-medium mr-2">Provider:</span> {region.provider}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-500">Region</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-1 text-gray-500 hover:text-blue-500"
                    onClick={() => openEditModal(region)}
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    className="p-1 text-gray-500 hover:text-red-500"
                    onClick={() => handleDelete(region.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentRegion ? 'Edit Region' : 'Create Region'}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {currentRegion ? 'Save Changes' : 'Create Region'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            id="account-id"
            label="Account"
            value={formData.accountId}
            onChange={handleAccountChange}
            options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
            required
            fullWidth
          />
          
          <Input
            id="region-name"
            label="Region Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., US West, Europe Central"
            required
            fullWidth
          />
          
          <Select
            id="region-code"
            label="Region Code"
            value={formData.code}
            onChange={(value) => setFormData({ ...formData, code: value })}
            options={getRegionOptions(formData.provider)}
            required
            fullWidth
          />
          
          {getRegionOptions(formData.provider).length === 0 && (
            <Input
              id="region-code-input"
              label="Region Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g., us-west-2, eu-west-1"
              required
              fullWidth
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RegionsPage;
