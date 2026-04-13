import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { deepSnakify } from '@/utils/normalizeApi';

const graphqlClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8000/graphql/',
  headers: {
    'Content-Type': 'application/json',
  },
});

graphqlClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

graphqlClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const executeGraphQLQuery = async <T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> => {
  const response = await graphqlClient.post<{ data?: unknown; errors?: { message: string }[] }>(
    '',
    { query, variables }
  );

  if (response.data?.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  const raw = response.data?.data;
  return deepSnakify<T>(raw);
};

export const graphqlQueries = {
  GET_DATASETS: `
    query GetDatasets($search: String, $theme: String, $format: String, $first: Int, $skip: Int, $orderBy: String) {
      datasets(search: $search, theme: $theme, format: $format, first: $first, skip: $skip, orderBy: $orderBy) {
        id
        ckanId
        name
        title
        notes
        theme
        metadataCreated
        metadataModified
        organization {
          id
          ckanId
          name
          title
          source {
            id
            slug
            title
          }
        }
        source {
          id
          slug
          title
        }
        resources {
          id
          ckanId
          name
          format
          url
        }
      }
    }
  `,

  GET_DATASET: `
    query GetDataset($id: Int!) {
      dataset(id: $id) {
        id
        ckanId
        name
        title
        notes
        theme
        metadataCreated
        metadataModified
        organization {
          id
          ckanId
          name
          title
          source {
            id
            slug
            title
          }
        }
        source {
          id
          slug
          title
        }
        resources {
          id
          ckanId
          name
          format
          url
        }
      }
    }
  `,

  GET_SOURCES: `
    query GetSources {
      sources {
        id
        slug
        title
      }
    }
  `,

  GET_ORGANIZATIONS: `
    query GetOrganizations($search: String) {
      organizations(search: $search) {
        id
        ckanId
        name
        title
        source {
          id
          slug
          title
        }
      }
    }
  `,
};

export default graphqlClient;
