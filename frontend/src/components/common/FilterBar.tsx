import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setFilters, clearFilters } from '@/features/data/dataSlice';

interface FilterBarProps {
  onFilterChange?: () => void;
  className?: string;
}

/**
 * Barre de filtres pour les datasets avec debounce de 300ms
 */
export const FilterBar: React.FC<FilterBarProps> = ({ 
  onFilterChange,
  className = '' 
}) => {
  const dispatch = useAppDispatch();
  const currentFilters = useAppSelector((state) => state.data.filters);
  const isFirstRenderRef = useRef(true);
  
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '');
  const [theme, setTheme] = useState(currentFilters.theme || '');
  const [catalogue, setCatalogue] = useState(currentFilters.catalogue || '');
  const [producer, setProducer] = useState(currentFilters.producer || '');
  const [format, setFormat] = useState(currentFilters.format || '');

  useEffect(() => {
    // Ne pas déclencher au premier render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Debounce de 300ms pour la recherche comme spécifié
    const timer = setTimeout(() => {
      dispatch(setFilters({ 
        search: searchTerm || undefined,
        theme: theme || undefined,
        catalogue: catalogue || undefined,
        producer: producer || undefined,
        format: format || undefined,
      }));
      onFilterChange?.();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, theme, catalogue, producer, format]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setTheme('');
    setCatalogue('');
    setProducer('');
    setFormat('');
    dispatch(clearFilters());
    onFilterChange?.();
  };

  const hasActiveFilters = searchTerm || theme || catalogue || producer || format;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filtres dynamiques</span>
        {hasActiveFilters && (
          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
            Actifs
          </span>
        )}
      </div>
      
      <div className="flex flex-col gap-4 p-4 bg-card border rounded-lg">
        {/* Ligne 1: Recherche principale */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher dans les datasets (debounce 300ms)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Ligne 2: Filtres spécifiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            type="text"
            placeholder="Thème..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          
          <Input
            type="text"
            placeholder="Catalogue..."
            value={catalogue}
            onChange={(e) => setCatalogue(e.target.value)}
          />
          
          <Input
            type="text"
            placeholder="Producteur..."
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
          />
          
          <Input
            type="text"
            placeholder="Format (CSV, JSON...)..."
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          />
        </div>
        
        {/* Bouton clear */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearFilters}
            >
              <X className="mr-2 h-4 w-4" />
              Effacer tous les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

