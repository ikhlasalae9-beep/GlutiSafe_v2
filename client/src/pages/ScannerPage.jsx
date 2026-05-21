import { Camera, CloudUpload, FileImage, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import Button from '../components/Button.jsx';
import ResultCard from '../components/ResultCard.jsx';

export default function ScannerPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResult, setHasResult] = useState(true);

  const handleScan = () => {
    setHasResult(false);
    setIsAnalyzing(true);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setHasResult(true);
    }, 1400);
  };

  return (
    <div className="text-slate-950">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-10">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-bold text-teal-700 ring-1 ring-cyan-100">
                <Home className="h-4 w-4" aria-hidden="true" />
                Smart label review
              </span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Scan ingredients with more confidence.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Upload a product label and GlutiSafe will help identify ingredients that may require extra care.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xl shadow-slate-200/70 sm:p-6">
              <button
                type="button"
                onClick={handleScan}
                className="group flex min-h-72 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-200 bg-white px-6 py-10 text-center transition hover:border-cyan-400 hover:bg-cyan-50/40"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition group-hover:scale-105">
                  <CloudUpload className="h-8 w-8" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-xl font-black text-slate-950">Upload ingredient label</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Drag and drop an image here, or choose a clear photo from your device.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button type="button" icon={FileImage}>
                    Choose Image
                  </Button>
                  <Button type="button" variant="secondary" icon={Camera}>
                    Use Camera
                  </Button>
                </div>
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="space-y-6">
            {isAnalyzing ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-cyan-100 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
                <span className="relative flex h-20 w-20 items-center justify-center">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-200 opacity-50" />
                  <span className="relative flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-cyan-100 border-t-cyan-500 bg-white text-teal-600">
                    <RefreshCw className="h-7 w-7" aria-hidden="true" />
                  </span>
                </span>
                <h2 className="mt-6 text-2xl font-black text-slate-950">Analyzing ingredients for your safety...</h2>
                <p className="mt-2 max-w-md text-slate-500">
                  GlutiSafe is reviewing the label and preparing a clear result.
                </p>
              </div>
            ) : hasResult ? (
              <ResultCard />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
                <ShieldAlert className="h-10 w-10 text-teal-600" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black text-slate-950">Ready when you are</h2>
                <p className="mt-2 text-slate-500">Upload an ingredient label to begin a new scan.</p>
              </div>
            )}
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Today&apos;s overview</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['Scans', '12'],
                ['Safe', '9'],
                ['Needs care', '3'],
                ['Saved', '8'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-2xl font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-gradient-to-br from-slate-900 to-teal-950 p-5 text-white">
              <p className="text-sm font-bold text-cyan-100">Health reminder</p>
              <p className="mt-2 leading-7 text-white/80">
                Always compare scan results with the original package label before making a food choice.
              </p>
            </div>
          </aside>
        </section>
    </div>
  );
}
