import { toast } from '@/components/ui/Toast';

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: string = 'Operation'
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`${context} Failed`, message);
    return null;
  }
};
