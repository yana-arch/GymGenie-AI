export class CameraService {
  /**
   * Check if camera access is available on the device
   */
  async isCameraAvailable(): Promise<boolean> {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if the current device is mobile
   */
  isMobileDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  }

  /**
   * Start video stream with optimal constraints and error recovery
   */
  async startVideoStream(): Promise<MediaStream> {
    const constraints = this.getOptimalVideoConstraints();
    
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      // Graceful degradation: Try fallback constraints
      console.warn('Primary camera constraints failed, trying fallback:', error);
      
      try {
        const fallbackConstraints = {
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user'
          },
          audio: false
        };
        return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      } catch (fallbackError) {
        // Final attempt: Minimal constraints
        console.warn('Fallback camera constraints failed, trying minimal:', fallbackError);
        
        try {
          const minimalConstraints = {
            video: true,
            audio: false
          };
          return await navigator.mediaDevices.getUserMedia(minimalConstraints);
        } catch (minimalError) {
          throw new Error(`Camera access failed: ${minimalError.message}`);
        }
      }
    }
  }

  /**
   * Stop video stream and release camera resources
   */
  async stopVideoStream(stream: MediaStream): Promise<void> {
    stream.getTracks().forEach(track => track.stop());
  }

  /**
   * Get optimal video constraints based on device capabilities
   */
  getOptimalVideoConstraints(): MediaStreamConstraints {
    const isMobile = this.isMobileDevice();
    
    return {
      video: {
        facingMode: 'user',
        width: { ideal: isMobile ? 480 : 640 },
        height: { ideal: isMobile ? 360 : 480 }
      },
      audio: false
    };
  }
}