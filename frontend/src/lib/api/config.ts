import { AxiosRequestConfig } from 'axios';
import { snakeCase } from 'lodash';

export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  cache?: boolean;
  cacheTime?: number;
  retry?: boolean;
  retryCount?: number;
  transform?: boolean;
  showError?: boolean;
}

export const defaultRequestOptions: RequestOptions = {
  skipAuth: false,
  cache: false,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  retry: true,
  retryCount: 3,
  transform: true,
  showError: true,
};

// Request builder
export class RequestBuilder {
  private config: AxiosRequestConfig = {};
  private options: RequestOptions = { ...defaultRequestOptions };
  
  method(method: string): this {
    this.config.method = method;
    return this;
  }
  
  url(url: string): this {
    this.config.url = url;
    return this;
  }
  
  data(data: any): this {
    this.config.data = data;
    return this;
  }
  
  params(params: Record<string, any>): this {
    this.config.params = params;
    return this;
  }
  
  headers(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }
  
  option(key: keyof RequestOptions, value: any): this {
    this.options[key] = value;
    return this;
  }
  
  build(): [AxiosRequestConfig, RequestOptions] {
    return [this.config, this.options];
  }
}

// Request factory
export const request = {
  get: (url: string) => new RequestBuilder().method('GET').url(url),
  post: (url: string, data?: any) => new RequestBuilder().method('POST').url(url).data(data),
  put: (url: string, data?: any) => new RequestBuilder().method('PUT').url(url).data(data),
  patch: (url: string, data?: any) => new RequestBuilder().method('PATCH').url(url).data(data),
  delete: (url: string) => new RequestBuilder().method('DELETE').url(url),
};