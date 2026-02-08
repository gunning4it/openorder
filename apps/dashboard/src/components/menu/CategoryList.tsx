/*
 * OpenOrder - Open-source restaurant ordering platform
 * Copyright (C) 2026  Josh Gunning
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuCategory } from '@openorder/shared-types';
import { useCategories, useDeleteCategory, useReorderCategories } from '../../lib/api/categories';
import CategoryDialog from './CategoryDialog';

interface CategoryWithItemCount extends MenuCategory {
  itemCount: number;
}

interface SortableCategoryProps {
  category: CategoryWithItemCount;
  isSelected: boolean;
  onSelect: (categoryId: string) => void;
  onEdit: (category: CategoryWithItemCount) => void;
  onDelete: (categoryId: string) => void;
}

function SortableCategory({ category, isSelected, onSelect, onEdit, onDelete }: SortableCategoryProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(category.id)}
      className={`
        bg-white border-2 rounded-lg p-4 cursor-pointer
        hover:shadow-md transition-all duration-200
        ${isSelected ? 'border-blue-600 shadow-md' : 'border-gray-200'}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Drag to reorder"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>

        {/* Category info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">{category.name}</h3>
            {!category.isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Edit category"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this category? All items in this category will also be deleted.')) {
                onDelete(category.id);
              }
            }}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            aria-label="Delete category"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoryListProps {
  onCategorySelect?: (categoryId: string | undefined) => void;
}

export default function CategoryList({ onCategorySelect }: CategoryListProps) {
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  const [localCategories, setLocalCategories] = useState<CategoryWithItemCount[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithItemCount | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local categories when data changes
  useEffect(() => {
    if (categories) {
      setLocalCategories(categories);
    }
  }, [categories]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localCategories.findIndex((cat) => cat.id === active.id);
    const newIndex = localCategories.findIndex((cat) => cat.id === over.id);

    const newOrder = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newOrder);

    // Update server
    const categoryIds = newOrder.map((cat) => cat.id);
    reorderMutation.mutate(categoryIds);
  };

  const handleEdit = (category: CategoryWithItemCount) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteMutation.mutateAsync(categoryId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(undefined);
  };

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      // Deselect if clicking the same category
      setSelectedCategoryId(undefined);
      onCategorySelect?.(undefined);
    } else {
      setSelectedCategoryId(categoryId);
      onCategorySelect?.(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayCategories = localCategories.length > 0 ? localCategories : categories || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Add Category
        </button>
      </div>

      {/* Show All button */}
      {displayCategories.length > 0 && (
        <button
          onClick={() => {
            setSelectedCategoryId(undefined);
            onCategorySelect?.(undefined);
          }}
          className={`
            w-full px-4 py-2 text-sm font-medium rounded-md text-left
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${!selectedCategoryId
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
          `}
        >
          Show All Items
        </button>
      )}

      {/* Category list */}
      {displayCategories.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">No categories yet. Create your first category to get started.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={displayCategories} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {displayCategories.map((category) => (
                <SortableCategory
                  key={category.id}
                  category={category}
                  isSelected={selectedCategoryId === category.id}
                  onSelect={handleCategorySelect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Dialog */}
      <CategoryDialog
        category={editingCategory}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
