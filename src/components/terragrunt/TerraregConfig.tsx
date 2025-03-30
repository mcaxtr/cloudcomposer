import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import { useTerrareg } from '../../context/TerraregContext';

interface TerraregConfigProps {
  onConfigSaved?: () => void;
}

const TerraregConfig: React.FC<TerraregConfigProps> = ({ onConfigSaved }) => {
  const { config: savedConfig, setConfig, testConnection } = useTerrareg();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    apiKey: '',
    autoUpdateModules: false
  });

  // Load saved config on component mount
  useEffect(() => {
    if (savedConfig) {
      setFormData({
        url: savedConfig.url,
        apiKey: savedConfig.apiKey,
        autoUpdateModules: savedConfig.autoUpdateModules || false
      });
    }
  }, [savedConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);
    
    try {
      await setConfig({
        url: formData.url,
        apiKey: formData.apiKey,
        autoUpdateModules: formData.autoUpdateModules
      });
      
      const connectionSuccess = await testConnection();
      
      if (connectionSuccess) {
        setTestResult({
          success: true,
          message: 'Successfully connected to Terrareg!'
        });
        
        if (onConfigSaved) {
          onConfigSaved();
        }
      } else {
        setTestResult({
          success: false,
          message: 'Failed to connect to Terrareg. Please check your configuration.'
        });
      }
    } catch (error) {
      console.error('Failed to save Terrareg configuration:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Terrareg Configuration" className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="terrareg-url"
          label="Terrareg URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://terrareg.example.com"
          required
          fullWidth
        />
        
        <Input
          id="terrareg-api-key"
          label="API Key (Optional)"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          placeholder="Your Terrareg API key"
          type="password"
          fullWidth
        />
        
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-update-modules"
            checked={formData.autoUpdateModules}
            onChange={(checked) => setFormData({ ...formData, autoUpdateModules: checked })}
          />
          <label htmlFor="auto-update-modules" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Auto-update Modules
          </label>
        </div>
        
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : 'Save Configuration'}
          </Button>
        </div>
        
        {testResult && (
          <div className={`mt-4 p-3 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {testResult.message}
          </div>
        )}
      </form>
    </Card>
  );
};

export default TerraregConfig;
