import { config } from '../config/environment';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class AnalyticsService {
  private initialized = false;

  public initialize(): void {
    if (this.initialized || !config.features.analytics) return;

    // Initialize Google Analytics
    if (config.analytics.googleAnalyticsId) {
      this.initializeGA();
    }

    // Initialize Mixpanel
    if (config.analytics.mixpanelToken) {
      this.initializeMixpanel();
    }

    this.initialized = true;
  }

  private initializeGA(): void {
    // In a real app, load Google Analytics script
    console.log('Google Analytics initialized');
  }

  private initializeMixpanel(): void {
    // In a real app, load Mixpanel script
    console.log('Mixpanel initialized');
  }

  public track(event: AnalyticsEvent): void {
    if (!this.initialized || !config.features.analytics) return;

    console.log('Analytics Event:', event);

    // Track with Google Analytics
    if (config.analytics.googleAnalyticsId && typeof gtag !== 'undefined') {
      gtag('event', event.name, event.properties);
    }

    // Track with Mixpanel
    if (config.analytics.mixpanelToken && typeof mixpanel !== 'undefined') {
      mixpanel.track(event.name, event.properties);
    }
  }

  public trackPageView(path: string): void {
    this.track({
      name: 'page_view',
      properties: { path }
    });
  }

  public trackCarbonCalculation(emissions: number): void {
    this.track({
      name: 'carbon_calculation',
      properties: { emissions }
    });
  }

  public trackCreditPurchase(creditId: string, amount: number): void {
    this.track({
      name: 'credit_purchase',
      properties: { creditId, amount }
    });
  }

  public trackWalletConnection(address: string): void {
    this.track({
      name: 'wallet_connected',
      properties: { address: address.slice(0, 6) + '...' + address.slice(-4) }
    });
  }
}

export const analyticsService = new AnalyticsService();