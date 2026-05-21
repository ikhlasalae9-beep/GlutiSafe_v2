import { AlertTriangle, Camera, CheckCircle2, CloudUpload, Download, FileImage, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import NutritionChart from '../components/NutritionChart.jsx';

const mockResults = [
  {
    name: 'Biscuits Bimo',
    status: 'Danger',
    explanation: 'Contient du blé et du gluten caché.',
    ingredients: ['Farine de blé', 'Sucre', 'Huile végétale'],
  },
  {
    name: "Jus d'Orange",
    status: 'Safe',
    explanation: 'Aucun ingrédient contenant du gluten détecté.',
    ingredients: ['Eau', "Concentré d'orange", 'Vitamine C'],
  },
  {
    name: 'Chips Lays',
    status: 'Danger',
    explanation: "Traces possibles de malt d'orge.",
    ingredients: ['Pommes de terre', 'Huile', 'Arôme (Malt)'],
  },
];

export default function AnalysisPage() {
  const timeoutRef = useRef(null);
  const lastResultIndexRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null') || JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  };

  const saveScanToHistory = (result) => {
    const currentUser = getCurrentUser();
    const email = currentUser?.email?.trim().toLowerCase();

    if (!email) return;

    const historyKey = `history_${email}`;
    let currentHistory = [];

    try {
      currentHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch {
      currentHistory = [];
    }

    const newScan = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      ...result,
    };

    localStorage.setItem(historyKey, JSON.stringify([newScan, ...currentHistory]));
  };

  const simulateScan = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSaveMessage('');

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      let randomIndex = Math.floor(Math.random() * mockResults.length);
      if (mockResults.length > 1 && randomIndex === lastResultIndexRef.current) {
        randomIndex = (randomIndex + 1) % mockResults.length;
      }

      lastResultIndexRef.current = randomIndex;
      const randomResult = mockResults[randomIndex];

      setAnalysisResult(randomResult);
      saveScanToHistory(randomResult);
      setIsAnalyzing(false);
      setSaveMessage('✅ Enregistré dans l’historique');
    }, 2000);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    simulateScan();
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    simulateScan();
  };

  const handleDownloadReport = () => {
    window.alert('Rapport PDF généré avec succès');
  };

  const isSafe = analysisResult?.status === 'Safe';
  const StatusIcon = isSafe ? CheckCircle2 : AlertTriangle;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6 lg:sticky lg:top-24 lg:self-start">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">Analysis</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Upload your product label</h1>
        <label
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="group mt-6 flex min-h-80 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-cyan-200 bg-slate-50 px-6 py-10 text-center transition hover:border-cyan-400 hover:bg-cyan-50/40"
        >
          <input className="sr-only" type="file" accept="image/*" onChange={handleFileChange} />
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition group-hover:scale-105">
            <CloudUpload className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-xl font-black">Drag, drop, or capture</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Use a sharp image with the full ingredient list visible.
          </p>
          {selectedFile ? (
            <p className="mt-3 max-w-sm truncate text-sm font-bold text-teal-700">{selectedFile.name}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition duration-200 group-hover:from-teal-400 group-hover:to-cyan-400">
              <FileImage className="h-4 w-4" aria-hidden="true" />
              Choose Image
            </span>
            <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 group-hover:border-teal-200 group-hover:text-teal-700">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Camera
            </span>
          </div>
        </label>
      </section>

      <section className="space-y-6">
        {saveMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            {saveMessage}
          </div>
        ) : null}

        {isAnalyzing ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-cyan-100 bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <span className="relative flex h-20 w-20 items-center justify-center">
              <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-200 opacity-50" />
              <span className="relative flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-cyan-100 border-t-cyan-500 bg-white text-teal-600">
                <RefreshCw className="h-7 w-7" aria-hidden="true" />
              </span>
            </span>
            <h2 className="mt-6 text-2xl font-black">Analyzing ingredients...</h2>
            <p className="mt-2 max-w-md text-slate-500">Preparing a clear, easy-to-read product summary.</p>
          </div>
        ) : null}

        {analysisResult ? (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Scan result</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{analysisResult.name}</h2>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ring-1 ${
                    isSafe
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-red-50 text-red-700 ring-red-200'
                  }`}
                >
                  <StatusIcon className="h-4 w-4" aria-hidden="true" />
                  {isSafe ? 'Sain' : 'Danger'}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-slate-700">Ingrédients détectés</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysisResult.ingredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={`mt-6 rounded-xl border p-4 ${
                  isSafe ? 'border-emerald-200 bg-emerald-50/70' : 'border-red-200 bg-red-50/70'
                }`}
              >
                <p className="font-black text-slate-950">Analyse IA</p>
                <p className="mt-2 leading-7 text-slate-700">{analysisResult.explanation}</p>
              </div>
            </section>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-black text-teal-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 focus:outline-none focus:ring-4 focus:ring-cyan-100 sm:w-auto"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Télécharger le rapport
            </button>
            <NutritionChart />
          </>
        ) : null}
      </section>
    </div>
  );
}
