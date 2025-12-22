import axiosClient from '@/api/axiosClient';
import { Dataset, Organization, Source, DatasetFilters } from '@/features/data/types';

export const dataService = {
  getDatasets: async (filters?: DatasetFilters): Promise<Dataset[]> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await axiosClient.get<Dataset[]>('/datasets/', { params });
    return response.data;
  },

  getDatasetById: async (id: number): Promise<Dataset> => {
    const response = await axiosClient.get<Dataset>(`/datasets/${id}/`);
    return response.data;
  },

  deleteDatasetById: async (id: number): Promise<void> => {
    await axiosClient.delete(`/datasets/${id}/`);
  },

  getOrganizations: async (): Promise<Organization[]> => {
    const response = await axiosClient.get<Organization[]>('/organizations/');
    return response.data;
  },

  getOrganizationById: async (id: number): Promise<Organization> => {
    const response = await axiosClient.get<Organization>(`/organizations/${id}/`);
    return response.data;
  },

  getSources: async (): Promise<Source[]> => {
    const response = await axiosClient.get<Source[]>('/sources/');
    return response.data;
  },

  getSourceById: async (id: number): Promise<Source> => {
    const response = await axiosClient.get<Source>(`/sources/${id}/`);
    return response.data;
  },
};


