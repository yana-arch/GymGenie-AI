import { FeedbackDrivenPersonalizationService } from '../services/FeedbackDrivenPersonalizationService';
import { FeedbackSettings } from '../types/feedbackPersonalization.types';

class FeedbackServiceManager {
  private static instance: FeedbackServiceManager;
  private service: FeedbackDrivenPersonalizationService | null = null;

  private constructor() {}

  static getInstance(): FeedbackServiceManager {
    if (!FeedbackServiceManager.instance) {
      FeedbackServiceManager.instance = new FeedbackServiceManager();
    }
    return FeedbackServiceManager.instance;
  }

  initializeService(settings: Partial<FeedbackSettings> = {}): FeedbackDrivenPersonalizationService {
    this.service = new FeedbackDrivenPersonalizationService(settings);
    return this.service;
  }

  getService(): FeedbackDrivenPersonalizationService | null {
    return this.service;
  }

  isInitialized(): boolean {
    return this.service !== null;
  }

  destroyService(): void {
    this.service = null;
  }
}

export const feedbackServiceManager = FeedbackServiceManager.getInstance();