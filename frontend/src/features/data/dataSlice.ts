import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dataService } from '@/services/dataService';
import { executeGraphQLQuery, graphqlQueries } from '@/api/graphqlClient';
import { DataState, Dataset, Organization, Source, DatasetFilters } from './types';

const initialState: DataState = {
  datasets: [],
  currentDataset: null,
  organizations: [],
  sources: [],
  loading: false,
  error: null,
  filters: {},
  totalCount: 0,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
};

export const fetchDatasets = createAsyncThunk(
  'data/fetchDatasets',
  async (filters: DatasetFilters | undefined, { rejectWithValue }) => {
    try {
      const datasets = await dataService.getDatasets(filters);
      return datasets;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de récupération des datasets');
    }
  }
);

export const fetchDatasetById = createAsyncThunk(
  'data/fetchDatasetById',
  async (id: number, { rejectWithValue }) => {
    try {
      const dataset = await dataService.getDatasetById(id);
      return dataset;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de récupération du dataset');
    }
  }
);

export const deleteDatasetById = createAsyncThunk(
  'data/deleteDatasetById',
  async (id: number, { rejectWithValue }) => {
    try {
      await dataService.deleteDatasetById(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de suppression du dataset');
    }
  }
);

// GraphQL
export const fetchDatasetsGraphQL = createAsyncThunk(
  'data/fetchDatasetsGraphQL',
  async (variables: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const response = await executeGraphQLQuery<{ datasets: Dataset[] }>(
        graphqlQueries.GET_DATASETS,
        variables
      );
      return response.datasets;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur GraphQL de récupération des datasets');
    }
  }
);

export const fetchDatasetByIdGraphQL = createAsyncThunk(
  'data/fetchDatasetByIdGraphQL',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await executeGraphQLQuery<{ dataset: Dataset }>(
        graphqlQueries.GET_DATASET,
        { id }
      );
      return response.dataset;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur GraphQL de récupération du dataset');
    }
  }
);

export const fetchOrganizations = createAsyncThunk(
  'data/fetchOrganizations',
  async (_, { rejectWithValue }) => {
    try {
      const organizations = await dataService.getOrganizations();
      return organizations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de récupération des organizations');
    }
  }
);

export const fetchSources = createAsyncThunk(
  'data/fetchSources',
  async (_, { rejectWithValue }) => {
    try {
      const sources = await dataService.getSources();
      return sources;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de récupération des sources');
    }
  }
);

export const fetchSourcesGraphQL = createAsyncThunk(
  'data/fetchSourcesGraphQL',
  async (_, { rejectWithValue }) => {
    try {
      const response = await executeGraphQLQuery<{ sources: Source[] }>(
        graphqlQueries.GET_SOURCES
      );
      return response.sources;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur GraphQL de récupération des sources');
    }
  }
);

/**
 * Slice Redux pour les données
 */
const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<DatasetFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearCurrentDataset: (state) => {
      state.currentDataset = null;
    },
    setPagination: (state, action: PayloadAction<{ page: number; pageSize: number }>) => {
      state.pagination.page = action.payload.page;
      state.pagination.pageSize = action.payload.pageSize;
    },
  },
  extraReducers: (builder) => {
    // Fetch datasets (REST)
    builder.addCase(fetchDatasets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDatasets.fulfilled, (state, action) => {
      state.loading = false;
      state.datasets = action.payload;
      state.totalCount = action.payload.length;
      state.error = null;
    });
    builder.addCase(fetchDatasets.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch dataset by ID (REST)
    builder.addCase(fetchDatasetById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDatasetById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentDataset = action.payload;
      state.error = null;
    });
    builder.addCase(fetchDatasetById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete dataset (REST)
    builder.addCase(deleteDatasetById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteDatasetById.fulfilled, (state, action) => {
      state.loading = false;
      const id = action.payload;
      state.datasets = state.datasets.filter((d) => d.id !== id);
      if (state.currentDataset?.id === id) {
        state.currentDataset = null;
      }
      state.totalCount = state.datasets.length;
      state.error = null;
    });
    builder.addCase(deleteDatasetById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch datasets (GraphQL)
    builder.addCase(fetchDatasetsGraphQL.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDatasetsGraphQL.fulfilled, (state, action) => {
      state.loading = false;
      state.datasets = action.payload;
      state.totalCount = action.payload.length;
      state.error = null;
    });
    builder.addCase(fetchDatasetsGraphQL.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch dataset by ID (GraphQL)
    builder.addCase(fetchDatasetByIdGraphQL.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDatasetByIdGraphQL.fulfilled, (state, action) => {
      state.loading = false;
      state.currentDataset = action.payload;
      state.error = null;
    });
    builder.addCase(fetchDatasetByIdGraphQL.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch organizations
    builder.addCase(fetchOrganizations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrganizations.fulfilled, (state, action) => {
      state.loading = false;
      state.organizations = action.payload;
      state.error = null;
    });
    builder.addCase(fetchOrganizations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch sources
    builder.addCase(fetchSources.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSources.fulfilled, (state, action) => {
      state.loading = false;
      state.sources = action.payload;
      state.error = null;
    });
    builder.addCase(fetchSources.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch sources (GraphQL)
    builder.addCase(fetchSourcesGraphQL.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSourcesGraphQL.fulfilled, (state, action) => {
      state.loading = false;
      state.sources = action.payload;
      state.error = null;
    });
    builder.addCase(fetchSourcesGraphQL.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, setFilters, clearFilters, clearCurrentDataset, setPagination } = dataSlice.actions;
export default dataSlice.reducer;

