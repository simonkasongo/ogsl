import axios, { AxiosInstance } from 'axios';

const graphqlClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8000/graphql/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const executeGraphQLQuery = async <T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> => {
  const response = await graphqlClient.post('', { query, variables });

  if (response.data?.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }

  return response.data.data as T;
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
          title
          name
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
          title
          name
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



