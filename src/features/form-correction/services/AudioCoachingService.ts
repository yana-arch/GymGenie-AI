import { FormAnalysis, FormIssue } from './FormAnalysisService';

export interface AudioFeedbackConfig {
  enabled: boolean;
  volume: number; // 0-1
  speechRate: number; // 0.5-2
  voiceGender: 'male' | 'female' | 'neutral';
  feedbackFrequency: number; // milliseconds between feedback
}

export interface AudioQueue {
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

export class AudioCoachingService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private config: AudioFeedbackConfig;
  private feedbackQueue: AudioQueue[] = [];
  private isSpeaking = false;
  private lastFeedbackTime = 0;
  private privateVoiceUtterance: SpeechSynthesisUtterance | null = null;

  constructor(config: Partial<AudioFeedbackConfig> = {}) {
    this.config = {
      enabled: true,
      volume: 0.8,
      speechRate: 1.2,
      voiceGender: 'neutral',
      feedbackFrequency: 3000, // 3 seconds minimum between feedback
      ...config
    };

    this.initializeSpeechSynthesis();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeSpeechSynthesis(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      
      // Reload voices when they change (browser specific) - FIXED: Add safety check
      if (this.synthesis && 'onvoiceschanged' in this.synthesis) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      console.warn('Speech synthesis not supported in this browser');
      this.config.enabled = false;
    }
  }

  /**
   * Load available voices and select appropriate voice
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    this.voices = this.synthesis.getVoices();
    this.selectOptimalVoice();
  }

  /**
   * Select the best voice based on gender and language preferences
   */
  private selectOptimalVoice(): SpeechSynthesisVoice | null {
    const preferredLanguages = ['en-US', 'en-GB', 'en'];
    
    // Try to find voice matching gender and language preferences
    for (const lang of preferredLanguages) {
      const genderVoices = this.voices.filter(voice => 
        voice.lang.startsWith(lang) && 
        (this.config.voiceGender === 'neutral' || 
         voice.name.toLowerCase().includes(this.config.voiceGender))
      );

      if (genderVoices.length > 0) {
        // Sort by local service (prefer local voices)
        const localVoice = genderVoices.find(voice => (voice as any).local);
        return localVoice || genderVoices[0];
      }
    }

    // Fallback to first available voice
    return this.voices[0] || null;
  }

  /**
   * Provide contextual audio feedback based on form analysis
   */
  provideFeedback(formAnalysis: FormAnalysis): void {
    if (!this.config.enabled || !this.synthesis) {
      return;
    }

    // Check if enough time has passed since last feedback
    const now = Date.now();
    if (now - this.lastFeedbackTime < this.config.feedbackFrequency) {
      return;
    }

    const feedback = this.generateFeedback(formAnalysis);
    
    if (feedback) {
      this.addToQueue(feedback.message, feedback.priority);
      this.lastFeedbackTime = now;
    }
  }

  /**
   * Provide audio announcement for workout adaptations
   */
  announceAdaptation(message: string): void {
    if (!this.config.enabled || !this.synthesis) {
      return;
    }

    this.addToQueue(message, 'high');
  }

  /**
   * Generate contextual feedback message based on form analysis
   */
  private generateFeedback(formAnalysis: FormAnalysis): { message: string; priority: 'high' | 'medium' | 'low' } | null {
    if (formAnalysis.isValid && formAnalysis.score >= 90) {
      return null; // No feedback needed for excellent form
    }

    // Prioritize high severity issues
    const highSeverityIssues = formAnalysis.issues.filter(issue => issue.severity === 'high');
    const mediumSeverityIssues = formAnalysis.issues.filter(issue => issue.severity === 'medium');
    const lowSeverityIssues = formAnalysis.issues.filter(issue => issue.severity === 'low');

    if (highSeverityIssues.length > 0) {
      return {
        message: this.generateHighPriorityFeedback(highSeverityIssues[0]),
        priority: 'high'
      };
    }

    if (mediumSeverityIssues.length > 0) {
      return {
        message: this.generateMediumPriorityFeedback(mediumSeverityIssues[0]),
        priority: 'medium'
      };
    }

    if (lowSeverityIssues.length > 0) {
      return {
        message: this.generateLowPriorityFeedback(lowSeverityIssues[0]),
        priority: 'low'
      };
    }

    // General encouragement for decent form
    if (formAnalysis.score >= 70) {
      return {
        message: 'Good form. Keep your focus on technique.',
        priority: 'low'
      };
    }

    return null;
  }

  /**
   * Generate high priority feedback messages
   */
  private generateHighPriorityFeedback(issue: FormIssue): string {
    const feedbackTemplates: { [key: string]: string[] } = {
      'Knee': [
        'Stop! Lower yourself deeper into the squat.',
        'Careful with your knee position. Keep knees tracking over feet.',
        'Adjust your squat depth immediately for proper form.'
      ],
      'Elbow': [
        'Danger! Don\'t lock your elbows at the top.',
        'Lower your chest more for proper push-up form.',
        'Reduce your range of motion to protect your shoulders.'
      ],
      'Spine': [
        'Stop! Straighten your back immediately.',
        'Your form is unsafe. Engage your core.',
        'Protect your spine - keep it neutral throughout.'
      ],
      'Hip': [
        'Hip position needs immediate correction.',
        'Level your hips with your shoulders.',
        'Stabilize your hips before continuing.'
      ]
    };

    const templates = feedbackTemplates[issue.bodyPart] || [
      'Stop! Form breakdown detected. Make an adjustment.',
      'Critical form issue. Focus on your technique.',
      'Safety concern. Correct your form before continuing.'
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate medium priority feedback messages
   */
  private generateMediumPriorityFeedback(issue: FormIssue): string {
    const feedbackTemplates: { [key: string]: string[] } = {
      'Knee': [
        'Try to go a bit deeper in your squat.',
        'Keep your knees aligned with your feet.',
        'Focus on controlled movement through your knees.'
      ],
      'Elbow': [
        'Lower yourself a bit more for better form.',
        'Maintain proper elbow angle throughout.',
        'Keep your elbows at about 90 degrees.'
      ],
      'Spine': [
        'Keep your back straighter.',
        'Engage your core for better stability.',
        'Focus on maintaining neutral spine position.'
      ],
      'Hip': [
        'Level your hips slightly.',
        'Maintain better hip alignment.',
        'Stabilize your pelvic position.'
      ]
    };

    const templates = feedbackTemplates[issue.bodyPart] || [
      'Focus on your form technique.',
      'Make a small adjustment for better form.',
      'Concentrate on proper movement pattern.'
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate low priority feedback messages
   */
  private generateLowPriorityFeedback(issue: FormIssue): string {
    const feedbackTemplates: { [key: string]: string[] } = {
      'Knee': [
        'Slightly adjust your knee tracking.',
        'Fine tune your squat depth.',
        'Minor knee adjustment needed.'
      ],
      'Elbow': [
        'Small adjustment to your push-up form.',
        'Fine tune your elbow position.',
        'Minor form improvement possible.'
      ],
      'Spine': [
        'Slightly straighten your back.',
        'Better core engagement needed.',
        'Minor spine adjustment.'
      ],
      'Hip': [
        'Small hip position tweak.',
        'Fine tune your hip alignment.',
        'Minor hip stabilization needed.'
      ]
    };

    const templates = feedbackTemplates[issue.bodyPart] || [
      'Small form adjustment needed.',
      'Fine tune your movement.',
      'Minor improvement possible.'
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Add feedback to queue for processing
   */
  private addToQueue(message: string, priority: 'high' | 'medium' | 'low'): void {
    const feedback: AudioQueue = {
      message,
      priority,
      timestamp: Date.now()
    };

    // Insert based on priority (high priority first)
    if (priority === 'high') {
      this.feedbackQueue.unshift(feedback);
    } else {
      // Check if there's already a similar message in queue
      const hasSimilarMessage = this.feedbackQueue.some(
        item => item.priority === priority && item.message.includes(feedback.message.substring(0, 10))
      );

      if (!hasSimilarMessage) {
        this.feedbackQueue.push(feedback);
      }
    }

    this.processQueue();
  }

  /**
   * Process feedback queue
   */
  private processQueue(): void {
    if (this.isSpeaking || this.feedbackQueue.length === 0 || !this.synthesis) {
      return;
    }

    const feedback = this.feedbackQueue.shift();
    if (feedback) {
      this.speak(feedback.message);
    }
  }

  /**
   * Convert text to speech
   */
  private speak(text: string): void {
    if (!this.synthesis) return;

    // Create utterance
    this.privateVoiceUtterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance properties
    this.privateVoiceUtterance.volume = this.config.volume;
    this.privateVoiceUtterance.rate = this.config.speechRate;
    this.privateVoiceUtterance.pitch = 1.0;

    // Select optimal voice
    const voice = this.selectOptimalVoice();
    if (voice) {
      this.privateVoiceUtterance.voice = voice;
    }

    // Set up event handlers
    this.privateVoiceUtterance.onend = () => {
      this.isSpeaking = false;
      this.processQueue(); // Process next in queue
    };

    this.privateVoiceUtterance.onerror = () => {
      this.isSpeaking = false;
      console.error('Speech synthesis error');
      this.processQueue();
    };

    // Start speaking
    this.synthesis.speak(this.privateVoiceUtterance);
    this.isSpeaking = true;
  }

  /**
   * Check if service is currently speaking
   */
  isActive(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get feedback queue status
   */
  getQueueStatus(): { length: number; isProcessing: boolean } {
    return {
      length: this.feedbackQueue.length,
      isProcessing: this.isSpeaking
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioFeedbackConfig {
    return { ...this.config };
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return [...this.voices];
  }

  /**
   * Test voice with sample text
   */
  testVoice(voice: SpeechSynthesisVoice, text: string): void {
    if (!this.synthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.volume = this.config.volume;
    utterance.rate = this.config.speechRate;
    utterance.pitch = 1.0;

    this.synthesis.speak(utterance);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AudioFeedbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if enabling/disabling
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled && !this.synthesis) {
        this.initializeSpeechSynthesis();
      } else if (!newConfig.enabled && this.synthesis) {
        this.stop();
      }
    }
  }

  /**
   * Stop speaking and clear queue
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.feedbackQueue = [];
    this.privateVoiceUtterance = null;
  }

  /**
   * Dispose of service
   */
  dispose(): void {
    this.stop();
    this.synthesis = null;
    this.voices = [];
  }
}