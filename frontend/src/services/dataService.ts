import axiosClient from '@/api/axiosClient';
import { Dataset, Organization, Source, DatasetFilters } from '@/features/data/types';

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: T[] }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

export const dataService = {
  getDatasets: async (filters?: DatasetFilters): Promise<Dataset[]> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await axiosClient.get<Dataset[] | { results: Dataset[] }>('/datasets/', { params });
    return unwrapList<Dataset>(response.data);
  },

  getDatasetById: async (id: number): Promise<Dataset> => {
    const response = await axiosClient.get<Dataset>(`/datasets/${id}/`);
    return response.data;
  },

  deleteDatasetById: async (id: number): Promise<void> => {
    await axiosClient.delete(`/datasets/${id}/`);
  },

  getOrganizations: async (): Promise<Organization[]> => {
    const response = await axiosClient.get<Organization[] | { results: Organization[] }>('/organizations/');
    return unwrapList<Organization>(response.data);
  },

  getOrganizationById: async (id: number): Promise<Organization> => {
    const response = await axiosClient.get<Organization>(`/organizations/${id}/`);
    return response.data;
  },

  getSources: async (): Promise<Source[]> => {
    const response = await axiosClient.get<Source[] | { results: Source[] }>('/sources/');
    return unwrapList<Source>(response.data);
  },

  getSourceById: async (id: number): Promise<Source> => {
    const response = await axiosClient.get<Source>(`/sources/${id}/`);
    return response.data;
  },
};


