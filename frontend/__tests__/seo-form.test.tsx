import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeoForm } from '@/components/seo-form';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  initiateScan: jest.fn(),
}));

const mockInitiateScan = require('@/lib/auth').initiateScan;

describe('SeoForm', () => {
  const mockOnScanInitiated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form elements', () => {
    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze seo/i })).toBeInTheDocument();
  });

  test('shows error for empty URL', async () => {
    const user = userEvent.setup();
    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    const button = screen.getByRole('button', { name: /analyze seo/i });
    await user.click(button);

    expect(screen.getByText(/url is required/i)).toBeInTheDocument();
  });

  test('shows error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    const input = screen.getByPlaceholderText(/example.com/i);
    const button = screen.getByRole('button', { name: /analyze seo/i });

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
    const button = screen.getByRole('button', { name: /analyze seo/i });

    await user.type(input, 'example.com');
    await user.click(button);

    await waitFor(() => {
      expect(mockInitiateScan).toHaveBeenCalledWith('https://example.com');
      expect(mockOnScanInitiated).toHaveBeenCalledWith(mockScanData);
    });
  });

  test('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockInitiateScan.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<SeoForm onScanInitiated={mockOnScanInitiated} />);

    const input = screen.getByPlaceholderText(/example.com/i);
    const button = screen.getByRole('button', { name: /analyze seo/i });

    await user.type(input, 'example.com');
    await user.click(button);

    expect(screen.getByText(/analyzing.../i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
