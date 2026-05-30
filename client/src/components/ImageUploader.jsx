import { Camera, ImagePlus, ScanText, UploadCloud } from 'lucide-react';

export default function ImageUploader({ mode, preview, isExtracting, showReadButton = true, onFileChange, onExtract, onCameraOpen }) {
  const isCamera = mode === 'camera';

  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      {isCamera ? (
        <div className="group flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[#a8cfa5] bg-[#f7f8f6] p-6 text-center transition hover:border-[#008f45] hover:bg-white">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#008f45] shadow-sm ring-1 ring-[#dfe8df] transition group-hover:scale-105">
            <Camera className="h-8 w-8" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-xl font-extrabold text-[#1d252b]">Prendre une photo</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Utilisez une photo nette et proche de la liste des ingrédients.</p>
          <button type="button" onClick={onCameraOpen} disabled={isExtracting} className="primary-btn mt-5">
            <Camera className="h-4 w-4" aria-hidden="true" />
            Prendre une photo
          </button>
        </div>
      ) : (
        <label className="group flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[#a8cfa5] bg-[#f7f8f6] p-6 text-center transition hover:border-[#008f45] hover:bg-white focus-within:ring-4 focus-within:ring-[#a8cfa5]/35">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#008f45] shadow-sm ring-1 ring-[#dfe8df] transition group-hover:scale-105">
            <UploadCloud className="h-8 w-8" aria-hidden="true" />
          </span>
          <span className="mt-5 text-xl font-extrabold text-[#1d252b]">Importer une image</span>
          <span className="mt-2 max-w-sm text-sm leading-6 text-slate-600">Utilisez une photo nette et proche de la liste des ingrédients.</span>
          <span className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#008f45] shadow-sm ring-1 ring-[#dfe8df]">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Importer une image
          </span>
          <input type="file" accept="image/*" onChange={onFileChange} disabled={isExtracting} className="sr-only" />
        </label>
      )}

      <div className="soft-card p-4">
        {preview ? (
          <img src={preview} alt="Aperçu de l’image à analyser" className="h-[280px] w-full rounded-[1.25rem] bg-[#f7f8f6] object-contain" />
        ) : (
          <div className="grid h-[280px] place-items-center rounded-[1.25rem] border border-[#dfe8df] bg-[#f7f8f6] p-6 text-center">
            <div>
              <ImagePlus className="mx-auto h-10 w-10 text-[#a8cfa5]" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-500">L’aperçu de l’image apparaîtra ici.</p>
            </div>
          </div>
        )}
        {showReadButton ? (
          <button type="button" onClick={onExtract} disabled={!preview || isExtracting} className="primary-btn mt-4 w-full">
            <ScanText size={19} aria-hidden="true" />
            {isExtracting ? 'Lecture en cours...' : 'Lire l’étiquette'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
