import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Plus, Edit, Trash2, Globe, Code, AlertTriangle } from 'lucide-react';
import { Environment, Region, Account } from '../types';
import TerragruntConfigEditor from '../components/terragrunt/TerragruntConfigEditor';
import { useS3 } from '../context/S3Context';
import Alert from '../components/ui/Alert';

const EnvironmentsPage: React.FC = () => {
  const { config: s3Config, createBucket, uploadFile } = useS3();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment | null>(null);
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    regionId: '',
    bucketName: ''
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      // Load accounts
      const storedAccounts = localStorage.getItem('accounts');
      if (storedAccounts) {
        try {
          setAccounts(JSON.parse(storedAccounts));
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
      
      // Load environments
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

  // Save environments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('environments', JSON.stringify(environments));
  }, [environments]);

  const openCreateModal = () => {
    if (regions.length === 0) {
      alert('Please create at least one region before adding environments.');
      return;
    }
    
    if (!s3Config) {
      alert('Please configure S3 storage in Settings before adding environments.');
      return;
    }
    
    const defaultRegion = regions[0];
    
    setCurrentEnvironment(null);
    setFormData({
      name: '',
      description: '',
      regionId: defaultRegion.id,
      bucketName: s3Config.bucketName || ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (environment: Environment) => {
    setCurrentEnvironment(environment);
    setFormData({
      name: environment.name,
      description: environment.description || '',
      regionId: environment.regionId,
      bucketName: environment.bucketName
    });
    setIsModalOpen(true);
  };

  const openConfigEditor = (environment: Environment) => {
    setCurrentEnvironment(environment);
    setIsConfigEditorOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.regionId || !formData.bucketName) {
        alert('Please fill in all required fields.');
        return;
      }
      
      // Get the selected region
      const selectedRegion = regions.find(region => region.id === formData.regionId);
      if (!selectedRegion) {
        alert('Selected region not found.');
        return;
      }
      
      // Get the account for the selected region
      const regionAccount = accounts.find(account => account.id === selectedRegion.accountId);
      if (!regionAccount) {
        alert('Account for the selected region not found.');
        return;
      }
      
      // Create or update the environment
      if (currentEnvironment) {
        // Edit existing environment
        setEnvironments(environments.map(env => 
          env.id === currentEnvironment.id 
            ? { 
                ...env, 
                name: formData.name,
                description: formData.description,
                regionId: formData.regionId,
                bucketName: formData.bucketName
              } 
            : env
        ));
      } else {
        // Create new environment
        const newEnvironment: Environment = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          regionId: formData.regionId,
          bucketName: formData.bucketName
        };
        
        // Create the bucket if it doesn't exist
        try {
          await createBucket(formData.bucketName);
        } catch (error) {
          console.error('Failed to create bucket:', error);
          // Continue even if bucket creation fails (might already exist)
        }
        
        // Create the environment structure in the bucket
        await createEnvironmentStructure(newEnvironment, selectedRegion, regionAccount);
        
        setEnvironments([...environments, newEnvironment]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to submit environment:', error);
      alert('An error occurred. Please check the console for details.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this environment? This action cannot be undone.')) {
      setEnvironments(environments.filter(env => env.id !== id));
    }
  };

  const handleSaveConfig = async (content: string) => {
    if (!currentEnvironment) return;
    
    try {
      // Get the selected region
      const selectedRegion = regions.find(region => region.id === currentEnvironment.regionId);
      if (!selectedRegion) {
        throw new Error('Selected region not found.');
      }
      
      // Upload the terragrunt.hcl file to the bucket
      await uploadFile(
        currentEnvironment.bucketName,
        `terragrunt/environments/${currentEnvironment.name}/terragrunt.hcl`,
        content
      );
      
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please check the console for details.');
    } finally {
      setIsConfigEditorOpen(false);
    }
  };

  const createEnvironmentStructure = async (environment: Environment, region: Region, account: Account) => {
    try {
      // Create the root terragrunt.hcl file
      const rootTerragruntContent = generateRootTerragruntConfig(environment, region, account);
      await uploadFile(
        environment.bucketName,
        'terragrunt/terragrunt.hcl',
        rootTerragruntContent
      );
      
      // Create the environment terragrunt.hcl file
      const envTerragruntContent = generateEnvironmentTerragruntConfig(environment, region, account);
      await uploadFile(
        environment.bucketName,
        `terragrunt/environments/${environment.name}/terragrunt.hcl`,
        envTerragruntContent
      );
      
      // Create directories for components and services
      await uploadFile(
        environment.bucketName,
        `terragrunt/environments/${environment.name}/components/.gitkeep`,
        ''
      );
      
      await uploadFile(
        environment.bucketName,
        `terragrunt/environments/${environment.name}/services/.gitkeep`,
        ''
      );
      
      console.log('Environment structure created successfully!');
    } catch (error) {
      console.error('Failed to create environment structure:', error);
    }
  };

  const generateRootTerragruntConfig = (environment: Environment, region: Region, account: Account): string => {
    return `# Root terragrunt.hcl file
# This file defines global configuration for all modules

remote_state {
  backend = "s3"
  config = {
    bucket         = "${environment.bucketName}"
    key            = "\${path_relative_to_include()}/terraform.tfstate"
    region         = "${region.code}"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

# Global variables that will be available to all modules
inputs = {
  aws_region  = "${region.code}"
  aws_account = "${account.id}"
  environment = "${environment.name}"
  provider    = "${account.provider}"
}
`;
  };

  const generateEnvironmentTerragruntConfig = (environment: Environment, region: Region, account: Account): string => {
    return `# Environment-specific terragrunt.hcl file for ${environment.name}
# This file defines configuration specific to this environment

include "root" {
  path = find_in_parent_folders()
}

# Environment-specific variables
inputs = {
  environment = "${environment.name}"
  region      = "${region.code}"
  account_id  = "${account.id}"
  provider    = "${account.provider}"
}
`;
  };

  const getRegionName = (regionId: string) => {
    const region = regions.find(reg => reg.id === regionId);
    return region ? region.name : 'Unknown';
  };

  const getRegionCode = (regionId: string) => {
    const region = regions.find(reg => reg.id === regionId);
    return region ? region.code : 'Unknown';
  };

  const getAccountForRegion = (regionId: string) => {
    const region = regions.find(reg => reg.id === regionId);
    if (!region) return 'Unknown';
    
    const account = accounts.find(acc => acc.id === region.accountId);
    return account ? account.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Environments</h1>
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="h-5 w-5" />}
          disabled={regions.length === 0 || !s3Config}
        >
          Add Environment
        </Button>
      </div>
      
      {(regions.length === 0 || !s3Config) && (
        <Alert 
          variant="warning" 
          title="Prerequisites Required"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          {regions.length === 0 && (
            <p>You need to create at least one region before adding environments. Go to the <a href="#/regions" className="text-amber-700 underline">Regions page</a> to create one.</p>
          )}
          {!s3Config && (
            <p>You need to configure S3 storage in <a href="#/settings" className="text-amber-700 underline">Settings</a> before adding environments.</p>
          )}
        </Alert>
      )}
      
      {environments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No environments yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Environments represent different deployment targets like development, staging, or production.
          </p>
          <Button
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-5 w-5" />}
            disabled={regions.length === 0 || !s3Config}
          >
            Add Environment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {environments.map((environment) => (
            <Card
              key={environment.id}
              title={environment.name}
              subtitle={environment.description}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="mt-2 space-y-3">
                <div className="flex items-center">
                  <Badge variant="primary" className="mr-2">
                    {getRegionCode(environment.regionId)}
                  </Badge>
                  <Badge variant="secondary">
                    {getAccountForRegion(environment.regionId)}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Region: <span className="font-medium">{getRegionName(environment.regionId)}</span>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Bucket: <span className="font-medium">{environment.bucketName}</span>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Code className="h-4 w-4" />}
                    onClick={() => openConfigEditor(environment)}
                  >
                    View Config
                  </Button>
                  
                  <div className="flex space-x-2">
                    <button
                      className="p-1 text-gray-500 hover:text-blue-500"
                      onClick={() => openEditModal(environment)}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      className="p-1 text-gray-500 hover:text-red-500"
                      onClick={() => handleDelete(environment.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentEnvironment ? 'Edit Environment' : 'Create Environment'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {currentEnvironment ? 'Save Changes' : 'Create Environment'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="environment-name"
            label="Environment Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., dev, staging, prod"
            required
            fullWidth
          />
          
          <Input
            id="environment-description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Development environment for testing"
            fullWidth
          />
          
          <Select
            id="environment-region"
            label="Region"
            value={formData.regionId}
            onChange={(value) => setFormData({ ...formData, regionId: value })}
            options={regions.map(region => ({ 
              value: region.id, 
              label: `${region.name} (${region.code}) - Account: ${getAccountForRegion(region.id)}` 
            }))}
            required
            fullWidth
          />
          
          <Input
            id="environment-bucket"
            label="S3 Bucket Name"
            value={formData.bucketName}
            onChange={(e) => setFormData({ ...formData, bucketName: e.target.value })}
            placeholder="e.g., my-terragrunt-state"
            required
            fullWidth
            disabled={!!s3Config}
            helperText={s3Config ? `Using configured bucket: ${s3Config.bucketName}` : ''}
          />
        </div>
      </Modal>
      
      <Modal
        isOpen={isConfigEditorOpen}
        onClose={() => setIsConfigEditorOpen(false)}
        title={`Terragrunt Configuration: ${currentEnvironment?.name}`}
        size="xl"
      >
        {currentEnvironment && (
          <TerragruntConfigEditor
            initialContent={
              (() => {
                const region = regions.find(r => r.id === currentEnvironment.regionId);
                if (!region) return '';
                
                const account = accounts.find(a => a.id === region.accountId);
                if (!account) return '';
                
                return generateEnvironmentTerragruntConfig(currentEnvironment, region, account);
              })()
            }
            title={`${currentEnvironment.name}/terragrunt.hcl`}
            path={`terragrunt/environments/${currentEnvironment.name}/terragrunt.hcl`}
            onSave={handleSaveConfig}
          />
        )}
      </Modal>
    </div>
  );
};

export default EnvironmentsPage;
