import { Memory } from '../constants';

/**
 * Robust, high-performance URL Sequence Expander
 * Supports reading and generating media links up to 10,000 items.
 * Handles:
 * 1. Bracket ranges: e.g. "https://domain.com/photo[1-10000].jpg", "{1..10000}", "(1-10000)"
 * 2. Sequential filenames: e.g. "https://domain.com/video10000.mp4", "photo10000.jpg", "clip300.mp4"
 * 3. Milestone counters: 100, 200, 300, 500, 1000, 2500, 5000, 10000
 * 4. Raw list of up to 10,000 individual links (separated by newlines, commas, or semicolons)
 */

export function expandSingleUrl(url: string, maxLimit = 10000): string[] {
  const trimmed = url.trim();
  if (!trimmed) return [];

  // Pattern 1: Explicit bracket range e.g. "path/prefix[1-10000].jpg", "{1..10000}", "(1-10000)"
  const bracketMatch = trimmed.match(/^(.*?)(?:\[|\{|\()(\d+)(?:-|\.\.)(\d+)(?:\]|\}|\))(.*)$/);
  if (bracketMatch) {
    const prefix = bracketMatch[1];
    const startStr = bracketMatch[2];
    const endStr = bracketMatch[3];
    const suffix = bracketMatch[4];
    const startNum = parseInt(startStr, 10);
    const endNum = parseInt(endStr, 10);

    if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum && startNum >= 0) {
      // Calculate how many to generate, capped at maxLimit (10,000)
      const totalCount = endNum - startNum + 1;
      const actualEnd = totalCount > maxLimit ? startNum + maxLimit - 1 : endNum;
      
      const isZeroPadded = startStr.length > 1 && startStr.startsWith('0');
      const padLen = isZeroPadded ? Math.max(startStr.length, endStr.length) : 0;
      const results: string[] = [];

      for (let i = startNum; i <= actualEnd; i++) {
        const numStr = padLen > 0 ? String(i).padStart(padLen, '0') : String(i);
        results.push(`${prefix}${numStr}${suffix}`);
      }
      return results;
    }
  }

  // Pattern 2: End-of-name number pattern up to 10000 (e.g. video10000.mp4, photo10000.jpg, image100.jpg, 10000.mp4)
  // Match prefix, non-digit basename or boundary, count number (1 to 5 digits: 1-10000), and optional extension
  const suffixMatch = trimmed.match(/^(.*?)(\D+?)(?:_|-|)?(\d{1,5})(\.[a-zA-Z0-9]+)?$/);
  if (suffixMatch) {
    const prefixPath = suffixMatch[1];
    const baseName = suffixMatch[2];
    const count = parseInt(suffixMatch[3], 10);
    const ext = suffixMatch[4] || (baseName.toLowerCase().includes('video') || prefixPath.toLowerCase().includes('video') ? '.mp4' : '.jpg');

    // Only expand if count is between 1 and 10000
    if (count >= 1 && count <= maxLimit) {
      // Differentiate between intentional sequences vs static photo URLs with IDs or dimensions
      const isSequentialKeyword = /^(.*)?(photo|img|image|pic|picture|video|vid|clip|slide|frame|memory|moment|track|media|scene|ep|episode|item|file|love|milli|sbu|banner)(\D*)$/i.test(baseName);
      const isMilestoneNumber = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000].includes(count);
      const hasSequenceDelimiter = trimmed.includes('_') || trimmed.includes('-') || trimmed.endsWith(`${count}${ext || ''}`);
      const isUnsplashDimension = trimmed.includes('unsplash.com') && (trimmed.includes('?w=') || trimmed.includes('&w=') || trimmed.includes('photo-15'));

      if (!isUnsplashDimension && (isSequentialKeyword || isMilestoneNumber || count === 10000 || hasSequenceDelimiter)) {
        const results: string[] = [];
        for (let i = 1; i <= count; i++) {
          results.push(`${prefixPath}${baseName}${i}${ext}`);
        }
        return results;
      }
    }
  }

  // Fallback: single static URL
  return [trimmed];
}

/**
 * Expands an array or string of URLs, supporting sequences and lists up to 10,000 items.
 */
export function expandMediaUrls(input: string[] | string, maxLimit = 10000): string[] {
  if (!input) return [];
  const result: string[] = [];
  const rawList: string[] = Array.isArray(input) ? input : [input];
  const flattened: string[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'string') continue;
    const parts = item.split(/[,\n;]/).map(p => p.trim()).filter(p => p.length > 0);
    flattened.push(...parts);
  }

  for (const url of flattened) {
    if (result.length >= maxLimit) break;
    const expanded = expandSingleUrl(url, maxLimit - result.length);
    result.push(...expanded);
  }

  return result.slice(0, maxLimit);
}

/**
 * Expands Episode Memory arrays when items contain sequence patterns up to 10,000 slides.
 */
export function expandEpisodeMemories(images: Memory[], maxLimit = 10000): Memory[] {
  if (!images || !Array.isArray(images)) return [];
  const result: Memory[] = [];

  for (const img of images) {
    if (!img) continue;
    if (result.length >= maxLimit) break;

    const trimmedImgUrl = img.imageUrl?.trim() || '';
    const trimmedVideoUrl = img.videoUrl?.trim() || '';

    // Check if either image or video URL has range/sequence syntax
    const expandedImages = trimmedImgUrl ? expandSingleUrl(trimmedImgUrl, maxLimit - result.length) : [];
    const expandedVideos = trimmedVideoUrl ? expandSingleUrl(trimmedVideoUrl, maxLimit - result.length) : [];

    const isSequence = expandedImages.length > 1 || expandedVideos.length > 1;

    if (isSequence) {
      const maxCount = Math.max(expandedImages.length, expandedVideos.length);
      for (let i = 1; i <= maxCount; i++) {
        if (result.length >= maxLimit) break;
        const itemImgUrl = expandedImages[i - 1] || expandedImages[0] || '';
        const itemVideoUrl = expandedVideos[i - 1] || expandedVideos[0] || undefined;
        const slideId = `${img.id || 'slide'}-seq-${i}`;

        result.push({
          id: slideId,
          title: `${img.title || 'Moments'} #${i}`,
          imageUrl: itemImgUrl,
          videoUrl: itemVideoUrl,
          description: img.description ? `${img.description} (${i}/${maxCount})` : undefined
        });
      }
    } else {
      result.push(img);
    }
  }

  return result.slice(0, maxLimit);
}
