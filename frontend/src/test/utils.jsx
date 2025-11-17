import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers
 * Wraps with BrowserRouter for React Router v6 compatibility
 */
function render(
  ui,
  {
    route = '/',
    ...renderOptions
  } = {}
) {
  // Set the initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create mock API response
 */
export function createMockResponse(data, status = 200) {
  return {
    status,
    data,
    headers: {},
    config: {},
  };
}

/**
 * Create mock error response
 */
export function createMockError(message, status = 500) {
  const error = new Error(message);
  error.response = {
    status,
    data: {
      success: false,
      error: message,
    },
  };
  return error;
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
}

/**
 * Create mock theme store
 */
export function createMockThemeStore() {
  return {
    isDark: false,
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  };
}

/**
 * Create mock auth store
 */
export function createMockAuthStore() {
  return {
    token: null,
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    setToken: vi.fn(),
  };
}

/**
 * Wait for loading state to complete
 */
export async function waitForLoadingToFinish() {
  return new Promise(resolve => {
    const checkLoading = () => {
      const loaders = document.querySelectorAll('[data-testid="loading"]');
      if (loaders.length === 0) {
        resolve();
      } else {
        setTimeout(checkLoading, 50);
      }
    };
    checkLoaders();
  });
}

/**
 * Screen coordinates helper for multi-screen testing
 */
export const SCREEN_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

export {
  // Re-export everything from testing library
  ...require('@testing-library/react'),
  render,
};
