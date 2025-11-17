# Frontend Testing Guide

Complete testing documentation for Taiwan Celebrity Tracker Frontend.

## Table of Contents

1. [Setup & Installation](#setup--installation)
2. [Running Tests](#running-tests)
3. [Test Architecture](#test-architecture)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [Troubleshooting](#troubleshooting)
7. [CI/CD Integration](#cicd-integration)

---

## Setup & Installation

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation Steps

```bash
# Install all dependencies (including test tools)
npm install

# Verify test setup
npm run test -- --version
```

### Dependencies

Key testing libraries installed:

- **vitest**: Fast unit test framework (Vite-native)
- **@testing-library/react**: React component testing
- **@testing-library/jest-dom**: DOM matchers
- **@testing-library/user-event**: User interaction simulation
- **msw**: Mock Service Worker for API mocking
- **@vitest/ui**: Interactive test dashboard
- **@vitest/coverage-v8**: Code coverage reporting

---

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Advanced Options

```bash
# Run specific test file
npm run test -- src/components/cards/__tests__/CelebrityCard.test.jsx

# Run tests matching pattern
npm run test -- --grep "CelebrityCard"

# Run with detailed output
npm run test -- --reporter=verbose

# Run single test
npm run test -- -t "should render celebrity name"

# Debug tests (opens inspector)
npm run test -- --inspect-brk

# Run tests in parallel
npm run test -- --threads

# Disable parallel execution
npm run test -- --no-threads
```

### Watch Mode Tips

When running `npm run test:watch`:

- Press `w` to show watch mode menu
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit

---

## Test Architecture

### Directory Structure

```
frontend/
├── src/
│   ├── test/
│   │   ├── setup.js                 # Global test setup
│   │   ├── utils.jsx                # Testing utilities
│   │   ├── fixtures.js              # Mock data
│   │   └── mocks/
│   │       ├── handlers.js          # MSW endpoint handlers
│   │       └── server.js            # MSW server setup
│   │
│   ├── components/
│   │   ├── cards/
│   │   │   └── __tests__/
│   │   │       ├── CelebrityCard.test.jsx
│   │   │       ├── MetricsCard.test.jsx
│   │   │       ├── MentionsCard.test.jsx
│   │   │       ├── TrendingCard.test.jsx
│   │   │       └── StatsCard.test.jsx
│   │   └── shared/
│   │       └── __tests__/
│   │           └── LoadingSpinner.test.jsx
│   │
│   ├── pages/
│   │   ├── public/
│   │   │   └── __tests__/
│   │   │       ├── CelebrityList.test.jsx
│   │   │       ├── Trending.test.jsx
│   │   │       ├── CelebrityDetail.test.jsx
│   │   │       ├── MentionsDetail.test.jsx
│   │   │       └── CardEmbed.test.jsx
│   │   └── admin/
│   │       └── __tests__/
│   │           ├── AdminDashboard.test.jsx
│   │           ├── ScrapeControl.test.jsx
│   │           ├── DataManagement.test.jsx
│   │           └── Analytics.test.jsx
│   │
│   ├── services/
│   │   └── __tests__/
│   │       ├── api.test.js
│   │       └── ...other service tests
│   │
│   └── context/
│       └── __tests__/
│           ├── authStore.test.js
│           └── themeStore.test.js
│
├── vitest.config.js                 # Vitest configuration
└── TEST_GUIDE.md                    # This file
```

### Test Organization

Tests follow a consistent pattern:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component Name', () => {
  describe('Feature/Behavior', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { /* ... */ };

      // Act
      const { getByText } = render(<Component {...props} />);

      // Assert
      expect(getByText('Expected Text')).toBeDefined();
    });
  });
});
```

### Test Utilities

See `src/test/utils.jsx` for available utilities:

```javascript
import {
  render,              // Custom render with providers
  screen,              // Query DOM elements
  fireEvent,           // Trigger events
  waitFor,             // Wait for async operations
  within,              // Scope queries
  createMockResponse,  // Create mock API response
  createMockError,     // Create mock error
  waitForAsync,        // Wait for promises
} from '@testing-library/react';
```

### Mock Data

See `src/test/fixtures.js` for mock data:

```javascript
import {
  mockCelebrities,
  mockMetrics,
  mockMentions,
  mockTrendingData,
  mockStats,
  createMockCelebrity,
  createMockMetrics,
  createPaginatedResponse,
} from '@test/fixtures.js';
```

### MSW Mock Handlers

All API endpoints are mocked in `src/test/mocks/handlers.js`.

Supported endpoints:
- GET /api/celebrities
- GET /api/celebrities/:id
- GET /api/metrics/:id
- GET /api/metrics/:id/history
- GET /api/mentions/:id
- GET /api/card/* (all card endpoints)
- GET /api/admin/stats
- POST /api/admin/scrape
- GET /api/admin/jobs
- POST /api/auth/login

---

## Writing Tests

### Component Unit Tests

**Template for card components:**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import CelebrityCard from '../../CelebrityCard';
import { mockCelebrity, mockMetrics } from '@test/fixtures';

describe('CelebrityCard', () => {
  describe('Interactive Mode', () => {
    it('should render celebrity name', () => {
      render(
        <CelebrityCard
          celebrity={mockCelebrity}
          metrics={mockMetrics}
          mode="interactive"
        />
      );

      expect(screen.getByText(mockCelebrity.name)).toBeDefined();
    });

    it('should call onCardClick when clicked', async () => {
      const onCardClick = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <CelebrityCard
          celebrity={mockCelebrity}
          metrics={mockMetrics}
          mode="interactive"
          onCardClick={onCardClick}
        />
      );

      await user.click(container.querySelector('[data-testid="card"]'));
      expect(onCardClick).toHaveBeenCalled();
    });

    it('should apply theme classes', () => {
      const { container } = render(
        <CelebrityCard
          celebrity={mockCelebrity}
          metrics={mockMetrics}
          mode="interactive"
          theme="dark"
        />
      );

      const card = container.querySelector('[data-testid="card"]');
      expect(card.className).toContain('dark');
    });
  });

  describe('Static Mode', () => {
    it('should render without click handlers', () => {
      const onCardClick = vi.fn();

      render(
        <CelebrityCard
          celebrity={mockCelebrity}
          metrics={mockMetrics}
          mode="static"
          onCardClick={onCardClick}
        />
      );

      // Clicking should not trigger callback in static mode
      // This would require DOM interaction test
    });
  });

  describe('SVG Mode', () => {
    it('should return SVG string', () => {
      const { container } = render(
        <CelebrityCard
          celebrity={mockCelebrity}
          metrics={mockMetrics}
          mode="svg"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });
});
```

### Page Integration Tests

**Template for pages:**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CelebrityList from '../../CelebrityList';

describe('CelebrityList Page', () => {
  it('should fetch and display celebrities', async () => {
    render(<CelebrityList />);

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeDefined();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).toBeNull();
    });

    // Should display celebrities
    const cards = screen.getAllByTestId('celebrity-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should handle pagination', async () => {
    render(<CelebrityList />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).toBeNull();
    });

    // Test pagination controls
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDefined();
  });

  it('should filter by category', async () => {
    render(<CelebrityList />);

    const filterSelect = screen.getByRole('combobox', { name: /category/i });
    // Test filter interaction
  });
});
```

### API Integration Tests

**Template for API testing:**

```javascript
import { describe, it, expect } from 'vitest';
import { fetchCelebrities, fetchMetrics } from '../../services/api';

describe('API Integration', () => {
  it('should fetch celebrities with pagination', async () => {
    const response = await fetchCelebrities(20, 0);

    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.count).toBeGreaterThan(0);
  });

  it('should fetch metrics for celebrity', async () => {
    const response = await fetchMetrics(1);

    expect(response.data.success).toBe(true);
    expect(response.data.data.frequency).toBeDefined();
    expect(response.data.data.velocity).toBeDefined();
  });

  it('should cache GET requests', async () => {
    const response1 = await fetchCelebrities();
    const response2 = await fetchCelebrities();

    // Should be identical (from cache)
    expect(response1.data.data).toEqual(response2.data.data);
  });
});
```

### User Event Testing

```javascript
import { userEvent } from '@testing-library/user-event';

it('should handle user interactions', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  // Click
  await user.click(screen.getByRole('button'));

  // Type
  await user.type(screen.getByRole('textbox'), 'search text');

  // Tab navigation
  await user.tab();

  // Hover
  await user.hover(screen.getByText('Hover me'));
});
```

### Testing Async Operations

```javascript
import { waitFor } from '@testing-library/react';

it('should handle async data loading', async () => {
  render(<AsyncComponent />);

  // Wait for loading to complete
  await waitFor(() => {
    expect(screen.getByText('Loaded data')).toBeDefined();
  }, { timeout: 3000 });
});
```

---

## Test Coverage

### Viewing Coverage

```bash
# Generate and view coverage report
npm run test:coverage

# Report outputs to:
# - Terminal: colored summary
# - coverage/index.html: detailed HTML report
# - coverage/lcov.info: LCOV format
```

### Coverage Targets

Per `vitest.config.js`:

- Exclude: node_modules, src/test/, test files
- Provider: v8 (built-in)
- Reporters: text, json, html, lcov

### Interpreting Coverage

Example output:

```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|----------
All files                     |   85.2  |   78.5   |   82.1  |   85.2
  src/components/            |   90.0  |   85.0   |   88.0  |   90.0
  src/pages/                 |   78.0  |   72.0   |   75.0  |   78.0
  src/services/              |   95.0  |   92.0   |   94.0  |   95.0
```

Target goals:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

---

## Troubleshooting

### Common Issues

#### Tests Timeout

```javascript
// Solution 1: Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout

// Solution 2: Configure global timeout in vitest.config.js
testTimeout: 10000,
```

#### API Mocks Not Working

1. Verify MSW server is running: `beforeAll(() => server.listen())`
2. Check handler URLs match exactly
3. Check `src/test/setup.js` is loaded
4. Verify `vitest.config.js` has `setupFiles: ['./src/test/setup.js']`

#### Import Errors

```javascript
// Use path aliases from vitest.config.js
import { mockCelebrity } from '@test/fixtures'; // ✅ Correct
import { mockCelebrity } from '../../test/fixtures'; // ❌ Avoid

// Configured aliases:
// '@' → './src'
// '@components' → './src/components'
// '@pages' → './src/pages'
// '@test' → './src/test'
```

#### localStorage Not Working

The setup mocks localStorage automatically. To use real localStorage in tests:

```javascript
import { vi } from 'vitest';

// Before test
delete global.localStorage;
global.localStorage = window.localStorage;

// Test code
localStorage.setItem('key', 'value');
```

#### Component Not Rendering

Check:
1. All required props are provided
2. No missing imports
3. Component doesn't throw error in render
4. Check console for error messages

```javascript
// Debug render errors
try {
  render(<Component />);
} catch (error) {
  console.error('Render error:', error);
}
```

---

## CI/CD Integration

### GitHub Actions Setup

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hooks

Setup Husky to run tests before commit:

```bash
# Install Husky
npm install husky --save-dev
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test"
```

### CI Best Practices

1. **Run tests on multiple Node versions**
2. **Generate coverage reports**
3. **Upload to Codecov or Coveralls**
4. **Block merge if tests fail**
5. **Cache dependencies** for faster runs
6. **Parallel test execution** for speed

---

## Test Maintenance

### Keeping Tests Updated

When you modify code:

1. **Update related tests** before committing
2. **Run full test suite** before pushing
3. **Add tests for new features** immediately
4. **Keep mocks synchronized** with backend changes
5. **Review coverage** on each PR

### Regular Maintenance Tasks

```bash
# Weekly: Update dependencies safely
npm update

# Monthly: Audit for security issues
npm audit

# Before release: Full test run with coverage
npm run test:coverage

# Check test execution time
npm run test -- --reporter=verbose
```

### Deprecation Warnings

If you see warnings about deprecated test utilities:

1. Check Vitest changelog
2. Update to newer syntax
3. Test thoroughly
4. Update this guide

---

## Best Practices

### Do's ✅

- **Do** organize tests near components
- **Do** use descriptive test names
- **Do** follow Arrange-Act-Assert pattern
- **Do** mock external dependencies
- **Do** test user behavior, not implementation
- **Do** keep tests isolated and independent
- **Do** run tests before pushing code

### Don'ts ❌

- **Don't** couple tests to internal implementation
- **Don't** use hardcoded timeouts unnecessarily
- **Don't** skip tests with `.skip` or `.only` (except during debugging)
- **Don't** test third-party libraries
- **Don't** make tests dependent on each other
- **Don't** ignore failing tests

---

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library React Guide](https://testing-library.com/docs/react-testing-library/intro)
- [MSW Documentation](https://mswjs.io)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

## Questions or Issues?

For testing-related questions:
1. Check this guide
2. Check Vitest docs
3. Check Testing Library docs
4. Open an issue in the repository

---

**Last Updated**: 2025-11-17
**Maintained By**: Frontend Team
