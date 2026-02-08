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

/**
 * Storage adapter interface for media files
 * Follows adapter pattern to support multiple storage backends
 * (local filesystem, S3, CloudFlare R2, etc.)
 */
export interface IStorageAdapter {
  /**
   * Upload a file to storage
   * @param buffer - File buffer
   * @param metadata - File metadata (filename, mimeType)
   * @returns Unique file ID
   */
  upload(buffer: Buffer, metadata: FileMetadata): Promise<string>;

  /**
   * Retrieve a file from storage
   * @param id - Unique file ID
   * @returns File buffer and metadata
   */
  get(id: string): Promise<StoredFile>;

  /**
   * Delete a file from storage
   * @param id - Unique file ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a file exists
   * @param id - Unique file ID
   */
  exists(id: string): Promise<boolean>;
}

export interface FileMetadata {
  filename: string;
  mimeType: string;
  size?: number;
  restaurantId?: string;
}

export interface StoredFile {
  buffer: Buffer;
  metadata: FileMetadata;
}
