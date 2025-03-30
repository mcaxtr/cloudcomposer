import { Module } from '../types';

interface TerraregConfig {
  url: string;
  apiKey?: string;
  autoUpdateModules?: boolean;
}

class TerraregService {
  private config: TerraregConfig | null = null;

  initialize(config: TerraregConfig): void {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('Terrareg service not initialized');
    }

    try {
      const response = await fetch(`${this.config.url}/v1/modules`);
      return response.ok;
    } catch (error) {
      console.error('Failed to connect to Terrareg:', error);
      return false;
    }
  }

  async getNamespaces(): Promise<string[]> {
    if (!this.config) {
      throw new Error('Terrareg service not initialized');
    }

    try {
      const response = await fetch(`${this.config.url}/v1/namespaces`);
      if (!response.ok) {
        throw new Error(`Failed to fetch namespaces: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.namespaces || [];
    } catch (error) {
      console.error('Failed to get namespaces:', error);
      throw error;
    }
  }

  async getModules(namespace: string): Promise<Module[]> {
    if (!this.config) {
      throw new Error('Terrareg service not initialized');
    }

    try {
      const response = await fetch(`${this.config.url}/v1/modules/${namespace}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the response to match our Module interface
      return (data.modules || []).map((module: any) => ({
        id: `${module.namespace}/${module.name}/${module.provider}`,
        name: module.name,
        namespace: module.namespace,
        provider: module.provider,
        version: module.version || 'latest',
        description: module.description || '',
        source: module.source || ''
      }));
    } catch (error) {
      console.error('Failed to get modules:', error);
      throw error;
    }
  }

  async searchModules(query: string): Promise<Module[]> {
    if (!this.config) {
      throw new Error('Terrareg service not initialized');
    }

    try {
      const response = await fetch(`${this.config.url}/v1/modules/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Failed to search modules: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform the response to match our Module interface
      return (data.modules || []).map((module: any) => ({
        id: `${module.namespace}/${module.name}/${module.provider}`,
        name: module.name,
        namespace: module.namespace,
        provider: module.provider,
        version: module.version || 'latest',
        description: module.description || '',
        source: module.source || ''
      }));
    } catch (error) {
      console.error('Failed to search modules:', error);
      throw error;
    }
  }

  async getModuleVersions(namespace: string, name: string, provider: string): Promise<string[]> {
    if (!this.config) {
      throw new Error('Terrareg service not initialized');
    }

    try {
      const response = await fetch(`${this.config.url}/v1/modules/${namespace}/${name}/${provider}/versions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch module versions: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.versions || [];
    } catch (error) {
      console.error('Failed to get module versions:', error);
      throw error;
    }
  }

  async getModuleDetails(namespace: string, name: string, provider: string, version: string): Promise<any> {
    if (!this.config) {
      throw new Error('Terrareg service not initialized');
    }

    try {
      const response = await fetch(`${this.config.url}/v1/modules/${namespace}/${name}/${provider}/${version}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch module details: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get module details:', error);
      throw error;
    }
  }
}

const terraregService = new TerraregService();
export default terraregService;
