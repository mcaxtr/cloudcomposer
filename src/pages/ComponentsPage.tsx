import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { Plus, Edit, Trash2, Package, Code } from 'lucide-react';
import { Component, Environment } from '../types';
import TerragruntConfigEditor from '../components/terragrunt/TerragruntConfigEditor';
import ModuleSelector from '../components/terragrunt/ModuleSelector';
import { useTerrareg } from '../context/TerraregContext';
import { useS3 } from '../context/S3Context';

const ComponentsPage: React.FC = () => {
  const { isConfigured: isTerraregConfigured } = useTerrareg();
  const { uploadFile } = useS3();
  const [components, setComponents] = useState<Component[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentComponent, setCurrentComponent] = useState<Component | null>(null);
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environmentId: '',
    source: '',
    version: '',
    inputs: '{}'
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      // Load environments
      const storedEnvironments = localStorage.getItem('environments');
      if (storedEnvironments) {
        try {
          setEnvironments(JSON.parse(storedEnvironments));
        } catch (error) {
          console.error('Failed to parse environments from localStorage:', error);
        }
      }
      
      // Load components
      const storedComponents = localStorage.getItem('components');
      if (storedComponents) {
        try {
          setComponents(JSON.parse(storedComponents));
        } catch (error) {
          console.error('Failed to parse components from localStorage:', error);
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

  // Save components to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('components', JSON.stringify(components));
  }, [components]);

  const openCreateModal = () => {
    if (environments.length === 0) {
      alert('Please create at least one environment before adding components.');
      return;
    }
    
    setCurrentComponent(null);
    setFormData({
      name: '',
      description: '',
      environmentId: environments[0]?.id || '',
      source: '',
      version: '',
      inputs: '{}'
    });
    setIsModalOpen(true);
  };

  const openImportModal = () => {
    if (environments.length === 0) {
      alert('Please create at least one environment before importing components.');
      return;
    }
    
    setIsImportModalOpen(true);
  };

  const openEditModal = (component: Component) => {
    setCurrentComponent(component);
    setFormData({
      name: component.name,
      description: component.description || '',
      environmentId: component.environmentId || environments[0]?.id || '',
      source: component.source,
      version: component.version,
      inputs: JSON.stringify(component.inputs, null, 2)
    });
    setIsModalOpen(true);
  };

  const openConfigEditor = (component: Component) => {
    setCurrentComponent(component);
    setIsConfigEditorOpen(true);
  };

  const handleSubmit = () => {
    try {
      const parsedInputs = JSON.parse(formData.inputs);
      
      if (currentComponent) {
        // Edit existing component
        setComponents(components.map(comp => 
          comp.id === currentComponent.id 
            ? { 
                ...comp, 
                name: formData.name,
                description: formData.description,
                environmentId: formData.environmentId,
                source: formData.source,
                version: formData.version,
                inputs: parsedInputs
              } 
            : comp
        ));
      } else {
        // Create new component
        const newComponent: Component = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          environmentId: formData.environmentId,
          source: formData.source,
          version: formData.version,
          inputs: parsedInputs
        };
        setComponents([...components, newComponent]);
        
        // Create the component structure in the bucket
        createComponentStructure(newComponent);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert('Invalid JSON in inputs field');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this component? This action cannot be undone.')) {
      setComponents(components.filter(comp => comp.id !== id));
    }
  };

  const handleSaveConfig = async (content: string, component: Component) => {
    try {
      const environment = environments.find(env => env.id === component.environmentId);
      
      if (!environment) {
        throw new Error('Environment not found');
      }
      
      // Create the path for the terragrunt.hcl file
      const path = `terragrunt/environments/${environment.name}/components/${component.name}/terragrunt.hcl`;
      
      // Upload the file to S3
      await uploadFile(environment.bucketName, path, content);
      
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please check the console for details.');
    } finally {
      setIsConfigEditorOpen(false);
    }
  };

  const createComponentStructure = async (component: Component) => {
    try {
      const environment = environments.find(env => env.id === component.environmentId);
      
      if (!environment) {
        throw new Error('Environment not found');
      }
      
      // Create the terragrunt.hcl file content
      const terragruntContent = generateTerragruntConfig(component);
      
      // Create the path for the terragrunt.hcl file
      const path = `terragrunt/environments/${environment.name}/components/${component.name}/terragrunt.hcl`;
      
      // Upload the file to S3
      await uploadFile(environment.bucketName, path, terragruntContent);
      
      console.log('Component structure created successfully!');
    } catch (error) {
      console.error('Failed to create component structure:', error);
    }
  };

  const generateTerragruntConfig = (component: Component): string => {
    return `# Terragrunt configuration for ${component.name}
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "${component.source}//${component.version}"
}

inputs = ${JSON.stringify(component.inputs, null, 2)}
`;
  };

  const getEnvironmentName = (id: string) => {
    const env = environments.find(e => e.id === id);
    return env ? env.name : 'Unknown';
  };

  const handleImportModule = async (importedComponent: Component) => {
    // Set the environment ID for the imported component
    const componentWithEnv = {
      ...importedComponent,
      environmentId: environments[0]?.id || '',
      id: Date.now().toString() // Generate a new ID
    };
    
    // Add the component to the list
    setComponents([...components, componentWithEnv]);
    
    // Create the component structure in the bucket
    await createComponentStructure(componentWithEnv);
    
    // Close the import modal
    setIsImportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Components</h1>
        <div className="flex space-x-2">
          {isTerraregConfigured && (
            <Button
              variant="outline"
              onClick={openImportModal}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Import from Registry
            </Button>
          )}
          <Button
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Add Component
          </Button>
        </div>
      </div>
      
      {components.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No components yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Components are reusable infrastructure pieces like databases, queues, or networking resources.
          </p>
          <div className="flex justify-center space-x-2">
            {isTerraregConfigured && (
              <Button
                variant="outline"
                onClick={openImportModal}
                leftIcon={<Plus className="h-5 w-5" />}
                disabled={environments.length === 0}
              >
                Import from Registry
              </Button>
            )}
            <Button
              variant="primary"
              onClick={openCreateModal}
              leftIcon={<Plus className="h-5 w-5" />}
              disabled={environments.length === 0}
            >
              Add Component
            </Button>
          </div>
          {environments.length === 0 && (
            <p className="text-sm text-amber-500 mt-2">
              You need to create at least one environment before adding components.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {components.map((component) => (
            <Card
              key={component.id}
              title={component.name}
              subtitle={component.description}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="mt-2 space-y-3">
                <div className="flex items-center">
                  <Badge variant="primary" className="mr-2">
                    {component.source}
                  </Badge>
                  <Badge variant="secondary">
                    v{component.version}
                  </Badge>
                </div>
                
                {component.environmentId && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Environment: <span className="font-medium">{getEnvironmentName(component.environmentId)}</span>
                  </div>
                )}
                
                {component.terraregNamespace && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Registry: <span className="font-medium">{component.terraregNamespace}/{component.terraregModule}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Code className="h-4 w-4" />}
                    onClick={() => openConfigEditor(component)}
                  >
                    View Config
                  </Button>
                  
                  <div className="flex space-x-2">
                    <button
                      className="p-1 text-gray-500 hover:text-blue-500"
                      onClick={() => openEditModal(component)}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      className="p-1 text-gray-500 hover:text-red-500"
                      onClick={() => handleDelete(component.id)}
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
      
      {/* Create/Edit Component Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentComponent ? 'Edit Component' : 'Create Component'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {currentComponent ? 'Save Changes' : 'Create Component'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="component-name"
            label="Component Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., database, queue, vpc"
            required
            fullWidth
          />
          
          <Input
            id="component-description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., RDS PostgreSQL database"
            fullWidth
          />
          
          <Select
            id="component-environment"
            label="Environment"
            value={formData.environmentId}
            onChange={(value) => setFormData({ ...formData, environmentId: value })}
            options={environments.map(env => ({ value: env.id, label: env.name }))}
            required
            fullWidth
          />
          
          <Input
            id="component-source"
            label="Module Source"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            placeholder="e.g., terraform-aws-modules/rds/aws"
            required
            fullWidth
          />
          
          <Input
            id="component-version"
            label="Version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="e.g., 3.5.0"
            required
            fullWidth
          />
          
          <Textarea
            id="component-inputs"
            label="Inputs (JSON)"
            value={formData.inputs}
            onChange={(e) => setFormData({ ...formData, inputs: e.target.value })}
            placeholder='{"name": "example", "engine": "postgres"}'
            className="font-mono text-sm"
            rows={10}
            required
            fullWidth
          />
        </div>
      </Modal>
      
      {/* Import Module Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Component from Registry"
        size="xl"
      >
        <ModuleSelector onSelectModule={handleImportModule} />
      </Modal>
      
      {/* Config Editor Modal */}
      <Modal
        isOpen={isConfigEditorOpen}
        onClose={() => setIsConfigEditorOpen(false)}
        title={`Terragrunt Configuration: ${currentComponent?.name}`}
        size="xl"
      >
        {currentComponent && (
          <TerragruntConfigEditor
            initialContent={generateTerragruntConfig(currentComponent)}
            title={`${currentComponent.name}/terragrunt.hcl`}
            path={`terragrunt/environments/${getEnvironmentName(currentComponent.environmentId || '')}/components/${currentComponent.name}/terragrunt.hcl`}
            onSave={(content) => handleSaveConfig(content, currentComponent)}
          />
        )}
      </Modal>
    </div>
  );
};

export default ComponentsPage;
