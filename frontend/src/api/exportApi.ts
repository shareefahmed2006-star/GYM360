import { apiClient, getToken } from './apiClient';

export interface CollectionSummaryItem {
  id: string;
  name: string;
  label: string;
  description: string;
  totalCount: number;
  orgCount: number;
}

export interface CollectionsSummaryResponse {
  totalCollections: number;
  totalDocuments: number;
  collections: CollectionSummaryItem[];
}

export const exportApi = {
  /**
   * Fetch summary of all collections and document counts in the database.
   */
  getSummary: async (): Promise<CollectionsSummaryResponse> => {
    const res = await apiClient<CollectionsSummaryResponse>('/export/collections');
    return res.data || { totalCollections: 0, totalDocuments: 0, collections: [] };
  },

  /**
   * Download the complete database as ONE SINGLE CSV SHEET containing all 66 members and all 696 records.
   */
  downloadSingleMasterCsv: async (style: 'table' | 'sections' = 'table'): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/export/single-master-csv?style=${style}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to download master database CSV: ${res.statusText}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      style === 'sections'
        ? `GYM360_Master_Complete_Database_Sections.csv`
        : `GYM360_Master_Database_696_Records.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download a single individual collection as CSV file.
   */
  downloadCollectionCsv: async (
    collectionName: string,
    scope: 'all' | 'tenant' = 'all'
  ): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/export/csv/${collectionName}?scope=${scope}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Failed to export ${collectionName}: ${res.statusText}`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GYM360_${collectionName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
