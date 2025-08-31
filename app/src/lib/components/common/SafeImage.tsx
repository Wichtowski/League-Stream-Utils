"use client";

import Image from "next/image";
import React from "react";
import { ALLOWED_IMAGE_HOSTS } from "@lib/services/common/constants";

const ALLOWED = new Set<string>(ALLOWED_IMAGE_HOSTS);

type SafeImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
};

export const SafeImage = ({
  src,
  alt,
  width = 48,
  height = 48,
  className,
  priority,
  fill = false
}: SafeImageProps): React.ReactElement => {
  try {
    const url = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const isSameOrigin = typeof window !== "undefined" && url.origin === window.location.origin;
    const isLocalBase64 = typeof src === "string" && src.startsWith("data:");

    if (isSameOrigin || isLocalBase64 || ALLOWED.has(url.hostname)) {
      return (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
          fill={fill}
        />
      );
    }
  } catch {
    // fall through to fallback below
  }

  // As a last resort, try rendering as plain img for unknown but potentially valid external hosts
  try {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} referrerPolicy="no-referrer" />;
  } catch {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#374151",
          color: "#9CA3AF"
        }}
      >
        <span className="text-xs">Image host not allowed by policy</span>
      </div>
    );
  }
};
