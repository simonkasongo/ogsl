import { RootState } from '@/app/store';
import { Dataset } from './types';

/**
 * Selectors pour les données
 */

export const selectDatasets = (state: RootState) => state.data.datasets;
export const selectCurrentDataset = (state: RootState) => state.data.currentDataset;
export const selectOrganizations = (state: RootState) => state.data.organizations;
export const selectSources = (state: RootState) => state.data.sources;
export const selectDataLoading = (state: RootState) => state.data.loading;
export const selectDataError = (state: RootState) => state.data.error;
export const selectDataFilters = (state: RootState) => state.data.filters;
export const selectTotalCount = (state: RootState) => state.data.totalCount;

/**
 * Selectors avec logique métier
 */

// Datasets groupés par thème
export const selectDatasetsByTheme = (state: RootState): Record<string, Dataset[]> => {
  const datasets = state.data.datasets;
  return datasets.reduce((acc, dataset) => {
    const theme = dataset.theme || 'Aucun thème';
    if (!acc[theme]) {
      acc[theme] = [];
    }
    acc[theme].push(dataset);
    return acc;
  }, {} as Record<string, Dataset[]>);
};

// Datasets groupés par format de ressource
export const selectDatasetsByFormat = (state: RootState): Record<string, Dataset[]> => {
  const datasets = state.data.datasets;
  const byFormat: Record<string, Dataset[]> = {};
  
  datasets.forEach(dataset => {
    dataset.resources.forEach(resource => {
      const format = resource.format || 'AUTRE';
      if (!byFormat[format]) {
        byFormat[format] = [];
      }
      if (!byFormat[format].find(d => d.id === dataset.id)) {
        byFormat[format].push(dataset);
      }
    });
  });
  
  return byFormat;
};

// Statistiques générales
export const selectDataStatistics = (state: RootState) => {
  const datasets = state.data.datasets;
  const organizations = state.data.organizations;
  const sources = state.data.sources;
  
  const themes = new Set(datasets.map(d => d.theme).filter(Boolean));
  const formats = new Set(
    datasets.flatMap(d => d.resources.map(r => r.format))
  );
  
  return {
    totalDatasets: datasets.length,
    totalOrganizations: organizations.length,
    totalSources: sources.length,
    uniqueThemes: themes.size,
    uniqueFormats: formats.size,
    totalResources: datasets.reduce((sum, d) => sum + d.resources.length, 0),
  };
};


