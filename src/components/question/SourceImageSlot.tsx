import { useEffect, useRef, useState } from 'react';
import {
  getCachedSourceImageStatus,
  markSourceImageStatus,
  preloadSourceImage,
  type SourceImageStatus,
} from '../../utils/sourceImageUtils.ts';
import { ImagePlaceholderIcon } from '../common/Icons.tsx';

interface SourceImageSlotProps {
  src: string;
  alt: string;
  variant: 'question' | 'key';
  placeholderLabel: string;
}

export function SourceImageSlot({
  src,
  alt,
  variant,
  placeholderLabel,
}: SourceImageSlotProps) {
  const [status, setStatus] = useState<SourceImageStatus>(() =>
    getCachedSourceImageStatus(src),
  );
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (status !== 'loading') return;

    let active = true;
    const imgElement = imgRef.current;

    if (imgElement?.complete && imgElement.naturalWidth > 0) {
      markSourceImageStatus(src, 'loaded');
      setStatus('loaded');
      return;
    }

    void preloadSourceImage(src).then((nextStatus) => {
      if (active) {
        setStatus(nextStatus);
      }
    });

    return () => {
      active = false;
    };
  }, [src, status]);

  const handleLoad = () => {
    if (status === 'loaded') return;
    markSourceImageStatus(src, 'loaded');
    setStatus('loaded');
  };

  const handleError = () => {
    markSourceImageStatus(src, 'error');
    setStatus('error');
  };

  return (
    <figure className="min-w-0">
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className={`edit-source-frame ${
          variant === 'key' ? 'edit-source-frame-key' : 'edit-source-frame-question'
        } ${status === 'loaded' ? 'edit-source-frame-loaded' : ''}`}
      >
        {status !== 'loaded' && (
          <span
            className={`edit-source-placeholder ${
              status === 'error' ? 'edit-source-placeholder-error' : ''
            }`}
            role={status === 'error' ? 'status' : undefined}
          >
            <ImagePlaceholderIcon className="h-5 w-5 shrink-0 opacity-70" />
            <span className="text-xs font-medium">
              {status === 'error' ? 'Image unavailable' : placeholderLabel}
            </span>
          </span>
        )}

        {status !== 'error' && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`edit-source-image ${
              status === 'loaded' ? 'edit-source-image-loaded' : ''
            }`}
          />
        )}
      </a>
    </figure>
  );
}
