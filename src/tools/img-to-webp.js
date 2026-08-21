// src/tools/img-to-webp.js
export default {
  id: "img-to-webp",
  title: "Image to WebP",
  category: "Image",
  icon: "🖼️",
  accept: ["image/jpeg", "image/png", "image/bmp", "image/svg+xml", "image/webp", "image/avif"],
  keywords: ["convert", "webp", "optimize", "compress", "image", "photo", "google"],
  description: "Convert and quantize images to modern, high-efficiency WebP format locally.",
  
  options: [
    {
      id: "quality",
      label: "Compression Quality",
      type: "range",
      min: 5,
      max: 100,
      default: 80,
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
        onProgress(35);
        
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        onProgress(70);
        
        const quality = ((options && options.quality) || 80) / 100;
        
        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('WebP quantization failed'));
          }
          onProgress(100);
          resolve({
            blob: blob,
            fileName: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            originalSize: file.size,
            processedSize: blob.size
          });
        }, 'image/webp', quality);
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to decode image: ' + (err.message || 'Corrupted file')));
      };

      img.src = url;
    });
  }
};
