import { Network, ConnectionStatus } from '@capacitor/network';

export type ServiceStatus = 'available' | 'degraded' | 'offline';
export type DegradationReason = 'network' | 'api' | null;

export class HealthService {
  private static instance: HealthService;
  private online: boolean = true;
  private serviceAvailable: boolean = true;
  private degradationReason: DegradationReason = null;
  private listeners: ((status: ServiceStatus, reason: DegradationReason) => void)[] = [];
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffIntervals = [5000, 15000, 45000, 120000]; // 5s, 15s, 45s, 2m
  private currentBackoffIndex = 0;

  private constructor() {}

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  public async initialize(): Promise<void> {
    const status = await Network.getStatus();
    this.updateNetworkStatus(status);

    Network.addListener('networkStatusChange', (status) => {
      this.updateNetworkStatus(status);
    });
  }

  private updateNetworkStatus(status: ConnectionStatus) {
    this.online = status.connected;
    if (!this.online) {
      this.setServiceStatus('offline', 'network');
    } else if (this.degradationReason === 'network') {
      this.setServiceStatus('available', null);
    }
    this.notify();
  }

  public setServiceStatus(status: ServiceStatus, reason: DegradationReason) {
    this.serviceAvailable = status === 'available';
    this.degradationReason = reason;
    
    if (status === 'degraded' && reason === 'api') {
      this.startRecoveryPolling();
    } else if (status === 'available') {
      this.stopRecoveryPolling();
    }
    
    this.notify();
  }

  public destroy() {
    this.stopRecoveryPolling();
    Network.removeAllListeners();
  }

  private startRecoveryPolling() {
    if (this.recoveryTimer) return;
    
    const poll = async () => {
      // Logic to check API health
      const { geminiService } = await import('./ai/GeminiService');
      const isHealthy = await geminiService.checkHealth();
      
      if (isHealthy) {
        this.setServiceStatus('available', null);
        return; // Polling stops via setServiceStatus
      }

      const interval = this.backoffIntervals[this.currentBackoffIndex];
      this.currentBackoffIndex = Math.min(this.currentBackoffIndex + 1, this.backoffIntervals.length - 1);
      
      this.recoveryTimer = setTimeout(poll, interval);
    };

    poll();
  }

  private stopRecoveryPolling() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    this.currentBackoffIndex = 0;
  }

  public isOnline(): boolean {
    return this.online;
  }

  public isServiceAvailable(): boolean {
    return this.serviceAvailable && this.online;
  }

  public getStatus(): { status: ServiceStatus; reason: DegradationReason } {
    if (!this.online) return { status: 'offline', reason: 'network' };
    if (!this.serviceAvailable) return { status: 'degraded', reason: 'api' };
    return { status: 'available', reason: null };
  }

  public subscribe(listener: (status: ServiceStatus, reason: DegradationReason) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const { status, reason } = this.getStatus();
    this.listeners.forEach(l => l(status, reason));
  }
}

export const healthService = HealthService.getInstance();
