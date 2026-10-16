"use client";

import {
  Check,
  Minus,
  Plus,
  X,
} from "lucide-react";

import {
  useCallback,
  useState,
} from "react";

import Cropper, {
  type Area,
} from "react-easy-crop";

export type SavedCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface ImageCropModalProps {
  image:
    string;

  type:
    | "avatar"
    | "banner";

  onCancel:
    () => void;

  onApply:
    (
      crop:
        SavedCrop
    ) => void;
}

export default function ImageCropModal({
  image,
  type,
  onCancel,
  onApply,
}: ImageCropModalProps) {
  const [
    crop,
    setCrop,
  ] =
    useState({
      x: 0,
      y: 0,
    });

  const [
    zoom,
    setZoom,
  ] =
    useState(
      1
    );

  const [
    croppedArea,
    setCroppedArea,
  ] =
    useState<
      Area |
      null
    >(
      null
    );

  const handleCropComplete =
    useCallback(
      (
        areaPercentages:
          Area
      ) => {
        setCroppedArea(
          areaPercentages
        );
      },
      []
    );

  function applyCrop() {
    if (
      !croppedArea
    ) {
      return;
    }

    onApply({
      x:
        croppedArea.x,

      y:
        croppedArea.y,

      width:
        croppedArea.width,

      height:
        croppedArea.height,
    });
  }

  const aspect =
    type ===
    "avatar"
      ? 1
      : 3 / 1;

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 lg:flex lg:items-center lg:justify-center lg:bg-black/80 lg:p-6 lg:backdrop-blur-sm">
      <div className="flex h-[100dvh] w-full flex-col bg-zinc-950 lg:h-auto lg:max-h-[90dvh] lg:max-w-3xl lg:overflow-hidden lg:rounded-2xl lg:border lg:border-zinc-800">
        {/* HEADER */}

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
          <button
            type="button"
            onClick={
              onCancel
            }
            className="rounded-full p-2 text-zinc-300 hover:bg-zinc-900"
            aria-label="Cancelar"
          >
            <X
              size={21}
            />
          </button>

          <h2 className="font-semibold text-zinc-100">
            {type ===
            "avatar"
              ? "Ajustar foto"
              : "Ajustar banner"}
          </h2>

          <button
            type="button"
            onClick={
              applyCrop
            }
            disabled={
              !croppedArea
            }
            className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-40"
          >
            <Check
              size={15}
            />

            Aplicar
          </button>
        </header>

        {/* CROPPER */}

        <div className="relative min-h-0 flex-1 bg-black lg:h-[500px] lg:flex-none">
          <Cropper
            image={
              image
            }
            crop={
              crop
            }
            zoom={
              zoom
            }
            aspect={
              aspect
            }
            cropShape={
              type ===
              "avatar"
                ? "round"
                : "rect"
            }
            showGrid={
              false
            }
            objectFit="contain"
            onCropChange={
              setCrop
            }
            onZoomChange={
              setZoom
            }
            onCropComplete={
              handleCropComplete
            }
          />
        </div>

        {/* ZOOM */}

        <div className="shrink-0 border-t border-zinc-800 px-5 py-5">
          <div className="flex items-center gap-4">
            <Minus
              size={17}
              className="text-zinc-600"
            />

            <input
              type="range"
              min={
                1
              }
              max={
                4
              }
              step={
                0.01
              }
              value={
                zoom
              }
              onChange={(
                event
              ) =>
                setZoom(
                  Number(
                    event.target.value
                  )
                )
              }
              className="w-full accent-fuchsia-500"
              aria-label="Zoom"
            />

            <Plus
              size={17}
              className="text-zinc-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}