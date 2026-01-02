import { describe, it, expect } from 'vitest';
import { 
  TypeSafeSerializer,
  DomainSerializers,
} from '@/types/serialization';
import { ValidationError, SerializationError } from '@/types/enhanced';
import { 
  ApiResponseValidator
} from '@/services/api-validation';
import { 
  Schemas
} from '@/types/schemas';
import {
  EnhancedUserProfile,
  EnhancedWorkoutSession,
  SessionState,
  FitnessGoal,
  Gender,
  FitnessLevel,
  TimeOfDay
} from '@/types/enhanced';

describe('Type Safety Enhancements', () => {
  describe('Enhanced Types', () => {
    it('should create valid enhanced user profile', () => {
      const userProfile: EnhancedUserProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: 'John Doe',
        age: 30,
        heightCm: 180,
        weightKg: 75,
        gender: Gender.Male,
        goal: FitnessGoal.MuscleGain,
        bmi: 23.1,
        tdee: 2500,
        bmr: 1800,
        preferences: {
          workoutDuration: 60,
          workoutsPerWeek: 4,
          preferredTimeOfDay: TimeOfDay.Morning,
          equipmentPreferences: ['Dumbbells', 'Barbell'],
          exerciseRestrictions: []
        },
        fitnessLevel: FitnessLevel.Intermediate,
        medicalConditions: []
      };

      expect(userProfile.name).toBe('John Doe');
      expect(userProfile.age).toBe(30);
      expect(userProfile.preferences.workoutDuration).toBe(60);
    });

    it('should create valid enhanced workout session', () => {
      const session: EnhancedWorkoutSession = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timestamp: Date.now(),
        weekId: '456e7890-e89b-12d3-a456-426614174000',
        dayId: '789e0123-e89b-12d3-a456-426614174000',
        state: SessionState.ACTIVE,
        startTime: Date.now(),
        completedTime: null,
        loggedTime: null,
        exerciseTimestamps: {},
        totalExercises: 5,
        completedExercises: 2,
        estimatedDuration: 60,
        actualDuration: null,
        isReadOnly: false,
        environment: {
          location: 'gym',
          equipment: ['Dumbbells', 'Bench']
        },
        exerciseData: {}
      };

      expect(session.state).toBe(SessionState.ACTIVE);
      expect(session.totalExercises).toBe(5);
      expect(session.environment.location).toBe('gym');
    });
  });

  describe('Zod Schema Validation', () => {
    it('should validate enhanced user profile with schema', () => {
      const validProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: 'John Doe',
        age: 30,
        heightCm: 180,
        weightKg: 75,
        gender: 'Male',
        goal: 'Muscle Gain',
        bmi: 23.1,
        tdee: 2500,
        bmr: 1800,
        preferences: {
          workoutDuration: 60,
          workoutsPerWeek: 4,
          preferredTimeOfDay: 'Morning',
          equipmentPreferences: ['Dumbbells'],
          exerciseRestrictions: []
        },
        fitnessLevel: 'Intermediate',
        medicalConditions: []
      };

      const result = Schemas.EnhancedUserProfile.parse(validProfile);
      expect(result.name).toBe('John Doe');
      expect(result.age).toBe(30);
    });

    it('should reject invalid user profile data', () => {
      const invalidProfile = {
        id: 'invalid-uuid',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: '', // Invalid: empty name
        age: 5, // Invalid: too young
        heightCm: 50, // Invalid: too short
        weightKg: 10, // Invalid: too light
        gender: 'Male',
        goal: 'Muscle Gain',
        bmi: 23.1,
        tdee: 2500,
        bmr: 1800,
        preferences: {
          workoutDuration: 60,
          workoutsPerWeek: 4,
          preferredTimeOfDay: 'Morning',
          equipmentPreferences: [],
          exerciseRestrictions: []
        },
        fitnessLevel: 'Intermediate',
        medicalConditions: []
      };

      expect(() => Schemas.EnhancedUserProfile.parse(invalidProfile)).toThrow();
    });
  });

  describe('Type-Safe Serialization', () => {
    it('should serialize and deserialize user profile correctly', () => {
      const profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: 'John Doe',
        age: 30,
        heightCm: 180,
        weightKg: 75,
        gender: 'Male',
        goal: 'Muscle Gain',
        bmi: 23.1,
        tdee: 2500,
        bmr: 1800,
        preferences: {
          workoutDuration: 60,
          workoutsPerWeek: 4,
          preferredTimeOfDay: 'Morning',
          equipmentPreferences: ['Dumbbells'],
          exerciseRestrictions: []
        },
        fitnessLevel: 'Intermediate',
        medicalConditions: []
      };

      const serialized = TypeSafeSerializer.serialize(profile, Schemas.EnhancedUserProfile);
      const deserialized = TypeSafeSerializer.deserialize(serialized, Schemas.EnhancedUserProfile);

      expect(deserialized.name).toBe(profile.name);
      expect(deserialized.age).toBe(profile.age);
      expect(deserialized.preferences.workoutDuration).toBe(profile.preferences.workoutDuration);
    });

    it('should handle serialization errors gracefully', () => {
      const invalidData = {
        name: '', // Invalid
        age: -1   // Invalid
      };

      expect(() => 
        TypeSafeSerializer.serialize(invalidData, Schemas.EnhancedUserProfile)
      ).toThrow(ValidationError);
    });

    it('should handle deserialization errors gracefully', () => {
      const invalidJson = '{"invalid": json}';

      expect(() => 
        TypeSafeSerializer.deserialize(invalidJson, Schemas.EnhancedUserProfile)
      ).toThrow(SerializationError);
    });
  });

  describe('API Response Validation', () => {
    it('should validate equipment identification response', () => {
      const validResponse = ['Dumbbells', 'Treadmill', 'Bench Press'];
      
      const result = ApiResponseValidator.validateEquipmentResponse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should reject invalid equipment response', () => {
      const invalidResponse = ['', 'Valid Equipment']; // Contains empty string
      
      expect(() => 
        ApiResponseValidator.validateEquipmentResponse(invalidResponse)
      ).toThrow(ValidationError);
    });

    it('should validate workout analysis response', () => {
      const validAnalysis = {
        score: 8,
        mood: 'Focused',
        summary: 'Great workout session with consistent effort.',
        advice: 'Try increasing weight on compound movements.',
        strengths: [],
        improvements: [],
        nextWorkoutRecommendations: []
      };

      const result = ApiResponseValidator.validateWorkoutAnalysisResponse(validAnalysis);
      expect(result.score).toBe(8);
      expect(result.mood).toBe('Focused');
    });

    it('should reject invalid workout analysis response', () => {
      const invalidAnalysis = {
        score: 15, // Invalid: too high
        mood: '',  // Invalid: empty
        summary: 'Valid summary',
        advice: 'Valid advice',
        strengths: [],
        improvements: [],
        nextWorkoutRecommendations: []
      };

      expect(() => 
        ApiResponseValidator.validateWorkoutAnalysisResponse(invalidAnalysis)
      ).toThrow(ValidationError);
    });
  });

  describe('Safe Validation Methods', () => {
    it('should return success result for valid data', () => {
      const validEquipment = ['Dumbbells', 'Barbell'];
      
      const result = ApiResponseValidator.safeValidateEquipmentResponse(validEquipment);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEquipment);
      }
    });

    it('should return error result for invalid data', () => {
      const invalidEquipment = ['']; // Empty string not allowed
      
      const result = ApiResponseValidator.safeValidateEquipmentResponse(invalidEquipment);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        if (result.success === false) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.name).toBe('ValidationError');
        }
      }
    });
  });

  describe('Domain Serializers', () => {
    it('should use domain-specific serialization methods', () => {
      const profile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: 'Jane Doe',
        age: 25,
        heightCm: 165,
        weightKg: 60,
        gender: 'Female',
        goal: 'Weight Loss',
        bmi: 22.0,
        tdee: 2000,
        bmr: 1500,
        preferences: {
          workoutDuration: 45,
          workoutsPerWeek: 5,
          preferredTimeOfDay: 'Evening',
          equipmentPreferences: ['Cardio Equipment'],
          exerciseRestrictions: []
        },
        fitnessLevel: 'Beginner',
        medicalConditions: []
      };

      const serialized = DomainSerializers.serializeUserProfile(profile as EnhancedUserProfile);
      const deserialized = DomainSerializers.deserializeUserProfile(serialized);

      expect(deserialized.name).toBe('Jane Doe');
      expect(deserialized.goal).toBe('Weight Loss');
    });

    it('should handle domain serialization errors', () => {
      const result = DomainSerializers.safeDeserializeUserProfile('invalid json');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        if (result.success === false) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.name).toBe('SerializationError');
        }
      }
    });
  });
});
