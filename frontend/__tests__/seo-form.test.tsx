import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SeoForm } from '@/components/seo-form';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  initiateScan: jest.fn(),
  initiateComparison: jest.fn(),
}));

const mockInitiateScan = require('@/lib/auth').initiateScan;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock AuthContext
jest.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', credits: 10 },
    isLoading: false,
    checkAuth: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock sonner to append toast text to document.body so screen queries can find it
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn((message: any) => {
      const el = document.createElement('div');
      el.textContent = String(message);
      document.body.appendChild(el);
    }),
    warning: jest.fn((message: any) => {
      const el = document.createElement('div');
      el.textContent = String(message);
      document.body.appendChild(el);
    }),
    success: jest.fn((message: any) => {
      const el = document.createElement('div');
      el.textContent = String(message);
      document.body.appendChild(el);
    }),
  },
}));

// Mock React Query hooks
jest.mock('@/lib/hooks/useInitiateScan', () => ({
  useInitiateScan: jest.fn(),
  MIN_SCAN_INTERVAL: 30000,
}));

jest.mock('@/lib/hooks/useInitiateComparison', () => ({
  useInitiateComparison: jest.fn(),
}));

const mockUseInitiateScan = require('@/lib/hooks/useInitiateScan').useInitiateScan;
const mockUseInitiateComparison = require('@/lib/hooks/useInitiateComparison').useInitiateComparison;

describe('SeoForm', () => {
  const mockOnScanInitiated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock return values
    mockUseInitiateScan.mockReturnValue({
      mutate: jest.fn(async (url: string, options?: { onSuccess?: (data: any) => void; onError?: (err: any) => void }) => {
        try {
          const data = await mockInitiateScan(url);
          if (options?.onSuccess) options.onSuccess(data);
        } catch (err) {
          if (options?.onError) options.onError(err);
        }
      }),
      isPending: false,
      error: null,
      status: 'idle',
      failureCount: 0,
    });

    mockUseInitiateComparison.mockReturnValue({
      mutate: jest.fn(async ({ url, competitorUrl }: { url: string; competitorUrl: string }, options?: { onSuccess?: (data: any) => void; onError?: (err: any) => void }) => {
        try {
          const data = await require('@/lib/auth').initiateComparison(url, competitorUrl);
          if (options?.onSuccess) options.onSuccess(data);
        } catch (err) {
          if (options?.onError) options.onError(err);
        }
      }),
      isPending: false,
      error: null,
    });
  });

  afterEach(() => {
    // Clear any appended toast elements from document.body
    document.body.innerHTML = '';
  });

  test('renders form elements', () => {
    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  test('shows error for empty URL', async () => {
    const user = userEvent.setup();
    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    const button = screen.getByRole('button', { name: /analyze/i });
    await user.click(button);

    expect(screen.getByText(/url is required/i)).toBeInTheDocument();
  });

  test('shows error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    const input = screen.getByPlaceholderText(/example.com/i);
    const button = screen.getByRole('button', { name: /analyze/i });

    await user.type(input, 'invalid-url');
    await user.click(button);

    expect(screen.getByText(/please enter a valid domain name/i)).toBeInTheDocument();
  });

  test('submits valid URL', async () => {
    const user = userEvent.setup();
    const mockScanData = { id: '123', createdAt: '2024-01-01T00:00:00Z', url: 'https://example.com', userId: 'user123' };
    mockInitiateScan.mockResolvedValue(mockScanData);

    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    const input = screen.getByPlaceholderText(/example.com/i);
    const button = screen.getByRole('button', { name: /analyze/i });

    await user.type(input, 'example.com');
    await user.click(button);

    await waitFor(() => {
      expect(mockInitiateScan).toHaveBeenCalledWith('https://example.com');
      expect(mockOnScanInitiated).toHaveBeenCalledWith(mockScanData);
    });
  });

  test('shows loading state during submission', async () => {
    mockUseInitiateScan.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
      error: null,
      status: 'pending',
      failureCount: 0,
    });

    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    const button = screen.getByRole('button', { name: /analyzing/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/analyzing.../i)).toBeInTheDocument();
  });
});
