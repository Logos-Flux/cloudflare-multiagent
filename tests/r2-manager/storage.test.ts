/**
 * R2 Storage Manager Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  uploadImage,
  generatePath,
  sanitizeFilename,
  getContentType,
  generateCdnUrl,
  downloadImage,
  deleteImage,
  getImageMetadata,
} from '../../workers/shared/r2-manager/storage';
import type { R2ManagerEnv, StorageOptions } from '../../workers/shared/r2-manager/types';

// Mock R2 Bucket
class MockR2Bucket {
  private storage = new Map<string, any>();
  name = 'test-bucket';

  async put(key: string, value: any, options?: any): Promise<R2Object> {
    const data = {
      key,
      value,
      options,
      size: value instanceof ArrayBuffer ? value.byteLength : 1024,
      customMetadata: options?.customMetadata || {},
    };
    this.storage.set(key, data);

    return data as R2Object;
  }

  async get(key: string): Promise<R2Object | null> {
    const data = this.storage.get(key);
    if (!data) return null;

    return {
      ...data,
      arrayBuffer: async () => data.value,
    } as R2Object;
  }

  async head(key: string): Promise<R2Object | null> {
    return this.storage.get(key) || null;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(options?: any): Promise<any> {
    const keys = Array.from(this.storage.keys());
    const filtered = options?.prefix
      ? keys.filter((k: string) => k.startsWith(options.prefix))
      : keys;

    return {
      objects: filtered.slice(0, options?.limit || 100).map((key: string) => ({
        key,
        ...this.storage.get(key),
      })),
    };
  }

  clear(): void {
    this.storage.clear();
  }
}

describe('R2 Storage Manager', () => {
  let mockBucket: MockR2Bucket;
  let env: R2ManagerEnv;

  beforeEach(() => {
    mockBucket = new MockR2Bucket();
    env = {
      R2_BUCKET: mockBucket as unknown as R2Bucket,
      CDN_URL: 'https://cdn.example.com',
    };
  });

  describe('generatePath', () => {
    it('should generate path with project ID', () => {
      const path = generatePath('production', 'demo-project', 'image.png');

      expect(path).toMatch(/^production\/demo-project\/\d+_image\.png$/);
    });

    it('should generate path without project ID', () => {
      const path = generatePath('production', undefined, 'image.png');

      expect(path).toMatch(/^production\/\d+_image\.png$/);
    });

    it('should sanitize filename', () => {
      const path = generatePath('production', undefined, '../../../etc/passwd');

      expect(path).not.toContain('..');
      expect(path).toMatch(/^production\/\d+_etcpasswd\.png$/);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      expect(sanitizeFilename('../secret.png')).toBe('secret.png');
      expect(sanitizeFilename('../../passwd')).toBe('passwd.png');
    });

    it('should replace unsafe characters', () => {
      expect(sanitizeFilename('my file!@#$.png')).toBe('my_file____.png');
    });

    it('should add .png extension if missing', () => {
      expect(sanitizeFilename('image')).toBe('image.png');
    });

    it('should preserve safe filenames', () => {
      expect(sanitizeFilename('image_123.png')).toBe('image_123.png');
    });
  });

  describe('getContentType', () => {
    it('should return correct content types', () => {
      expect(getContentType('image.png')).toBe('image/png');
      expect(getContentType('photo.jpg')).toBe('image/jpeg');
      expect(getContentType('photo.jpeg')).toBe('image/jpeg');
      expect(getContentType('animated.gif')).toBe('image/gif');
      expect(getContentType('modern.webp')).toBe('image/webp');
    });

    it('should default to image/png for unknown extensions', () => {
      expect(getContentType('file.xyz')).toBe('image/png');
      expect(getContentType('noextension')).toBe('image/png');
    });

    it('should be case-insensitive', () => {
      expect(getContentType('IMAGE.PNG')).toBe('image/png');
      expect(getContentType('PHOTO.JPG')).toBe('image/jpeg');
    });
  });

  describe('generateCdnUrl', () => {
    it('should use custom CDN URL when configured', () => {
      const url = generateCdnUrl('production/image.png', env);

      expect(url).toBe('https://cdn.example.com/production/image.png');
    });

    it('should fallback to R2 public URL', () => {
      const envNoCdn: R2ManagerEnv = {
        R2_BUCKET: mockBucket as unknown as R2Bucket,
      };

      const url = generateCdnUrl('production/image.png', envNoCdn);

      expect(url).toMatch(/^https:\/\/pub-.*\.r2\.dev\/production\/image\.png$/);
    });
  });

  describe('uploadImage', () => {
    it('should upload image and return result', async () => {
      const imageData = new ArrayBuffer(1024);
      const options: StorageOptions = {
        instanceId: 'production',
        projectId: 'demo-project',
        filename: 'test.png',
        metadata: {
          provider: 'ideogram',
          model: 'v2',
        },
      };

      const result = await uploadImage(imageData, options, env);

      expect(result.r2_path).toMatch(/^production\/demo-project\/\d+_test\.png$/);
      expect(result.cdn_url).toContain('https://cdn.example.com/');
      expect(result.bucket).toBe('test-bucket');
      expect(result.size_bytes).toBe(1024);
      expect(result.uploaded_at).toBeDefined();
    });

    it('should throw error if R2_BUCKET not configured', async () => {
      const envNoBucket: R2ManagerEnv = {};
      const imageData = new ArrayBuffer(1024);
      const options: StorageOptions = {
        instanceId: 'production',
        filename: 'test.png',
        metadata: {},
      };

      await expect(uploadImage(imageData, options, envNoBucket)).rejects.toThrow(
        'R2_BUCKET binding not configured'
      );
    });

    it('should handle metadata correctly', async () => {
      const imageData = new ArrayBuffer(1024);
      const options: StorageOptions = {
        instanceId: 'production',
        filename: 'test.png',
        metadata: {
          provider: 'ideogram',
          prompt: 'A beautiful sunset',
        },
      };

      await uploadImage(imageData, options, env);

      // Verify metadata was stored
      const keys = Array.from((mockBucket as any).storage.keys());
      const stored = (mockBucket as any).storage.get(keys[0]);

      expect(stored.options.customMetadata.provider).toBe('ideogram');
      expect(stored.options.customMetadata.prompt).toBe('A beautiful sunset');
    });
  });

  describe('downloadImage', () => {
    it('should download existing image', async () => {
      const imageData = new ArrayBuffer(1024);
      await mockBucket.put('production/test.png', imageData);

      const downloaded = await downloadImage('production/test.png', env);

      expect(downloaded).toEqual(imageData);
    });

    it('should return null for non-existent image', async () => {
      const downloaded = await downloadImage('nonexistent.png', env);

      expect(downloaded).toBeNull();
    });
  });

  describe('deleteImage', () => {
    it('should delete image', async () => {
      await mockBucket.put('production/test.png', new ArrayBuffer(1024));

      await deleteImage('production/test.png', env);

      const result = await mockBucket.get('production/test.png');
      expect(result).toBeNull();
    });
  });

  describe('getImageMetadata', () => {
    it('should retrieve image metadata', async () => {
      await mockBucket.put('production/test.png', new ArrayBuffer(1024), {
        customMetadata: {
          provider: 'ideogram',
          model: 'v2',
        },
      });

      const metadata = await getImageMetadata('production/test.png', env);

      expect(metadata).toEqual({
        provider: 'ideogram',
        model: 'v2',
      });
    });

    it('should return null for non-existent image', async () => {
      const metadata = await getImageMetadata('nonexistent.png', env);

      expect(metadata).toBeNull();
    });
  });
});
