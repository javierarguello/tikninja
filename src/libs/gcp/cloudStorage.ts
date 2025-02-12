import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import * as fs from 'fs';

export class CloudStorage {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
  }

  /**
   * Uploads a file to Google Cloud Storage
   * @param bucketName - The name of the bucket to upload to
   * @param filePath - The local path of the file to upload
   * @param destination - The destination path in the bucket (optional)
   * @returns Promise with the public URL of the uploaded file
   */
  async uploadFile(
    bucketName: string,
    filePath: string,
    destination?: string
  ): Promise<{ publicUrl: string; fileName: string }> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const fileName = destination || path.basename(filePath);

      const [file] = await bucket.upload(filePath, {
        destination: fileName,
      });

      return {
        publicUrl: file.publicUrl(),
        fileName: path.join(bucketName, fileName),
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }
      throw new Error('Failed to upload file: Unknown error');
    }
  }

  /**
   * Uploads a buffer to Google Cloud Storage
   * @param bucketName - The name of the bucket to upload to
   * @param buffer - The buffer containing the file data
   * @param destination - The destination path in the bucket
   * @returns Promise with the public URL of the uploaded file
   */
  async uploadBuffer(
    bucketName: string,
    buffer: Buffer,
    destination: string
  ): Promise<{ publicUrl: string; fileName: string }> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(destination);

      await file.save(buffer);

      return {
        publicUrl: file.publicUrl(),
        fileName: path.join(bucketName, destination),
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload buffer: ${error.message}`);
      }
      throw new Error('Failed to upload buffer: Unknown error');
    }
  }

  /**
   * Downloads a file from Google Cloud Storage to a local directory
   * @param bucketName - The name of the bucket to download from
   * @param fileName - The name of the file in the bucket
   * @param downloadDir - The local directory to download the file to
   * @returns Promise with the local path of the downloaded file
   */
  async downloadFile(
    bucketName: string,
    fileName: string,
    downloadDir: string
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);

      // Ensure download directory exists
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const destinationPath = path.join(downloadDir, fileName);

      await file.download({
        destination: destinationPath,
      });

      return destinationPath;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }
      throw new Error('Failed to download file: Unknown error');
    }
  }
}
