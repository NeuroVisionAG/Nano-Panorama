
interface FileConversionResult {
  base64: string;
  mimeType: string;
}

/**
 * Creates a 16:9 canvas, places the uploaded image in the center (scaled to fit),
 * and returns the result as a base64 PNG string.
 * This prepares the image for an "outpainting" task robustly for any aspect ratio.
 */
export const createImageTemplate = (file: File): Promise<FileConversionResult> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src); // Clean up object URL
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Не удалось получить контекст холста'));
      }

      const TARGET_WIDTH = 1280;
      const TARGET_HEIGHT = 720;
      const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT;

      canvas.width = TARGET_WIDTH;
      canvas.height = TARGET_HEIGHT;

      const originalWidth = img.width;
      const originalHeight = img.height;
      const originalAspectRatio = originalWidth / originalHeight;

      let drawWidth = originalWidth;
      let drawHeight = originalHeight;

      // Fit image within target dimensions, preserving aspect ratio
      if (originalAspectRatio > TARGET_ASPECT_RATIO) {
        // Image is wider than target, so fit to width
        drawWidth = TARGET_WIDTH;
        drawHeight = TARGET_WIDTH / originalAspectRatio;
      } else {
        // Image is taller than or same aspect as target, so fit to height
        drawHeight = TARGET_HEIGHT;
        drawWidth = TARGET_HEIGHT * originalAspectRatio;
      }

      // Center the image on the canvas
      const offsetX = (TARGET_WIDTH - drawWidth) / 2;
      const offsetY = (TARGET_HEIGHT - drawHeight) / 2;

      // Draw the scaled image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Export the canvas to a base64 PNG string
      const dataUrl = canvas.toDataURL('image/png');
      const parts = dataUrl.split(',');
      if (parts.length !== 2) {
        return reject(new Error('Неверный формат Data URL при создании шаблона'));
      }
      
      resolve({ base64: parts[1], mimeType: 'image/png' });
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      reject(error);
    };
  });
};
