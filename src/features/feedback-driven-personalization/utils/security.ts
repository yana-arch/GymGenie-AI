/**
 * Security utility functions for input sanitization and XSS prevention
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and potentially dangerous characters
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous JavaScript patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove dangerous characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Trim whitespace
    .trim();
};

/**
 * Sanitize comments specifically for feedback display
 */
export const sanitizeComment = (comment: string): string => {
  if (!comment) return '';
  
  const sanitized = sanitizeInput(comment);
  
  // Additional comment-specific validation
  if (sanitized.length > 500) {
    return sanitized.substring(0, 497) + '...';
  }
  
  return sanitized;
};

/**
 * Validate and sanitize feedback tags
 */
export const sanitizeTags = (tags: string[]): string[] => {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
    .map(tag => sanitizeInput(tag.trim()))
    .filter(tag => tag.length <= 50) // Limit tag length
    .slice(0, 10); // Limit number of tags
};

/**
 * Validate feedback data structure and sanitize string fields
 */
export const validateAndSanitizeFeedback = (feedback: any) => {
  if (!feedback || typeof feedback !== 'object') {
    throw new Error('Invalid feedback data: not an object');
  }

  // Sanitize string fields
  const sanitized = {
    ...feedback,
    id: sanitizeInput(feedback.id || ''),
    workoutId: sanitizeInput(feedback.workoutId || ''),
    exerciseId: sanitizeInput(feedback.exerciseId || ''),
    comments: sanitizeComment(feedback.comments || ''),
    tags: sanitizeTags(feedback.tags || [])
  };

  // Validate required fields
  if (!sanitized.id || sanitized.id.length === 0) {
    throw new Error('Invalid feedback data: missing or invalid id');
  }
  
  if (!sanitized.workoutId || sanitized.workoutId.length === 0) {
    throw new Error('Invalid feedback data: missing or invalid workoutId');
  }
  
  if (!sanitized.exerciseId || sanitized.exerciseId.length === 0) {
    throw new Error('Invalid feedback data: missing or invalid exerciseId');
  }

  return sanitized;
};