# API Client Integration

This directory contains the enhanced API client implementation for the frontend application.

## Features

- **Axios-based HTTP client** with interceptors
- **Automatic token management** with refresh logic
- **Request/response interceptors** for authentication
- **Error handling** with retry logic
- **Request caching** for GET requests
- **Request deduplication**
- **File upload/download support** with progress tracking
- **WebSocket integration** for real-time updates
- **TypeScript interfaces** for type safety

## Setup

### 1. Initialize in your app

```typescript
// In your app initialization (e.g., _app.tsx or layout.tsx)
import { setupApiErrorHandler } from '@/lib/api';

// Setup error handler to show notifications
setupApiErrorHandler();
```

### 2. Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_WS_URL=ws://localhost:5001
```

## Usage Examples

### Basic API Calls

```typescript
import { userService } from '@/lib/api';

// List users
const users = await userService.listUsers({
  page: 1,
  limit: 25,
  roles: ['admin', 'sales_manager'],
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// Create user
const newUser = await userService.createUser({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'sales_manager',
  departmentId: 'dept-123',
});

// Update user
const updatedUser = await userService.updateUser('user-123', {
  position: 'Senior Sales Manager',
  phoneNumber: '+1234567890',
});
```

### With Redux Thunks

```typescript
import { useAppDispatch } from '@/store';
import { fetchUsers, createUser } from '@/store/thunks/userThunks';

// In a component
const dispatch = useAppDispatch();

// Fetch users
dispatch(fetchUsers());

// Create user
dispatch(createUser({
  email: 'user@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'finance_manager',
  departmentId: 'dept-456',
}));
```

### File Upload

```typescript
import { fileService } from '@/lib/api';

// Upload file with progress
const uploadFile = async (file: File) => {
  const result = await fileService.uploadFile(file, {
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress}%`);
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  });
  
  console.log('File uploaded:', result);
};

// Upload avatar
const uploadAvatar = async (file: File, userId: string) => {
  const result = await fileService.uploadAvatar(file, userId, {
    onProgress: (progress) => {
      console.log(`Avatar upload progress: ${progress}%`);
    },
  });
  
  return result;
};
```

### Error Handling

Errors are automatically handled by the interceptors and will show notifications via Redux.

For custom error handling:

```typescript
import { errorHandler } from '@/lib/api';

try {
  await userService.createUser(userData);
} catch (error) {
  // Error is already handled by interceptor
  // But you can do additional handling here
  console.error('Failed to create user:', error);
}

// Register custom error messages
errorHandler.registerErrorMessage('USER_LIMIT_REACHED', 'Maximum number of users reached');
```

### Authentication

```typescript
import { authService } from '@/lib/api';

// Login
const { tokens, user } = await authService.login({
  email: 'admin@example.com',
  password: 'password123',
  rememberMe: true,
});

// Logout
await authService.logout();

// Check authentication
if (authService.isAuthenticated()) {
  // User is authenticated
}

// Get current user
const currentUser = await authService.getCurrentUser();
```

### WebSocket (Optional)

```typescript
import { wsClient } from '@/lib/websocket/client';

// Connect WebSocket
wsClient.connect();

// Listen for events
wsClient.on('user:created', (user) => {
  console.log('New user created:', user);
});

wsClient.on('user:updated', (user) => {
  console.log('User updated:', user);
});

// Join room
wsClient.joinRoom('users:updates');

// Send message
wsClient.send('message', { text: 'Hello' });

// Disconnect
wsClient.disconnect();
```

## API Services

### UserService
- `listUsers()` - Get paginated list of users
- `getUser()` - Get single user details
- `createUser()` - Create new user
- `updateUser()` - Update user details
- `deleteUser()` - Delete user
- `bulkUpdateUsers()` - Update multiple users
- `exportUsers()` - Export users to file
- `importUsers()` - Import users from file

### PermissionService
- `getPermissions()` - Get all permissions
- `getPermissionGroups()` - Get permission groups
- `getUserPermissions()` - Get user's permissions
- `updateUserPermissions()` - Update user permissions
- `validatePermissions()` - Validate permission set

### DepartmentService
- `getDepartments()` - Get all departments
- `getDepartmentTree()` - Get hierarchical tree
- `createDepartment()` - Create department
- `updateDepartment()` - Update department
- `deleteDepartment()` - Delete department
- `getDepartmentMembers()` - Get department members

### ActivityService
- `listActivities()` - Get activity logs
- `getUserActivities()` - Get user's activities
- `exportActivities()` - Export activity logs
- `getActivityStats()` - Get statistics
- `getActivityTimeline()` - Get timeline data

### FileService
- `uploadFile()` - Upload file with progress
- `uploadAvatar()` - Upload user avatar
- `downloadFile()` - Download file
- `deleteFile()` - Delete file

## Configuration

### Request Options

```typescript
import { request } from '@/lib/api';

// Build custom request
const [config, options] = request
  .get('/custom-endpoint')
  .params({ filter: 'active' })
  .headers({ 'X-Custom-Header': 'value' })
  .option('cache', true)
  .option('cacheTime', 10 * 60 * 1000) // 10 minutes
  .option('retry', false)
  .build();

// Execute request
const response = await apiClient.request(config);
```

### Cache Management

The API client includes automatic caching for GET requests:

```typescript
// Enable cache for a request
const users = await apiClient.get('/users', {
  headers: { cache: true, cacheTime: 300000 } // 5 minutes
});

// Cache is automatically managed
// Subsequent identical requests will return cached data
```

### Retry Configuration

```typescript
import { createApiClient } from '@/lib/api/client';

// Create custom client with retry config
const customClient = createApiClient({
  retryConfig: {
    retries: 5,
    retryDelay: 2000,
    retryCondition: (error) => {
      // Custom retry logic
      return error.response?.status === 503;
    },
  },
});
```

## TypeScript Types

All API responses are fully typed. Import types from:

```typescript
import type {
  User,
  UserRole,
  UserStatus,
  Department,
  Permission,
  ActivityLog,
  // ... and more
} from '@/lib/api';
```

## Best Practices

1. **Use the service methods** instead of direct API calls
2. **Handle errors appropriately** - most are auto-handled
3. **Use TypeScript types** for better development experience
4. **Enable caching** for frequently accessed data
5. **Monitor WebSocket connections** in production
6. **Set appropriate timeouts** for file uploads
7. **Validate file types and sizes** before upload

## Troubleshooting

### Token Refresh Issues
- Check if refresh token is valid
- Ensure backend returns correct token format
- Verify token storage permissions

### CORS Errors
- Ensure backend allows frontend origin
- Check withCredentials setting
- Verify API URL configuration

### WebSocket Connection Failed
- Check if backend WebSocket server is running
- Verify WebSocket URL
- Ensure authentication token is valid

### File Upload Failed
- Check file size limits
- Verify allowed file types
- Ensure multipart/form-data support