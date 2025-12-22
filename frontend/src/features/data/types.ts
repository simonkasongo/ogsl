/**
 * Types pour les données (datasets, organizations, sources)
 */

export interface Source {
  id: number;
  slug: string;
  title: string;
}

export interface Organization {
  id: number;
  ckan_id: string;
  name: string;
  title: string;
  source?: Source;
}

export interface Resource {
  id: number;
  ckan_id: string;
  name: string;
  format: string;
  url: string;
}

export interface Dataset {
  id: number;
  ckan_id: string;
  name: string;
  title: string;
  notes?: string;
  theme?: string;
  metadata_created: string | null;
  metadata_modified: string | null;
  organization: Organization | null;
  source: Source;
  resources: Resource[];
}

export interface DatasetFilters {
  search?: string;
  theme?: string;
  format?: string;
  ordering?: string;
  catalogue?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  producer?: string;
}

export interface DataState {
  datasets: Dataset[];
  currentDataset: Dataset | null;
  organizations: Organization[];
  sources: Source[];
  loading: boolean;
  error: string | null;
  filters: DatasetFilters;
  totalCount: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

// GraphQL Query Types
export interface GraphQLDatasetResponse {
  datasets: Dataset[];
}

export interface GraphQLDatasetDetailResponse {
  dataset: Dataset;
}

export interface GraphQLSourcesResponse {
  sources: Source[];
}

export interface GraphQLOrganizationsResponse {
  organizations: Organization[];
}

