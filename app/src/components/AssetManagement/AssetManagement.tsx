'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Asset, ASSET_TYPES, ASSET_CATEGORIES } from '@/lib/types/asset';
import { AssetCard } from './AssetCard';
import { AssetService } from '@/lib/services/assetService';
import { formatCurrency } from '@/lib/utils/currency';

interface GroupedAssets {
  [type: string]: {
    [category: string]: {
      [subcategory: string]: Asset[];
    };
  };
}

export const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  // Handle edit button click
  const handleEditClick = (asset: Asset) => {
    setEditingAsset(asset);
    setShowAddModal(true);
  };
  const [owners, setOwners] = useState<Array<{id: string, name: string, displayName: string}>>([]);
  
  const assetService = new AssetService();


  useEffect(() => {
    const loadData = async () => {
      try {
        // Load owners
        const ownersResponse = await fetch('/api/owners');
        if (!ownersResponse.ok) throw new Error('Failed to load owners');
        const ownersData = await ownersResponse.json();
        setOwners(ownersData.owners);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
      }
    };
    
    loadData();
  }, [showAddModal])

  // Load assets and owners
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load assets
        const assetsData = await assetService.getAssets();
        // Ensure all assets have typeDisplay and proper owner
        const processedAssets = assetsData.map((asset: Asset) => ({
          ...asset,
          typeDisplay: asset.typeDisplay || ASSET_TYPES[asset.type as keyof typeof ASSET_TYPES] || asset.type,
          // Ensure owner is set, default to first owner if not provided
          owner: asset.owner || owners[0]?.name || ''
        }));
        setAssets(processedAssets);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [showAddModal, owners]); // Reload data when modal is closed or owners change

  // Group assets by type, category, and subcategory
  const groupedAssets = React.useMemo<GroupedAssets>(() => {
    const grouped: GroupedAssets = {
      asset: {},
      liability: {}
    };

    assets.forEach(asset => {
      const type = asset.type === 'liability' ? 'liability' : 'asset';
      const category = asset.category;
      const subcategory = asset.subcategory || '其他';
      
      if (!grouped[type][category]) {
        grouped[type][category] = {};
      }
      
      if (!grouped[type][category][subcategory]) {
        grouped[type][category][subcategory] = [];
      }
      
      grouped[type][category][subcategory].push(asset);
    });
    
    return grouped;
  }, [assets]);

  const handleSaveAsset = async (assetData: Partial<Asset>) => {
    try {
      // Map type to display name
      const typeDisplay = ASSET_TYPES[assetData.type as keyof typeof ASSET_TYPES] || assetData.type;
      
      // For new assets, ensure we have the correct category and subcategory
      const isNewAsset = !editingAsset;
      let category = assetData.category;
      let subcategory = assetData.subcategory;
      
      if (isNewAsset && assetData.type) {
        // Map the type to the correct category name
        const typeToCategoryMap: Record<string, string> = {
          'cash': 'cash',
          'investment': 'investment',
          'fixed_asset': 'fixed_asset',
          'receivable': 'receivable',
          'liability': 'liability'
        };
        
        // Update category based on type if not explicitly set
        if (!category && typeToCategoryMap[assetData.type]) {
          category = typeToCategoryMap[assetData.type];
        }
        
        // If subcategory is a display name, find the corresponding value
        if (category && subcategory) {
          const categoryKey = category as keyof typeof ASSET_CATEGORIES;
          const subcategories = ASSET_CATEGORIES[categoryKey] || [];
          if (Array.isArray(subcategories) && !subcategories.includes(subcategory as any)) {
            // If subcategory is not in the list, use the first one as default
            subcategory = subcategories[0] || '';
          }
        }
      }
      
      const dataToSave = {
        ...assetData,
        typeDisplay,
        date: assetData.date || new Date().toISOString().split('T')[0],
        owner: assetData.owner || owners[0]?.name || '',
        category,
        subcategory
      };

      if (editingAsset) {
        await assetService.updateAsset(editingAsset.id, dataToSave);
      } else {
        await assetService.addAsset(dataToSave as Omit<Asset, 'id'>);
      }
      
      // Refresh assets
      const updatedAssets = await assetService.getAssets();
      setAssets(updatedAssets);
      setShowAddModal(false);
      setEditingAsset(null);
    } catch (err) {
      console.error('Error saving asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to save asset');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    
    try {
      await assetService.deleteAsset(id);
      const updatedAssets = await assetService.getAssets();
      setAssets(updatedAssets);
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete asset');
    }
  };

  const calculateTotal = (type: 'asset' | 'liability') => {
    return Object.values(groupedAssets[type])
      .flatMap(category => 
        Object.values(category).flatMap(subcategory => 
          subcategory.reduce((sum, item) => sum + (item.amount || 0), 0)
        )
      )
      .reduce((sum, amount) => sum + amount, 0);
  };

  const totalAssets = calculateTotal('asset');
  const totalLiabilities = calculateTotal('liability');
  const netWorth = totalAssets - totalLiabilities;

  if (loading) return <div className="p-4">加载中...</div>;
  if (error) return <div className="p-4 text-red-500">错误: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">资产管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          添加资产/负债
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600">总资产</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAssets)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-gray-600">总负债</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          netWorth >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="text-sm text-gray-600">净资产</div>
          <div className={`text-2xl font-bold ${
            netWorth >= 0 ? 'text-blue-600' : 'text-yellow-600'
          }`}>
            {formatCurrency(netWorth)}
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">资产</h2>
        {Object.entries(ASSET_CATEGORIES).filter(([key]) => key !== 'liability').map(([categoryKey, subcategories]) => {
          const categoryName = ASSET_TYPES[categoryKey as keyof typeof ASSET_TYPES] || categoryKey;
          
          return (
            <div key={categoryKey} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{categoryName}</h3>
              <div className="space-y-4">
                {subcategories.map(subcategory => {
                  const assetsInSubcategory = groupedAssets.asset[categoryName]?.[subcategory] || [];
                  if (assetsInSubcategory.length === 0) return null;
                  
                  return (
                    <AssetCard
                      key={`asset-${categoryKey}-${subcategory}`}
                      type="asset"
                      category={categoryName}
                      subcategory={subcategory}
                      items={assetsInSubcategory}
                      owners={owners}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteAsset}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Liabilities Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">负债</h2>
        {ASSET_CATEGORIES.liability.map(subcategory => {
          const assetsInSubcategory = groupedAssets.liability['负债']?.[subcategory] || [];
          if (assetsInSubcategory.length === 0) return null;
          
          return (
            <AssetCard
              key={`liability-${subcategory}`}
              type="liability"
              category="负债"
              subcategory={subcategory}
              items={assetsInSubcategory}
              owners={owners}
              onEdit={handleEditClick}
              onDelete={handleDeleteAsset}
            />
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AssetFormModal
          asset={editingAsset}
          owners={owners}
          onSave={handleSaveAsset}
          onClose={() => {
            setShowAddModal(false);
            setEditingAsset(null);
          }}
        />
      )}
    </div>
  );
};

// Asset Form Modal Component
interface AssetFormModalProps {
  asset: Asset | null;
  owners: Array<{id: string, name: string, displayName: string}>;
  onSave: (asset: Partial<Asset>) => void;
  onClose: () => void;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({
  asset,
  owners,
  onSave,
  onClose,
}) => {
  // Helper function to map type to its key in ASSET_TYPES
  const getTypeKey = (typeValue: string | undefined): keyof typeof ASSET_TYPES => {
    if (!typeValue) return 'cash';
    
    // First check if the value is a direct key
    if (Object.keys(ASSET_TYPES).includes(typeValue)) {
      return typeValue as keyof typeof ASSET_TYPES;
    }
    
    // Then check if it's a display value
    const entry = Object.entries(ASSET_TYPES).find(([_, value]) => value === typeValue);
    if (entry) {
      return entry[0] as keyof typeof ASSET_TYPES;
    }
    
    // Default to 'cash' if no match found
    return 'cash';
  };
  
  // Handle owner selection change
  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      owner: e.target.value
    }));
  };

  const isEditMode = !!asset;

  const [formData, setFormData] = useState<{
    type: keyof typeof ASSET_TYPES;
    typeDisplay: string;
    category: string;
    subcategory: string;
    name: string;
    account: string;
    amount: number;
    rate?: number;
    note?: string;
    owner: string;
  }>(() => {
    // Default values for new assets
    const defaultData = {
      type: 'cash' as const,
      typeDisplay: ASSET_TYPES.cash,
      category: 'asset',
      subcategory: '',
      name: '',
      account: '',
      amount: 0,
      rate: undefined,
      note: '',
      owner: owners[0]?.name || '',
    };

    if (!asset) return defaultData;

    // For existing asset, map the type correctly
    let mappedType: keyof typeof ASSET_TYPES = 'cash';
    
    // First check if the asset type is a valid key
    if (asset.type in ASSET_TYPES) {
      mappedType = asset.type as keyof typeof ASSET_TYPES;
    } else {
      // If not, try to find the key by value
      const typeEntry = Object.entries(ASSET_TYPES).find(([_, value]) => value === asset.type);
      if (typeEntry) {
        mappedType = typeEntry[0] as keyof typeof ASSET_TYPES;
      }
    }

    const isLiability = mappedType === 'liability' || asset.category === 'liability';
    const typeDisplay = asset.typeDisplay || ASSET_TYPES[mappedType] || asset.type;

    return {
      ...defaultData,
      ...asset,
      type: mappedType,
      typeDisplay,
      category: isLiability ? 'liability' : 'asset',
      owner: asset.owner || owners[0]?.name || '',
      subcategory: asset.subcategory || ''
    };
  });

  // Update form data when owners or asset changes
  useEffect(() => {
    if (asset) {
      // Map the type to a valid key
      const mappedType = getTypeKey(asset.type) || 'cash';
      const isLiability = mappedType === 'liability' || asset.category === 'liability';
      const typeDisplay = asset.typeDisplay || ASSET_TYPES[mappedType] || asset.type;
      
      setFormData(prev => ({
        ...prev,
        ...asset,
        type: mappedType,
        typeDisplay,
        category: isLiability ? 'liability' : 'asset',
        owner: asset.owner || owners[0]?.name || '',
        subcategory: asset.subcategory || ''
      }));
    } else {
      // Reset form for new asset
      setFormData({
        type: 'cash',
        typeDisplay: ASSET_TYPES.cash,
        category: 'asset',
        subcategory: '',
        name: '',
        account: '',
        amount: 0,
        rate: undefined,
        note: '',
        owner: owners[0]?.name || ''
      });
    }
  }, [asset, owners]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the display value for the type
    const typeDisplayValue = ASSET_TYPES[formData.type] || formData.type;
    const isLiability = formData.type === 'liability' || formData.category === 'liability';
    
    // Prepare the data to be saved
    const saveData: Partial<Asset> = {
      ...formData,
      type: isLiability ? 'liability' : formData.type,
      typeDisplay: isLiability ? '负债' : typeDisplayValue,
      amount: Number(formData.amount) || 0,
      rate: formData.rate ? Number(formData.rate) : undefined,
      date: asset?.date || new Date().toISOString().split('T')[0],
      owner: formData.owner || owners[0]?.name || '',
    };

    console.log('Saving asset data:', saveData);
    onSave(saveData);
  };

  const getSubcategories = () => {
    // If category is liability, return liability subcategories
    if (formData.category === 'liability') {
      return ASSET_CATEGORIES.liability;
    }
    
    // For assets, get subcategories based on the selected type
    // The type should already be a valid key, but we'll handle any case
    const typeKey = formData.type;
    
    // Check if the type is a direct key in ASSET_CATEGORIES
    if (typeKey && typeKey in ASSET_CATEGORIES) {
      return ASSET_CATEGORIES[typeKey as keyof typeof ASSET_CATEGORIES] || [];
    }
    
    // If the type is a display value, find its key
    const typeEntry = Object.entries(ASSET_TYPES).find(([_, value]) => value === typeKey);
    if (typeEntry && typeEntry[0] in ASSET_CATEGORIES) {
      return ASSET_CATEGORIES[typeEntry[0] as keyof typeof ASSET_CATEGORIES] || [];
    }
    
    // Default to empty array if no match found
    return [];
  };
  
  // Update type when category changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    setFormData(prev => {
      // If switching to/from liability, reset type and subcategory
      if (newCategory === 'liability' || prev.category === 'liability') {
        return {
          ...prev,
          category: newCategory,
          type: newCategory === 'liability' ? 'liability' : 'cash',
          subcategory: '',
        };
      }
      // Otherwise just update the category
      return {
        ...prev,
        category: newCategory,
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {asset ? '编辑金额' : '添加资产/负债'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditMode ? (
            <>
              <div className="space-y-2 p-3 bg-gray-50 rounded">
                <div>
                  <div className="text-sm text-gray-500">账户/说明</div>
                  <div className="font-medium">{formData.account || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">所有人</div>
                  <div className="font-medium">
                    {owners.find(o => o.name === formData.owner)?.displayName || formData.owner || '-'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  金额 (元)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: e.target.value as any})}
                  className="w-full p-2 border rounded"
                  required
                  autoFocus
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类别
                </label>
                <select
                  value={formData.category}
                  onChange={handleCategoryChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="asset">资产</option>
                  <option value="liability">负债</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'cash' | 'investment' | 'fixed_asset' | 'receivable' | 'liability';
                    setFormData(prev => ({
                      ...prev,
                      type: newType,
                      subcategory: ''
                    }));
                  }}
                  className="w-full p-2 border rounded"
                  required
                  disabled={formData.category === 'liability'}
                >
                  {Object.entries(ASSET_TYPES)
                    .filter(([key]) => key !== 'liability')
                    .map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  子类
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                >
                  {getSubcategories().map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名称
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  账户/说明
                </label>
                <input
                  type="text"
                  value={formData.account || ''}
                  onChange={(e) => setFormData({...formData, account: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  金额 (元)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: e.target.value as any})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  利率 (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate || ''}
                  onChange={(e) => setFormData({...formData, rate: e.target.value as any})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所有人
                </label>
                <select
                  value={formData.owner}
                  onChange={handleOwnerChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.name}>
                      {owner.displayName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.note || ''}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isEditMode ? '更新金额' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
