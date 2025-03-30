import React, { useState, useEffect } from 'react';
import { useRegistry } from '../../context/RegistryContext';
import { RegistryConfig as RegistryConfigType, RegistryType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  AlertTriangle, Check, Plus, Trash, Edit, RefreshCw, 
  Server, Globe, GitBranch, Github, Gitlab, Settings, 
  ChevronDown, ChevronUp, ExternalLink, Copy
} from 'lucide-react';

// UI Components
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import Alert from '../ui/Alert';
import Modal from '../ui/Modal';
import Tabs from '../ui/Tabs';
import Badge from '../ui/Badge';

interface RegistryConfigProps {
  onConfigSaved?: () => void;
}

const RegistryConfig: React.FC<RegistryConfigProps> = ({ onConfigSaved }) => {
  const { 
    registries, 
    activeRegistry, 
    isConfigured,
    addRegistry, 
    updateRegistry, 
    deleteRegistry, 
    setActiveRegistry,
    testConnection,
    importLegacyTerraregConfig
  } = useRegistry();

  // Form state
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<RegistryType>(RegistryType.TERRAREG);
  const [url, setUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [autoUpdateModules, setAutoUpdateModules] = useState<boolean>(false);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  
  // UI state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [expandedRegistry, setExpandedRegistry] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Try to import legacy Terrareg config on first load
  useEffect(() => {
    if (!isConfigured) {
      importLegacyConfig();
    }
  }, []);

  // Reset form
  const resetForm = () => {
    setName('');
    setType(RegistryType.TERRAREG);
    setUrl('');
    setApiKey('');
    setAutoUpdateModules(false);
    setIsDefault(false);
    setIsEnabled(true);
    setIsEditing(false);
    setEditingId(null);
    setError(null);
    setTestResult(null);
    setActiveTab('general');
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (registry: RegistryConfigType) => {
    loadRegistryForEdit(registry);
    setIsAddModalOpen(true);
  };

  // Load registry data for editing
  const loadRegistryForEdit = (registry: RegistryConfigType) => {
    setName(registry.name);
    setType(registry.type);
    setUrl(registry.url);
    setApiKey(registry.apiKey || '');
    setAutoUpdateModules(registry.autoUpdateModules || false);
    setIsDefault(registry.isDefault || false);
    setIsEnabled(registry.isEnabled);
    setIsEditing(true);
    setEditingId(registry.id);
    setError(null);
    setTestResult(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // Validate form
      if (!name.trim()) {
        throw new Error('Registry name is required');
      }

      if (!url.trim()) {
        throw new Error('Registry URL is required');
      }

      // Create registry config
      const config: RegistryConfigType = {
        id: editingId || uuidv4(),
        name: name.trim(),
        type,
        url: url.trim(),
        apiKey: apiKey.trim() || undefined,
        autoUpdateModules,
        isDefault,
        isEnabled
      };

      // Test connection
      const connected = await testConnection(config);
      setTestResult(connected);

      if (!connected) {
        throw new Error('Failed to connect to registry. Please check your configuration.');
      }

      // Save registry
      if (isEditing && editingId) {
        await updateRegistry(editingId, config);
      } else {
        await addRegistry(config);
      }

      // Reset form and close modal
      resetForm();
      setIsAddModalOpen(false);

      // Call onConfigSaved callback if provided
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error) {
      console.error('Failed to save registry config:', error);
      setError(error instanceof Error ? error.message : 'Failed to save registry config');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registry deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this registry?')) {
      try {
        await deleteRegistry(id);
      } catch (error) {
        console.error('Failed to delete registry:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete registry');
      }
    }
  };

  // Handle setting active registry
  const handleSetActive = async (id: string) => {
    try {
      await setActiveRegistry(id);
    } catch (error) {
      console.error('Failed to set active registry:', error);
      setError(error instanceof Error ? error.message : 'Failed to set active registry');
    }
  };

  // Import legacy Terrareg config
  const importLegacyConfig = async () => {
    try {
      const imported = await importLegacyTerraregConfig();
      if (imported) {
        setImportResult('Successfully imported legacy Terrareg configuration.');
      }
    } catch (error) {
      console.error('Failed to import legacy Terrareg config:', error);
    }
  };

  // Toggle registry expansion
  const toggleExpand = (id: string) => {
    if (expandedRegistry === id) {
      setExpandedRegistry(null);
    } else {
      setExpandedRegistry(id);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get registry icon based on type
  const getRegistryIcon = (type: RegistryType) => {
    switch (type) {
      case RegistryType.TERRAREG:
        return <Server className="h-5 w-5" />;
      case RegistryType.TERRAFORM_REGISTRY:
        return <Globe className="h-5 w-5" />;
      case RegistryType.GITLAB:
        return <Gitlab className="h-5 w-5" />;
      case RegistryType.GITHUB:
        return <Github className="h-5 w-5" />;
      case RegistryType.CUSTOM:
        return <Settings className="h-5 w-5" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  // Get registry type label
  const getRegistryTypeLabel = (type: RegistryType) => {
    switch (type) {
      case RegistryType.TERRAREG:
        return 'Terrareg';
      case RegistryType.TERRAFORM_REGISTRY:
        return 'Terraform Registry';
      case RegistryType.GITLAB:
        return 'GitLab';
      case RegistryType.GITHUB:
        return 'GitHub';
      case RegistryType.CUSTOM:
        return 'Custom';
      default:
        return type;
    }
  };

  // Render form tabs
  const renderFormTabs = () => {
    return (
      <Tabs
        tabs={[
          { id: 'general', label: 'General' },
          { id: 'advanced', label: 'Advanced' },
          { id: 'test', label: 'Connection Test' }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
    );
  };

  // Render form content based on active tab
  const renderFormContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-4">
            <Input
              id="registry-name"
              label="Registry Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Registry"
              required
              fullWidth
            />

            <Select
              id="registry-type"
              label="Registry Type"
              value={type}
              onChange={(value) => setType(value as RegistryType)}
              options={[
                { value: RegistryType.TERRAREG, label: 'Terrareg' },
                { value: RegistryType.TERRAFORM_REGISTRY, label: 'Terraform Registry' },
                { value: RegistryType.GITLAB, label: 'GitLab' },
                { value: RegistryType.GITHUB, label: 'GitHub' },
                { value: RegistryType.CUSTOM, label: 'Custom' }
              ]}
            />

            <Input
              id="registry-url"
              label="Registry URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://registry.example.com"
              required
              fullWidth
              leftIcon={<Globe className="h-4 w-4 text-gray-400" />}
            />

            <Input
              id="registry-api-key"
              label="API Key (Optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your API key"
              type={showApiKey ? "text" : "password"}
              fullWidth
              rightIcon={
                <button 
                  type="button" 
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              }
            />
          </div>
        );
      case 'advanced':
        return (
          <div className="space-y-4">
            <Switch
              id="auto-update-modules"
              label="Auto-update modules"
              checked={autoUpdateModules}
              onChange={setAutoUpdateModules}
              description="Automatically fetch modules when visiting the modules page"
            />

            <Switch
              id="is-default"
              label="Set as default registry"
              checked={isDefault}
              onChange={setIsDefault}
              description="This registry will be used by default"
            />

            <Switch
              id="is-enabled"
              label="Enable registry"
              checked={isEnabled}
              onChange={setIsEnabled}
              description="Disable to temporarily turn off this registry"
            />
          </div>
        );
      case 'test':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Test the connection to the registry to ensure it's properly configured.
            </p>
            
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={async () => {
                setIsLoading(true);
                setTestResult(null);
                try {
                  const config: RegistryConfigType = {
                    id: editingId || uuidv4(),
                    name: name.trim(),
                    type,
                    url: url.trim(),
                    apiKey: apiKey.trim() || undefined,
                    autoUpdateModules,
                    isDefault,
                    isEnabled
                  };
                  const result = await testConnection(config);
                  setTestResult(result);
                } catch (error) {
                  console.error('Connection test failed:', error);
                  setTestResult(false);
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            >
              Test Connection
            </Button>

            {testResult === true && (
              <Alert 
                variant="success" 
                title="Connection Successful"
                icon={<Check className="h-5 w-5" />}
              >
                Successfully connected to the registry.
              </Alert>
            )}

            {testResult === false && (
              <Alert 
                variant="error" 
                title="Connection Failed"
                icon={<AlertTriangle className="h-5 w-5" />}
              >
                Failed to connect to the registry. Please check your configuration.
              </Alert>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {importResult && (
        <Alert 
          variant="success" 
          title="Import Successful"
          icon={<Check className="h-5 w-5" />}
          onClose={() => setImportResult(null)}
        >
          {importResult}
        </Alert>
      )}

      {error && (
        <Alert 
          variant="error" 
          title="Error"
          icon={<AlertTriangle className="h-5 w-5" />}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Registry List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Registry Configurations</h2>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openAddModal}
          >
            Add Registry
          </Button>
        </div>

        {registries.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Server className="h-6 w-6" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No registries</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding a new registry.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={openAddModal}
              >
                Add Registry
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {registries.map((registry) => (
              <li key={registry.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      activeRegistry?.id === registry.id 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {getRegistryIcon(registry.type)}
                    </div>
                    <div className="ml-4 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {registry.name}
                        </p>
                        <div className="ml-2 flex flex-wrap gap-1">
                          {registry.isDefault && (
                            <Badge color="blue">Default</Badge>
                          )}
                          {!registry.isEnabled && (
                            <Badge color="gray">Disabled</Badge>
                          )}
                          {activeRegistry?.id === registry.id && (
                            <Badge color="green">Active</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {registry.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeRegistry?.id !== registry.id && registry.isEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(registry.id)}
                      >
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={() => toggleExpand(registry.id)}
                      title={expandedRegistry === registry.id ? "Collapse" : "Expand"}
                    >
                      {expandedRegistry === registry.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {expandedRegistry === registry.id && (
                  <div className="mt-4 pl-14 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Registry Details
                        </h4>
                        <dl className="mt-2 space-y-1">
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">{getRegistryTypeLabel(registry.type)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">URL:</dt>
                            <dd className="text-sm text-gray-900 dark:text-white flex items-center">
                              <span className="truncate max-w-xs">{registry.url}</span>
                              <button 
                                onClick={() => copyToClipboard(registry.url, `url-${registry.id}`)}
                                className="ml-1 text-gray-400 hover:text-gray-500"
                                title="Copy URL"
                              >
                                {copiedId === `url-${registry.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                              <a 
                                href={registry.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-1 text-gray-400 hover:text-gray-500"
                                title="Open URL"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto-update:</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {registry.autoUpdateModules ? 'Enabled' : 'Disabled'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </h4>
                        <dl className="mt-2 space-y-1">
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Default:</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {registry.isDefault ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Enabled:</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {registry.isEnabled ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Active:</dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {activeRegistry?.id === registry.id ? 'Yes' : 'No'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit className="h-4 w-4" />}
                        onClick={() => openEditModal(registry)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash className="h-4 w-4" />}
                        onClick={() => handleDelete(registry.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add/Edit Registry Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          resetForm();
          setIsAddModalOpen(false);
        }}
        title={isEditing ? 'Edit Registry' : 'Add Registry'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              {isEditing ? 'Update Registry' : 'Add Registry'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {renderFormTabs()}
          <div className="mt-4">
            {renderFormContent()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RegistryConfig;
