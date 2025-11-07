import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getUserImages, createImage } from "./db";
import { storagePut } from "./storage";
import sharp from "sharp";
import fetch from "node-fetch";

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

// Helper function to calculate color distance (Euclidean distance in RGB space)
function colorDistance(color1: [number, number, number], color2: [number, number, number]): number {
  const dr = color1[0] - color2[0];
  const dg = color1[1] - color2[1];
  const db = color1[2] - color2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Helper function to find the closest color in a palette
function findClosestColor(
  targetColor: [number, number, number],
  palette: Array<{ hex: string; rgb: [number, number, number]; name: string }>
): { hex: string; name: string } {
  let closest = palette[0];
  let minDistance = colorDistance(targetColor, palette[0].rgb);
  for (let i = 1; i < palette.length; i++) {
    const distance = colorDistance(targetColor, palette[i].rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closest = palette[i];
    }
  }
  return { hex: closest.hex, name: closest.name };
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Image pixelation feature
  image: router({
    // Get user's image history
    list: protectedProcedure.query(({ ctx }) =>
      getUserImages(ctx.user.id)
    ),
    
    // Pixelate an image
    pixelate: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().url(),
          pixelSize: z.number().int().min(1).max(100),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Fetch the image from URL (data URL or regular URL)
          let buffer: Buffer;
          
          if (input.imageUrl.startsWith("data:")) {
            // Handle data URL
            const base64Data = input.imageUrl.split(",")[1];
            buffer = Buffer.from(base64Data, "base64");
          } else {
            // Handle regular URL
            const response = await fetch(input.imageUrl);
            if (!response.ok) {
              throw new Error("Failed to fetch image");
            }
            buffer = await response.buffer();
          }
          
          // Get image metadata
          const metadata = await sharp(buffer).metadata();
          const { width = 800, height = 600 } = metadata;
          
          // Pixelate by resizing down and back up
          const pixelSize = Math.max(1, Math.round(input.pixelSize));
          const smallWidth = Math.ceil(width / pixelSize);
          const smallHeight = Math.ceil(height / pixelSize);
          
          const pixelatedBuffer = await sharp(buffer)
            .resize(smallWidth, smallHeight, {
              fit: "fill",
              withoutEnlargement: false,
            })
            .resize(width, height, {
              fit: "fill",
              withoutEnlargement: false,
            })
            .png()
            .toBuffer();
          
          // Upload to S3
          const fileKey = `pixelated/${ctx.user.id}/${Date.now()}-pixelated.png`;
          const { url: pixelatedUrl } = await storagePut(
            fileKey,
            pixelatedBuffer,
            "image/png"
          );
          
          return {
            pixelatedUrl,
            width,
            height,
          };
        } catch (error) {
          console.error("Pixelation error:", error);
          throw new Error("Failed to pixelate image");
        }
      }),

    // Generate bead preview with custom color palette
    generateBeadPreviewWithPalette: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().url(),
          pixelSize: z.number().int().min(1).max(100),
          colorPalette: z.array(z.object({
            hex: z.string(),
            name: z.string().optional(),
          })).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Fetch the image
          let buffer: Buffer;
          
          if (input.imageUrl.startsWith("data:")) {
            const base64Data = input.imageUrl.split(",")[1];
            buffer = Buffer.from(base64Data, "base64");
          } else {
            const response = await fetch(input.imageUrl);
            if (!response.ok) {
              throw new Error("Failed to fetch image");
            }
            buffer = await response.buffer();
          }
          
          // Get image metadata
          const metadata = await sharp(buffer).metadata();
          const { width = 800, height = 600 } = metadata;
          
          // Create bead grid
          const beadSize = Math.max(5, input.pixelSize);
          const cols = Math.ceil(width / beadSize);
          const rows = Math.ceil(height / beadSize);
          
          // Resize image to match bead grid
          const gridImage = await sharp(buffer)
            .resize(cols, rows, {
              fit: "fill",
              withoutEnlargement: false,
            })
            .raw()
            .toBuffer({ resolveWithObject: true });
          
          const { data: pixelData } = gridImage;
          
          // Parse color palette
          const palette = input.colorPalette && input.colorPalette.length > 0
            ? input.colorPalette.map(c => ({
                hex: c.hex,
                rgb: hexToRgb(c.hex),
                name: c.name || c.hex,
              }))
            : null;
          
          // Create SVG with bead circles
          let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
          svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;
          
          const radius = beadSize / 2.2;
          const colorMap = new Map<string, { count: number; rgb: [number, number, number]; name: string }>();
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const pixelIndex = (row * cols + col) * 3;
              const r = pixelData[pixelIndex];
              const g = pixelData[pixelIndex + 1];
              const b = pixelData[pixelIndex + 2];
              
              // Find closest color in palette or use original color
              let color: string;
              let colorName: string;
              
              if (palette && palette.length > 0) {
                const closest = findClosestColor([r, g, b], palette);
                color = closest.hex;
                colorName = closest.name;
              } else {
                color = `rgb(${r},${g},${b})`;
                colorName = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
              }
              
              // Count colors
              if (colorMap.has(colorName)) {
                colorMap.get(colorName)!.count++;
              } else {
                colorMap.set(colorName, {
                  count: 1,
                  rgb: [r, g, b],
                  name: colorName,
                });
              }
              
              const cx = col * beadSize + beadSize / 2;
              const cy = row * beadSize + beadSize / 2;
              
              svgContent += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>`;
            }
          }
          
          svgContent += `</svg>`;
          
          // Convert SVG to PNG
          const beadPreviewBuffer = await sharp(Buffer.from(svgContent))
            .png()
            .toBuffer();
          
          // Upload to S3
          const fileKey = `bead-preview/${ctx.user.id}/${Date.now()}-bead-preview.png`;
          const { url: beadPreviewUrl } = await storagePut(
            fileKey,
            beadPreviewBuffer,
            "image/png"
          );
          
          // Convert color map to array and sort by count
          const beadColors = Array.from(colorMap.entries())
            .map(([name, data]) => ({
              hex: name,
              rgb: data.rgb,
              count: data.count,
              percentage: Math.round((data.count / (cols * rows)) * 100 * 100) / 100,
            }))
            .sort((a, b) => b.count - a.count);
          
          const totalBeads = cols * rows;
          
          return {
            beadPreviewUrl,
            width,
            height,
            beadColors,
            totalBeads,
            uniqueColors: beadColors.length,
            gridSize: { cols, rows },
          };
        } catch (error) {
          console.error("Bead preview generation error:", error);
          throw new Error("Failed to generate bead preview");
        }
      }),

    // Generate bead preview
    generateBeadPreview: protectedProcedure
      .input(
        z.object({
          pixelatedImageUrl: z.string().url(),
          beadSize: z.number().int().min(1).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Fetch the pixelated image
          let buffer: Buffer;
          
          if (input.pixelatedImageUrl.startsWith("data:")) {
            // Handle data URL
            const base64Data = input.pixelatedImageUrl.split(",")[1];
            buffer = Buffer.from(base64Data, "base64");
          } else {
            // Handle regular URL
            const response = await fetch(input.pixelatedImageUrl);
            if (!response.ok) {
              throw new Error("Failed to fetch pixelated image");
            }
            buffer = await response.buffer();
          }
          
          // Get image metadata
          const metadata = await sharp(buffer).metadata();
          const { width = 800, height = 600 } = metadata;
          
          // Create bead preview by drawing circles on a canvas-like image
          // We'll create an SVG that overlays circles on the pixelated image
          const beadSize = Math.max(5, input.beadSize);
          const cols = Math.ceil(width / beadSize);
          const rows = Math.ceil(height / beadSize);
          
          // Create a new image with bead circles
          // First, resize the pixelated image to match the bead grid
          const gridImage = await sharp(buffer)
            .resize(cols, rows, {
              fit: "fill",
              withoutEnlargement: false,
            })
            .raw()
            .toBuffer({ resolveWithObject: true });
          
          const { data, info } = gridImage;
          const pixelData = data;
          
          // Create SVG with bead circles
          let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
          svgContent += `<rect width="${width}" height="${height}" fill="white"/>`;
          
          const radius = beadSize / 2.2; // Slightly smaller than the grid size
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const pixelIndex = (row * cols + col) * 3;
              const r = pixelData[pixelIndex];
              const g = pixelData[pixelIndex + 1];
              const b = pixelData[pixelIndex + 2];
              
              const color = `rgb(${r},${g},${b})`;
              const cx = col * beadSize + beadSize / 2;
              const cy = row * beadSize + beadSize / 2;
              
              svgContent += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>`;
            }
          }
          
          svgContent += `</svg>`;
          
          // Convert SVG to PNG
          const beadPreviewBuffer = await sharp(Buffer.from(svgContent))
            .png()
            .toBuffer();
          
          // Upload bead preview to S3
          const fileKey = `bead-preview/${ctx.user.id}/${Date.now()}-bead-preview.png`;
          const { url: beadPreviewUrl } = await storagePut(
            fileKey,
            beadPreviewBuffer,
            "image/png"
          );
          
          return {
            beadPreviewUrl,
            width,
            height,
          };
        } catch (error) {
          console.error("Bead preview generation error:", error);
          throw new Error("Failed to generate bead preview");
        }
      }),

    // Analyze bead colors and count
    analyzeBeadColors: protectedProcedure
      .input(
        z.object({
          pixelatedImageUrl: z.string().url(),
          beadSize: z.number().int().min(1).max(100),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Fetch the pixelated image
          let buffer: Buffer;
          
          if (input.pixelatedImageUrl.startsWith("data:")) {
            // Handle data URL
            const base64Data = input.pixelatedImageUrl.split(",")[1];
            buffer = Buffer.from(base64Data, "base64");
          } else {
            // Handle regular URL
            const response = await fetch(input.pixelatedImageUrl);
            if (!response.ok) {
              throw new Error("Failed to fetch pixelated image");
            }
            buffer = await response.buffer();
          }
          
          // Get image metadata
          const metadata = await sharp(buffer).metadata();
          const { width = 800, height = 600 } = metadata;
          
          // Create bead grid
          const beadSize = Math.max(5, input.beadSize);
          const cols = Math.ceil(width / beadSize);
          const rows = Math.ceil(height / beadSize);
          
          // Resize image to match bead grid
          const gridImage = await sharp(buffer)
            .resize(cols, rows, {
              fit: "fill",
              withoutEnlargement: false,
            })
            .raw()
            .toBuffer({ resolveWithObject: true });
          
          const { data: pixelData } = gridImage;
          
          // Count colors
          const colorMap = new Map<string, { count: number; rgb: [number, number, number] }>();
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const pixelIndex = (row * cols + col) * 3;
              const r = pixelData[pixelIndex];
              const g = pixelData[pixelIndex + 1];
              const b = pixelData[pixelIndex + 2];
              
              // Create a hex color key
              const colorKey = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
              
              if (colorMap.has(colorKey)) {
                const existing = colorMap.get(colorKey)!;
                existing.count++;
              } else {
                colorMap.set(colorKey, {
                  count: 1,
                  rgb: [r, g, b],
                });
              }
            }
          }
          
          // Convert to array and sort by count (descending)
          const beadColors = Array.from(colorMap.entries())
            .map(([hex, data]) => ({
              hex,
              rgb: data.rgb,
              count: data.count,
              percentage: Math.round((data.count / (cols * rows)) * 100 * 100) / 100,
            }))
            .sort((a, b) => b.count - a.count);
          
          const totalBeads = cols * rows;
          
          return {
            beadColors,
            totalBeads,
            uniqueColors: beadColors.length,
            gridSize: { cols, rows },
          };
        } catch (error) {
          console.error("Bead color analysis error:", error);
          throw new Error("Failed to analyze bead colors");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
