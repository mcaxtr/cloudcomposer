import React, { useState, useEffect } from 'react';
import { useTerrareg } from '../../context/TerraregContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Search, Download, ExternalLink } from 'lucide-react';
import { Module, Component } from '../../types';

interface ModuleSelectorProps {
  onSelectModule?: (component: Component) => void;
  showImportButton?: boolean;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({ 
  onSelectModule,
  showImportButton = true
}) => {
  const { isConfigured, getNamespaces, getModules, searchModules, getModuleDetails } = useTerrareg();
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConfigured) {
      loadNamespaces();
    }
  }, [isConfigured]);

  const loadNamespaces = async () => {
    try {
      setIsLoading(true);
      const fetchedNamespaces = await getNamespaces();
      setNamespaces(fetchedNamespaces);
      
      if (fetchedNamespaces.length > 0 && !selectedNamespace) {
        setSelectedNamespace(fetchedNamespaces[0]);
        loadModules(fetchedNamespaces[0]);
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModules = async (namespace: string) => {
    try {
      setIsLoading(true);
      const fetchedModules = await getModules(namespace);
      setModules(fetchedModules);
    } catch (error) {
      console.error('Failed to load modules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNamespaceChange = (namespace: string) => {
    setSelectedNamespace(namespace);
    setSearchQuery('');
    loadModules(namespace);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadModules(selectedNamespace);
      return;
    }
    
    try {
      setIsSearching(true);
      setIsLoading(true);
      const results = await searchModules(searchQuery);
      setModules(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectModule = async (module: Module) => {
    if (!onSelectModule) return;
    
    try {
      // Get the latest version
      const latestVersion = module.versions[0];
      
      // Create a component from the module
      const component: Component = {
        id: module.id,
        name: module.name,
        description: module.description,
        source: module.source,
        version: latestVersion,
        inputs: {},
        terraregNamespace: module.source.split('/')[0],
        terraregModule: module.name
      };
      
      onSelectModule(component);
    } catch (error) {
      console.error('Failed to select module:', error);
    }
  };

  if (!isConfigured) {
    return (
      <Card title="Module Registry" className="mb-6">
        <div className="p-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Please configure Terrareg connection in the settings to browse modules.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/settings'}
          >
            Go to Settings
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Module Registry" className="mb-6">
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Namespace
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedNamespace}
              onChange={(e) => handleNamespaceChange(e.target.value)}
              disabled={isLoading}
            >
              {namespaces.map((namespace) => (
                <option key={namespace} value={namespace}>
                  {namespace}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-2/3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Modules
            </label>
            <div className="flex">
              <Input
                id="module-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, provider, or description..."
                fullWidth
                disabled={isLoading}
              />
              <Button
                variant="outline"
                className="ml-2"
                onClick={handleSearch}
                disabled={isLoading}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {isSearching 
                ? 'No modules found matching your search criteria.' 
                : 'No modules found in this namespace.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Latest Version
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {modules.map((module) => (
                  <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {module.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {module.description || 'No description available'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {module.versions[0] || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {showImportButton && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Download className="h-4 w-4" />}
                            onClick={() => handleSelectModule(module)}
                          >
                            Import
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<ExternalLink className="h-4 w-4" />}
                          onClick={() => window.open(`${module.source}`, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ModuleSelector;
