import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TerraregConfig, Module } from '../types';

interface TerraregContextType {
  config: TerraregConfig | null;
  isConfigured: boolean;
  isConnected: boolean;
  setConfig: (config: TerraregConfig) => Promise<void>;
  testConnection: () => Promise<boolean>;
  getNamespaces: () => Promise<string[]>;
  getModules: (namespace: string) => Promise<Module[]>;
  searchModules: (query: string) => Promise<Module[]>;
}

const TerraregContext = createContext<TerraregContextType | undefined>(undefined);

export const TerraregProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfigState] = useState<TerraregConfig | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Load config from localStorage on mount
  useEffect(() => {
    const storedConfig = localStorage.getItem('terraregConfig');
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig);
        setConfigState(parsedConfig);
        
        // Test connection with loaded config
        testConnectionWithConfig(parsedConfig)
          .then(connected => setIsConnected(connected))
          .catch(() => setIsConnected(false));
      } catch (error) {
        console.error('Failed to parse Terrareg config from localStorage:', error);
      }
    }
  }, []);

  // Save config to localStorage and test connection
  const setConfig = async (newConfig: TerraregConfig): Promise<void> => {
    try {
      // Save to localStorage
      localStorage.setItem('terraregConfig', JSON.stringify(newConfig));
      
      // Update state
      setConfigState(newConfig);
      
      // Test connection
      const connected = await testConnectionWithConfig(newConfig);
      setIsConnected(connected);
    } catch (error) {
      console.error('Failed to save Terrareg config:', error);
      throw error;
    }
  };

  // Test connection with the current config
  const testConnection = async (): Promise<boolean> => {
    if (!config) return false;
    return testConnectionWithConfig(config);
  };

  // Test connection with a specific config
  const testConnectionWithConfig = async (config: TerraregConfig): Promise<boolean> => {
    try {
      const response = await fetch(`${config.url}/v1/modules`, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to connect to Terrareg:', error);
      return false;
    }
  };

  // Get all namespaces from Terrareg
  const getNamespaces = async (): Promise<string[]> => {
    if (!config || !isConnected) {
      throw new Error('Terrareg is not configured or connected');
    }
    
    try {
      const response = await fetch(`${config.url}/v1/namespaces`, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch namespaces: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.namespaces || [];
    } catch (error) {
      console.error('Failed to get namespaces from Terrareg:', error);
      throw error;
    }
  };

  // Get modules for a specific namespace
  const getModules = async (namespace: string): Promise<Module[]> => {
    if (!config || !isConnected) {
      throw new Error('Terrareg is not configured or connected');
    }
    
    try {
      const response = await fetch(`${config.url}/v1/modules/${namespace}`, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the API response to our Module type
      return (data.modules || []).map((module: any) => ({
        id: `${namespace}/${module.name}`,
        name: module.name,
        source: `${namespace}/${module.name}/${module.provider}`,
        description: module.description || '',
        versions: module.versions || [],
        inputs: module.inputs || [],
        outputs: module.outputs || []
      }));
    } catch (error) {
      console.error(`Failed to get modules for namespace ${namespace} from Terrareg:`, error);
      throw error;
    }
  };

  // Search modules by query
  const searchModules = async (query: string): Promise<Module[]> => {
    if (!config || !isConnected) {
      throw new Error('Terrareg is not configured or connected');
    }
    
    try {
      const response = await fetch(`${config.url}/v1/modules/search?q=${encodeURIComponent(query)}`, {
        headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the API response to our Module type
      return (data.modules || []).map((module: any) => ({
        id: module.id || `${module.namespace}/${module.name}`,
        name: module.name,
        source: `${module.namespace}/${module.name}/${module.provider}`,
        description: module.description || '',
        versions: module.versions || [],
        inputs: module.inputs || [],
        outputs: module.outputs || []
      }));
    } catch (error) {
      console.error(`Failed to search modules with query "${query}" from Terrareg:`, error);
      throw error;
    }
  };

  const value = {
    config,
    isConfigured: !!config,
    isConnected,
    setConfig,
    testConnection,
    getNamespaces,
    getModules,
    searchModules
  };

  return (
    <TerraregContext.Provider value={value}>
      {children}
    </TerraregContext.Provider>
  );
};

export const useTerrareg = (): TerraregContextType => {
  const context = useContext(TerraregContext);
  if (context === undefined) {
    throw new Error('useTerrareg must be used within a TerraregProvider');
  }
  return context;
};
