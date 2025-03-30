import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RegistryConfig, RegistryType, Module } from '../types';
import terraregService from '../services/TerraregService';

interface RegistryContextType {
  registries: RegistryConfig[];
  activeRegistry: RegistryConfig | null;
  isConfigured: boolean;
  isConnected: boolean;
  addRegistry: (config: RegistryConfig) => Promise<void>;
  updateRegistry: (id: string, config: Partial<RegistryConfig>) => Promise<void>;
  deleteRegistry: (id: string) => Promise<void>;
  setActiveRegistry: (id: string) => Promise<void>;
  testConnection: (config: RegistryConfig) => Promise<boolean>;
  getNamespaces: () => Promise<string[]>;
  getModules: (namespace: string) => Promise<Module[]>;
  searchModules: (query: string) => Promise<Module[]>;
  importLegacyTerraregConfig: () => Promise<boolean>;
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

export const RegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [registries, setRegistries] = useState<RegistryConfig[]>([]);
  const [activeRegistry, setActiveRegistryState] = useState<RegistryConfig | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Load registries from localStorage on mount
  useEffect(() => {
    const storedRegistries = localStorage.getItem('registries');
    if (storedRegistries) {
      try {
        const parsedRegistries = JSON.parse(storedRegistries);
        setRegistries(parsedRegistries);
        
        // Set active registry to the default one if available
        const defaultRegistry = parsedRegistries.find((r: RegistryConfig) => r.isDefault);
        if (defaultRegistry) {
          setActiveRegistryState(defaultRegistry);
          
          // Test connection with active registry
          testConnectionWithConfig(defaultRegistry)
            .then(connected => setIsConnected(connected))
            .catch(() => setIsConnected(false));
        }
      } catch (error) {
        console.error('Failed to parse registries from localStorage:', error);
      }
    }
  }, []);

  // Save registries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('registries', JSON.stringify(registries));
  }, [registries]);

  // Add a new registry
  const addRegistry = async (config: RegistryConfig): Promise<void> => {
    try {
      // If this is the first registry, make it the default
      if (registries.length === 0) {
        config.isDefault = true;
      }
      
      // If this is marked as default, update all others to not be default
      const updatedRegistries = config.isDefault 
        ? registries.map(r => ({ ...r, isDefault: false }))
        : [...registries];
      
      // Add the new registry
      const newRegistries = [...updatedRegistries, config];
      setRegistries(newRegistries);
      
      // If this is the default or the first registry, set it as active
      if (config.isDefault || registries.length === 0) {
        setActiveRegistryState(config);
        
        // Test connection with the new registry
        const connected = await testConnectionWithConfig(config);
        setIsConnected(connected);
      }
    } catch (error) {
      console.error('Failed to add registry:', error);
      throw error;
    }
  };

  // Update an existing registry
  const updateRegistry = async (id: string, updates: Partial<RegistryConfig>): Promise<void> => {
    try {
      // Find the registry to update
      const registryIndex = registries.findIndex(r => r.id === id);
      if (registryIndex === -1) {
        throw new Error(`Registry with ID ${id} not found`);
      }
      
      // Create updated registry
      const updatedRegistry = { ...registries[registryIndex], ...updates };
      
      // If this is being set as default, update all others to not be default
      let updatedRegistries = [...registries];
      if (updates.isDefault) {
        updatedRegistries = registries.map(r => 
          r.id !== id ? { ...r, isDefault: false } : r
        );
      }
      
      // Update the registry in the list
      updatedRegistries[registryIndex] = updatedRegistry;
      setRegistries(updatedRegistries);
      
      // If this is the active registry, update it
      if (activeRegistry?.id === id) {
        setActiveRegistryState(updatedRegistry);
        
        // Test connection with the updated registry
        const connected = await testConnectionWithConfig(updatedRegistry);
        setIsConnected(connected);
      }
      
      // If this is now the default and no active registry, set it as active
      if (updates.isDefault && !activeRegistry) {
        setActiveRegistryState(updatedRegistry);
        
        // Test connection with the updated registry
        const connected = await testConnectionWithConfig(updatedRegistry);
        setIsConnected(connected);
      }
    } catch (error) {
      console.error('Failed to update registry:', error);
      throw error;
    }
  };

  // Delete a registry
  const deleteRegistry = async (id: string): Promise<void> => {
    try {
      // Check if this is the active registry
      const isActive = activeRegistry?.id === id;
      
      // Check if this is the default registry
      const isDefault = registries.find(r => r.id === id)?.isDefault || false;
      
      // Remove the registry
      const updatedRegistries = registries.filter(r => r.id !== id);
      
      // If this was the default registry, set a new default if possible
      if (isDefault && updatedRegistries.length > 0) {
        updatedRegistries[0].isDefault = true;
      }
      
      setRegistries(updatedRegistries);
      
      // If this was the active registry, set a new active registry if possible
      if (isActive) {
        if (updatedRegistries.length > 0) {
          const newActive = updatedRegistries.find(r => r.isDefault) || updatedRegistries[0];
          setActiveRegistryState(newActive);
          
          // Test connection with the new active registry
          const connected = await testConnectionWithConfig(newActive);
          setIsConnected(connected);
        } else {
          setActiveRegistryState(null);
          setIsConnected(false);
        }
      }
    } catch (error) {
      console.error('Failed to delete registry:', error);
      throw error;
    }
  };

  // Set the active registry
  const setActiveRegistry = async (id: string): Promise<void> => {
    try {
      const registry = registries.find(r => r.id === id);
      if (!registry) {
        throw new Error(`Registry with ID ${id} not found`);
      }
      
      setActiveRegistryState(registry);
      
      // Test connection with the new active registry
      const connected = await testConnectionWithConfig(registry);
      setIsConnected(connected);
    } catch (error) {
      console.error('Failed to set active registry:', error);
      throw error;
    }
  };

  // Test connection with a registry config
  const testConnection = async (config: RegistryConfig): Promise<boolean> => {
    return testConnectionWithConfig(config);
  };

  // Test connection with a specific registry config
  const testConnectionWithConfig = async (config: RegistryConfig): Promise<boolean> => {
    try {
      if (!config.isEnabled) {
        return false;
      }
      
      switch (config.type) {
        case RegistryType.TERRAREG:
          // Initialize Terrareg service with the config
          terraregService.initialize({
            url: config.url,
            apiKey: config.apiKey,
            autoUpdateModules: config.autoUpdateModules
          });
          
          // Test connection
          return await terraregService.testConnection();
          
        case RegistryType.TERRAFORM_REGISTRY:
          // For Terraform Registry, just check if the URL is reachable
          const response = await fetch(`${config.url}/v1/modules`);
          return response.ok;
          
        case RegistryType.GITLAB:
        case RegistryType.GITHUB:
        case RegistryType.CUSTOM:
          // For other registry types, implement specific connection tests
          // For now, just check if the URL is reachable
          const res = await fetch(config.url);
          return res.ok;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      return false;
    }
  };

  // Get all namespaces from the active registry
  const getNamespaces = async (): Promise<string[]> => {
    if (!activeRegistry || !isConnected) {
      throw new Error('No active registry or not connected');
    }
    
    try {
      switch (activeRegistry.type) {
        case RegistryType.TERRAREG:
          // Initialize Terrareg service with the active registry config
          terraregService.initialize({
            url: activeRegistry.url,
            apiKey: activeRegistry.apiKey,
            autoUpdateModules: activeRegistry.autoUpdateModules
          });
          
          // Get namespaces
          return await terraregService.getNamespaces();
          
        case RegistryType.TERRAFORM_REGISTRY:
        case RegistryType.GITLAB:
        case RegistryType.GITHUB:
        case RegistryType.CUSTOM:
          // Implement for other registry types
          // For now, return an empty array
          return [];
          
        default:
          return [];
      }
    } catch (error) {
      console.error('Failed to get namespaces:', error);
      throw error;
    }
  };

  // Get modules for a specific namespace from the active registry
  const getModules = async (namespace: string): Promise<Module[]> => {
    if (!activeRegistry || !isConnected) {
      throw new Error('No active registry or not connected');
    }
    
    try {
      switch (activeRegistry.type) {
        case RegistryType.TERRAREG:
          // Initialize Terrareg service with the active registry config
          terraregService.initialize({
            url: activeRegistry.url,
            apiKey: activeRegistry.apiKey,
            autoUpdateModules: activeRegistry.autoUpdateModules
          });
          
          // Get modules
          const modules = await terraregService.getModules(namespace);
          
          // Add registry ID to each module
          return modules.map(module => ({
            ...module,
            registryId: activeRegistry.id
          }));
          
        case RegistryType.TERRAFORM_REGISTRY:
        case RegistryType.GITLAB:
        case RegistryType.GITHUB:
        case RegistryType.CUSTOM:
          // Implement for other registry types
          // For now, return an empty array
          return [];
          
        default:
          return [];
      }
    } catch (error) {
      console.error('Failed to get modules:', error);
      throw error;
    }
  };

  // Search modules by query in the active registry
  const searchModules = async (query: string): Promise<Module[]> => {
    if (!activeRegistry || !isConnected) {
      throw new Error('No active registry or not connected');
    }
    
    try {
      switch (activeRegistry.type) {
        case RegistryType.TERRAREG:
          // Initialize Terrareg service with the active registry config
          terraregService.initialize({
            url: activeRegistry.url,
            apiKey: activeRegistry.apiKey,
            autoUpdateModules: activeRegistry.autoUpdateModules
          });
          
          // Search modules
          const modules = await terraregService.searchModules(query);
          
          // Add registry ID to each module
          return modules.map(module => ({
            ...module,
            registryId: activeRegistry.id
          }));
          
        case RegistryType.TERRAFORM_REGISTRY:
        case RegistryType.GITLAB:
        case RegistryType.GITHUB:
        case RegistryType.CUSTOM:
          // Implement for other registry types
          // For now, return an empty array
          return [];
          
        default:
          return [];
      }
    } catch (error) {
      console.error('Failed to search modules:', error);
      throw error;
    }
  };

  // Import legacy Terrareg config if it exists
  const importLegacyTerraregConfig = async (): Promise<boolean> => {
    try {
      const storedConfig = localStorage.getItem('terraregConfig');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        
        // Check if this config is already imported
        const existingRegistry = registries.find(r => 
          r.type === RegistryType.TERRAREG && 
          r.url === parsedConfig.url
        );
        
        if (!existingRegistry) {
          // Create a new registry config from the legacy config
          const newRegistry: RegistryConfig = {
            id: Date.now().toString(),
            name: 'Terrareg (Imported)',
            type: RegistryType.TERRAREG,
            url: parsedConfig.url,
            apiKey: parsedConfig.apiKey,
            autoUpdateModules: parsedConfig.autoUpdateModules || false,
            isDefault: registries.length === 0, // Make default if it's the first registry
            isEnabled: true
          };
          
          // Add the new registry
          await addRegistry(newRegistry);
          
          // Remove the legacy config
          localStorage.removeItem('terraregConfig');
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import legacy Terrareg config:', error);
      return false;
    }
  };

  const value = {
    registries,
    activeRegistry,
    isConfigured: registries.length > 0,
    isConnected,
    addRegistry,
    updateRegistry,
    deleteRegistry,
    setActiveRegistry,
    testConnection,
    getNamespaces,
    getModules,
    searchModules,
    importLegacyTerraregConfig
  };

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
};

export const useRegistry = (): RegistryContextType => {
  const context = useContext(RegistryContext);
  if (context === undefined) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
};
