'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, X, Tag } from 'lucide-react';

type CategoryMap = {
  [key: string]: string[]; // category: tags[]
};

export default function CategoryManagement() {
  const [categoryMap, setCategoryMap] = useState<CategoryMap>({});
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const router = useRouter();

  // Load categories and tags
  useEffect(() => {
    fetch('/api/category-map')
      .then(res => res.json())
      .then(data => {
        setCategoryMap(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch category map:', err);
        setLoading(false);
      });
  }, []);

  // Add a new category
  const handleAddCategory = () => {
    if (newCategory.trim() && !categoryMap[newCategory.trim()]) {
      const categoryName = newCategory.trim();
      updateCategoryMap({
        addCategory: { name: categoryName }
      });
      setNewCategory('');
    }
  };

  // Delete a category
  const handleDeleteCategory = (category: string) => {
    if (confirm(`确定要删除分类 "${category}" 吗？`)) {
      updateCategoryMap({
        deleteCategory: { name: category }
      });
    }
  };

  // Add a tag to a category
  const handleAddTag = (category: string) => {
    if (newTag.trim()) {
      const tag = newTag.trim();
      updateCategoryMap({
        addTag: { category, tag }
      });
      setNewTag('');
    }
  };

  // Delete a tag from a category
  const handleDeleteTag = (category: string, tag: string) => {
    updateCategoryMap({
      deleteTag: { category, tag }
    });
  };

  // Handle tag input keydown (Enter to add tag)
  const handleTagKeyDown = (e: KeyboardEvent, category: string) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag(category);
    }
  };

  // Update category map in both state and API
  const updateCategoryMap = async (updates: any) => {
    try {
      const response = await fetch('/api/category-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const result = await response.json();
      if (result.success) {
        // Update local state with the new data from server
        setCategoryMap(result.data);
      }
    } catch (err) {
      console.error('Failed to update category map:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">分类管理</h1>
        </div>

        {/* Add New Category */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">添加新分类</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="输入新分类名称"
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-5 w-5 mr-1" /> 添加
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          {Object.entries(categoryMap).map(([category, tags]) => (
            <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">{category}</h3>
                <button
                  onClick={() => handleDeleteCategory(category)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="删除分类"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                {/* Tags */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag) => (
                      <div key={tag} className="bg-blue-100 px-3 py-1 rounded-full text-sm flex items-center">
                        <Tag className="h-3 w-3 mr-1 text-blue-500" />
                        <span>{tag}</span>
                        <button
                          onClick={() => handleDeleteTag(category, tag)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Tag */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => handleTagKeyDown(e, category)}
                    onFocus={() => setActiveCategory(category)}
                    onBlur={() => setActiveCategory(null)}
                    placeholder="输入关键词，按回车添加"
                    className="flex-1 p-2 border rounded-lg text-sm"
                  />
                  <button
                    onClick={() => handleAddTag(category)}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center"
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" /> 添加
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
