import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Composant d'affichage d'erreur
 */
export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = 'Une erreur est survenue', 
  onRetry,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <AlertCircle className="text-destructive mb-4" size={48} />
      <p className="text-lg font-medium text-destructive mb-2">Erreur</p>
      <p className="text-sm text-muted-foreground mb-4 text-center">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Réessayer
        </Button>
      )}
    </div>
  );
};


