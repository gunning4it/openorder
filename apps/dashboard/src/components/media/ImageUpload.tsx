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

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadImage } from '../../lib/api/media';

interface ImageUploadProps {
  value?: string | null;
  onChange: (imageUrl: string) => void;
  onDelete?: () => void;
  maxSizeMB?: number;
  accept?: string;
  aspectRatio?: 'square' | '16:9';
  label?: string;
  helperText?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onDelete,
  maxSizeMB = 5,
  aspectRatio = 'square',
  label = 'Image',
  helperText,
}: ImageUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const uploadMutation = useUploadImage();

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
        } else {
          setError('File upload failed. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];
      if (!file) {
        return;
      }

      try {
        // Simulate progress for UX (real progress would require backend support)
        setUploadProgress(10);
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const result = await uploadMutation.mutateAsync(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Call onChange with the uploaded image URL
        onChange(result.url);

        // Reset progress after a short delay
        setTimeout(() => {
          setUploadProgress(0);
        }, 500);
      } catch (err) {
        setUploadProgress(0);
        setError('Upload failed. Please try again.');
      }
    },
    [maxSizeMB, uploadMutation, onChange]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: maxSizeBytes,
    multiple: false,
  });

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      onChange('');
    }
    setError(null);
    setUploadProgress(0);
  };

  const isUploading = uploadProgress > 0 && uploadProgress < 100;
  const hasImage = !!value && !isUploading;

  // Aspect ratio classes
  const aspectRatioClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div className="relative">
        {/* Preview with Image */}
        {hasImage ? (
          <div className={`relative w-full ${aspectRatioClass} rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-300`}>
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
            />

            {/* Delete Button Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={handleDelete}
                className="
                  inline-flex items-center justify-center gap-2
                  px-4 py-2 text-sm font-medium
                  text-white bg-red-600
                  border border-transparent rounded-md
                  hover:bg-red-700
                  active:bg-red-800 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                  transition-all duration-200 shadow-lg
                "
                aria-label="Delete image"
              >
                <svg
                  className="h-4 w-4"
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
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* Dropzone */
          <div
            {...getRootProps()}
            className={`
              relative w-full ${aspectRatioClass} rounded-lg
              border-2 border-dashed
              flex flex-col items-center justify-center
              cursor-pointer
              transition-all duration-200
              ${isDragActive && !isDragReject
                ? 'border-blue-600 bg-blue-50'
                : isDragReject
                ? 'border-red-600 bg-red-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }
              ${isUploading ? 'pointer-events-none' : ''}
              focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
            `}
          >
            <input {...getInputProps()} aria-label="Upload image file" />

            {/* Upload Icon and Text */}
            {!isUploading && (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <svg
                  className="h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                {isDragActive ? (
                  <p className="text-sm font-medium text-blue-600">
                    Drop the image here
                  </p>
                ) : isDragReject ? (
                  <p className="text-sm font-medium text-red-600">
                    Invalid file type or size
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Drag & drop an image here, or click to select
                    </p>
                    <p className="text-xs text-gray-600">
                      JPEG, PNG, WebP · Max {maxSizeMB}MB
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="flex flex-col items-center justify-center p-6">
                {/* Spinner */}
                <div className="relative mb-4">
                  <svg
                    className="animate-spin h-12 w-12 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>

                {/* Progress Text */}
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Uploading... {uploadProgress}%
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-sm text-gray-600">{helperText}</p>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <svg
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
