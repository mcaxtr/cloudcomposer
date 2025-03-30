import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { Database, Save, RefreshCw } from 'lucide-react';
import { useS3 } from '../../context/S3Context';

const S3BucketConfig: React.FC = () => {
  const { config, setConfig, isConfigured, isConnected, createBucket, testConnection } = useS3();
  const [bucketName, setBucketName] = useState(config?.bucketName || '');
  const [region, setRegion] = useState(config?.region || '');
  const [accessKey, setAccessKey] = useState(config?.accessKey || '');
  const [secretKey, setSecretKey] = useState(config?.secretKey || '');
  const [endpoint, setEndpoint] = useState(config?.endpoint || '');
  const [useSSL, setUseSSL] = useState(config?.useSSL !== false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBucket, setIsCreatingBucket] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [awsSDKLoaded, setAwsSDKLoaded] = useState(false);

  // Check if AWS SDK is loaded
  useEffect(() => {
    // @ts-ignore
    if (window.AWS) {
      setAwsSDKLoaded(true);
    } else {
      const checkSDK = setInterval(() => {
        // @ts-ignore
        if (window.AWS) {
          setAwsSDKLoaded(true);
          clearInterval(checkSDK);
        }
      }, 500);
      
      return () => clearInterval(checkSDK);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate inputs
      if (!bucketName || !region || !accessKey || !secretKey) {
        throw new Error('Bucket name, region, access key, and secret key are required');
      }

      if (!awsSDKLoaded) {
        throw new Error('AWS SDK is not loaded yet. Please wait a moment and try again.');
      }

      await setConfig({
        bucketName,
        region,
        accessKey,
        secretKey,
        endpoint: endpoint || undefined,
        useSSL
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBucket = async () => {
    setIsCreatingBucket(true);
    setError(null);
    
    try {
      if (!bucketName) {
        throw new Error('Bucket name is required');
      }
      
      if (!awsSDKLoaded) {
        throw new Error('AWS SDK is not loaded yet. Please wait a moment and try again.');
      }
      
      const created = await createBucket(bucketName);
      if (created) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Bucket already exists, but that's not an error
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket');
    } finally {
      setIsCreatingBucket(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);
    setError(null);
    
    try {
      if (!accessKey || !secretKey) {
        throw new Error('Access key and secret key are required');
      }
      
      if (!awsSDKLoaded) {
        throw new Error('AWS SDK is not loaded yet. Please wait a moment and try again.');
      }
      
      // Initialize service with current form values without saving
      await setConfig({
        bucketName,
        region,
        accessKey,
        secretKey,
        endpoint: endpoint || undefined,
        useSSL
      });
      
      const connected = await testConnection();
      setConnectionStatus(connected ? 'success' : 'error');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection');
      setConnectionStatus('error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card 
      title="Object Storage Configuration" 
      subtitle="Configure S3 or S3-compatible storage for Terragrunt files"
      className="h-full"
    >
      <div className="space-y-4">
        {!awsSDKLoaded && (
          <Alert variant="warning" title="Loading AWS SDK">
            Waiting for AWS SDK to load. This may take a moment...
          </Alert>
        )}
        
        {isConfigured && isConnected && (
          <Alert variant="success" title="Object Storage Configured">
            Your object storage is configured and connected.
          </Alert>
        )}
        
        {isConfigured && !isConnected && (
          <Alert variant="warning" title="Connection Issue">
            Your object storage is configured but there seems to be a connection issue.
          </Alert>
        )}
        
        {error && (
          <Alert variant="error" title="Configuration Error">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" title="Success">
            Operation completed successfully.
          </Alert>
        )}
        
        {connectionStatus === 'success' && (
          <Alert variant="success" title="Connection Successful">
            Successfully connected to the object storage service.
          </Alert>
        )}
        
        {connectionStatus === 'error' && !error && (
          <Alert variant="error" title="Connection Failed">
            Could not connect to the object storage service with the provided credentials.
          </Alert>
        )}

        <Input
          id="bucket-name"
          label="Bucket Name"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          placeholder="terragrunt-infrastructure"
          fullWidth
          leftIcon={<Database className="h-5 w-5 text-gray-400" />}
          required
        />
        
        <Input
          id="region"
          label="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="us-west-2"
          fullWidth
          required
        />
        
        <Input
          id="access-key"
          label="Access Key"
          value={accessKey}
          onChange={(e) => setAccessKey(e.target.value)}
          placeholder="AKIAIOSFODNN7EXAMPLE"
          fullWidth
          required
        />
        
        <Input
          id="secret-key"
          label="Secret Key"
          type="password"
          value={secretKey}
          onChange={(e) => setSecretKey(e.target.value)}
          placeholder="••••••••••••••••••••••••••••••••"
          fullWidth
          required
        />
        
        <Input
          id="endpoint"
          label="Custom Endpoint (Optional)"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="minio.lab.local"
          helperText="Leave empty for AWS S3. For MinIO or other S3-compatible services, enter the endpoint URL without protocol (e.g., minio.lab.local)."
          fullWidth
        />
        
        <div className="flex items-center mb-4">
          <input
            id="use-ssl"
            type="checkbox"
            checked={useSSL}
            onChange={(e) => setUseSSL(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="use-ssl" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Use SSL
          </label>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            isLoading={isTesting}
            leftIcon={<RefreshCw className="h-5 w-5" />}
            fullWidth
            disabled={!awsSDKLoaded}
          >
            Test Connection
          </Button>
          
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="h-5 w-5" />}
            fullWidth
            disabled={!awsSDKLoaded}
          >
            Save Configuration
          </Button>
        </div>
        
        {isConfigured && isConnected && (
          <Button
            variant="success"
            onClick={handleCreateBucket}
            isLoading={isCreatingBucket}
            fullWidth
            disabled={!awsSDKLoaded}
          >
            Create Bucket
          </Button>
        )}
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Configuração do MinIO para CORS</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Se você estiver usando MinIO e enfrentando problemas de CORS, configure o MinIO com os seguintes comandos:
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
            <pre className="text-xs text-gray-800 dark:text-gray-300">
{`# Configuração via variáveis de ambiente
export MINIO_API_CORS_ALLOW_ORIGIN="*"
export MINIO_API_CORS_ALLOW_METHODS="GET,PUT,POST,DELETE,OPTIONS"
export MINIO_API_CORS_ALLOW_HEADERS="*"

# Ou via arquivo de configuração JSON
mc admin config set myminio cors \\
  cors_allow_origin="*" \\
  cors_allow_methods="GET,PUT,POST,DELETE,OPTIONS" \\
  cors_allow_headers="*" \\
  cors_expose_headers="ETag,X-Amz-Object-Lock-Mode,X-Amz-Object-Lock-Retain-Until-Date"

# Reinicie o MinIO após a configuração
`}
            </pre>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">Solução de Problemas de Autenticação</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Se você estiver enfrentando erros de autenticação com o MinIO, verifique:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Certifique-se de que as credenciais (access key e secret key) estão corretas</li>
            <li>Verifique se o endpoint está correto e acessível (tente acessar diretamente no navegador)</li>
            <li>Se estiver usando HTTPS, certifique-se de que o certificado é válido</li>
            <li>Tente desativar SSL se estiver tendo problemas com certificados</li>
            <li>Verifique se o MinIO está configurado para aceitar conexões externas</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Para MinIO local sem SSL, use o formato: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">http://minio.lab.local</code> e desmarque a opção "Use SSL".
          </p>
        </div>
      </div>
    </Card>
  );
};

export default S3BucketConfig;
