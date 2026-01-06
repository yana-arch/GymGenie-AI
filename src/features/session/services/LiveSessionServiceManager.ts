/**
 * Live Session Service Manager
 * Manages services that shouldn't be stored in Redux state
 * to maintain serializability and avoid performance issues
 */

import { InjuryFilterService } from '@/features/injury-aware/services/InjuryFilterService';

class LiveSessionServiceManager {
  private static instance: LiveSessionServiceManager;
  private injuryFilterService: InjuryFilterService;

  private constructor() {
    this.injuryFilterService = new InjuryFilterService();
  }

  static getInstance(): LiveSessionServiceManager {
    if (!LiveSessionServiceManager.instance) {
      LiveSessionServiceManager.instance = new LiveSessionServiceManager();
    }
    return LiveSessionServiceManager.instance;
  }

  getInjuryFilterService(): InjuryFilterService {
    return this.injuryFilterService;
  }

  // Clean up resources when needed
  destroy(): void {
    // Clean up any resources if needed
    console.log('LiveSessionServiceManager destroyed');
  }
}

export default LiveSessionServiceManager;