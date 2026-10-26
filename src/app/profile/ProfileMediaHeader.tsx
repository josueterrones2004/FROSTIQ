import Image from "next/image";
import type { ReactNode } from "react";

import {
  shouldUseOriginalImage,
} from "@/lib/image-optimization";

export type ProfileCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface CroppedProfileImageProps {
  src: string;
  crop: ProfileCrop | null;
  alt: string;
  className?: string;
}

function isValidCrop(
  crop: ProfileCrop | null,
): crop is ProfileCrop {
  if (!crop) {
    return false;
  }

  return (
    Number.isFinite(crop.x) &&
    Number.isFinite(crop.y) &&
    Number.isFinite(crop.width) &&
    Number.isFinite(crop.height) &&
    crop.x >= 0 &&
    crop.y >= 0 &&
    crop.width > 0 &&
    crop.height > 0 &&
    crop.width <= 100 &&
    crop.height <= 100 &&
    crop.x + crop.width <= 100.1 &&
    crop.y + crop.height <= 100.1
  );
}

export function CroppedProfileImage({
  src,
  crop,
  alt,
  className = "",
}: CroppedProfileImageProps) {
  if (!isValidCrop(crop)) {
    return (
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1200}
        unoptimized={shouldUseOriginalImage(src)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const imageWidth =
    (100 / crop.width) * 100;

  const left =
    -(crop.x / crop.width) * 100;

  const top =
    -(crop.y / crop.height) * 100;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={1200}
        unoptimized={shouldUseOriginalImage(src)}
        className={`absolute max-w-none ${className}`}
        style={{
          width: `${imageWidth}%`,
          height: "auto",
          left: `${left}%`,
          top: `${top}%`,
        }}
      />
    </div>
  );
}

interface ProfileMediaHeaderProps {
  banner: ReactNode;
  avatar: ReactNode;
  bannerControls?: ReactNode;
  avatarControls?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export default function ProfileMediaHeader({
  banner,
  avatar,
  bannerControls,
  avatarControls,
  action,
  children,
}: ProfileMediaHeaderProps) {
  return (
    <section id="perfil">
      <style>{`
        .frost-profile-banner {
          height: 175px;
        }

        @media (min-width: 640px) {
          .frost-profile-banner {
            height: 220px;
          }
        }

        @media (min-width: 1024px) {
          .frost-profile-banner {
            height: 300px;
          }
        }
      `}</style>

      {/* BANNER */}

      <div className="frost-profile-banner relative w-full overflow-hidden bg-frost-surface">
        {banner}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-frost-bg/60 to-transparent" />

        {bannerControls && (
          <div className="absolute inset-0 z-20">
            {bannerControls}
          </div>
        )}
      </div>

      {/* AVATAR + ACTION */}

      <div className="relative z-30 -mt-12 flex items-end justify-between px-4 lg:-mt-16 lg:px-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-frost-bg bg-frost-raised shadow-xl lg:h-30 lg:w-30">
          {avatar}

          {avatarControls}
        </div>

        {action && (
          <div className="pb-1">
            {action}
          </div>
        )}
      </div>

      {/* INFO */}

      <div className="px-4 pt-3 lg:px-6 lg:pt-4">
        {children}
      </div>
    </section>
  );
}