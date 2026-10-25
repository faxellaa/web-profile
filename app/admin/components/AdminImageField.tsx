'use client';

import { ImageOff } from 'lucide-react';

type AdminImageFieldProps = {
  label: string;
  imageUrl?: string | null;
  file: File | null;
  removeImage: boolean;
  allowRemoveImage?: boolean;
  onFileChange: (file: File | null) => void;
  onRemoveImage: () => void;
  onRestoreImage: () => void;
  unavailableLabel: string;
  chooseImageLabel: string;
  removeImageLabel: string;
  restoreImageLabel: string;
};

export default function AdminImageField({
  label,
  imageUrl,
  file,
  removeImage,
  allowRemoveImage = true,
  onFileChange,
  onRemoveImage,
  onRestoreImage,
  unavailableLabel,
  chooseImageLabel,
  removeImageLabel,
  restoreImageLabel,
}: AdminImageFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold">{label}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {imageUrl && !removeImage ? (
          <img src={imageUrl} alt="" className="h-28 w-full shrink-0 rounded-xl bg-blue-50 object-cover dark:bg-slate-800 sm:w-40" />
        ) : (
          <div role="img" aria-label={unavailableLabel} className="flex h-28 w-full shrink-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2 text-center text-xs font-medium text-slate-400 dark:border-white/10 dark:bg-slate-900 dark:text-slate-500 sm:w-40">
            <ImageOff aria-hidden="true" className="h-6 w-6" />
            <span>{unavailableLabel}</span>
          </div>
        )}
        <div className="min-w-0 space-y-2">
          <label className="grid gap-2 text-xs font-bold">
            {chooseImageLabel}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border bg-slate-50 p-2.5 text-sm font-normal dark:border-white/10 dark:bg-slate-900"
            />
          </label>
          {file && <p className="break-all text-xs text-slate-500 dark:text-slate-400">{file.name}</p>}
          {imageUrl && allowRemoveImage && (
            <button
              type="button"
              onClick={removeImage ? onRestoreImage : onRemoveImage}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20"
            >
              {removeImage ? restoreImageLabel : removeImageLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
