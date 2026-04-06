// src/lib/analytics.ts
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
}

type GTagWindow = Window & { gtag?: (command: string, event: string, params?: Record<string, unknown>) => void };

class Analytics {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  track(event: string, properties?: Record<string, unknown>, userId?: string) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      userId,
    };

    // In production, send to your analytics service
    // Example: Google Analytics, Mixpanel, Amplitude, etc.
    console.log('Analytics Event:', analyticsEvent);

    // Example implementation for Google Analytics 4
    if (typeof window !== 'undefined' && (window as GTagWindow).gtag) {
      (window as GTagWindow).gtag!('event', event, {
        ...properties,
        user_id: userId,
      });
    }
  }

  // Track page views
  trackPageView(page: string, userId?: string) {
    this.track('page_view', { page }, userId);
  }

  // Track user registration
  trackRegistration(userId: string, method: string = 'email') {
    this.track('user_registered', { method }, userId);
  }

  // Track flashcard interactions
  trackFlashcardInteraction(
    action: 'view' | 'flip' | 'next' | 'previous',
    cardId: string,
    difficulty: string,
    userId?: string
  ) {
    this.track('flashcard_interaction', {
      action,
      card_id: cardId,
      difficulty,
    }, userId);
  }

  // Track study session
  trackStudySession(
    duration: number,
    cardsStudied: number,
    difficulty: string,
    userId?: string
  ) {
    this.track('study_session', {
      duration_seconds: duration,
      cards_studied: cardsStudied,
      difficulty,
    }, userId);
  }

  // Track XP gained
  trackXPGained(amount: number, source: string, userId?: string) {
    this.track('xp_gained', {
      amount,
      source,
    }, userId);
  }

  // Track errors
  trackError(error: Error, context?: string, userId?: string) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
    }, userId);
  }
}

export const analytics = new Analytics(); 