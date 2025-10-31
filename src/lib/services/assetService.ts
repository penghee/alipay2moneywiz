import { ASSET_CATEGORIES, ASSET_TYPES, Asset, AssetSummary } from '@/lib/types/asset';

const API_BASE = '/api';

export class AssetService {
  private owners: Array<{ id: string; name: string }> = [];

  constructor() {
    this.loadOwners();
  }

  private async loadOwners() {
    try {
      const response = await fetch('/api/owners');
      if (!response.ok) throw new Error('Failed to load owners');
      const data = await response.json();
      this.owners = data.owners || [];
    } catch (error) {
      console.error('Error loading owners:', error);
      this.owners = [];
    }
  }



  public async addAsset(asset: Omit<Asset, 'id'>) {
    try {
      const response = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });
      
      if (!response.ok) throw new Error('Failed to add asset');
      return await response.json();
    } catch (error) {
      console.error('Error adding asset:', error);
      throw error;
    }
  }

  public async updateAsset(id: string, updates: Partial<Asset>) {
    try {
      const response = await fetch(`${API_BASE}/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update asset');
      return await response.json();
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  }

  public async deleteAsset(id: string) {
    try {
      const response = await fetch(`${API_BASE}/assets/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete asset');
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  }

  public async getAssets(filters: {
    type?: string;
    ownerId?: string;
    category?: string;
    subcategory?: string;
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.ownerId) params.append('ownerId', filters.ownerId);
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);

      // Only add the query string if there are parameters
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${API_BASE}/assets${queryString}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch assets:', response.status, errorText);
        throw new Error(`Failed to fetch assets: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched assets:', data);
      return data;
    } catch (error) {
      console.error('Error in getAssets:', error);
      return [];
    }
  }

  public async getAssetSummary(): Promise<AssetSummary> {
    try {
      const response = await fetch(`${API_BASE}/assets/summary`);
      if (!response.ok) throw new Error('Failed to fetch asset summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching asset summary:', error);
      return {
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        byCategory: {},
        byOwner: {},
      };
    }
  }

  public getAssetTypes() {
    return ASSET_TYPES;
  }

  public getAssetCategories() {
    return ASSET_CATEGORIES;
  }

  public getOwners() {
    return [...this.owners];
  }

  public async importFromCSV(csvData: string, type: 'assets' | 'liabilities') {
    try {
      const response = await fetch(`${API_BASE}/assets/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, type }),
      });
      
      if (!response.ok) throw new Error('Failed to import assets');
      return await response.json();
    } catch (error) {
      console.error('Error importing assets:', error);
      throw error;
    }
  }

  private mapChineseToType(chineseType: string): string {
    const typeMap: Record<string, string> = {
      '活期': 'cash',
      '投资': 'investment',
      '固定资产': 'fixed_asset',
      '应收': 'receivable',
      '负债': 'liability'
    };
    return typeMap[chineseType] || 'other';
  }
}
