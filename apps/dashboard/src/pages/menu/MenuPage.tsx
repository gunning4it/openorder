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

import { useState } from 'react';
import CategoryList from '../../components/menu/CategoryList';
import ItemList from '../../components/menu/ItemList';
import ItemDialog from '../../components/menu/ItemDialog';
import type { MenuItem } from '@openorder/shared-types';

export default function MenuPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>();

  const handleCategorySelect = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
  };

  const handleAddItem = () => {
    setEditingItem(undefined);
    setIsItemDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setIsItemDialogOpen(false);
    setEditingItem(undefined);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar - Categories */}
      <div className="lg:col-span-1">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <CategoryList onCategorySelect={handleCategorySelect} />
        </div>
      </div>

      {/* Main content - Menu Items */}
      <div className="lg:col-span-2">
        <ItemList
          selectedCategoryId={selectedCategoryId}
          onAddItem={handleAddItem}
          onEditItem={handleEditItem}
        />
      </div>

      {/* Item Dialog */}
      <ItemDialog
        item={editingItem}
        isOpen={isItemDialogOpen}
        onClose={handleCloseItemDialog}
        defaultCategoryId={selectedCategoryId}
      />
    </div>
  );
}
