import { Dataset } from '@/features/data/types';

export interface StatsData {
  totalDatasets: number;
  totalResources: number;
  uniqueThemes: number;
  uniqueFormats: number;
  uniqueOrganizations: number;
}

export const buildStatsFromItems = (datasets: Dataset[]): StatsData => {
  const themes = new Set(datasets.map(d => d.theme).filter(Boolean));
  const formats = new Set(
    datasets.flatMap(d => d.resources.map(r => r.format))
  );
  const organizations = new Set(
    datasets.map(d => d.organization?.id).filter(Boolean)
  );

  return {
    totalDatasets: datasets.length,
    totalResources: datasets.reduce((sum, d) => sum + d.resources.length, 0),
    uniqueThemes: themes.size,
    uniqueFormats: formats.size,
    uniqueOrganizations: organizations.size,
  };
};

export const groupByCatalogue = (datasets: Dataset[]): Record<string, number> => {
  const catalogueCount: Record<string, number> = {};
  datasets.forEach(dataset => {
    const catalogue = dataset.source?.title || 'Non spécifié';
    catalogueCount[catalogue] = (catalogueCount[catalogue] || 0) + 1;
  });
  return catalogueCount;
};

export const groupByTheme = (datasets: Dataset[]): Record<string, number> => {
  const themeCount: Record<string, number> = {};
  datasets.forEach(dataset => {
    const theme = dataset.theme || 'Non spécifié';
    themeCount[theme] = (themeCount[theme] || 0) + 1;
  });
  return themeCount;
};

export const groupByMonth = (datasets: Dataset[]): Array<{ month: string; count: number }> => {
  const monthCount: Record<string, number> = {};
  
  datasets.forEach(dataset => {
    if (dataset.metadata_created) {
      const date = new Date(dataset.metadata_created);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCount[monthKey] = (monthCount[monthKey] || 0) + 1;
    }
  });

  return Object.entries(monthCount)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

export const groupByFormat = (datasets: Dataset[]): Record<string, number> => {
  const formatCount: Record<string, number> = {};
  
  datasets.forEach(dataset => {
    dataset.resources.forEach(resource => {
      const format = resource.format || 'AUTRE';
      formatCount[format] = (formatCount[format] || 0) + 1;
    });
  });

  return formatCount;
};

export const calculateTimeTrends = (datasets: Dataset[]): {
  byMonth: Array<{ month: string; count: number }>;
  growth: number; // Pourcentage de croissance
} => {
  const byMonth = groupByMonth(datasets);
  
  if (byMonth.length < 2) {
    return { byMonth, growth: 0 };
  }

  const firstMonthCount = byMonth[0].count;
  const lastMonthCount = byMonth[byMonth.length - 1].count;
  const growth = firstMonthCount > 0
    ? ((lastMonthCount - firstMonthCount) / firstMonthCount) * 100
    : 0;

  return { byMonth, growth };
};


