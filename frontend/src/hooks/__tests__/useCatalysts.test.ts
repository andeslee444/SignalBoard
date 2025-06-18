import { renderHook, waitFor } from '@testing-library/react';
import { useCatalysts } from '../useCatalysts';
import { createClient } from '@/utils/supabase/client';

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock notification manager
jest.mock('@/components/ui/NotificationToast', () => ({
  notificationManager: {
    show: jest.fn(),
  },
}));

describe('useCatalysts', () => {
  let mockSupabase: any;
  let mockChannel: any;

  beforeEach(() => {
    // Setup mock channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            ticker: 'AAPL',
            title: 'Earnings Release',
            event_date: new Date().toISOString(),
            impact_score: 0.75,
          },
          {
            id: '2',
            ticker: 'GOOGL',
            title: 'Product Launch',
            event_date: new Date().toISOString(),
            impact_score: 0.65,
          },
        ],
        error: null,
      }),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch catalysts on mount', async () => {
    const { result } = renderHook(() => useCatalysts());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.catalysts).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have fetched catalysts
    expect(result.current.catalysts).toHaveLength(2);
    expect(result.current.catalysts[0].ticker).toBe('AAPL');
    expect(result.current.error).toBeNull();
  });

  it('should filter catalysts for next 30 days', async () => {
    renderHook(() => useCatalysts());

    await waitFor(() => {
      expect(mockSupabase.gte).toHaveBeenCalledWith(
        'event_date',
        expect.any(String)
      );
      expect(mockSupabase.lte).toHaveBeenCalledWith(
        'event_date',
        expect.any(String)
      );
    });
  });

  it('should handle fetch errors', async () => {
    mockSupabase.order.mockResolvedValue({
      data: null,
      error: new Error('Failed to fetch'),
    });

    const { result } = renderHook(() => useCatalysts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.catalysts).toEqual([]);
  });

  it('should set up real-time subscription', () => {
    renderHook(() => useCatalysts());

    expect(mockSupabase.channel).toHaveBeenCalledWith('catalysts-changes');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'catalysts',
      }),
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should clean up subscription on unmount', () => {
    const { unmount } = renderHook(() => useCatalysts());

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('should handle real-time INSERT events', async () => {
    const { result } = renderHook(() => useCatalysts());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get the subscription callback
    const subscriptionCallback = mockChannel.on.mock.calls[0][2];

    // Simulate INSERT event
    const newCatalyst = {
      id: '3',
      ticker: 'MSFT',
      title: 'New Product',
      event_date: new Date().toISOString(),
      impact_score: 0.8,
    };

    subscriptionCallback({
      eventType: 'INSERT',
      new: newCatalyst,
    });

    // Should add new catalyst
    expect(result.current.catalysts).toHaveLength(3);
    expect(result.current.catalysts[2]).toEqual(newCatalyst);
  });
});