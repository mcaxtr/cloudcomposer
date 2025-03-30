import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { Plus, Edit, Trash2, Server, Code, Link } from 'lucide-react';
import { Service, Component, Environment } from '../types';
import TerragruntConfigEditor from '../components/terragrunt/TerragruntConfigEditor';

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environmentId: '',
    moduleSource: '',
    version: '',
    inputs: '{}',
    componentDependencies: [] as string[]
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
      
      // Load services
      const storedServices = localStorage.getItem('services');
      if (storedServices) {
        try {
          setServices(JSON.parse(storedServices));
        } catch (error) {
          console.error('Failed to parse services from localStorage:', error);
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

  // Save services to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('services', JSON.stringify(services));
  }, [services]);

  const openCreateModal = () => {
    if (environments.length === 0) {
      alert('Please create at least one environment before adding services.');
      return;
    }
    
    setCurrentService(null);
    setFormData({
      name: '',
      description: '',
      environmentId: environments[0]?.id || '',
      moduleSource: '',
      version: '',
      inputs: '{}',
      componentDependencies: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setCurrentService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      environmentId: service.environmentId,
      moduleSource: service.moduleSource,
      version: service.version,
      inputs: JSON.stringify(service.inputs, null, 2),
      componentDependencies: [...(service.componentDependencies || [])]
    });
    setIsModalOpen(true);
  };

  const openConfigEditor = (service: Service) => {
    setCurrentService(service);
    setIsConfigEditorOpen(true);
  };

  const handleSubmit = () => {
    try {
      const parsedInputs = JSON.parse(formData.inputs);
      
      if (currentService) {
        // Edit existing service
        setServices(services.map(svc => 
          svc.id === currentService.id 
            ? { 
                ...svc, 
                name: formData.name,
                description: formData.description,
                environmentId: formData.environmentId,
                moduleSource: formData.moduleSource,
                version: formData.version,
                inputs: parsedInputs,
                componentDependencies: formData.componentDependencies
              } 
            : svc
        ));
      } else {
        // Create new service
        const newService: Service = {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          environmentId: formData.environmentId,
          moduleSource: formData.moduleSource,
          version: formData.version,
          inputs: parsedInputs,
          componentDependencies: formData.componentDependencies
        };
        setServices([...services, newService]);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert('Invalid JSON in inputs field');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      setServices(services.filter(svc => svc.id !== id));
    }
  };

  const handleSaveConfig = async (content: string) => {
    // In a real app, this would save to the S3 bucket
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsConfigEditorOpen(false);
  };

  const getEnvironmentName = (id: string) => {
    const env = environments.find(e => e.id === id);
    return env ? env.name : 'Unknown';
  };

  const getComponentName = (id: string) => {
    const component = components.find(c => c.id === id);
    return component ? component.name : 'Unknown';
  };

  const getEnvironmentComponents = (environmentId: string) => {
    return components.filter(c => c.environmentId === environmentId);
  };

  const handleComponentDependencyChange = (componentId: string) => {
    const updatedDependencies = [...formData.componentDependencies];
    const index = updatedDependencies.indexOf(componentId);
    
    if (index === -1) {
      updatedDependencies.push(componentId);
    } else {
      updatedDependencies.splice(index, 1);
    }
    
    setFormData({
      ...formData,
      componentDependencies: updatedDependencies
    });
  };

  const handleEnvironmentChange = (environmentId: string) => {
    // When environment changes, reset component dependencies
    setFormData({
      ...formData,
      environmentId,
      componentDependencies: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
        <Button
          variant="primary"
          onClick={openCreateModal}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Service
        </Button>
      </div>
      
      {services.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No services yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Services are higher-level infrastructure components like API services, web applications, or worker processes.
          </p>
          <Button
            variant="primary"
            onClick={openCreateModal}
            leftIcon={<Plus className="h-5 w-5" />}
            disabled={environments.length === 0}
          >
            Add Service
          </Button>
          {environments.length === 0 && (
            <p className="text-sm text-amber-500 mt-2">
              You need to create at least one environment before adding services.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              title={service.name}
              subtitle={service.description}
              className="hover:shadow-lg transition-shadow"
            >
              <div className="mt-2 space-y-3">
                <div className="flex items-center">
                  <Badge variant="primary" className="mr-2">
                    {service.moduleSource}
                  </Badge>
                  <Badge variant="secondary">
                    v{service.version}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Environment: <span className="font-medium">{getEnvironmentName(service.environmentId)}</span>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Dependencies:
                  <div className="flex flex-wrap gap-2 mt-1">
                    {service.componentDependencies && service.componentDependencies.map(depId => (
                      <Badge key={depId} variant="info" size="sm">
                        {getComponentName(depId)}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Code className="h-4 w-4" />}
                    onClick={() => openConfigEditor(service)}
                  >
                    View Config
                  </Button>
                  
                  <div className="flex space-x-2">
                    <button
                      className="p-1 text-gray-500 hover:text-blue-500"
                      onClick={() => openEditModal(service)}
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      className="p-1 text-gray-500 hover:text-red-500"
                      onClick={() => handleDelete(service.id)}
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
        title={currentService ? 'Edit Service' : 'Create Service'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {currentService ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="service-name"
            label="Service Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., api, web, worker"
            required
            fullWidth
          />
          
          <Input
            id="service-description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., API service running on ECS"
            fullWidth
          />
          
          <Select
            id="service-environment"
            label="Environment"
            value={formData.environmentId}
            onChange={handleEnvironmentChange}
            options={environments.map(env => ({ value: env.id, label: env.name }))}
            required
            fullWidth
          />
          
          <Input
            id="service-module-source"
            label="Module Source"
            value={formData.moduleSource}
            onChange={(e) => setFormData({ ...formData, moduleSource: e.target.value })}
            placeholder="e.g., terraform-aws-modules/ecs/aws"
            required
            fullWidth
          />
          
          <Input
            id="service-version"
            label="Version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="e.g., 3.5.0"
            required
            fullWidth
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Component Dependencies
            </label>
            <div className="space-y-2 border border-gray-300 dark:border-gray-600 rounded-md p-3">
              {getEnvironmentComponents(formData.environmentId).length === 0 ? (
                <p className="text-sm text-amber-500">
                  No components available in this environment. Create components first.
                </p>
              ) : (
                getEnvironmentComponents(formData.environmentId).map(component => (
                  <div key={component.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`component-${component.id}`}
                      checked={formData.componentDependencies.includes(component.id)}
                      onChange={() => handleComponentDependencyChange(component.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`component-${component.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      {component.name} - {component.description}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <Textarea
            id="service-inputs"
            label="Inputs (JSON)"
            value={formData.inputs}
            onChange={(e) => setFormData({ ...formData, inputs: e.target.value })}
            placeholder='{"name": "example", "container_port": 8080}'
            className="font-mono text-sm"
            rows={10}
            required
            fullWidth
          />
        </div>
      </Modal>
      
      <Modal
        isOpen={isConfigEditorOpen}
        onClose={() => setIsConfigEditorOpen(false)}
        title={`Terragrunt Configuration: ${currentService?.name}`}
        size="xl"
      >
        {currentService && (
          <TerragruntConfigEditor
            initialContent={`# Terragrunt configuration for ${currentService.name}
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "${currentService.moduleSource}//${currentService.version}"
}

${currentService.componentDependencies && currentService.componentDependencies.map(depId => {
  const component = components.find(c => c.id === depId);
  return component ? `dependency "${component.name}" {
  config_path = "../components/${component.name}"
}` : '';
}).filter(Boolean).join('\n\n')}

inputs = ${JSON.stringify(currentService.inputs, null, 2)}
`}
            title={`${currentService.name}/terragrunt.hcl`}
            path={`terragrunt/environments/${getEnvironmentName(currentService.environmentId)}/services/${currentService.name}/terragrunt.hcl`}
            onSave={handleSaveConfig}
          />
        )}
      </Modal>
    </div>
  );
};

export default ServicesPage;
