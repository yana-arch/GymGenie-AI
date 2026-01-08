import { useEffect } from 'react';
import { useToast, toast } from '@/components/ui/Toast';
import { EncouragementService } from '../services/EncouragementService';

export const useEncouragement = () => {
  const { showToast } = useToast();

  useEffect(() => {
    const service = EncouragementService.getInstance();
    
    const unsubscribe = service.subscribe((message) => {
      showToast(toast.info('Encouragement', message, { duration: 4000 }));
    });

    return () => unsubscribe();
  }, [showToast]);
};
