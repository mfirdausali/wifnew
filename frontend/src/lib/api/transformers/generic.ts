import { snakeCase, camelCase } from 'lodash';
import { PaginationMeta } from '../types';

export function transformPaginationMeta(meta: any): PaginationMeta {
  return {
    page: meta.page || 1,
    limit: meta.limit || 25,
    total: meta.total || 0,
    totalPages: meta.total_pages || meta.totalPages || Math.ceil(meta.total / meta.limit),
    hasNextPage: meta.has_next_page || meta.hasNextPage || false,
    hasPrevPage: meta.has_prev_page || meta.hasPrevPage || false,
  };
}

export function transformFilters(filters: any): any {
  const transformed: any = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    
    if (Array.isArray(value) && value.length === 0) return;
    
    if (key === 'dateRange' && typeof value === 'object') {
      const dateRange = value as any;
      if (dateRange.start) transformed.start_date = dateRange.start;
      if (dateRange.end) transformed.end_date = dateRange.end;
    } else {
      transformed[snakeCase(key)] = value;
    }
  });
  
  return transformed;
}

export function transformSorting(sorting: any): any {
  return {
    sort_by: snakeCase(sorting.field),
    sort_order: sorting.order,
  };
}

export function transformTimestamps(data: any): any {
  if (Array.isArray(data)) {
    return data.map(transformTimestamps);
  }
  
  if (data && typeof data === 'object') {
    const transformed = { ...data };
    
    // Transform known timestamp fields
    const timestampFields = [
      'created_at',
      'updated_at',
      'deleted_at',
      'last_login_at',
      'email_verified_at',
      'suspension_end_date',
    ];
    
    timestampFields.forEach((field) => {
      if (transformed[field]) {
        transformed[camelCase(field)] = new Date(transformed[field]);
      }
    });
    
    return transformed;
  }
  
  return data;
}

export function transformRequestParams(params: any): any {
  const transformed: any = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    
    // Convert arrays to comma-separated strings for query params
    if (Array.isArray(value)) {
      if (value.length > 0) {
        transformed[snakeCase(key)] = value.join(',');
      }
    } else {
      transformed[snakeCase(key)] = value;
    }
  });
  
  return transformed;
}

export function transformRequestData(data: any): any {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data && typeof data === 'object') {
    const transformed: any = {};
    
    Object.entries(data).forEach(([key, value]) => {
      transformed[snakeCase(key)] = value;
    });
    
    return transformed;
  }
  
  return data;
}