import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { Account } from '../types';

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    provider: 'aws',
    description: ''
  });

  // Load accounts from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      const storedAccounts = localStorage.getItem('accounts');
      if (storedAccounts) {
        try {
          setAccounts(JSON.parse(storedAccounts));
        } catch (error) {
          console.error('Failed to parse accounts from localStorage:', error);
        }
      }
      
      // Load regions to check dependencies
      const storedRegions = localStorage.getItem('regions');
      if (storedRegions) {
        try {
          setRegions(JSON.parse(storedRegions));
        } catch (error) {
          console.error('Failed to parse regions from localStorage:', error);
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

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  const openCreateModal = () => {
    setCurrentAccount(null);
    setFormData({
      name: '',
      id: '',
      provider: 'aws',
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setCurrentAccount(account);
    setFormData({
      name: account.name,
      id: account.id,
      provider: account.provider,
      description: account.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (currentAccount) {
      // Edit existing account
      setAccounts(accounts.map(acc => 
        acc.id === currentAccount.id ? { ...acc, ...formData } : acc
      ));
    } else {
      // Create new account
      const newAccount: Account = {
        id: formData.id,
        name: formData.name,
        provider: formData.provider,
        description: formData.description
      };
      setAccounts([...accounts, newAccount]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    // Check if any regions depend on this account
    const dependentRegions = regions.filter(region => region.accountId === id);
    
    if (dependentRegions.length > 0) {
      alert(`Cannot delete this account because ${dependentRegions.length} region(s) depend on it. Please delete those regions first.`);
      return;
    }
    
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws':
        return '☁️';
      case 'azure':
        return '🔷';
      case 'gcp':
        return '🌈';
      default:
        return '🏢';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'aws':
        return 'AWS';
      case 'azure':
        return 'Azure';
      case 'gcp':
        return 'Google Cloud';
      default:
        return provider;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Account
        </Button>
      </div>
      
      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No accounts yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Accounts represent your cloud provider accounts (AWS, Azure, GCP, etc.).
          </p>
          <Button
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Add Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card
              key={account.id}
              title={account.name}
              subtitle={account.description}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="mt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium mr-2">ID:</span> {account.id}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <span className="font-medium mr-2">Provider:</span> 
                  <span className="mr-1">{getProviderIcon(account.provider)}</span>
                  {getProviderName(account.provider)}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-500">Account</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-1 text-gray-500 hover:text-blue-500"
                    onClick={() => openEditModal(account)}
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    className="p-1 text-gray-500 hover:text-red-500"
                    onClick={() => handleDelete(account.id)}
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
        title={currentAccount ? 'Edit Account' : 'Create Account'}
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {currentAccount ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="account-name"
            label="Account Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Production, Development"
            required
            fullWidth
          />
          
          <Input
            id="account-id"
            label="Account ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="e.g., 123456789012"
            required
            fullWidth
          />
          
          <Select
            id="account-provider"
            label="Cloud Provider"
            value={formData.provider}
            onChange={(value) => setFormData({ ...formData, provider: value })}
            options={[
              { value: 'aws', label: 'AWS' },
              { value: 'azure', label: 'Azure' },
              { value: 'gcp', label: 'Google Cloud' }
            ]}
            required
            fullWidth
          />
          
          <Input
            id="account-description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Main production account"
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
};

export default AccountsPage;
