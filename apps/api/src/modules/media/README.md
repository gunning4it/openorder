# Media Module

Image upload and management system for OpenOrder using Sharp image processing and local filesystem storage.

## Architecture

The media module follows the **adapter pattern** to support multiple storage backends:

```
MediaService (business logic)
    ↓
IStorageAdapter (interface)
    ↓
LocalStorageAdapter (filesystem implementation)
```

This design allows easy addition of cloud storage adapters (S3, CloudFlare R2, etc.) in the future.

## Components

### Storage Interface (`storage.interface.ts`)
Defines the contract for storage adapters:
- `upload(buffer, metadata)` - Store file and return unique ID
- `get(id)` - Retrieve file buffer and metadata
- `delete(id)` - Remove file from storage
- `exists(id)` - Check if file exists

### Local Storage Adapter (`storage.local.ts`)
Filesystem implementation that stores files in `/data/uploads/`:
- Filename format: `{uuid}_{timestamp}_{sanitized-filename}.ext`
- Metadata stored as `{filename}.json` alongside each file
- Automatic directory creation
- Safe filename sanitization to prevent path traversal

### Media Service (`media.service.ts`)
Business logic layer with Sharp image processing:
- **Validation:** File type (JPEG/PNG/WebP) and size (max 5MB)
- **Optimization:** Resize to 800px width (configurable)
- **Compression:** Quality 85 with format-specific optimizations
- **URL generation:** Returns public URL for uploaded images

### Media Routes (`media.routes.ts`)
REST API endpoints with Fastify multipart support:
- `POST /api/media/upload` - Upload image (authenticated)
- `GET /api/media/:id` - Retrieve image (public)
- `DELETE /api/media/:id` - Delete image (authenticated)

## API Endpoints

### Upload Image

```http
POST /api/media/upload
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

file: <image-file>
```

**Authentication:** Required (OWNER or MANAGER role)

**Request:**
- Multipart form with single file field
- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 5MB

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "http://localhost:4000/api/media/550e8400-e29b-41d4-a716-446655440000",
    "filename": "menu-item.jpg",
    "mimeType": "image/jpeg",
    "size": 123456
  }
}
```

**Errors:**
- `400` - No file uploaded, invalid file type, or file too large
- `401` - Authentication required
- `403` - Insufficient permissions
- `500` - Processing error

### Retrieve Image

```http
GET /api/media/:id
```

**Authentication:** None (public endpoint)

**Response:** `200 OK`
- Headers:
  - `Content-Type: image/jpeg` (or appropriate MIME type)
  - `Cache-Control: public, max-age=31536000, immutable` (1 year cache)
- Body: Image binary data

**Errors:**
- `400` - Invalid ID format
- `404` - Image not found

### Delete Image

```http
DELETE /api/media/:id
Authorization: Bearer <jwt-token>
```

**Authentication:** Required (OWNER or MANAGER role)

**Response:** `204 No Content`

**Errors:**
- `400` - Invalid ID format
- `401` - Authentication required
- `403` - Insufficient permissions
- `404` - Image not found

## Image Processing

All uploaded images are automatically processed with Sharp:

1. **Validation**
   - File type must be JPEG, PNG, or WebP
   - File size must be under 5MB

2. **Resizing**
   - Max width: 800px (configurable)
   - Maintains aspect ratio
   - Only resizes if image exceeds max width

3. **Optimization**
   - **JPEG:** Quality 85, MozJPEG compression
   - **PNG:** Quality 85, compression level 9
   - **WebP:** Quality 85

4. **Storage**
   - Unique UUID assigned
   - Filename sanitized to prevent attacks
   - Metadata stored alongside file

## Storage Directory Structure

```
/data/uploads/
├── 550e8400-e29b-41d4-a716-446655440000_1698765432000_menu-item.jpg
├── 550e8400-e29b-41d4-a716-446655440000_1698765432000_menu-item.jpg.json
├── 660e9511-f39c-52e5-b827-557766551111_1698765433000_logo.png
└── 660e9511-f39c-52e5-b827-557766551111_1698765433000_logo.png.json
```

**Metadata JSON:**
```json
{
  "filename": "menu-item.jpg",
  "mimeType": "image/jpeg",
  "size": 123456,
  "restaurantId": "ckl3m4n5o0000qzrmxyz1234",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2024-10-31T12:30:32.000Z"
}
```

## Usage Examples

### From Dashboard (React)

```tsx
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImageUrl(response.data.data.url);
      console.log('Upload success:', response.data.data);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      {imageUrl && <img src={imageUrl} alt="Uploaded" />}
    </div>
  );
}
```

### From Menu Item Creation

```typescript
// Create menu item with image
const imageFile = await getImageFile(); // From file input
const uploadResult = await uploadImage(imageFile);

const menuItem = await createMenuItem({
  name: 'Margherita Pizza',
  price: 1299, // $12.99 in cents
  imageUrl: uploadResult.data.url,
  // ... other fields
});
```

## Docker Configuration

In production (Docker), the `/data/uploads/` directory is mounted as a volume:

```yaml
# docker-compose.yml
services:
  api:
    volumes:
      - uploads:/data/uploads

volumes:
  uploads:
```

This ensures uploaded images persist across container restarts.

## Environment Variables

- `PUBLIC_URL` - Base URL for generating image URLs (default: `http://localhost:4000`)

Example: `PUBLIC_URL=https://api.example.com`

## Security Considerations

1. **File Type Validation**
   - Only allows JPEG, PNG, WebP (no SVG to prevent XSS)
   - Uses MIME type from multipart data, not file extension

2. **File Size Limits**
   - Enforced at multipart plugin level (5MB)
   - Double-checked in service layer

3. **Filename Sanitization**
   - Removes path separators (`/`, `\`)
   - Removes special characters
   - Limits length to 100 characters

4. **Authentication**
   - Upload/delete require JWT authentication
   - Only OWNER and MANAGER roles can upload
   - Public read access for serving images

5. **UUID-based IDs**
   - Prevents enumeration attacks
   - UUIDs are cryptographically random

6. **Cache Headers**
   - 1-year immutable cache for images
   - Reduces server load and bandwidth

## Future Enhancements

### Cloud Storage Adapter (S3/R2)
```typescript
export class S3StorageAdapter implements IStorageAdapter {
  private s3Client: S3Client;

  async upload(buffer: Buffer, metadata: FileMetadata): Promise<string> {
    const id = randomUUID();
    await this.s3Client.putObject({
      Bucket: 'openorder-media',
      Key: id,
      Body: buffer,
      ContentType: metadata.mimeType,
      // ...
    });
    return id;
  }
  // ... other methods
}
```

### Image Transformations
- Multiple sizes (thumbnail, medium, large)
- On-the-fly resizing with query parameters
- Format conversion (serve WebP to supporting browsers)

### CDN Integration
- CloudFlare R2 + CDN
- Automatic cache purging on delete
- Edge caching for global performance

## Testing

### Manual Testing with cURL

**Upload:**
```bash
curl -X POST http://localhost:4000/api/media/upload \
  -H "Authorization: Bearer <your-jwt-token>" \
  -F "file=@/path/to/image.jpg"
```

**Retrieve:**
```bash
curl http://localhost:4000/api/media/<image-id> \
  --output downloaded-image.jpg
```

**Delete:**
```bash
curl -X DELETE http://localhost:4000/api/media/<image-id> \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Integration Tests

```typescript
describe('Media Upload', () => {
  it('should upload and process image', async () => {
    const file = fs.readFileSync('test-image.jpg');
    const response = await uploadImage(file, {
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
    });

    expect(response.id).toBeTruthy();
    expect(response.url).toContain('/api/media/');
    expect(response.size).toBeLessThan(5 * 1024 * 1024);
  });

  it('should reject invalid file types', async () => {
    const file = Buffer.from('not an image');
    await expect(uploadImage(file, {
      filename: 'test.txt',
      mimeType: 'text/plain',
    })).rejects.toThrow('Invalid file type');
  });
});
```

## License

AGPL-3.0 - See LICENSE file for details.
