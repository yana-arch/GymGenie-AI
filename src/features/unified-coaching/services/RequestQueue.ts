/**
 * Request Queue Service
 * Manages concurrent request processing with queuing and throttling
 */

export interface QueuedRequest<T> {
  id: string;
  request: T;
  priority: number;
  timestamp: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

export interface QueueConfig {
  maxSize: number;
  maxConcurrent: number;
  timeout: number;
  priorityQueue?: boolean;
}

export interface QueueStats {
  totalQueued: number;
  processing: number;
  completed: number;
  failed: number;
  averageWaitTime: number;
}

export class RequestQueue {
  private config: QueueConfig = {
    maxSize: 100,
    maxConcurrent: 5,
    timeout: 30000,
    priorityQueue: true
  };

  private queue: QueuedRequest<any>[] = [];
  private processing: Set<string> = new Set();
  private stats: QueueStats = {
    totalQueued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    averageWaitTime: 0
  };

  private waitTimes: number[] = [];

  /**
   * Set maximum queue size
   */
  setMaxSize(size: number): void {
    this.config.maxSize = size;
  }

  /**
   * Set maximum concurrent requests
   */
  setMaxConcurrent(max: number): void {
    this.config.maxConcurrent = max;
  }

  /**
   * Enqueue request for processing
   */
  async enqueue<T>(id: string, processor: (request: T) => Promise<any>, request?: T): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.queue.length >= this.config.maxSize) {
        reject(new Error('Queue is full'));
        return;
      }

      const queuedRequest: QueuedRequest<T> = {
        id,
        request: request as T,
        priority: Date.now(), // Simple priority based on timestamp
        timestamp: Date.now(),
        resolve,
        reject
      };

      if (this.config.priorityQueue) {
        this.insertByPriority(queuedRequest);
      } else {
        this.queue.push(queuedRequest);
      }

      this.stats.totalQueued++;
      this.processQueue();
    });
  }

  /**
   * Get current queue statistics
   */
  getStats(): QueueStats {
    return {
      ...this.stats,
      processing: this.processing.size,
      averageWaitTime: this.calculateAverageWaitTime()
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    // Reject all pending requests
    this.queue.forEach(request => {
      request.reject(new Error('Queue cleared'));
    });

    this.queue = [];
    this.processing.clear();
    this.resetStats();
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0 && this.processing.size === 0;
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length + this.processing.size;
  }

  // Private methods

  private async processQueue(): Promise<void> {
    // Check if we can process more requests
    if (this.processing.size >= this.config.maxConcurrent) {
      return;
    }

    while (this.queue.length > 0 && this.processing.size < this.config.maxConcurrent) {
      const request = this.queue.shift();
      if (!request) break;

      this.processing.add(request.id);
      this.processRequest(request);
    }
  }

  private async processRequest<T>(request: QueuedRequest<T>): Promise<void> {
    const waitTime = Date.now() - request.timestamp;
    this.waitTimes.push(waitTime);

    try {
      // Set timeout for request processing
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.config.timeout);
      });

      // Simulate processing (in real implementation, call the processor)
      const result = await Promise.race([
        this.simulateProcessing(request.request),
        timeoutPromise
      ]);

      request.resolve(result);
      this.stats.completed++;
    } catch (error) {
      request.reject(error);
      this.stats.failed++;
    } finally {
      this.processing.delete(request.id);
      
      // Process next requests
      this.processQueue();
    }
  }

  private async simulateProcessing(request: any): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    return {
      processed: true,
      request,
      timestamp: Date.now()
    };
  }

  private insertByPriority<T>(request: QueuedRequest<T>): void {
    let insertIndex = this.queue.length;
    
    // Find correct position based on priority (lower number = higher priority)
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority > request.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.queue.splice(insertIndex, 0, request);
  }

  private calculateAverageWaitTime(): number {
    if (this.waitTimes.length === 0) return 0;
    
    const sum = this.waitTimes.reduce((a, b) => a + b, 0);
    return sum / this.waitTimes.length;
  }

  private resetStats(): void {
    this.stats = {
      totalQueued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      averageWaitTime: 0
    };
    this.waitTimes = [];
  }
}