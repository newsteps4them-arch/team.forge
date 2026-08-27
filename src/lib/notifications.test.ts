import { describe, it, expect, vi } from 'vitest';
import { NotificationManager } from './notifications';

describe('NotificationManager', () => {
  it('should subscribe and unsubscribe correctly', () => {
    const manager = new NotificationManager();
    const listener = vi.fn();

    const unsubscribe = manager.subscribe(listener);
    manager.show('test message');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    manager.show('test message 2');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple subscriptions of the same listener independently', () => {
    const manager = new NotificationManager();
    const listener = vi.fn();

    const unsubscribe1 = manager.subscribe(listener);
    const unsubscribe2 = manager.subscribe(listener);

    manager.show('test message');
    expect(listener).toHaveBeenCalledTimes(2); // Called twice because it's subscribed twice

    unsubscribe1();
    manager.show('test message 2');
    // It should have been called 2 times initially + 1 time from the second subscription = 3 times total
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe2();
    manager.show('test message 3');
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('should safely handle unsubscribing during notification dispatch', () => {
    const manager = new NotificationManager();
    let listener2Called = false;

    let unsubscribe1: () => void;

    // First listener unsubscribes itself when called
    const listener1 = vi.fn(() => {
      unsubscribe1();
    });

    const listener2 = vi.fn(() => {
      listener2Called = true;
    });

    unsubscribe1 = manager.subscribe(listener1);
    const unsubscribe2 = manager.subscribe(listener2);

    manager.show('test message');

    // Both listeners should be called, even though listener1 unsubscribed during its execution
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2Called).toBe(true);

    manager.show('test message 2');
    // listener1 was unsubscribed, so it should not be called again
    expect(listener1).toHaveBeenCalledTimes(1);
    // listener2 is still subscribed, so it should be called again (total 2 times)
    expect(listener2).toHaveBeenCalledTimes(2);
  });
});
