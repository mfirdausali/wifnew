import { fileClient, API_ENDPOINTS } from './client';
import { ApiResponse, FileUploadResponse } from './types';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  maxSize?: number;
  allowedTypes?: string[];
}

export class FileService {
  // Upload file
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<FileUploadResponse> {
    // Validate file
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File size exceeds maximum of ${options.maxSize} bytes`);
    }
    
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fileClient.post<ApiResponse<FileUploadResponse>>(
      API_ENDPOINTS.files.upload,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            options.onProgress(progress);
          }
        },
      }
    );
    
    return response.data.data;
  }
  
  // Upload avatar
  async uploadAvatar(
    file: File,
    userId: string,
    options: UploadOptions = {}
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId);
    
    const response = await fileClient.post<ApiResponse<FileUploadResponse>>(
      API_ENDPOINTS.files.avatar,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            options.onProgress(progress);
          }
        },
      }
    );
    
    return response.data.data;
  }
  
  // Download file
  async downloadFile(id: string, filename?: string): Promise<void> {
    const response = await fileClient.get(
      API_ENDPOINTS.files.download(id),
      {
        responseType: 'blob',
      }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `download_${id}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
  
  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<FileUploadResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }
  
  // Delete file
  async deleteFile(id: string): Promise<void> {
    await fileClient.delete(API_ENDPOINTS.files.delete(id));
  }
}

export const fileService = new FileService();