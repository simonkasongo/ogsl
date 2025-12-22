import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDatasetByIdGraphQL, clearCurrentDataset, deleteDatasetById } from '@/features/data/dataSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/common/Loader';
import { ErrorState } from '@/components/common/ErrorState';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  FileText, 
  ExternalLink, 
  Download,
  Trash2
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/utils/format';

/**
 * Détails d’un jeu de données.
 */
export const DataDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentDataset, loading, error } = useAppSelector((state) => state.data);

  useEffect(() => {
    if (id) {
      dispatch(fetchDatasetByIdGraphQL(parseInt(id)));
    }

    return () => {
      dispatch(clearCurrentDataset());
    };
  }, [id, dispatch]);

  if (loading) {
    return <Loader text="Chargement du dataset..." />;
  }

  if (error) {
    return (
      <ErrorState 
        message={error} 
        onRetry={() => id && dispatch(fetchDatasetByIdGraphQL(parseInt(id)))} 
      />
    );
  }

  if (!currentDataset) {
    return <ErrorState message="Dataset non trouvé" />;
  }

  const handleDelete = async () => {
    const ok = window.confirm(`Supprimer définitivement le dataset « ${currentDataset.title} » ?`);
    if (!ok) return;
    await dispatch(deleteDatasetById(currentDataset.id));
    navigate('/datasets');
  };

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/datasets')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à la liste
      </Button>

      {/* En-tête du dataset */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl mb-3">
                {currentDataset.title}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-3 text-base">
                {currentDataset.organization && (
                  <span className="flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    {currentDataset.organization.title}
                  </span>
                )}
                {currentDataset.metadata_modified && (
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Modifié le {formatDate(currentDataset.metadata_modified)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-start gap-2">
              {currentDataset.theme && (
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {currentDataset.theme}
                </Badge>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Supprimer"
                aria-label="Supprimer ce dataset"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          {currentDataset.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {currentDataset.notes}
              </p>
            </div>
          )}

          {/* Métadonnées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Identifiant CKAN</p>
              <p className="text-sm font-mono">{currentDataset.ckan_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Nom technique</p>
              <p className="text-sm font-mono">{currentDataset.name}</p>
            </div>
            {currentDataset.metadata_created && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Date de création</p>
                <p className="text-sm">{formatDateTime(currentDataset.metadata_created)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Source</p>
              <p className="text-sm">{currentDataset.source.title}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ressources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Ressources ({currentDataset.resources.length})
          </CardTitle>
          <CardDescription>
            Fichiers de données disponibles au téléchargement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentDataset.resources.length > 0 ? (
            <div className="space-y-3">
              {currentDataset.resources.map((resource) => (
                <div 
                  key={resource.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline">{resource.format}</Badge>
                      <h4 className="font-medium">
                        {resource.name || 'Ressource sans nom'}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {resource.ckan_id}
                    </p>
                  </div>
                  <a 
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune ressource disponible
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Link to="/stats" className="flex-1">
          <Button variant="outline" className="w-full">
            Voir les statistiques
          </Button>
        </Link>
        <Link to="/datasets" className="flex-1">
          <Button variant="default" className="w-full">
            Explorer d'autres datasets
          </Button>
        </Link>
      </div>
    </div>
  );
};


