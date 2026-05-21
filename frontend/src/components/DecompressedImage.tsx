import React, { useState, useEffect } from 'react';
import { decompressGzipArrayBuffer } from '../lib/compression';
import api from '../api/client';
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
  const [imgSrc, setImgSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!photoUrl) {
      setImgSrc('');
      return;
    }

    // If it's already a base64 string or is not a GZIP file URL
    if (photoUrl.startsWith('data:')) {
      setImgSrc(photoUrl);
      return;
    }

    const fullUrl = photoUrl.startsWith('http') ? photoUrl : `http://localhost:8080${photoUrl}`;

    // Return immediately if already cached
    if (decompressedCache[fullUrl]) {
      setImgSrc(decompressedCache[fullUrl]);
      return;
    }

    let active = true;
    const fetchImage = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await api.get(fullUrl, { responseType: 'arraybuffer' });
        const decompressed = await decompressGzipArrayBuffer(response.data);
        
        if (active) {
          decompressedCache[fullUrl] = decompressed;
          setImgSrc(decompressed);
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
  }, [photoUrl]);

  if (!photoUrl || error) {
    return (
      <div className={`flex items-center justify-center bg-[#f7f4ef] text-[#a09080] ${className}`}>
        <User size={fallbackIconSize} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-[#f7f4ef]/50 animate-pulse ${className}`}>
        <div className="h-4 w-4 rounded-full border-2 border-[#2d6a4f] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <img src={imgSrc} className={className} alt="" {...props} />;
};

export default DecompressedImage;
