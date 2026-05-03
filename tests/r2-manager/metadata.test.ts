/**
 * R2 Metadata Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateMetadata,
  truncatePrompt,
  parseMetadata,
  validateMetadata,
  serializeMetadata,
} from '../../workers/shared/r2-manager/metadata';
import type { ImageMetadata } from '../../workers/shared/r2-manager/types';

describe('R2 Metadata', () => {
  describe('generateMetadata', () => {
    it('should generate basic metadata', () => {
      const metadata = generateMetadata(
        'production',
        'ideogram',
        'v2',
        'A beautiful sunset'
      );

      expect(metadata.instance_id).toBe('production');
      expect(metadata.provider).toBe('ideogram');
      expect(metadata.model).toBe('v2');
      expect(metadata.prompt).toBe('A beautiful sunset');
      expect(metadata.generation_timestamp).toBeDefined();
    });

    it('should include project ID when provided', () => {
      const metadata = generateMetadata(
        'production',
        'ideogram',
        'v2',
        'Test prompt',
        'demo-project'
      );

      expect(metadata.project_id).toBe('demo-project');
    });

    it('should merge additional metadata', () => {
      const metadata = generateMetadata(
        'production',
        'ideogram',
        'v2',
        'Test prompt',
        undefined,
        {
          custom_field: 'custom_value',
          another_field: 'another_value',
        }
      );

      expect(metadata.custom_field).toBe('custom_value');
      expect(metadata.another_field).toBe('another_value');
    });

    it('should truncate long prompts', () => {
      const longPrompt = 'a'.repeat(1000);
      const metadata = generateMetadata(
        'production',
        'ideogram',
        'v2',
        longPrompt
      );

      expect(metadata.prompt.length).toBeLessThanOrEqual(512);
      expect(metadata.prompt).toContain('...');
    });
  });

  describe('truncatePrompt', () => {
    it('should not truncate short prompts', () => {
      const prompt = 'A short prompt';
      const truncated = truncatePrompt(prompt);

      expect(truncated).toBe(prompt);
    });

    it('should truncate long prompts to default length', () => {
      const longPrompt = 'a'.repeat(1000);
      const truncated = truncatePrompt(longPrompt);

      expect(truncated.length).toBe(512);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should truncate to custom length', () => {
      const longPrompt = 'a'.repeat(1000);
      const truncated = truncatePrompt(longPrompt, 100);

      expect(truncated.length).toBe(100);
      expect(truncated.endsWith('...')).toBe(true);
    });

    it('should handle exact length match', () => {
      const prompt = 'a'.repeat(512);
      const truncated = truncatePrompt(prompt);

      expect(truncated).toBe(prompt);
    });
  });

  describe('parseMetadata', () => {
    it('should parse valid metadata', () => {
      const customMetadata = {
        instance_id: 'production',
        project_id: 'demo-project',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test prompt',
        generation_timestamp: '2025-11-20T00:00:00Z',
      };

      const parsed = parseMetadata(customMetadata);

      expect(parsed).toEqual(customMetadata);
    });

    it('should return null for invalid metadata', () => {
      const invalidMetadata = {
        provider: 'ideogram',
        // Missing instance_id
      };

      const parsed = parseMetadata(invalidMetadata);

      expect(parsed).toBeNull();
    });

    it('should provide defaults for missing fields', () => {
      const minimalMetadata = {
        instance_id: 'production',
      };

      const parsed = parseMetadata(minimalMetadata);

      expect(parsed?.provider).toBe('unknown');
      expect(parsed?.model).toBe('unknown');
      expect(parsed?.prompt).toBe('');
      expect(parsed?.generation_timestamp).toBeDefined();
    });

    it('should preserve extra fields', () => {
      const customMetadata = {
        instance_id: 'production',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
        custom_field: 'custom_value',
      };

      const parsed = parseMetadata(customMetadata);

      expect(parsed?.custom_field).toBe('custom_value');
    });
  });

  describe('validateMetadata', () => {
    it('should validate correct metadata', () => {
      const metadata: ImageMetadata = {
        instance_id: 'production',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
      };

      expect(validateMetadata(metadata)).toBe(true);
    });

    it('should reject metadata without instance_id', () => {
      const metadata: ImageMetadata = {
        instance_id: '',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
      };

      expect(validateMetadata(metadata)).toBe(false);
    });

    it('should reject metadata without provider', () => {
      const metadata: ImageMetadata = {
        instance_id: 'production',
        provider: '',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
      };

      expect(validateMetadata(metadata)).toBe(false);
    });

    it('should reject metadata with whitespace-only values', () => {
      const metadata: ImageMetadata = {
        instance_id: '   ',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
      };

      expect(validateMetadata(metadata)).toBe(false);
    });
  });

  describe('serializeMetadata', () => {
    it('should serialize metadata to strings', () => {
      const metadata: ImageMetadata = {
        instance_id: 'production',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
      };

      const serialized = serializeMetadata(metadata);

      expect(typeof serialized.instance_id).toBe('string');
      expect(typeof serialized.provider).toBe('string');
      expect(serialized).toEqual(metadata);
    });

    it('should filter out undefined values', () => {
      const metadata: ImageMetadata = {
        instance_id: 'production',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
        project_id: undefined,
      };

      const serialized = serializeMetadata(metadata);

      expect('project_id' in serialized).toBe(false);
    });

    it('should convert non-string values to strings', () => {
      const metadata: any = {
        instance_id: 'production',
        provider: 'ideogram',
        model: 'v2',
        prompt: 'Test',
        generation_timestamp: '2025-11-20T00:00:00Z',
        count: 123,
      };

      const serialized = serializeMetadata(metadata);

      expect(typeof serialized.count).toBe('string');
      expect(serialized.count).toBe('123');
    });
  });
});
