import type { ImageStorage } from "@lib/types/common";
import { LOGO_SQUARE_TOLERANCE } from "./constants";

/**
 * Convert ImageStorage object into a URL that can be used in <img src>.
 * Images are fetched from MongoDB database.
 * Handles:
 *  - external URLs (type: 'url')
 *  - database-stored images (type: 'upload' - fetches from MongoDB)
 */
export const getImageUrl = async (image?: ImageStorage): Promise<string> => {
  if (!image) {
    return "";
  }

  // External URL
  if (image.type === "url") {
    return image.url || "";
  }

  // Database-stored image - fetch from MongoDB
  if (image.type === "upload" && image.data) {
    try {
      // Fetch image data from MongoDB
      const response = await fetch(`/api/v1/assets/ingame/${image.data}`);
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error("Failed to fetch image from database:", error);
    }
  }

  return "";
};

/**
 * Get team logo URL - uses the dedicated team logo endpoint
 */
export const getTeamLogoUrl = async (teamId: string): Promise<string> => {
  // Database-stored image - use the team logo endpoint
  try {
    const response = await fetch(`/api/v1/teams/${teamId}/logo`);
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error(`Failed to fetch logo for team ${teamId}:`, error);
  }

  return "";
};

/**
 * Get tournament logo URL - uses the dedicated tournament logo endpoint
 */
export const getTournamentLogoUrl = async (tournamentId: string): Promise<string> => {
  try {
    const response = await fetch(`/api/v1/tournaments/${tournamentId}/logo`);
    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error(`Failed to fetch logo for tournament ${tournamentId}:`, error);
  }

  return "";
};


export const isAlmostSquare = (width: number, height: number, tolerance: number = LOGO_SQUARE_TOLERANCE): boolean => {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return Math.abs(1 - ratio) <= tolerance;
};

const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
};

const getImageDataFromImage = (img: HTMLImageElement, maxSize: number = 128): ImageData => {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(img.width * scale));
  canvas.height = Math.max(1, Math.floor(img.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return data;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number): string => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const match = /^#?([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/.exec(hex);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  };
};

// LAB color space conversion functions
const rgbToLab = (r: number, g: number, bVal: number): { l: number; a: number; b: number } => {
  // Convert RGB to XYZ
  const toLinear = (c: number): number => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  const rLinear = toLinear(r);
  const gLinear = toLinear(g);
  const bLinear = toLinear(bVal);
  
  const x = rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805;
  const y = rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722;
  const z = rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505;
  
  // Convert XYZ to LAB
  const toLab = (c: number): number => {
    return c > 0.008856 ? Math.pow(c, 1/3) : (7.787 * c) + (16 / 116);
  };
  
  const xLab = toLab(x / 0.95047);
  const yLab = toLab(y);
  const zLab = toLab(z / 1.08883);
  
  const l = (116 * yLab) - 16;
  const a = 500 * (xLab - yLab);
  const b = 200 * (yLab - zLab);
  
  return { l, a, b };
};

const labToRgb = (lVal: number, aVal: number, bVal: number): { r: number; g: number; b: number } => {
  // Convert LAB to XYZ
  const toXyz = (c: number): number => {
    const c3 = Math.pow(c, 3);
    return c3 > 0.008856 ? c3 : (c - 16 / 116) / 7.787;
  };
  
  const y = (lVal + 16) / 116;
  const x = y + aVal / 500;
  const z = y - bVal / 200;
  
  const xXyz = toXyz(x) * 0.95047;
  const yXyz = toXyz(y);
  const zXyz = toXyz(z) * 1.08883;
  
  // Convert XYZ to RGB
  const toLinear = (c: number): number => {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
  };
  
  const rLinear = xXyz * 3.2406 + yXyz * -1.5372 + zXyz * -0.4986;
  const gLinear = xXyz * -0.9689 + yXyz * 1.8758 + zXyz * 0.0415;
  const bLinear = xXyz * 0.0557 + yXyz * -0.2040 + zXyz * 1.0570;
  
  const r = Math.max(0, Math.min(255, Math.round(toLinear(rLinear) * 255)));
  const g = Math.max(0, Math.min(255, Math.round(toLinear(gLinear) * 255)));
  const b = Math.max(0, Math.min(255, Math.round(toLinear(bLinear) * 255)));
  
  return { r, g, b };
};

const labDistance = (lab1: { l: number; a: number; b: number }, lab2: { l: number; a: number; b: number }): number => {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
};

// K-means clustering implementation
const kMeansClustering = (colors: Array<{ lab: { l: number; a: number; b: number }; rgb: { r: number; g: number; b: number }; weight: number }>, k: number, maxIterations: number = 100): Array<{ center: { l: number; a: number; b: number }; rgb: { r: number; g: number; b: number }; weight: number }> => {
  if (colors.length === 0) return [];
  
  // Initialize centroids randomly
  const centroids: Array<{ l: number; a: number; b: number }> = [];
  for (let i = 0; i < k; i++) {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    centroids.push({ ...randomColor.lab });
  }
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign colors to nearest centroid
    const clusters: Array<Array<typeof colors[0]>> = Array.from({ length: k }, () => []);
    
    for (const color of colors) {
      let minDistance = Infinity;
      let nearestCentroid = 0;
      
      for (let i = 0; i < k; i++) {
        const distance = labDistance(color.lab, centroids[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = i;
        }
      }
      
      clusters[nearestCentroid].push(color);
    }
    
    // Update centroids
    let centroidsChanged = false;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      
      const totalWeight = clusters[i].reduce((sum, color) => sum + color.weight, 0);
      const newCentroid = {
        l: clusters[i].reduce((sum, color) => sum + color.lab.l * color.weight, 0) / totalWeight,
        a: clusters[i].reduce((sum, color) => sum + color.lab.a * color.weight, 0) / totalWeight,
        b: clusters[i].reduce((sum, color) => sum + color.lab.b * color.weight, 0) / totalWeight
      };
      
      if (labDistance(centroids[i], newCentroid) > 0.1) {
        centroidsChanged = true;
      }
      centroids[i] = newCentroid;
    }
    
    if (!centroidsChanged) break;
  }
  
  // Return cluster centers with their total weights
  const finalClusters: Array<Array<typeof colors[0]>> = Array.from({ length: k }, () => []);
  
  // Assign colors to final centroids
  for (const color of colors) {
    let minDistance = Infinity;
    let nearestCentroid = 0;
    
    for (let i = 0; i < k; i++) {
      const distance = labDistance(color.lab, centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCentroid = i;
      }
    }
    
    finalClusters[nearestCentroid].push(color);
  }
  
  return centroids.map((centroid, i) => {
    const cluster = finalClusters[i];
    const totalWeight = cluster.reduce((sum: number, color) => sum + color.weight, 0);
    const rgb = labToRgb(centroid.l, centroid.a, centroid.b);
    return { center: centroid, rgb, weight: totalWeight };
  }).sort((a, b) => b.weight - a.weight);
};

const extractPaletteFromImageData = (imageData: ImageData, maxColors: number = 8): string[] => {
  const data = imageData.data;
  const colorMap = new Map<string, { lab: { l: number; a: number; b: number }; rgb: { r: number; g: number; b: number }; weight: number }>();
  
  // Sample pixels and convert to LAB
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 140) continue;
    
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Skip very dark or very light colors
    const brightness = (r + g + b) / 3;
    if (brightness < 20 || brightness > 235) continue;
    
    const key = `${r},${g},${b}`;
    const existing = colorMap.get(key);
    
    if (existing) {
      existing.weight += 1;
    } else {
      const lab = rgbToLab(r, g, b);
      // Weight by saturation (more colorful = higher weight)
      const saturation = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
      const weight = 1 + Math.min(2, saturation / 50);
      
      colorMap.set(key, { lab, rgb: { r, g, b }, weight });
    }
  }
  
  const colors = Array.from(colorMap.values());
  if (colors.length === 0) return ["#777777"];
  
  // Use k-means clustering
  const k = Math.min(maxColors, colors.length);
  const clusters = kMeansClustering(colors, k);
  
  return clusters.map(cluster => rgbToHex(cluster.rgb.r, cluster.rgb.g, cluster.rgb.b));
};

const pickDistinctColors = (palette: string[], count: number, minDistance: number): string[] => {
  const picked: string[] = [];
  
  for (const hex of palette) {
    const rgb = hexToRgb(hex);
    if (!rgb) continue;
    
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    let ok = true;
    
    for (const prev of picked) {
      const prgb = hexToRgb(prev)!;
      const plab = rgbToLab(prgb.r, prgb.g, prgb.b);
      const distance = labDistance(lab, plab);
      
      if (distance < minDistance * 100) { // Scale for LAB space
        ok = false;
        break;
      }
    }
    
    if (ok) {
      picked.push(hex);
      if (picked.length === count) break;
    }
  }
  
  if (picked.length < count) {
    for (const hex of palette) {
      if (!picked.includes(hex)) {
        picked.push(hex);
        if (picked.length === count) break;
      }
    }
  }
  
  return picked;
};

export const extractTeamColorsFromImage = async (src: string): Promise<{ primary: string; secondary: string; accent: string }> => {
  const img = await loadImageElement(src);
  const data = getImageDataFromImage(img, 160);
  const palette = extractPaletteFromImageData(data, 8);
  const distinct = pickDistinctColors(palette, 3, 0.3);
  const [primary, secondary, accent] = distinct.length >= 3 ? distinct : ["#1d4ed8", "#dc2626", "#ffd700"];
  return { primary, secondary, accent };
};