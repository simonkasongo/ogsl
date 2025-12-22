import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: number;
  className?: string;
  text?: string;
}

/**
 * Composant de chargement (spinner)
 */
export const Loader: React.FC<LoaderProps> = ({ 
  size = 40, 
  className = '', 
  text = 'Chargement...' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className="animate-spin text-primary" size={size} />
      {text && <p className="mt-4 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};


