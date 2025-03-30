export enum RegistryType {
  TERRAREG = 'TERRAREG',
  TERRAFORM_REGISTRY = 'TERRAFORM_REGISTRY',
  GITLAB = 'GITLAB',
  GITHUB = 'GITHUB',
  CUSTOM = 'CUSTOM'
}

export interface RegistryConfig {
  id: string;
  name: string;
  type: RegistryType;
  url: string;
  apiKey?: string;
  autoUpdateModules?: boolean;
  isDefault?: boolean;
  isEnabled: boolean;
}

export interface Module {
  id: string;
  name: string;
  namespace: string;
  provider: string;
  version: string;
  description?: string;
  source?: string;
  registryId?: string;
}

export interface TerragruntConfig {
  id: string;
  name: string;
  path: string;
  content: string;
  dependencies?: string[];
  lastModified: Date;
}

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region: string;
  bucket: string;
  useSSL: boolean;
}

export interface Account {
  id: string;
  name: string;
  awsAccountId?: string;
  description?: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Environment {
  id: string;
  name: string;
  description?: string;
}

export interface Component {
  id: string;
  name: string;
  description?: string;
  moduleId?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  components: string[];
}
