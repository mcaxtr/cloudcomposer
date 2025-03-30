import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
import { Plus, Search, Package, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { Module } from '../types';
import { useRegistry } from '../context/RegistryContext';
import RegistryConfig from '../components/terragrunt/RegistryConfig';

const ModulesPage: React.FC = () => {
  const { 
    isConfigured, 
    isConnected, 
    getNamespaces, 
    getModules, 
    searchModules,
    activeRegistry
  } = useRegistry();
  
  const [modules, setModules] = useState<Module[]>([]);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  // Load modules from Registry when component mounts or config changes
  useEffect(() => {
    if (isConfigured && isConnected) {
      loadNamespaces();
      
      // If auto-update is enabled, load modules automatically
      if (activeRegistry?.autoUpdateModules) {
        loadAllModules();
      }
    }
  }, [isConfigured, isConnected, activeRegistry?.autoUpdateModules]);

  // Load namespaces from Registry
  const loadNamespaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedNamespaces = await getNamespaces();
      setNamespaces(fetchedNamespaces);
      
      // Select the first namespace if available
      if (fetchedNamespaces.length > 0 && !selectedNamespace) {
        setSelectedNamespace(fetchedNamespaces[0]);
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error);
      setError('Failed to load namespaces from registry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load modules for the selected namespace
  const loadModules = async () => {
    if (!selectedNamespace) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const fetchedModules = await getModules(selectedNamespace);
      setModules(fetchedModules);
    } catch (error) {
      console.error('Failed to load modules:', error);
      setError(`Failed to load modules for namespace "${selectedNamespace}".`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load all modules from all namespaces
  const loadAllModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First, get all namespaces
      const fetchedNamespaces = await getNamespaces();
      setNamespaces(fetchedNamespaces);
      
      // Then, get modules for each namespace
      let allModules: Module[] = [];
      for (const namespace of fetchedNamespaces) {
        const namespaceModules = await getModules(namespace);
        allModules = [...allModules, ...namespaceModules];
      }
      
      setModules(allModules);
    } catch (error) {
      console.error('Failed to load all modules:', error);
      setError('Failed to load modules from registry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle namespace change
  const handleNamespaceChange = (namespace: string) => {
    setSelectedNamespace(namespace);
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If search query is empty, load modules for selected namespace
      loadModules();
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      const results = await searchModules(searchQuery);
      setModules(results);
    } catch (error) {
      console.error('Failed to search modules:', error);
      setError(`Failed to search for "${searchQuery}".`);
    } finally {
      setIsLoading(false);
    }
  };

  // Open module details modal
  const openModuleDetails = (module: Module) => {
    setSelectedModule(module);
    setIsModalOpen(true);
  };

  // Render module inputs
  const renderModuleInputs = (inputs: Module['inputs']) => {
    if (!inputs || inputs.length === 0) {
      return <p className="text-gray-500 italic">No inputs defined</p>;
    }
    
    return (
      <div className="space-y-2">
        {inputs.map((input, index) => (
          <div key={index} className="border-b border-gray-200 pb-2">
            <div className="flex justify-between">
              <span className="font-medium">{input.name}</span>
              <span className="text-sm text-gray-500">{input.type}</span>
            </div>
            {input.description && (
              <p className="text-sm text-gray-600">{input.description}</p>
            )}
            <div className="text-sm">
              {input.required ? (
                <span className="text-red-500">Required</span>
              ) : (
                <span className="text-gray-500">
                  Optional, default: {input.default !== undefined ? 
                    (typeof input.default === 'object' ? 
                      JSON.stringify(input.default) : 
                      String(input.default)
                    ) : 
                    'null'
                  }
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render module outputs
  const renderModuleOutputs = (outputs: Module['outputs']) => {
    if (!outputs || outputs.length === 0) {
      return <p className="text-gray-500 italic">No outputs defined</p>;
    }
    
    return (
      <div className="space-y-2">
        {outputs.map((output, index) => (
          <div key={index} className="border-b border-gray-200 pb-2">
            <span className="font-medium">{output.name}</span>
            {output.description && (
              <p className="text-sm text-gray-600">{output.description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terraform Modules</h1>
        <Button
          variant="primary"
          onClick={loadAllModules}
          leftIcon={<RefreshCw className="h-5 w-5" />}
          disabled={!isConfigured || !isConnected || isLoading}
        >
          Refresh Modules
        </Button>
      </div>
      
      {!isConfigured && (
        <Alert 
          variant="warning" 
          title="Registry Not Configured"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          <p>Please configure your registry connection to browse and use modules.</p>
          <RegistryConfig />
        </Alert>
      )}
      
      {isConfigured && !isConnected && (
        <Alert 
          variant="error" 
          title="Connection Failed"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          <p>Failed to connect to registry. Please check your configuration.</p>
          <RegistryConfig />
        </Alert>
      )}
      
      {isConfigured && isConnected && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select
                  id="namespace-select"
                  label="Namespace"
                  value={selectedNamespace}
                  onChange={handleNamespaceChange}
                  options={namespaces.map(ns => ({ value: ns, label: ns }))}
                  placeholder="Select a namespace"
                  fullWidth
                />
              </div>
              <div className="flex-1">
                <Input
                  id="search-query"
                  label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules..."
                  fullWidth
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={handleSearch}
                  leftIcon={<Search className="h-5 w-5" />}
                  disabled={isLoading}
                >
                  Search
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {modules.length} module{modules.length !== 1 ? 's' : ''} found
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadModules}
                disabled={!selectedNamespace || isLoading}
              >
                Load Modules for {selectedNamespace || 'Selected Namespace'}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          )}
          
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading modules...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No modules found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {selectedNamespace 
                  ? `No modules found in namespace "${selectedNamespace}".` 
                  : 'Select a namespace or search for modules.'}
              </p>
              {selectedNamespace && (
                <Button
                  variant="primary"
                  onClick={loadModules}
                  leftIcon={<RefreshCw className="h-5 w-5" />}
                >
                  Refresh
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  title={module.name}
                  subtitle={module.source}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => openModuleDetails(module)}
                >
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {module.description || 'No description available'}
                    </p>
                    
                    {module.versions && module.versions.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Latest version:</span>{' '}
                        <span className="text-blue-600">{module.versions[0]}</span>
                      </div>
                    )}
                    
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Inputs:</span>{' '}
                      <span>{module.inputs?.length || 0}</span>
                    </div>
                    
                    <div className="mt-1 text-sm">
                      <span className="font-medium">Outputs:</span>{' '}
                      <span>{module.outputs?.length || 0}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedModule?.name || 'Module Details'}
        size="xl"
      >
        {selectedModule && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Source</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <code className="text-sm">{selectedModule.source}</code>
              </div>
            </div>
            
            {selectedModule.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-gray-600 dark:text-gray-300">{selectedModule.description}</p>
              </div>
            )}
            
            {selectedModule.versions && selectedModule.versions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Versions</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedModule.versions.map((version, index) => (
                    <span 
                      key={index} 
                      className={`px-2 py-1 rounded-md text-sm ${
                        index === 0 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                      }`}
                    >
                      {version}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Inputs</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md max-h-60 overflow-y-auto">
                {renderModuleInputs(selectedModule.inputs)}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Outputs</h3>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md max-h-60 overflow-y-auto">
                {renderModuleOutputs(selectedModule.outputs)}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              {activeRegistry && (
                <Button
                  variant="primary"
                  leftIcon={<ExternalLink className="h-4 w-4" />}
                  onClick={() => window.open(`${activeRegistry.url}/modules/${selectedModule.source}`, '_blank')}
                >
                  View in Registry
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ModulesPage;
