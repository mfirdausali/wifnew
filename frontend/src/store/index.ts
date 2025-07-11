import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Slices
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import permissionsReducer from './slices/permissionsSlice';
import departmentsReducer from './slices/departmentsSlice';
import activityReducer from './slices/activitySlice';
import uiReducer from './slices/uiSlice';

// Middleware
import { errorMiddleware } from './middleware/errorMiddleware';
import { analyticsMiddleware } from './middleware/analyticsMiddleware';
import { optimisticUpdateMiddleware } from './middleware/optimisticUpdateMiddleware';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['ui'], // Only persist UI preferences
  blacklist: ['users', 'permissions', 'departments', 'activity'], // Don't persist data
};

const rootReducer = combineReducers({
  auth: authReducer,
  users: usersReducer,
  permissions: permissionsReducer,
  departments: departmentsReducer,
  activity: activityReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['register', 'rehydrate'],
      },
    })
      .concat(errorMiddleware)
      .concat(analyticsMiddleware)
      .concat(optimisticUpdateMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;