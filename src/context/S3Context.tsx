import React, { createContext, useContext, useState, useEffect } from 'react';
import { S3Config } from '../types';
import objectStorageService from '../services/ObjectStorageService';

interface S3ContextType {
  config: S3Config | null;
  setConfig: (config: S3Config) => Promise<void>;
  isConfigured: boolean;
  isConnected: boolean;
  testConnection: () => Promise<boolean>;
  createBucket: (bucketName: string) => Promise<boolean>;
  listBuckets: () => Promise<any[]>;
  uploadFile: (bucketName: string, objectName: string, content: string | Buffer) => Promise<void>;
  downloadFile: (bucketName: string, objectName: string) => Promise<string>;
  listFiles: (bucketName: string, prefix?: string) => Promise<string[]>;
  deleteFile: (bucketName: string, objectName: string) => Promise<void>;
}

const S3Context = createContext<S3ContextType | undefined>(undefined);

export const S3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<S3Config | null>(() => {
    const savedConfig = localStorage.getItem('s3Config');
    return savedConfig ? JSON.parse(savedConfig) : null;
  });
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      initializeS3Service();
    }
  }, []);

  const initializeS3Service = async () => {
    if (config) {
      try {
        await objectStorageService.initialize(config);
        const connected = await objectStorageService.testConnection();
        setIsConnected(connected);
      } catch (error) {
        console.error('Failed to initialize S3 service:', error);
        setIsConnected(false);
      }
    }
  };

  const updateConfig = async (newConfig: S3Config) => {
    try {
      await objectStorageService.initialize(newConfig);
      const connected = await objectStorageService.testConnection();
      
      if (connected) {
        setConfig(newConfig);
        setIsConnected(true);
        localStorage.setItem('s3Config', JSON.stringify(newConfig));
      } else {
        throw new Error('Could not connect to S3 with the provided configuration');
      }
    } catch (error) {
      console.error('Failed to update S3 configuration:', error);
      setIsConnected(false);
      throw error;
    }
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      return await objectStorageService.testConnection();
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  const createBucket = async (bucketName: string): Promise<boolean> => {
    try {
      return await objectStorageService.createBucket(bucketName);
    } catch (error) {
      console.error('Failed to create bucket:', error);
      throw error;
    }
  };

  const listBuckets = async (): Promise<any[]> => {
    try {
      return await objectStorageService.listBuckets();
    } catch (error) {
      console.error('Failed to list buckets:', error);
      throw error;
    }
  };

  const uploadFile = async (bucketName: string, objectName: string, content: string | Buffer): Promise<void> => {
    try {
      await objectStorageService.uploadFile(bucketName, objectName, content);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  const downloadFile = async (bucketName: string, objectName: string): Promise<string> => {
    try {
      return await objectStorageService.downloadFile(bucketName, objectName);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  };

  const listFiles = async (bucketName: string, prefix: string = ''): Promise<string[]> => {
    try {
      return await objectStorageService.listFiles(bucketName, prefix);
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  };

  const deleteFile = async (bucketName: string, objectName: string): Promise<void> => {
    try {
      await objectStorageService.deleteFile(bucketName, objectName);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  };

  return (
    <S3Context.Provider value={{ 
      config, 
      setConfig: updateConfig, 
      isConfigured: !!config,
      isConnected,
      testConnection,
      createBucket,
      listBuckets,
      uploadFile,
      downloadFile,
      listFiles,
      deleteFile
    }}>
      {children}
    </S3Context.Provider>
  );
};

export const useS3 = () => {
  const context = useContext(S3Context);
  if (context === undefined) {
    throw new Error('useS3 must be used within a S3Provider');
  }
  return context;
};
