// services/OfflineRequestQueue.ts

interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
}

export class OfflineRequestQueue {
  private queue: QueuedRequest[] = [];
  public isOnline: boolean = navigator.onLine;

  constructor(manualTrigger = false) {
    if (!manualTrigger) {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        this.loadQueueFromStorage();
    }
  }

  private handleOnline() {
    this.isOnline = true;
    this.processQueue();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  public async queueRequest(url: string, options: RequestInit): Promise<void> {
    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      options,
      timestamp: Date.now(),
    };
    this.queue.push(request);
    await this.saveQueueToStorage();
  }

  public async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return;
    }

    const requestsToProcess = [...this.queue];
    this.queue = [];
    await this.saveQueueToStorage();

    for (const request of requestsToProcess) {
      try {
        await fetch(request.url, request.options);
      } catch (error) {
        // If the request fails again, put it back in the queue.
        this.queue.unshift(request);
        await this.saveQueueToStorage();
        // Stop processing if we go offline again
        if (!navigator.onLine) {
            this.handleOffline();
            break;
        }
      }
    }
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue to storage', error);
    }
  }

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const storedQueue = localStorage.getItem('offlineQueue');
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Failed to load offline queue from storage', error);
    }
  }
}
