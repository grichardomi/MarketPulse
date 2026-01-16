/**
 * Caching layer for competitor discovery results
 * Uses database for persistence (can be upgraded to Redis for performance)
 */

import { db as prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import type { RankedCompetitor } from './ai-ranker';

interface CachedDiscovery {
  competitors: RankedCompetitor[];
  cachedAt: string;
  expiresAt: string;
}

const CACHE_TTL_DAYS = 30;

/**
 * Generate a unique cache key from search parameters
 */
export function getCacheKey(
  industry: string,
  city: string,
  state: string
): string {
  // Normalize input
  const normalized = `${industry}|${city}|${state}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  // Create hash
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Get cached discovery results
 */
export async function getCached(
  industry: string,
  city: string,
  state: string
): Promise<RankedCompetitor[] | null> {
  try {
    const key = getCacheKey(industry, city, state);

    const cached = await prisma.competitorDiscoveryCache.findUnique({
      where: { cacheKey: key },
    });

    if (!cached) {
      return null;
    }

    // Check if expired
    if (new Date(cached.expiresAt) < new Date()) {
      // Delete expired cache
      await prisma.competitorDiscoveryCache.delete({
        where: { id: cached.id },
      });
      return null;
    }

    // Parse and return results
    const data = cached.results as any;
    return data.competitors || [];
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null; // Fail gracefully
  }
}

/**
 * Save discovery results to cache with retry logic for race conditions
 */
export async function saveToCache(
  industry: string,
  city: string,
  state: string,
  competitors: RankedCompetitor[]
): Promise<void> {
  const key = getCacheKey(industry, city, state);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  const data: CachedDiscovery = {
    competitors,
    cachedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try update first (most common case for race conditions)
      const updated = await prisma.competitorDiscoveryCache.updateMany({
        where: { cacheKey: key },
        data: {
          industry,
          city,
          state,
          results: data as any,
          expiresAt,
        },
      });

      // If no record was updated, create a new one
      if (updated.count === 0) {
        await prisma.competitorDiscoveryCache.create({
          data: {
            cacheKey: key,
            industry,
            city,
            state,
            results: data as any,
            expiresAt,
          },
        });
      }

      // Success - exit retry loop
      return;
    } catch (error: any) {
      // Handle P2002 (unique constraint) - another request already created the record
      if (error?.code === 'P2002') {
        if (attempt < maxRetries) {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 50 * attempt));
          continue;
        }
        // On final attempt, try one more update (the record should exist now)
        try {
          await prisma.competitorDiscoveryCache.updateMany({
            where: { cacheKey: key },
            data: {
              industry,
              city,
              state,
              results: data as any,
              expiresAt,
            },
          });
          return;
        } catch (updateError) {
          console.error('Cache save final update error:', updateError);
        }
      } else {
        console.error('Cache save error:', error);
      }

      // For non-P2002 errors or final attempt failures, break the loop
      if (error?.code !== 'P2002') {
        break;
      }
    }
  }

  // Don't throw - caching failure shouldn't break discovery
}

/**
 * Clear expired cache entries (run as background job)
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const result = await prisma.competitorDiscoveryCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  total: number;
  expired: number;
  valid: number;
}> {
  try {
    const total = await prisma.competitorDiscoveryCache.count();
    const expired = await prisma.competitorDiscoveryCache.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      total,
      expired,
      valid: total - expired,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { total: 0, expired: 0, valid: 0 };
  }
}
