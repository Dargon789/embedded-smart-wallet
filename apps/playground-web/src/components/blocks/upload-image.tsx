"use client";

import { UploadIcon } from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const ALLOWED_IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function isValidImageFile(file: File) {
  const hasAllowedMimeType = ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase());
  const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.test(file.name);
  const hasAllowedSize = file.size > 0 && file.size <= MAX_IMAGE_SIZE_BYTES;

  return hasAllowedMimeType && hasAllowedExtension && hasAllowedSize;
}

export function UploadImage(props: {
  onImageUpload?: (file: File) => void;
  className?: string;
  size?: number;
  id?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setPreview((previousPreview) => {
      if (previousPreview) URL.revokeObjectURL(previousPreview);
      return objectUrl;
    });

    props.onImageUpload?.(file);
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: TODO
    // biome-ignore lint/a11y/noStaticElementInteractions: TODO
    <div
      className={cn(
        "relative aspect-square w-80 cursor-pointer overflow-hidden rounded-lg border",
        "ring-offset-background transition-colors hover:ring-2 hover:ring-ring hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        props.className,
      )}
      onClick={handleClick}
    >
      <input
        accept="image/*"
        className="hidden"
        id={props.id}
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="Preview"
          className="h-full w-full object-contain"
          src={preview}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-muted-foreground">
          <UploadIcon className="mb-2 h-8 w-8" />
          <p className="text-center text-sm">Upload Image</p>
        </div>
      )}
    </div>
  );
}
