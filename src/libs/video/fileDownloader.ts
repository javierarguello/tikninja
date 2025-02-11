import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export class FileDownloader {
    /**
     * Downloads a file from the given URL to a temporary location
     * @param fileUrl The URL of the file to download
     * @returns Promise<string> The path where the file was saved
     */
    public async downloadToTemp(rootFolder: string, fileUrl: string, filePrefix?: string): Promise<string> {
        try {
            // Create a temporary filename using the original filename
            const originalFilename = path.basename(fileUrl);
            const tempFilePath = path.join(rootFolder, `${filePrefix ? `${filePrefix}-` : ''}${originalFilename}`);

            // Download the file
            const response = await axios({
                method: 'GET',
                url: fileUrl,
                responseType: 'stream',
            });

            // Create write stream with flags to overwrite if exists
            const writer = fs.createWriteStream(tempFilePath, { flags: 'w' });

            // Pipe the response data to the file
            response.data.pipe(writer);

            // Return a promise that resolves when the download is complete
            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(tempFilePath));
                writer.on('error', reject);
            });
        } catch (error) {
            throw new Error(`Failed to download file: ${error}`);
        }
    }
}
