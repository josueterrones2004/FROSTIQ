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
    <div className="fixed inset-0 frost-crop-overlay-z bg-frost-bg lg:flex lg:items-center lg:justify-center lg:bg-black/80 lg:p-6 lg:backdrop-blur-sm">
      <style>{`
        .frost-crop-overlay-z { z-index: 200; }
        @media (min-width: 1024px) {
          .frost-crop-dialog-max-height { max-height: 90dvh; }
          .frost-crop-canvas-height { height: 500px; }
        }
      `}</style>
      <div className="flex h-dvh w-full flex-col bg-frost-bg lg:h-auto frost-crop-dialog-max-height lg:max-w-3xl lg:overflow-hidden lg:rounded-2xl lg:border lg:border-frost-border">
        {/* HEADER */}

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-frost-border px-4">
          <button
            type="button"
            onClick={
              onCancel
            }
            className="rounded-full p-2 text-frost-text hover:bg-frost-surface"
            aria-label="Cancelar"
          >
            <X
              size={21}
            />
          </button>

          <h2 className="font-semibold text-frost-text">
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
            className="flex items-center gap-1.5 rounded-full bg-frost-text px-4 py-2 text-sm font-semibold text-frost-bg disabled:opacity-40"
          >
            <Check
              size={15}
            />

            Aplicar
          </button>
        </header>

        {/* CROPPER */}

        <div className="relative min-h-0 flex-1 bg-black frost-crop-canvas-height lg:flex-none">
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

        <div className="shrink-0 border-t border-frost-border px-5 py-5">
          <div className="flex items-center gap-4">
            <Minus
              size={17}
              className="text-frost-muted"
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
              className="w-full accent-frost-accent"
              aria-label="Zoom"
            />

            <Plus
              size={17}
              className="text-frost-muted"
            />
          </div>
        </div>
      </div>
    </div>
  );
}