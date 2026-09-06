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

  // Explicit bracket / brace / parenthesis range e.g.:
  // - "path/prefix[1-10].jpg"
  // - "path/prefix{1..10}.jpg"
  // - "path/prefix(1-10).jpg"
  // - "[1-10]"
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

  // Exact URL according to user's instructions (e.g. "images/193.jpg" adds ONLY that URL).
  // Single numbered files must never be automatically expanded into sequences of unwanted images.
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
