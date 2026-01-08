import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '../services/AnalyticsService';
import { WorkoutHistoryEntry } from '@/types';
import { EnhancedWorkoutSession, SessionState } from '@/types/enhanced';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  const mockHistory: WorkoutHistoryEntry[] = [
    {
      id: '1',
      completedAt: new Date('2026-01-01T10:00:00Z').toISOString(),
      planTitle: 'Strength Plan',
      weekNumber: 1,
      dayName: 'Monday',
      dayTitle: 'Chest Day',
      exercisesCompleted: 3,
      totalExercises: 3,
      durationMinutes: 45,
      rpe: 7,
      syncStatus: 'synced'
    },
    {
      id: '2',
      completedAt: new Date('2026-01-03T10:00:00Z').toISOString(),
      planTitle: 'Strength Plan',
      weekNumber: 1,
      dayName: 'Wednesday',
      dayTitle: 'Back Day',
      exercisesCompleted: 3,
      totalExercises: 3,
      durationMinutes: 50,
      rpe: 8,
      syncStatus: 'synced'
    },
    {
      id: '3',
      completedAt: new Date('2026-01-08T10:00:00Z').toISOString(),
      planTitle: 'Strength Plan',
      weekNumber: 2,
      dayName: 'Monday',
      dayTitle: 'Chest Day',
      exercisesCompleted: 4,
      totalExercises: 4,
      durationMinutes: 55,
      rpe: 9,
      syncStatus: 'synced'
    }
  ];

  const mockSessions: Record<string, EnhancedWorkoutSession> = {
    '1-1': {
      id: 's1',
      weekId: '1',
      dayId: '1',
      state: SessionState.LOGGED,
      startTime: new Date('2026-01-01T10:00:00Z').getTime(),
      completedTime: new Date('2026-01-01T10:45:00Z').getTime(),
      loggedTime: new Date('2026-01-01T10:50:00Z').getTime(),
      exerciseTimestamps: {},
      isReadOnly: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timestamp: Date.now(),
      environment: { location: 'gym', equipment: [] },
      totalExercises: 3,
      completedExercises: 3,
      estimatedDuration: 45,
      exerciseData: {
        'bench-press': {
          exerciseId: 'bench-press',
          isCompleted: true,
          sets: [
            { id: 'set1', setNumber: 1, weight: 60, reps: 10, completedAt: Date.now(), targetRestTime: 60, actualRestTime: 60, duration: 30000 },
            { id: 'set2', setNumber: 2, weight: 60, reps: 10, completedAt: Date.now(), targetRestTime: 60, actualRestTime: 60, duration: 30000 }
          ]
        }
      }
    },
    '2-1': {
      id: 's3',
      weekId: '2',
      dayId: '1',
      state: SessionState.LOGGED,
      startTime: new Date('2026-01-08T10:00:00Z').getTime(),
      completedTime: new Date('2026-01-08T10:55:00Z').getTime(),
      loggedTime: new Date('2026-01-08T11:00:00Z').getTime(),
      exerciseTimestamps: {},
      isReadOnly: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timestamp: Date.now(),
      environment: { location: 'gym', equipment: [] },
      totalExercises: 4,
      completedExercises: 4,
      estimatedDuration: 55,
      exerciseData: {
        'bench-press': {
          exerciseId: 'bench-press',
          isCompleted: true,
          sets: [
            { id: 'set1', setNumber: 1, weight: 65, reps: 10, completedAt: Date.now(), targetRestTime: 60, actualRestTime: 60, duration: 30000 },
            { id: 'set2', setNumber: 2, weight: 65, reps: 8, completedAt: Date.now(), targetRestTime: 60, actualRestTime: 60, duration: 30000 }
          ]
        }
      }
    }
  };

  beforeEach(() => {
    analyticsService = AnalyticsService.getInstance();
  });

  it('should be a singleton @smoke', () => {
    const instance1 = AnalyticsService.getInstance();
    const instance2 = AnalyticsService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should calculate consistency correctly @p0', () => {
    const consistency = analyticsService.calculateConsistency(mockHistory, 'Week');
    expect(consistency).toBeDefined();
    expect(consistency.length).toBeGreaterThan(0);
  });

  it('should calculate strength gains correctly @p0', () => {
    const strengthGains = analyticsService.calculateStrengthGains(mockSessions, 'bench-press', 'All Time');
    expect(strengthGains).toBeDefined();
    // Week 1: 60kg, Week 2: 65kg -> Gain: 5kg or 8.3%
    expect(strengthGains.maxWeightTrend[0].value).toBe(60);
    expect(strengthGains.maxWeightTrend[1].value).toBe(65);
  });

  it('should calculate endurance metrics correctly @p0', () => {
    const endurance = analyticsService.calculateEndurance(mockHistory);
    expect(endurance.totalDuration).toBe(150);
    expect(endurance.averageDuration).toBe(50);
  });

  it('should filter data by time period @p1', () => {
    const filteredWeek = analyticsService.filterHistoryByPeriod(mockHistory, 'Week');
    expect(filteredWeek).toBeDefined();
  });

  it('should handle large data volumes efficiently @p2', () => {
    const largeHistory: WorkoutHistoryEntry[] = [];
    const startDate = new Date('2025-01-01');
    for (let i = 0; i < 200; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      largeHistory.push({
        id: `h-${i}`,
        completedAt: date.toISOString(),
        planTitle: 'Test Plan',
        weekNumber: Math.floor(i / 7) + 1,
        dayName: 'Monday',
        dayTitle: 'Test Day',
        exercisesCompleted: 5,
        totalExercises: 5,
        durationMinutes: 60,
        syncStatus: 'synced'
      });
    }

    const start = performance.now();
    const consistency = analyticsService.calculateConsistency(largeHistory, 'All Time');
    const endurance = analyticsService.calculateEndurance(largeHistory);
    const end = performance.now();

    expect(consistency.length).toBe(200);
    expect(endurance.totalDuration).toBe(200 * 60);
    expect(end - start).toBeLessThan(50); // Should be very fast (< 50ms)
  });

  it('should calculate trend trajectory correctly @p0', () => {
    const data = [
      { date: '2026-01-01', value: 100 },
      { date: '2026-01-02', value: 110 },
      { date: '2026-01-03', value: 120 }
    ];
    const trajectory = analyticsService.calculateTrendTrajectory(data);
    expect(trajectory.trajectory).toBe('upward');
    expect(trajectory.changePercentage).toBe(20);
  });

  it('should calculate moving average correctly @p1', () => {
    const data = [
      { value: 10 },
      { value: 20 },
      { value: 30 },
      { value: 40 }
    ];
    const ma = analyticsService.calculateMovingAverage(data, 2);
    expect(ma).toEqual([10, 15, 25, 35]);
  });

  it('should detect plateaus correctly @p0', () => {
    const sessions: Record<string, EnhancedWorkoutSession> = {};
    const baseDate = new Date('2026-01-01').getTime();
    
    // 4 sessions with same weight
    for (let i = 0; i < 4; i++) {
      const date = baseDate + i * 7 * 24 * 60 * 60 * 1000;
      sessions[`s${i}`] = {
        ...mockSessions['1-1'],
        id: `s${i}`,
        startTime: date,
        completedTime: date + 3600000,
        exerciseData: {
          'bench-press': {
            exerciseId: 'bench-press',
            isCompleted: true,
            sets: [{ 
              id: `set${i}`, 
              setNumber: 1, 
              weight: 100, 
              reps: 10, 
              completedAt: date,
              targetRestTime: 60,
              actualRestTime: 60,
              duration: 30000
            }]
          }
        }
      };
    }
    
    const plateau = analyticsService.detectPlateaus(sessions, 'bench-press');
    expect(plateau.isPlateau).toBe(true);
    expect(plateau.weeksStalled).toBe(3);
  });

  it('should group by muscle group correctly @p1', () => {
    const sessions: Record<string, EnhancedWorkoutSession> = {
      's1': {
        ...mockSessions['1-1'],
        exerciseData: {
          'bench-press': {
            exerciseId: 'bench-press',
            isCompleted: true,
            sets: [{ 
              id: 'set1', 
              setNumber: 1, 
              weight: 100, 
              reps: 10, 
              completedAt: Date.now(),
              targetRestTime: 60,
              actualRestTime: 60,
              duration: 30000
            }]
          }
        }
      }
    };
    const db = {
      'bench-press': { bodyPart: ['chest'] }
    };
    const groups = analyticsService.groupByMuscleGroup(sessions, db);
    expect(groups['chest']).toBeDefined();
    expect(groups['chest'].volume).toBe(1000);
  });
});
