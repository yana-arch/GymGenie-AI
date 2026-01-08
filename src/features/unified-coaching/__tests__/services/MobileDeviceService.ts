// Mock services for testing Mobile Device Compatibility
export class MobileDeviceService {
  adaptForDevice(featureSet: any, device: any): any {
    return {
      degradedFeatures: featureSet
    };
  }

  getFallbackStrategy(deviceType: string): any {
    return {
      mode: 'minimal_functionality',
      coreFeatures: ['basic_form_detection', 'simple_feedback'],
      disabledFeatures: deviceType === 'very_low_end' ? 
        ['advanced_ai_coaching'] : 
        ['personalization']
    };
  }
}