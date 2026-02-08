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
import type { MenuItem } from '@openorder/shared-types';
import {
  useBulkDeleteMenuItems,
  useBulkToggleAvailability,
} from '../../lib/api/items';

interface BulkActionsToolbarProps {
  selectedItems: MenuItem[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export default function BulkActionsToolbar({
  selectedItems,
  onClearSelection,
  onActionComplete,
}: BulkActionsToolbarProps) {
  const [showConfirm, setShowConfirm] = useState<'delete' | null>(null);
  const bulkDeleteMutation = useBulkDeleteMenuItems();
  const bulkToggleAvailabilityMutation = useBulkToggleAvailability();

  const selectedCount = selectedItems.length;
  const selectedIds = selectedItems.map((item) => item.id);

  const handleBulkDelete = () => {
    if (showConfirm === 'delete') {
      bulkDeleteMutation.mutate(selectedIds, {
        onSuccess: () => {
          setShowConfirm(null);
          onActionComplete();
        },
      });
    } else {
      setShowConfirm('delete');
    }
  };

  const handleBulkToggleAvailability = (isAvailable: boolean) => {
    bulkToggleAvailabilityMutation.mutate(
      {
        itemIds: selectedIds,
        isAvailable,
      },
      {
        onSuccess: () => {
          onActionComplete();
        },
      }
    );
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top duration-200">
      <div className="bg-white border border-gray-300 rounded-lg shadow-xl px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Selection Count */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
              {selectedCount}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {selectedCount === 1 ? 'item selected' : 'items selected'}
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Confirmation or Actions */}
          {showConfirm === 'delete' ? (
            <>
              <span className="text-sm font-medium text-red-900">
                Delete {selectedCount} {selectedCount === 1 ? 'item' : 'items'}?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2 text-sm font-medium
                    text-white bg-red-600
                    border border-transparent rounded-md
                    hover:bg-red-700
                    active:bg-red-800 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowConfirm(null)}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2 text-sm font-medium
                    text-gray-700 bg-white
                    border border-gray-300 rounded-md
                    hover:bg-gray-50
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    transition-all duration-200
                  "
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                {/* Mark Available */}
                <button
                  onClick={() => handleBulkToggleAvailability(true)}
                  disabled={bulkToggleAvailabilityMutation.isPending}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2 text-sm font-medium
                    text-green-700 bg-green-50
                    border border-green-300 rounded-md
                    hover:bg-green-100
                    active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Mark selected items as available"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Available
                </button>

                {/* Mark Unavailable (86) */}
                <button
                  onClick={() => handleBulkToggleAvailability(false)}
                  disabled={bulkToggleAvailabilityMutation.isPending}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2 text-sm font-medium
                    text-amber-700 bg-amber-50
                    border border-amber-300 rounded-md
                    hover:bg-amber-100
                    active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  title="Mark selected items as unavailable (86'd)"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                  86 (Unavailable)
                </button>

                {/* Delete */}
                <button
                  onClick={handleBulkDelete}
                  className="
                    inline-flex items-center gap-2
                    px-4 py-2 text-sm font-medium
                    text-red-700 bg-white
                    border border-red-300 rounded-md
                    hover:bg-red-50
                    active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                    transition-all duration-200
                  "
                  title="Delete selected items"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}

          {/* Divider */}
          {!showConfirm && <div className="h-6 w-px bg-gray-300" />}

          {/* Clear Selection */}
          {!showConfirm && (
            <button
              onClick={onClearSelection}
              className="
                inline-flex items-center gap-2
                px-4 py-2 text-sm font-medium
                text-gray-700 bg-white
                border border-gray-300 rounded-md
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-all duration-200
              "
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
