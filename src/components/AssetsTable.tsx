import { useState, useEffect, useMemo } from "react";
import { Pencil, Trash2, Save, X, Plus } from "lucide-react";
import billOwners from "../config/bill_owners.json";
import { Asset } from "@/lib/types/asset";

// Type definitions
type CategoryType = "资产" | "负债";
type AssetCategory = "活期" | "投资" | "固定资产" | "应收" | "其他";
type LiabilityCategory =
  | "信用贷"
  | "信用卡"
  | "花呗/白条"
  | "亲友借款"
  | "其他";
type CategoryMap = {
  [key in CategoryType]: string[];
};
type SubcategoryMap = {
  [key in CategoryType]: {
    [key: string]: string[];
  };
};

// Category and subcategory constants
const CATEGORIES: CategoryMap = {
  资产: ["活期", "投资", "固定资产", "应收", "其他"],
  负债: ["信用贷", "信用卡", "花呗/白条", "亲友借款", "其他"],
} as const;

const SUBCATEGORIES: SubcategoryMap = {
  资产: {
    活期: ["现金", "活期存款"],
    投资: ["货基", "定期", "股票", "基金", "债券", "养老金"],
    固定资产: ["房产", "汽车", "公积金"],
    应收: ["应收"],
    其他: ["其他"],
  },
  负债: {
    信用贷: ["信用贷"],
    信用卡: ["信用卡"],
    "花呗/白条": ["花呗", "白条"],
    亲友借款: ["亲友借款"],
    其他: ["其他"],
  },
};

// Using relative imports since shadcn/ui components might not be properly set up
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "default";
  size?: "sm" | "default" | "icon";
}

const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = "rounded-md flex items-center justify-center";
  const variantStyles = {
    default: "bg-blue-500 text-white hover:bg-blue-600",
    ghost: "hover:bg-gray-100",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-sm",
    default: "px-4 py-2",
    icon: "p-2",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    {...props}
  />
);

const Table = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`border rounded-md overflow-hidden ${className}`}>
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  </div>
);

const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);

const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="hover:bg-gray-50">{children}</tr>
);

const TableHead = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

const TableCell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>
);

interface Owner {
  id: string;
  name: string;
  displayName: string;
}

interface AssetsTableProps {
  assets: Asset[];
  onSave: (assets: Asset[]) => Promise<void>;
  isSaving: boolean;
}

export function AssetsTable({
  assets: initialAssets = [],
  onSave,
  isSaving: externalIsSaving,
}: AssetsTableProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAsset, setEditedAsset] = useState<Partial<Asset>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    return [...assets];
  }, [assets]);

  // Update local state when initialAssets prop changes
  useEffect(() => {
    // Ensure we always have an array, even if initialAssets is undefined or null
    const safeAssets = Array.isArray(initialAssets) ? initialAssets : [];
    setAssets(safeAssets);
  }, [initialAssets]);

  // Get available accounts from bill_owners.json
  const availableAccounts = useMemo<Owner[]>(() => {
    return billOwners.owners;
  }, []);

  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setEditedAsset({ ...asset });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedAsset({});
  };

  const handleFieldChange = (field: keyof Asset, value: string | number) => {
    setEditedAsset((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!editingId) return;

    const updatedAssets = initialAssets.map((asset) =>
      asset.id === editingId
        ? {
            ...asset,
            ...editedAsset,
            // Ensure amount is a number
            amount:
              editedAsset.amount !== undefined
                ? Number(editedAsset.amount)
                : asset.amount,
          }
        : asset,
    );

    setIsSaving(true);
    try {
      await onSave(updatedAssets);
      setEditingId(null);
      setEditedAsset({});
      setAssets(updatedAssets);
    } catch (error) {
      console.error("Error saving asset:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = () => {
    const newAsset: Asset = {
      id: `new-${Date.now()}`,
      type: "活期",
      typeDisplay: "活期",
      date: new Date().toISOString().split("T")[0],
      category: "",
      subcategory: "",
      name: "",
      account: "",
      amount: 0,
      rate: undefined,
      note: "",
      owner: "",
    };

    setEditingId(newAsset.id);
    setEditedAsset(newAsset);
    // Add the new asset to the beginning of the list
    setAssets([newAsset, ...assets]);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("确定要删除这条记录吗？")) {
      try {
        setIsSaving(true);
        const updatedAssets = assets.filter((asset) => asset.id !== id);
        // Update local state optimistically
        setAssets(updatedAssets);
        await onSave(updatedAssets);
      } catch (error) {
        console.error("Error deleting asset:", error);
        // Optionally show error to user and revert state
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">资产列表</h2>
          <Button
            onClick={handleAddNew}
            className="ml-4"
            disabled={isSaving || externalIsSaving}
          >
            <Plus className="w-4 h-4 mr-2" />
            新增资产
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>类型</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>子分类</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>账户</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>所有者</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                {editingId === asset.id ? (
                  <>
                    <TableCell>
                      <select
                        value={editedAsset?.type || ""}
                        onChange={(e) =>
                          handleFieldChange("type", e.target.value)
                        }
                        className="w-[100px] p-2 border rounded-md"
                      >
                        <option value="">选择类型</option>
                        <option value="资产">资产</option>
                        <option value="负债">负债</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={editedAsset?.date}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFieldChange("date", e.target.value)
                        }
                        className="w-[120px]"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={editedAsset?.category || ""}
                        onChange={(e) =>
                          handleFieldChange("category", e.target.value)
                        }
                        className="w-[100px] p-2 border rounded-md"
                      >
                        <option value="">选择分类</option>
                        {editedAsset?.type &&
                          CATEGORIES[
                            editedAsset.type as keyof typeof CATEGORIES
                          ]?.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        value={editedAsset?.subcategory || ""}
                        onChange={(e) =>
                          handleFieldChange("subcategory", e.target.value)
                        }
                        className="w-[100px] p-2 border rounded-md"
                        disabled={!editedAsset?.category}
                      >
                        <option value="">选择子分类</option>
                        {editedAsset?.category &&
                          SUBCATEGORIES[
                            editedAsset.type as keyof typeof SUBCATEGORIES
                          ]?.[editedAsset.category]?.map((subcat) => (
                            <option key={subcat} value={subcat}>
                              {subcat}
                            </option>
                          ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editedAsset?.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFieldChange("name", e.target.value)
                        }
                        placeholder="账户"
                        className="w-[100px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editedAsset?.account}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFieldChange("account", e.target.value)
                        }
                        placeholder="账户"
                        className="w-[100px]"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        value={editedAsset?.amount || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "amount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24 p-2 border rounded-md"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={editedAsset?.owner || ""}
                        onChange={(e) =>
                          handleFieldChange("owner", e.target.value)
                        }
                        className="w-24 p-2 border rounded-md"
                      >
                        <option value="">选择所有者</option>
                        {availableAccounts?.map((owner) => (
                          <option key={owner.id} value={owner.name}>
                            {owner.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="p-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell>{asset.date}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{asset.subcategory}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.account}</TableCell>
                    <TableCell className="text-right">
                      {asset.amount.toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell>{asset.owner || ""}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="p-2 hover:bg-gray-100 rounded-md"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 hover:bg-gray-100 rounded-md text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
