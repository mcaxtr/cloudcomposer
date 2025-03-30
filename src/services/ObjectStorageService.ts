import { S3Config } from '../types';

// This service is designed to be provider-agnostic
// It primarily targets AWS S3 compatibility, but works with any S3-compatible storage
class ObjectStorageService {
  private client: any = null;
  private config: S3Config | null = null;

  async initialize(config: S3Config) {
    this.config = config;
    
    try {
      // Use AWS SDK from global scope (loaded via CDN)
      // @ts-ignore
      const AWS = window.AWS;
      
      if (!AWS) {
        throw new Error('AWS SDK not loaded. Please check your internet connection.');
      }
      
      // Configure AWS SDK
      AWS.config.update({
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
        region: config.region || 'us-east-1',
        signatureVersion: 'v4',
        s3ForcePathStyle: true, // Required for MinIO
        httpOptions: {
          xhrWithCredentials: false
        }
      });
      
      const options: any = {
        signatureVersion: 'v4',
        s3ForcePathStyle: true,
        computeChecksums: true,
        correctClockSkew: true
      };
      
      // If endpoint is provided, use it (for MinIO or other S3-compatible services)
      if (config.endpoint) {
        // Ensure endpoint has proper protocol
        let endpoint = config.endpoint;
        if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
          endpoint = config.useSSL !== false ? `https://${endpoint}` : `http://${endpoint}`;
        }
        
        options.endpoint = new AWS.Endpoint(endpoint);
      }
      
      this.client = new AWS.S3(options);
      
      // Remove custom request handler that was causing issues
      // Let AWS SDK handle the signing process properly
    } catch (error) {
      console.error('Failed to initialize S3 client:', error);
      throw error;
    }
  }

  async createBucket(bucketName: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('ObjectStorageService not initialized');
    }

    try {
      // Check if bucket exists first
      try {
        await this.checkBucketExists(bucketName);
        return false; // Bucket already exists
      } catch (error: any) {
        // If error code is 404 or NoSuchBucket, bucket doesn't exist
        if (error.code === 'NotFound' || error.code === 'NoSuchBucket' || error.statusCode === 404) {
          const params: any = {
            Bucket: bucketName
          };
          
          // Only add LocationConstraint if region is not us-east-1
          // This is because us-east-1 is the default and specifying it explicitly causes errors
          if (this.config?.region && this.config.region !== 'us-east-1') {
            params.CreateBucketConfiguration = {
              LocationConstraint: this.config.region
            };
          }
          
          await this.promisifyS3Operation('createBucket', params);
          return true;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error creating bucket:', error);
      throw error;
    }
  }

  async checkBucketExists(bucketName: string): Promise<boolean> {
    try {
      await this.promisifyS3Operation('headBucket', { Bucket: bucketName });
      return true;
    } catch (error) {
      throw error;
    }
  }

  async listBuckets() {
    if (!this.client) {
      throw new Error('ObjectStorageService not initialized');
    }

    try {
      const data = await this.promisifyS3Operation('listBuckets', {});
      return data.Buckets;
    } catch (error) {
      console.error('Error listing buckets:', error);
      throw error;
    }
  }

  async uploadFile(bucketName: string, objectName: string, content: string | Buffer) {
    if (!this.client) {
      throw new Error('ObjectStorageService not initialized');
    }

    try {
      const buffer = typeof content === 'string' ? Buffer.from(content) : content;
      const params = {
        Bucket: bucketName,
        Key: objectName,
        Body: buffer
      };
      
      await this.promisifyS3Operation('putObject', params);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async downloadFile(bucketName: string, objectName: string): Promise<string> {
    if (!this.client) {
      throw new Error('ObjectStorageService not initialized');
    }

    try {
      const params = {
        Bucket: bucketName,
        Key: objectName
      };
      
      const data = await this.promisifyS3Operation('getObject', params);
      return data.Body.toString();
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async listFiles(bucketName: string, prefix: string = '') {
    if (!this.client) {
      throw new Error('ObjectStorageService not initialized');
    }

    try {
      const params = {
        Bucket: bucketName,
        Prefix: prefix
      };
      
      const data = await this.promisifyS3Operation('listObjectsV2', params);
      return data.Contents?.map((item: any) => item.Key) || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectName: string) {
    if (!this.client) {
      throw new Error('ObjectStorageService not initialized');
    }

    try {
      const params = {
        Bucket: bucketName,
        Key: objectName
      };
      
      await this.promisifyS3Operation('deleteObject', params);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error('ObjectStorageService not initialized');
    }

    try {
      await this.promisifyS3Operation('listBuckets', {});
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Helper method to promisify S3 operations and handle errors consistently
  private promisifyS3Operation(operation: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client[operation](params, (err: any, data: any) => {
        if (err) {
          console.error(`S3 operation ${operation} failed:`, err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}

export const objectStorageService = new ObjectStorageService();
export default objectStorageService;
