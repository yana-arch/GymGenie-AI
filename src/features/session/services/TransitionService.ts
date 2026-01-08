import { store } from '@/store';
import { 
  setTransitionStatus, 
  setNextExercise, 
  updateRestRemaining 
} from '../store/liveSessionSlice';
import { AudioCoachingService } from '@/features/form-correction/services/AudioCoachingService';
import { FormAnalysisService } from '@/features/form-correction/services/FormAnalysisService';

export class TransitionService {
  private static instance: TransitionService;
  private restTimer: ReturnType<typeof setInterval> | null = null;
  private remainingSeconds: number = 0;
  private audioService: AudioCoachingService;
  private formAnalysisService: FormAnalysisService;

  private constructor() {
    this.audioService = AudioCoachingService.getInstance();
    this.formAnalysisService = FormAnalysisService.getInstance();
  }

  public static getInstance(): TransitionService {
    if (!TransitionService.instance) {
      TransitionService.instance = new TransitionService();
    }
    return TransitionService.instance;
  }

  /**
   * Starts a rest period before the next exercise
   */
  public startRest(durationSeconds: number, nextExerciseName: string): void {
    if (durationSeconds <= 0) {
      this.completeTransition();
      return;
    }
    this.stopTimers();
    
    this.remainingSeconds = durationSeconds;
    store.dispatch(setTransitionStatus('resting'));
    store.dispatch(setNextExercise(nextExerciseName));
    store.dispatch(updateRestRemaining(this.remainingSeconds));

    // Integrate with AudioCoachingService
    this.audioService.announceNextExercise(nextExerciseName);

    // Warm up FormAnalysisService for the next exercise
    this.formAnalysisService.prepareForExercise(nextExerciseName);

    this.restTimer = setInterval(() => {
      this.remainingSeconds -= 1;
      store.dispatch(updateRestRemaining(this.remainingSeconds));

      if (this.remainingSeconds <= 0) {
        this.completeTransition();
      }
    }, 1000);
  }

  /**
   * Skips the current rest period and starts the exercise
   */
  public skipRest(): void {
    this.completeTransition();
  }

  /**
   * Extends the current rest period
   */
  public extendRest(additionalSeconds: number): void {
    this.remainingSeconds += additionalSeconds;
    store.dispatch(updateRestRemaining(this.remainingSeconds));
  }

  /**
   * Completes the transition and sets status to active
   */
  private completeTransition(): void {
    this.stopTimers();
    store.dispatch(setTransitionStatus('active'));
    // We keep nextExercise until the next set starts or it's cleared by the session manager
  }

  private stopTimers(): void {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
  }
}
