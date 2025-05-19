export async function compressImage(file, resolution, qualityFactor) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(event) {
      try {
        const img = new Image();
        img.onload = function() {
          const [targetWidth, targetHeight] = getResolutionDimensions(resolution);

          const dimensions = calculateAspectRatioFit(
            img.width,
            img.height,
            targetWidth,
            targetHeight
          );

          const canvas = document.createElement('canvas');
          canvas.width = dimensions.width;
          canvas.height = dimensions.height;
          const ctx = canvas.getContext('2d');

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

          const imageQuality = Math.max(0.1, Math.min(0.92, qualityFactor));
          const dataUrl = canvas.toDataURL('image/jpeg', imageQuality);

          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const compressedName = `compressed_${file.name}`;
              resolve({ name: compressedName, dataUrl, blob });
            })
            .catch(reject);
        };

        img.onerror = reject;
        img.src = event.target.result;
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getResolutionDimensions(resolution) {
  switch (resolution) {
    case '360': return [640, 360];
    case '480': return [854, 480];
    case '720': return [1280, 720];
    case '1080': return [1920, 1080];
    case '1440': return [2560, 1440];
    case '2160': return [3840, 2160];
    default: return [1920, 1080];
  }
}

export function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: srcWidth * ratio, height: srcHeight * ratio };
}