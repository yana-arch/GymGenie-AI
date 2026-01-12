import React, { useEffect } from 'react';
import { Alert, Transition, Box, Text } from '@mantine/core';
import { Info, AlertTriangle, Lightbulb } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { dismissSuggestion, Suggestion, DEFAULT_SUGGESTION_TIMEOUT } from '../store/liveSessionSlice';

interface SuggestionOverlayProps {
  suggestion: Suggestion | null;
  onAction?: (suggestion: Suggestion) => void;
}

const SuggestionOverlay: React.FC<SuggestionOverlayProps> = ({ suggestion, onAction }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!suggestion) return;

    const timeout = suggestion.autoDismissTimeout || DEFAULT_SUGGESTION_TIMEOUT;
    const timer = setTimeout(() => {
      dispatch(dismissSuggestion(suggestion.id));
    }, timeout);

    return () => clearTimeout(timer);
  }, [suggestion?.id, suggestion?.autoDismissTimeout, dispatch]);

  const getIcon = () => {
    if (!suggestion) return null;
    switch (suggestion.type) {
      case 'safety':
        return <AlertTriangle size={18} />;
      case 'performance':
        return <Lightbulb size={18} />;
      case 'motivation':
        return <Info size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const getColor = () => {
    if (!suggestion) return 'gray';
    switch (suggestion.type) {
      case 'safety':
        return 'red';
      case 'performance':
        return 'blue';
      case 'motivation':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Transition mounted={!!suggestion} transition="fade" duration={400} timingFunction="ease">
      {(styles) => (
        <Box 
          style={{ 
            ...styles, 
            position: 'fixed', 
            bottom: 20, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1000, 
            width: '90%', 
            maxWidth: 400
          }}
        >
          {suggestion && (
            <Alert
              variant="filled"
              color={getColor()}
              title={suggestion.type.toUpperCase()}
              icon={getIcon()}
              withCloseButton
              onClose={() => dispatch(dismissSuggestion(suggestion.id))}
            >
              <Box 
                style={{ cursor: onAction ? 'pointer' : 'default' }}
                onClick={() => onAction?.(suggestion)}
              >
                <Text size="sm">{suggestion.message}</Text>
                {onAction && (
                  <Text size="xs" fw={700} mt={5} style={{ textDecoration: 'underline' }}>
                    TAP TO VIEW DETAILS
                  </Text>
                )}
              </Box>
            </Alert>
          )}
        </Box>
      )}
    </Transition>
  );
};

export default SuggestionOverlay;
