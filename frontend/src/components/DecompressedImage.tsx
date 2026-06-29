import React, { useState, useEffect } from 'react';
import { decompressGzipArrayBuffer } from '../lib/compression';
import api, { getApiResourceUrl } from '../api/client';
import { User } from 'lucide-react';

interface DecompressedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  photoUrl?: string;
  fallbackIconSize?: number;
}

// Global in-memory cache for decompressed images to optimize rendering
const decompressedCache: Record<string, string> = {};

const DecompressedImage: React.FC<DecompressedImageProps> = ({
  photoUrl,
  fallbackIconSize = 24,
  className,
  ...props
}) => {
  const [decompressedImage, setDecompressedImage] = useState<{ url: string; src: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const imageUrl = photoUrl ? getApiResourceUrl(photoUrl) : '';
  const isCompressedImage = Boolean(photoUrl && !photoUrl.startsWith('data:') && photoUrl.toLowerCase().endsWith('.gz'));
  const isDatabaseImage = Boolean(photoUrl && photoUrl.startsWith('/api/upload/photo/'));
  const needsLoading = isCompressedImage || isDatabaseImage;

  useEffect(() => {
    if (!photoUrl || !needsLoading) {
      return;
    }

    let active = true;
    const fetchImage = async () => {
      const cachedSrc = decompressedCache[imageUrl];
      setLoading(!cachedSrc);
      setError(false);

      if (cachedSrc) {
        setDecompressedImage({ url: imageUrl, src: cachedSrc });
        setLoading(false);
        return;
      }

      try {
        if (isDatabaseImage) {
          const response = await api.get<string>(photoUrl);
          const base64Data = response.data;
          if (active) {
            decompressedCache[imageUrl] = base64Data;
            setDecompressedImage({ url: imageUrl, src: base64Data });
          }
        } else {
          const response = await api.get(photoUrl, { responseType: 'arraybuffer' });
          const decompressed = await decompressGzipArrayBuffer(response.data);
          if (active) {
            decompressedCache[imageUrl] = decompressed;
            setDecompressedImage({ url: imageUrl, src: decompressed });
          }
        }
      } catch (err) {
        console.error('Failed to load or decompress image:', err);
        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      active = false;
    };
  }, [imageUrl, needsLoading, photoUrl, isDatabaseImage]);

  if (!photoUrl || ((isCompressedImage || isDatabaseImage) && error)) {
    return (
      <div className={`flex items-center justify-center bg-[#f7f4ef] text-[#a09080] ${className}`}>
        <User size={fallbackIconSize} />
      </div>
    );
  }

  if (!isCompressedImage && !isDatabaseImage) {
    return <img src={imageUrl} className={className} alt="" {...props} />;
  }

  const decompressedSrc = decompressedImage?.url === imageUrl ? decompressedImage.src : '';

  if (loading || !decompressedSrc) {
    return (
      <div className={`flex items-center justify-center bg-[#f7f4ef]/50 animate-pulse ${className}`}>
        <div className="h-4 w-4 rounded-full border-2 border-[#2d6a4f] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <img src={decompressedSrc} className={className} alt="" {...props} />;
};

export default DecompressedImage;
