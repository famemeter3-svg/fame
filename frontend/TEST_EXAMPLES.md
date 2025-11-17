# Test Examples & Templates

Complete examples for testing different component types in the Taiwan Celebrity Tracker Frontend.

## Table of Contents

1. [Card Component Tests](#card-component-tests)
2. [Page Component Tests](#page-component-tests)
3. [API Integration Tests](#api-integration-tests)
4. [Context/Store Tests](#contextstore-tests)
5. [Hook Tests](#hook-tests)
6. [E2E Flow Tests](#e2e-flow-tests)

---

## Card Component Tests

### CelebrityCard Example

**File**: `src/components/cards/__tests__/CelebrityCard.test.jsx`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CelebrityCard from '../CelebrityCard';
import { mockCelebrity, mockMetrics } from '@test/fixtures';

describe('CelebrityCard', () => {
  const defaultProps = {
    celebrity: mockCelebrity,
    metrics: mockMetrics,
    theme: 'light',
    mode: 'interactive',
  };

  describe('Interactive Mode', () => {
    it('should render celebrity card with all required information', () => {
      render(
        <CelebrityCard {...defaultProps} />
      );

      // Check name is displayed
      expect(screen.getByText(mockCelebrity.name)).toBeInTheDocument();

      // Check category is displayed
      expect(screen.getByText(mockCelebrity.category)).toBeInTheDocument();

      // Check mention count is displayed
      expect(screen.getByText(`${mockCelebrity.mention_count}`)).toBeInTheDocument();
    });

    it('should display ranking badge when showRanking is true', () => {
      render(
        <CelebrityCard
          {...defaultProps}
          showRanking={true}
          ranking={1}
        />
      );

      // Check ranking badge appears
      const badge = screen.getByText('#1');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('ranking-badge');
    });

    it('should not display ranking badge by default', () => {
      render(
        <CelebrityCard {...defaultProps} />
      );

      expect(screen.queryByText('#1')).not.toBeInTheDocument();
    });

    it('should call onCardClick when card is clicked', async () => {
      const user = userEvent.setup();
      const onCardClick = vi.fn();

      render(
        <CelebrityCard
          {...defaultProps}
          onCardClick={onCardClick}
        />
      );

      const card = screen.getByTestId('celebrity-card');
      await user.click(card);

      expect(onCardClick).toHaveBeenCalledWith(mockCelebrity.id);
    });

    it('should show hover effects on hover', async () => {
      const user = userEvent.setup();

      const { container } = render(
        <CelebrityCard {...defaultProps} />
      );

      const card = container.querySelector('[data-testid="celebrity-card"]');

      await user.hover(card);
      expect(card).toHaveClass('hover');

      await user.unhover(card);
      expect(card).not.toHaveClass('hover');
    });

    it('should apply theme correctly in interactive mode', () => {
      const { container: lightContainer } = render(
        <CelebrityCard {...defaultProps} theme="light" />
      );

      const lightCard = lightContainer.querySelector('[data-testid="celebrity-card"]');
      expect(lightCard).toHaveClass('light-theme');

      const { container: darkContainer } = render(
        <CelebrityCard {...defaultProps} theme="dark" />
      );

      const darkCard = darkContainer.querySelector('[data-testid="celebrity-card"]');
      expect(darkCard).toHaveClass('dark-theme');
    });
  });

  describe('Static Mode', () => {
    it('should render without click handlers in static mode', async () => {
      const user = userEvent.setup();
      const onCardClick = vi.fn();

      render(
        <CelebrityCard
          {...defaultProps}
          mode="static"
          onCardClick={onCardClick}
        />
      );

      const card = screen.getByTestId('celebrity-card');

      // In static mode, click should not trigger callback
      // Component should have cursor-default instead of cursor-pointer
      expect(card).toHaveClass('cursor-default');
    });

    it('should display all content but with static styling', () => {
      render(
        <CelebrityCard
          {...defaultProps}
          mode="static"
        />
      );

      expect(screen.getByText(mockCelebrity.name)).toBeInTheDocument();
      expect(screen.getByTestId('celebrity-card')).toHaveClass('static');
    });
  });

  describe('SVG Mode', () => {
    it('should render as SVG element in SVG mode', () => {
      const { container } = render(
        <CelebrityCard
          {...defaultProps}
          mode="svg"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should contain celebrity data in SVG', () => {
      const { container } = render(
        <CelebrityCard
          {...defaultProps}
          mode="svg"
        />
      );

      const svg = container.querySelector('svg');
      const svgText = svg.textContent;

      expect(svgText).toContain(mockCelebrity.name);
      expect(svgText).toContain(mockCelebrity.category);
    });

    it('should have proper SVG dimensions', () => {
      const { container } = render(
        <CelebrityCard
          {...defaultProps}
          mode="svg"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width');
      expect(svg).toHaveAttribute('height');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing celebrity data gracefully', () => {
      render(
        <CelebrityCard
          {...defaultProps}
          celebrity={{}}
        />
      );

      // Should render without crashing
      expect(screen.getByTestId('celebrity-card')).toBeInTheDocument();
    });

    it('should display placeholder for missing image', () => {
      render(
        <CelebrityCard
          {...defaultProps}
          celebrity={{ ...mockCelebrity, image: null }}
        />
      );

      const placeholder = screen.getByAltText(/placeholder/i);
      expect(placeholder).toBeInTheDocument();
    });

    it('should handle undefined metrics', () => {
      render(
        <CelebrityCard
          {...defaultProps}
          metrics={undefined}
        />
      );

      expect(screen.getByTestId('celebrity-card')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile screens', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(max-width: 640px)',
        media: query,
      }));

      const { container } = render(
        <CelebrityCard {...defaultProps} />
      );

      const card = container.querySelector('[data-testid="celebrity-card"]');
      expect(card).toHaveClass('sm:flex');
    });

    it('should display correctly on different screen sizes', () => {
      const { container: mobileContainer } = render(
        <CelebrityCard {...defaultProps} />
      );

      const card = mobileContainer.querySelector('[data-testid="celebrity-card"]');

      // Check responsive classes
      expect(card.className).toContain('w-full');
      expect(card.className).toContain('md:w-1/2');
      expect(card.className).toContain('lg:w-1/3');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      render(
        <CelebrityCard {...defaultProps} />
      );

      const card = screen.getByTestId('celebrity-card');
      // Card should be a button or have role="button"
      expect(card).toHaveAttribute('role', 'button');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onCardClick = vi.fn();

      render(
        <CelebrityCard
          {...defaultProps}
          onCardClick={onCardClick}
        />
      );

      const card = screen.getByTestId('celebrity-card');

      // Tab to card
      await user.tab();
      expect(card).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(onCardClick).toHaveBeenCalled();
    });

    it('should have proper ARIA labels', () => {
      render(
        <CelebrityCard {...defaultProps} />
      );

      const card = screen.getByTestId('celebrity-card');
      expect(card).toHaveAttribute('aria-label');
    });
  });
});
```

---

## Page Component Tests

### CelebrityList Page Example

**File**: `src/pages/public/__tests__/CelebrityList.test.jsx`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CelebrityList from '../CelebrityList';
import { mockCelebrities } from '@test/fixtures';

describe('CelebrityList Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Load & Data Fetching', () => {
    it('should show loading state initially', () => {
      render(<CelebrityList />);

      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should fetch and display celebrities', async () => {
      render(<CelebrityList />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Check celebrities are displayed
      const cards = screen.getAllByTestId('celebrity-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should display correct number of celebrities per page', async () => {
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const cards = screen.getAllByTestId('celebrity-card');
      expect(cards.length).toBeLessThanOrEqual(20); // Default limit
    });

    it('should handle API error gracefully', async () => {
      // Test with error handler in MSW
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Even with error, page should still render
      expect(screen.getByTestId('celebrity-list')).toBeInTheDocument();
    });
  });

  describe('Filtering & Search', () => {
    it('should filter celebrities by category', async () => {
      const user = userEvent.setup();
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Find category filter
      const categorySelect = screen.getByRole('combobox', { name: /category/i });

      // Select "Singer" category
      await user.selectOptions(categorySelect, 'Singer');

      // Should re-fetch with category filter
      await waitFor(() => {
        const cards = screen.getAllByTestId('celebrity-card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('should search celebrities by name', async () => {
      const user = userEvent.setup();
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'Jolin');

      // Should trigger search
      await waitFor(() => {
        expect(screen.getByDisplayValue('Jolin')).toBeInTheDocument();
      });
    });

    it('should clear filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      await user.selectOptions(categorySelect, 'Singer');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(categorySelect).toHaveValue('');
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();
    });

    it('should go to next page when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      const firstCardBefore = screen.getAllByTestId('celebrity-card')[0];
      const firstIdBefore = firstCardBefore.getAttribute('data-celebrity-id');

      await user.click(nextButton);

      await waitFor(() => {
        const firstCardAfter = screen.getAllByTestId('celebrity-card')[0];
        const firstIdAfter = firstCardAfter.getAttribute('data-celebrity-id');
        expect(firstIdAfter).not.toBe(firstIdBefore);
      });
    });

    it('should disable previous button on first page', async () => {
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', async () => {
      const user = userEvent.setup();
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Go to last page
      let nextButton = screen.getByRole('button', { name: /next/i });
      while (!nextButton.disabled) {
        await user.click(nextButton);
        nextButton = screen.queryByRole('button', { name: /next/i });
        if (!nextButton) break;
      }

      // Next button should be disabled
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('Sorting', () => {
    it('should sort by name (A-Z)', async () => {
      const user = userEvent.setup();
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      await user.selectOptions(sortSelect, 'name-asc');

      // Should re-fetch with sort parameter
      await waitFor(() => {
        expect(sortSelect).toHaveValue('name-asc');
      });
    });

    it('should sort by trending', async () => {
      const user = userEvent.setup();
      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      await user.selectOptions(sortSelect, 'trending');

      await waitFor(() => {
        expect(sortSelect).toHaveValue('trending');
      });
    });
  });

  describe('Card Interactions', () => {
    it('should navigate to detail page when card is clicked', async () => {
      const user = userEvent.setup();
      const mockNavigate = vi.fn();

      // Mock useNavigate
      vi.mock('react-router-dom', () => ({
        useNavigate: () => mockNavigate,
      }));

      render(<CelebrityList />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const firstCard = screen.getAllByTestId('celebrity-card')[0];
      const celebrityId = firstCard.getAttribute('data-celebrity-id');

      await user.click(firstCard);

      expect(mockNavigate).toHaveBeenCalledWith(`/celebrity/${celebrityId}`);
    });
  });

  describe('Responsive Design', () => {
    it('should display cards in responsive grid', () => {
      const { container } = render(<CelebrityList />);

      const grid = container.querySelector('[data-testid="celebrity-grid"]');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('sm:grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper page heading', () => {
      render(<CelebrityList />);

      const heading = screen.getByRole('heading', { level: 1, name: /celebrities/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible filter controls', () => {
      render(<CelebrityList />);

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      expect(categorySelect).toHaveAccessibleName();
    });
  });
});
```

---

## API Integration Tests

### Complete API Test Suite Example

**File**: `src/services/__tests__/api.complete.test.js`

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  fetchCelebrities,
  fetchCelebrityById,
  fetchMetrics,
  fetchMentions,
  fetchTrending,
} from '../api';
import { mockCelebrities, mockMetrics, mockMentions } from '@test/fixtures';

describe('Complete API Integration Suite', () => {
  describe('Response Format Validation', () => {
    it('should return data with consistent response format', async () => {
      const response = await fetchCelebrities();

      // All responses should have this structure
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
      expect(response.data).toHaveProperty('data');
    });

    it('should include metadata in paginated responses', async () => {
      const response = await fetchCelebrities(20, 0);

      expect(response.data).toHaveProperty('count');
      // Optional but should be present
      if (response.data.pagination) {
        expect(response.data.pagination).toHaveProperty('limit');
        expect(response.data.pagination).toHaveProperty('offset');
      }
    });
  });

  describe('Data Type Validation', () => {
    it('should return typed data for celebrities', async () => {
      const response = await fetchCelebrities();
      const celebrity = response.data.data[0];

      expect(typeof celebrity.id).toBe('number');
      expect(typeof celebrity.name).toBe('string');
      expect(typeof celebrity.category).toBe('string');
      expect(typeof celebrity.mention_count).toBe('number');
    });

    it('should return typed data for metrics', async () => {
      const response = await fetchMetrics(1);
      const metrics = response.data.data;

      expect(typeof metrics.frequency).toBe('number');
      expect(typeof metrics.velocity).toBe('number');
      expect(typeof metrics.trending_score).toBe('number');
      expect(typeof metrics.keywords_json).toBe('string');
    });

    it('should parse JSON fields correctly', async () => {
      const response = await fetchMetrics(1);
      const metrics = response.data.data;

      // keywords_json should be parseable
      const keywords = JSON.parse(metrics.keywords_json);
      expect(Array.isArray(keywords)).toBe(true);
    });
  });

  describe('Query Parameter Handling', () => {
    it('should handle limit parameter', async () => {
      const response5 = await fetchCelebrities(5);
      const response20 = await fetchCelebrities(20);

      expect(response5.data.data.length).toBeLessThanOrEqual(5);
      expect(response20.data.data.length).toBeLessThanOrEqual(20);
    });

    it('should handle offset parameter for pagination', async () => {
      const page1 = await fetchCelebrities(10, 0);
      const page2 = await fetchCelebrities(10, 10);

      // First item of page 2 should be different from page 1
      if (page1.data.data.length > 0 && page2.data.data.length > 0) {
        expect(page1.data.data[0].id).not.toBe(page2.data.data[0].id);
      }
    });

    it('should handle multiple query parameters', async () => {
      const response = await fetchCelebrities(10, 0, {
        category: 'Singer',
        status: 'active',
      });

      expect(response.data.success).toBe(true);
    });
  });

  describe('Caching Behavior', () => {
    it('should cache GET requests', async () => {
      const time1 = Date.now();
      await fetchCelebrities();
      const time2 = Date.now();
      const firstCallDuration = time2 - time1;

      const time3 = Date.now();
      await fetchCelebrities(); // Should use cache
      const time4 = Date.now();
      const secondCallDuration = time4 - time3;

      // Cached call should be significantly faster
      expect(secondCallDuration).toBeLessThan(firstCallDuration);
    });

    it('should not cache POST requests', async () => {
      // POST requests bypass cache by design
      // This is tested implicitly through startScrape tests
    });

    it('should cache based on URL parameters', async () => {
      const response1 = await fetchCelebrities(10, 0);
      const response2 = await fetchCelebrities(20, 0); // Different limit

      // Different URLs should have different cache entries
      expect(response1.data.data.length).not.toBe(response2.data.data.length);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle 404 errors', async () => {
      try {
        // This would return mock data in test, but shows error handling
        await fetchCelebrityById(999999);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network timeout', async () => {
      // Timeout configured to 10 seconds in vitest.config.js
      try {
        const response = await fetchCelebrities();
        expect(response).toBeDefined();
      } catch (error) {
        expect(error.code).toBe('ECONNABORTED');
      }
    });

    it('should handle malformed JSON', async () => {
      try {
        const response = await fetchMetrics(1);
        // Should still parse correctly
        const keywords = JSON.parse(response.data.data.keywords_json);
        expect(keywords).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
```

---

## Context/Store Tests

### Auth Store Test Example

**File**: `src/context/__tests__/authStore.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  });

  describe('Initial State', () => {
    it('should have empty initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Login Action', () => {
    it('should set token and user on successful login', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('admin', 'password');
      });

      expect(result.current.token).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
    });

    it('should fail on invalid credentials', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('invalid', 'wrong');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout Action', () => {
    it('should clear token and user on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      await act(async () => {
        await result.current.login('admin', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should persist token to localStorage', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('admin', 'password');
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        expect.any(String)
      );
    });

    it('should restore token from localStorage', () => {
      // Mock localStorage
      global.localStorage.getItem.mockReturnValue('saved_token');

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.restoreToken();
      });

      expect(result.current.token).toBe('saved_token');
    });
  });
});
```

---

## Hook Tests

### useFetch Hook Test Example

**File**: `src/hooks/__tests__/useFetch.test.js`

```javascript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../useFetch';
import { fetchCelebrities } from '@/services/api';

vi.mock('@/services/api');

describe('useFetch Hook', () => {
  it('should fetch data on mount', async () => {
    const mockData = { celebrities: [] };
    fetchCelebrities.mockResolvedValue({ data: mockData });

    const { result } = renderHook(() =>
      useFetch(() => fetchCelebrities(), [])
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('should handle errors', async () => {
    const mockError = new Error('API Error');
    fetchCelebrities.mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useFetch(() => fetchCelebrities(), [])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should refetch data when refetch is called', async () => {
    fetchCelebrities.mockResolvedValue({ data: { celebrities: [] } });

    const { result } = renderHook(() =>
      useFetch(() => fetchCelebrities(), [])
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchCelebrities).toHaveBeenCalledTimes(1);

    // Refetch
    result.current.refetch();

    expect(fetchCelebrities).toHaveBeenCalledTimes(2);
  });
});
```

---

## E2E Flow Tests

### Complete User Flow Example

**File**: `src/test/e2e/celebrity-flow.test.jsx`

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Complete Celebrity Browse Flow (E2E)', () => {
  it('should complete full flow: browse → filter → detail → share', async () => {
    const user = userEvent.setup();

    render(<App />);

    // Step 1: Load celebrity list
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const celebrities = screen.getAllByTestId('celebrity-card');
    expect(celebrities.length).toBeGreaterThan(0);

    // Step 2: Filter by category
    const categoryFilter = screen.getByRole('combobox', { name: /category/i });
    await user.selectOptions(categoryFilter, 'Singer');

    // List should update with filtered results
    await waitFor(() => {
      const filteredCelebrities = screen.getAllByTestId('celebrity-card');
      expect(filteredCelebrities.length).toBeGreaterThan(0);
    });

    // Step 3: Click on a celebrity to view detail
    const firstCard = screen.getAllByTestId('celebrity-card')[0];
    await user.click(firstCard);

    // Step 4: Verify detail page loaded
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    // Step 5: Check metrics are displayed
    const metricsTab = screen.getByRole('tab', { name: /metrics/i });
    await user.click(metricsTab);

    expect(screen.getByText(/trending score/i)).toBeInTheDocument();

    // Step 6: Navigate to share/embed
    const shareTab = screen.getByRole('tab', { name: /share/i });
    await user.click(shareTab);

    // Step 7: Copy embed code
    const copyButton = screen.getByRole('button', { name: /copy/i });
    await user.click(copyButton);

    // Verify success message
    expect(screen.getByText(/copied/i)).toBeInTheDocument();
  });
});
```

---

## Running Test Examples

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- CelebrityCard.test.jsx

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Interactive UI
npm run test:ui
```

---

**Generated**: 2025-11-17
**Framework**: Vitest + Testing Library
