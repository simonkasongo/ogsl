import React, { useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDatasetsGraphQL } from '@/features/data/dataSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/common/FilterBar';
import { Loader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { Database, Calendar, Building2, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { formatDate, truncateText } from '@/utils/format';
import { deleteDatasetById } from '@/features/data/dataSlice';

/**
 * Liste des jeux de données.
 */
export const DataListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { datasets, loading, error, filters } = useAppSelector((state) => state.data);
  const hasLoadedRef = useRef(false);

  // Mémoriser la fonction loadDatasets
  const loadDatasets = useCallback(() => {
    // Utiliser GraphQL pour charger les datasets
    const variables = {
      search: filters.search,
      theme: filters.theme,
      first: 50,
    };
    dispatch(fetchDatasetsGraphQL(variables));
  }, [dispatch, filters.search, filters.theme]);

  // Charger les datasets une seule fois au montage
  useEffect(() => {
    if (!hasLoadedRef.current && datasets.length === 0 && !loading) {
      hasLoadedRef.current = true;
      loadDatasets();
    }
  }, [datasets.length, loading, loadDatasets]);

  const handleFilterChange = useCallback(() => {
    loadDatasets();
  }, [loadDatasets]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, datasetId: number, title: string) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = window.confirm(`Supprimer définitivement le dataset « ${title} » ?`);
      if (!ok) return;
      await dispatch(deleteDatasetById(datasetId));
    },
    [dispatch]
  );

  if (loading && datasets.length === 0) {
    return <Loader text="Chargement des datasets..." />;
  }

  if (error && datasets.length === 0) {
    return <ErrorState message={error} onRetry={loadDatasets} />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center">
            <Database className="mr-3 h-8 w-8" />
            Datasets
          </h1>
          <p className="text-muted-foreground mt-2">
            {datasets.length} jeu{datasets.length > 1 ? 'x' : ''} de données disponible{datasets.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Barre de filtres */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Liste des datasets */}
      {loading && datasets.length > 0 && (
        <div className="text-center py-4">
          <Loader text="Actualisation..." size={24} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {datasets.length > 0 ? (
          datasets.map((dataset) => (
            <Card key={dataset.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      <Link 
                        to={`/datasets/${dataset.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {dataset.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="flex flex-wrap gap-2 items-center">
                      {dataset.organization && (
                        <span className="flex items-center">
                          <Building2 className="h-3 w-3 mr-1" />
                          {dataset.organization.title}
                        </span>
                      )}
                      {dataset.metadata_modified && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(dataset.metadata_modified)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-start gap-2">
                    {dataset.theme && (
                      <Badge variant="secondary">{dataset.theme}</Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title="Supprimer"
                      aria-label={`Supprimer ${dataset.title}`}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDelete(e, dataset.id, dataset.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataset.notes && (
                  <p className="text-sm text-muted-foreground">
                    {truncateText(dataset.notes, 200)}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {dataset.resources.length} ressource{dataset.resources.length > 1 ? 's' : ''}
                    </span>
                    {dataset.resources.length > 0 && (
                      <div className="flex gap-1">
                        {[...new Set(dataset.resources.map(r => r.format))].slice(0, 3).map((format) => (
                          <Badge key={format} variant="outline" className="text-xs">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Link to={`/datasets/${dataset.id}`}>
                    <Button variant="outline" size="sm">
                      Voir détails
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Aucun dataset trouvé</p>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos filtres de recherche
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};


