/**
 * Tests unitaires pour les utilitaires de statistiques
 * 
 * Pour exécuter les tests :
 * npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
 * npm run test
 */

import { describe, it, expect } from 'vitest';
import { buildStatsFromItems, groupByCatalogue, groupByFormat, groupByMonth } from './stats';
import { formatDate, formatDateTime, truncateText, capitalizeFirst } from './format';
import type { Dataset } from '@/features/data/types';

// Mock datasets pour les tests
const mockDatasets: Dataset[] = [
  {
    id: 1,
    ckan_id: 'test-1',
    name: 'dataset-1',
    title: 'Dataset Test 1',
    notes: 'Description',
    theme: 'Environnement',
    metadata_created: '2024-01-15T10:00:00Z',
    metadata_modified: '2024-01-20T10:00:00Z',
    organization: {
      id: 1,
      ckan_id: 'org-1',
      name: 'org-test',
      title: 'Organisation Test',
    },
    source: {
      id: 1,
      slug: 'source-1',
      title: 'Source Test',
    },
    resources: [
      {
        id: 1,
        ckan_id: 'res-1',
        name: 'Resource 1',
        format: 'CSV',
        url: 'https://test.com/1',
      },
      {
        id: 2,
        ckan_id: 'res-2',
        name: 'Resource 2',
        format: 'JSON',
        url: 'https://test.com/2',
      },
    ],
  },
  {
    id: 2,
    ckan_id: 'test-2',
    name: 'dataset-2',
    title: 'Dataset Test 2',
    theme: 'Économie',
    metadata_created: '2024-02-10T10:00:00Z',
    metadata_modified: '2024-02-15T10:00:00Z',
    organization: {
      id: 2,
      ckan_id: 'org-2',
      name: 'org-test-2',
      title: 'Organisation Test 2',
    },
    source: {
      id: 1,
      slug: 'source-1',
      title: 'Source Test',
    },
    resources: [
      {
        id: 3,
        ckan_id: 'res-3',
        name: 'Resource 3',
        format: 'CSV',
        url: 'https://test.com/3',
      },
    ],
  },
];

describe('Stats Utilities', () => {
  describe('buildStatsFromItems', () => {
    it('should calculate correct statistics', () => {
      const stats = buildStatsFromItems(mockDatasets);
      
      expect(stats.totalDatasets).toBe(2);
      expect(stats.totalResources).toBe(3);
      expect(stats.uniqueThemes).toBe(2);
      expect(stats.uniqueFormats).toBe(2);
      expect(stats.uniqueOrganizations).toBe(2);
    });

    it('should handle empty array', () => {
      const stats = buildStatsFromItems([]);
      
      expect(stats.totalDatasets).toBe(0);
      expect(stats.totalResources).toBe(0);
      expect(stats.uniqueThemes).toBe(0);
    });
  });

  describe('groupByCatalogue', () => {
    it('should group datasets by catalogue', () => {
      const grouped = groupByCatalogue(mockDatasets);
      
      expect(grouped['Source Test']).toBe(2);
    });
  });

  describe('groupByFormat', () => {
    it('should count formats correctly', () => {
      const grouped = groupByFormat(mockDatasets);
      
      expect(grouped['CSV']).toBe(2);
      expect(grouped['JSON']).toBe(1);
    });
  });

  describe('groupByMonth', () => {
    it('should group by month correctly', () => {
      const grouped = groupByMonth(mockDatasets);
      
      expect(grouped).toHaveLength(2);
      expect(grouped[0].month).toBe('2024-01');
      expect(grouped[0].count).toBe(1);
      expect(grouped[1].month).toBe('2024-02');
      expect(grouped[1].count).toBe(1);
    });
  });
});

describe('Format Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const formatted = formatDate('2024-01-15T10:00:00Z');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('janvier');
    });

    it('should handle null/undefined', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('should handle invalid date', () => {
      expect(formatDate('invalid-date')).toBe('N/A');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime correctly', () => {
      const formatted = formatDateTime('2024-01-15T10:30:00Z');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('10');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      const truncated = truncateText(text, 20);
      
      expect(truncated.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(truncated).toContain('...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const truncated = truncateText(text, 20);
      
      expect(truncated).toBe(text);
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('WORLD')).toBe('World');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });
  });
});


