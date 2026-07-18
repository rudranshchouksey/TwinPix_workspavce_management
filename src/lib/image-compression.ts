export async function compressImage(
  file: File,
  maxWidthOrHeight: number = 800
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    // We cannot easily compress GIFs on the client side with canvas without losing animation.
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round(height * (maxWidthOrHeight / width));
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round(width * (maxWidthOrHeight / height));
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // fallback to original file
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp for better compression, unless it's a PNG and we need transparency
        const targetType = file.type === "image/png" ? "image/png" : "image/webp";
        const quality = 0.85;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // fallback
              return;
            }
            
            // Reconstruct the file with the new blob data
            const fileName = file.name.replace(/\.[^/.]+$/, "") + (targetType === "image/webp" ? ".webp" : ".png");
            const compressedFile = new File([blob], fileName, {
              type: targetType,
              lastModified: Date.now(),
            });
            
            // If somehow the compression made it bigger (rare but possible for tiny files), use original
            if (compressedFile.size > file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          targetType,
          quality
        );
      };
      
      img.onerror = (error) => reject(error);
    };
    
    reader.onerror = (error) => reject(error);
  });
}
