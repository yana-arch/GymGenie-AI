import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  submitFeedback,
  FeedbackType,
  selectFeedbackError,
  selectIsProcessingFeedback,
  feedbackPersonalizationActions,
  selectValidationResult,
  selectShowValidationErrors
} from '../store/feedbackPersonalizationSlice';
import { FeedbackData } from '../types/feedbackPersonalization.types';
import { useAppDispatch, useAppSelector } from '@/store';
import { sanitizeInput, sanitizeComment, validateAndSanitizeFeedback } from '../utils/security';

interface FeedbackCollectionProps {
  workoutId: string;
  exerciseId: string;
  exerciseName?: string;
  currentWeight?: number;
  currentReps?: number;
  currentSets?: number;
  onFeedbackSubmitted?: (success: boolean) => void;
  className?: string;
}

interface FormData {
  type: FeedbackType;
  rating: number;
  comments: string;
  tags: string[];
  priority: 'high' | 'medium' | 'low';
}

export const FeedbackCollection: React.FC<FeedbackCollectionProps> = ({
  workoutId,
  exerciseId,
  exerciseName,
  currentWeight,
  currentReps,
  currentSets,
  onFeedbackSubmitted,
  className = ''
}) => {
  const dispatch = useAppDispatch();
  const feedbackError = useSelector(selectFeedbackError);
  const isProcessing = useSelector(selectIsProcessingFeedback);
  const validationResult = useSelector(selectValidationResult);
  const showValidationErrors = useSelector(selectShowValidationErrors);

  const [formData, setFormData] = useState<FormData>({
    type: FeedbackType.DIFFICULTY_RATING,
    rating: 3,
    comments: '',
    tags: [],
    priority: 'medium'
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const feedbackTypes = [
    { value: FeedbackType.DIFFICULTY_RATING, label: 'Difficulty Rating', description: 'How challenging was this exercise?' },
    { value: FeedbackType.ENERGY_LEVEL, label: 'Energy Level', description: 'How was your energy during this exercise?' },
    { value: FeedbackType.COMFORT_LEVEL, label: 'Comfort Level', description: 'How comfortable did you feel?' },
    { value: FeedbackType.PAIN_FEEDBACK, label: 'Pain Feedback', description: 'Any pain or discomfort (IMPORTANT FOR SAFETY)' },
    { value: FeedbackType.TECHNIQUE_FEEDBACK, label: 'Technique Feedback', description: 'How was your form and technique?' },
    { value: FeedbackType.MOTIVATION_LEVEL, label: 'Motivation Level', description: 'How motivated did you feel?' }
  ];

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (isSubmitted) {
      setIsSubmitted(false);
    }
  }, [isSubmitted]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, formData.tags, handleInputChange]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, handleInputChange]);

  const generateFeedbackId = useCallback(() => {
    return `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const buildFeedbackData = useCallback((): FeedbackData => {
    const feedbackData = {
      id: generateFeedbackId(),
      workoutId,
      exerciseId,
      type: formData.type,
      rating: formData.rating,
      timestamp: new Date().toISOString(),
      context: {
        currentWeight,
        currentReps,
        currentSets,
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                  new Date().getHours() < 17 ? 'afternoon' : 'evening'
      },
      comments: sanitizeComment(formData.comments) || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      priority: formData.priority
    };
    
    // Validate and sanitize the complete feedback object
    return validateAndSanitizeFeedback(feedbackData);
  }, [
    generateFeedbackId,
    workoutId,
    exerciseId,
    formData,
    currentWeight,
    currentReps,
    currentSets
  ]);

  const validateAndSubmit = useCallback(async () => {
    const feedbackData = buildFeedbackData();
    
    // Validate first
    dispatch(feedbackPersonalizationActions.validateFeedbackData(feedbackData));
    
    try {
      const result = await dispatch(submitFeedback(feedbackData)).unwrap();
      setIsSubmitted(true);
      onFeedbackSubmitted?.(true);
      
      // Reset form for next feedback
      setFormData({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 3,
        comments: '',
        tags: [],
        priority: 'medium'
      });
      setTagInput('');
      
      return result;
    } catch (error) {
      onFeedbackSubmitted?.(false);
      throw error;
    }
  }, [dispatch, buildFeedbackData, onFeedbackSubmitted]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    validateAndSubmit().catch(console.error);
  }, [validateAndSubmit]);

  const getRatingIcon = (rating: number) => {
    const icons = ['😞', '😐', '🙂', '😊', '🤩'];
    return icons[rating - 1] || '😐';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 focus:ring-red-500';
      case 'medium': return 'border-yellow-500 focus:ring-yellow-500';
      case 'low': return 'border-green-500 focus:ring-green-500';
      default: return 'border-gray-500 focus:ring-gray-500';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Exercise Feedback
        </h3>
        {exerciseName && (
          <p className="text-sm text-gray-600 mb-2">
            <strong>Exercise:</strong> {exerciseName}
          </p>
        )}
        {(currentWeight || currentReps || currentSets) && (
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {currentWeight && <span><strong>Weight:</strong> {currentWeight}kg</span>}
            {currentReps && <span><strong>Reps:</strong> {currentReps}</span>}
            {currentSets && <span><strong>Sets:</strong> {currentSets}</span>}
          </div>
        )}
      </div>

      {feedbackError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {feedbackError}
        </div>
      )}

      {showValidationErrors && validationResult && !validationResult.isValid && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Validation Errors:</strong>
          <ul className="list-disc list-inside mt-1">
            {validationResult.errors.map((error: string, index: number) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          {validationResult.recommendations.length > 0 && (
            <div className="mt-2">
              <strong>Recommendations:</strong>
              <ul className="list-disc list-inside">
                {validationResult.recommendations.map((rec: string, index: number) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {isSubmitted && !feedbackError && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Success!</strong> Your feedback has been recorded and will help improve future recommendations.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Feedback Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as FeedbackType)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {feedbackTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {feedbackTypes.find(t => t.value === formData.type)?.description}
          </p>
        </div>

        {/* Rating Scale */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => handleInputChange('rating', rating)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.rating === rating
                    ? 'border-blue-500 bg-blue-50 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl">{getRatingIcon(rating)}</div>
                <div className="text-xs mt-1">{rating}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Very Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as const).map(priority => (
              <button
                key={priority}
                type="button"
                onClick={() => handleInputChange('priority', priority)}
                className={`px-4 py-2 rounded-md border-2 capitalize transition-all ${
                  formData.priority === priority
                    ? `${getPriorityColor(priority)} border-opacity-100 bg-opacity-10`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comments (Optional)
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => handleInputChange('comments', e.target.value)}
            placeholder="Any additional thoughts about this exercise?"
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag..."
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Tag
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isProcessing}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              isProcessing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isProcessing ? 'Submitting...' : 'Submit Feedback'}
          </button>
          
          <button
            type="button"
            onClick={() => dispatch(feedbackPersonalizationActions.toggleValidationErrorDisplay())}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            {showValidationErrors ? 'Hide' : 'Show'} Validation
          </button>
        </div>
      </form>
    </div>
  );
};