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

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { toast } from 'sonner';

interface UploadImageResponse {
  success: boolean;
  data: {
    id: string;
    url: string;
  };
}

/**
 * Hook to upload an image file
 * Returns the image ID and URL
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.upload<UploadImageResponse>(
        '/media/upload',
        formData
      );
      return response.data;
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        toast.error('Upload failed. Please try again.');
      }
    },
  });
}

/**
 * Hook to delete an image
 */
export function useDeleteImage() {
  return useMutation({
    mutationFn: async (imageId: string) => {
      await apiClient.delete(`/media/${imageId}`);
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(`Delete failed: ${error.message}`);
      } else {
        toast.error('Delete failed. Please try again.');
      }
    },
  });
}
