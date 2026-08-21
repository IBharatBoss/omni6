// src/tools/img-compress.js
export default {
  id: "img-compress",
  title: "Image Compressor",
  category: "Image",
  icon: "🗜️",
  accept: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/bmp"],
  keywords: ["compress", "shrink", "reduce", "size", "kb", "mb", "optimize", "image", "photo"],
  description: "Reduce file size up to 90% via intelligent resolution scaling and adaptive quantization.",
  
  options: [
    {
      id: "maxDimension",
      label: "Max Resolution (px)",
      type: "range",
      min: 400,
      max: 3840,
      step: 100,
      default: 1920,
      unit: "px"
    },
    {
      id: "quality",
      label: "Compression Quality",
      type: "range",
      min: 5,
      max: 95,
      default: 75,
      unit: "%"
    }
  ],

  async execute(file, options, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      onProgress(10);
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        onProgress(30);
        
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        const maxDim = (options && options.maxDimension) || 1920;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // If JPEG or user-specified, fill background
        if (file.type === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);
        onProgress(65);
        
        const quality = ((options && options.quality) || 75) / 100;
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Compression encoding failed'));
          }
          onProgress(100);
          
          let ext = file.name.split('.').pop();
          if (!ext || ext.length > 4) ext = 'jpg';

          resolve({
            blob: blob,
            fileName: file.name.replace(/\.[^/.]+$/, "") + "_compressed." + ext,
            originalSize: file.size,
            processedSize: blob.size
          });
        }, mimeType, quality);
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image file'));
      };

      img.src = url;
    });
  }
};
