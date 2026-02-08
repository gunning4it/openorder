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

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type {
  IStorageAdapter,
  FileMetadata,
  StoredFile,
} from './storage.interface.js';

/**
 * Local filesystem storage adapter
 * Stores files in /data/uploads/ directory (Docker volume)
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly baseDir: string;

  constructor(baseDir = '/data/uploads') {
    this.baseDir = baseDir;
  }

  /**
   * Initialize storage directory
   * Creates base directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      await fs.access(this.baseDir);
    } catch {
      await fs.mkdir(this.baseDir, { recursive: true });
    }
  }

  /**
   * Upload file to local storage
   * Format: {uuid}_{timestamp}_{sanitized-filename}.ext
   */
  async upload(buffer: Buffer, metadata: FileMetadata): Promise<string> {
    await this.initialize();

    const id = randomUUID();
    const timestamp = Date.now();
    const sanitizedFilename = this.sanitizeFilename(metadata.filename);
    const filename = `${id}_${timestamp}_${sanitizedFilename}`;
    const filePath = path.join(this.baseDir, filename);
    const metadataPath = `${filePath}.json`;

    // Write file
    await fs.writeFile(filePath, buffer);

    // Write metadata
    const metadataToStore: FileMetadata & { id: string; createdAt: string } = {
      ...metadata,
      id,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadataToStore, null, 2));

    return id;
  }

  /**
   * Retrieve file from local storage
   */
  async get(id: string): Promise<StoredFile> {
    const filePath = await this.findFileById(id);
    if (!filePath) {
      throw new Error(`File not found: ${id}`);
    }

    const metadataPath = `${filePath}.json`;

    // Read file and metadata
    const [buffer, metadataContent] = await Promise.all([
      fs.readFile(filePath),
      fs.readFile(metadataPath, 'utf-8'),
    ]);

    const metadata = JSON.parse(metadataContent) as FileMetadata;

    return {
      buffer,
      metadata,
    };
  }

  /**
   * Delete file from local storage
   */
  async delete(id: string): Promise<void> {
    const filePath = await this.findFileById(id);
    if (!filePath) {
      return; // Already deleted or doesn't exist
    }

    const metadataPath = `${filePath}.json`;

    // Delete file and metadata
    await Promise.all([
      fs.unlink(filePath).catch(() => {}),
      fs.unlink(metadataPath).catch(() => {}),
    ]);
  }

  /**
   * Check if file exists
   */
  async exists(id: string): Promise<boolean> {
    const filePath = await this.findFileById(id);
    return filePath !== null;
  }

  /**
   * Find file path by ID
   * Scans directory for files matching the ID pattern
   */
  private async findFileById(id: string): Promise<string | null> {
    try {
      await this.initialize();
      const files = await fs.readdir(this.baseDir);

      // Find file that starts with the UUID
      const matchingFile = files.find(
        (file) => file.startsWith(`${id}_`) && !file.endsWith('.json')
      );

      if (!matchingFile) {
        return null;
      }

      return path.join(this.baseDir, matchingFile);
    } catch {
      return null;
    }
  }

  /**
   * Sanitize filename to prevent directory traversal and special characters
   */
  private sanitizeFilename(filename: string): string {
    // Remove path separators and special characters
    const sanitized = filename
      .replace(/[/\\]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 100); // Limit length

    // Ensure we have a valid filename
    return sanitized || 'file';
  }
}
