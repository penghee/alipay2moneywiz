import React from 'react';
import { Asset } from '@/lib/types/asset';
import { formatCurrency } from '@/lib/utils/currency';

interface Owner {
  id: string;
  name: string;
  displayName: string;
}

interface AssetCardProps {
  type: 'asset' | 'liability';
  category: string;
  subcategory: string;
  items: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  owners: Owner[];
}

export const AssetCard: React.FC<AssetCardProps> = ({
  type,
  category,
  subcategory,
  items,
  onEdit,
  onDelete,
  owners
}) => {
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const isLiability = type === 'liability';
  
  return (
    <div className={`rounded-lg border p-4 mb-4 ${isLiability ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">
          {category} - {subcategory}
        </h3>
        <span className={`font-bold ${isLiability ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(totalAmount)}
        </span>
      </div>
      
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">{item.account}</div>
              <div className="text-xs text-gray-400">
                {item.ownerId ? `所有人: ${item.ownerId}` : ''}
                {item.note && item.ownerId ? ' • ' : ''}
                {item.note}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{formatCurrency(item.amount)}</span>
              <button
                onClick={() => onEdit(item)}
                className="text-blue-500 hover:text-blue-700"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
