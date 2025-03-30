import { Client } from 'minio';
import { S3Config } from '../types';

class MinioService {
  private client: Client | null = null;
  private config: S3Config | null = null;

  initialize(config: S3Config) {
    this.config = config;
    
    this.client = new Client({
      endPoint: config.endpoint || 'play.min.io',
      port: 443,
      useSSL: config.useSSL !== false,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region
    });
  }

  async createBucket(bucketName: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('MinioService not initialized');
    }

    try {
      const exists = await this.client.bucketExists(bucketName);
      if (!exists) {
        await this.client.makeBucket(bucketName, this.config?.region || 'us-east-1');
        return true;
      }
      return false; // Bucket already exists
    } catch (error) {
      console.error('Error creating bucket:', error);
      throw error;
    }
  }

  async listBuckets() {
    if (!this.client) {
      throw new Error('MinioService not initialized');
    }

    try {
      return await this.client.listBuckets();
    } catch (error) {
      console.error('Error listing buckets:', error);
      throw error;
    }
  }

  async uploadFile(bucketName: string, objectName: string, content: string | Buffer) {
    if (!this.client) {
      throw new Error('MinioService not initialized');
    }

    try {
      const buffer = typeof content === 'string' ? Buffer.from(content) : content;
      await this.client.putObject(bucketName, objectName, buffer);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async downloadFile(bucketName: string, objectName: string): Promise<string> {
    if (!this.client) {
      throw new Error('MinioService not initialized');
    }

    try {
      const dataStream = await this.client.getObject(bucketName, objectName);
      return new Promise((resolve, reject) => {
        let data = '';
        dataStream.on('data', chunk => {
          data += chunk;
        });
        dataStream.on('end', () => {
          resolve(data);
        });
        dataStream.on('error', err => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async listFiles(bucketName: string, prefix: string = '') {
    if (!this.client) {
      throw new Error('MinioService not initialized');
    }

    try {
      const stream = this.client.listObjects(bucketName, prefix, true);
      return new Promise<string[]>((resolve, reject) => {
        const files: string[] = [];
        stream.on('data', obj => {
          files.push(obj.name);
        });
        stream.on('end', () => {
          resolve(files);
        });
        stream.on('error', err => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectName: string) {
    if (!this.client) {
      throw new Error('MinioService not initialized');
    }

    try {
      await this.client.removeObject(bucketName, objectName);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error('MinioService not initialized');
    }

    try {
      await this.client.listBuckets();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const minioService = new MinioService();
export default minioService;
