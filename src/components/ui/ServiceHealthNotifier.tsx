import React, { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useAppSelector, useAppDispatch } from '@/store';
import { healthService } from '@/services/HealthService';
import { updateServiceStatus } from '@/features/ui/store/featureFlagSlice';
import { WifiOff, AlertTriangle, Wifi } from 'lucide-react';

export const ServiceHealthNotifier: React.FC = () => {
  const dispatch = useAppDispatch();
  const { serviceStatus, degradationReason } = useAppSelector((state) => state.featureFlags);

  useEffect(() => {
    const unsubscribe = healthService.subscribe((status, reason) => {
      dispatch(updateServiceStatus({ status, reason }));
    });

    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (serviceStatus === 'offline') {
      notifications.show({
        id: 'service-offline',
        title: 'Network Disconnected',
        message: 'You are offline. AI coaching is paused, but workout tracking is active.',
        color: 'red',
        icon: <WifiOff size={18} />,
        autoClose: false,
      });
    } else {
      notifications.hide('service-offline');
    }

    if (serviceStatus === 'degraded' && degradationReason === 'api') {
      notifications.show({
        id: 'service-degraded',
        title: 'AI Service Unavailable',
        message: 'AI Service is temporarily unavailable. Continuing in manual mode.',
        color: 'yellow',
        icon: <AlertTriangle size={18} />,
        autoClose: false,
      });
    } else {
      notifications.hide('service-degraded');
    }

    if (serviceStatus === 'available') {
      // Optional: show "back online" notification briefly
    }
  }, [serviceStatus, degradationReason]);

  return null;
};
