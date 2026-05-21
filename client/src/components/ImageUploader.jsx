import { ImagePlus, ScanText } from 'lucide-react';

export default function ImageUploader({ mode, preview, isExtracting, onFileChange, onExtract }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <label className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center transition hover:bg-emerald-50">
        <ImagePlus className="text-emerald-700" size={34} />
        <span className="mt-4 text-lg font-black text-slate-950">
          {mode === 'camera' ? 'Prendre une photo' : 'Importer une image'}
        </span>
        <span className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
          Utilisez une photo nette de la liste d’ingrédients. Vous pourrez corriger le texte avant l’analyse.
        </span>
        <input
          type="file"
          accept="image/*"
          capture={mode === 'camera' ? 'environment' : undefined}
          onChange={onFileChange}
          className="sr-only"
        />
      </label>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        {preview ? (
          <img src={preview} alt="Aperçu des ingrédients" className="h-[260px] w-full rounded-2xl bg-slate-50 object-contain" />
        ) : (
          <div className="grid h-[260px] place-items-center rounded-2xl bg-slate-50 text-center text-sm text-slate-500">
            Aucun aperçu pour le moment
          </div>
        )}
        <button
          type="button"
          onClick={onExtract}
          disabled={!preview || isExtracting}
          className="primary-btn mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 font-black disabled:opacity-50"
        >
          <ScanText size={19} />
          {isExtracting ? 'Extraction en cours' : 'Extraire le texte avec EasyOCR'}
        </button>
      </div>
    </div>
  );
}
