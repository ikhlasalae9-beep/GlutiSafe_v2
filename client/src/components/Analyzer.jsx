import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Keyboard } from 'lucide-react';
import { fullAnalysis } from '../lib/api.js';
import { saveAnalysis, textPreview } from '../lib/history.js';
import { extractTextWithEasyOCR } from '../lib/ocrApi.js';
import ExtractedTextEditor from './ExtractedTextEditor.jsx';
import ImageUploader from './ImageUploader.jsx';
import InputMethodTabs from './InputMethodTabs.jsx';
import OcrProgress from './OcrProgress.jsx';
import ResultCard from './ResultCard.jsx';

export default function Analyzer({ latestResult, onResult, onNavigate }) {
  const [method, setMethod] = useState('upload');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [ocrError, setOcrError] = useState('');
  const [ocrWarning, setOcrWarning] = useState('');
  const [ocrEngine, setOcrEngine] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [saved, setSaved] = useState(false);

  const isImageMode = useMemo(() => method === 'upload' || method === 'camera', [method]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function resetAll() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview('');
    setText('');
    setProgress(0);
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setAnalysisError('');
    setSaved(false);
    onResult(null);
  }

  function handleMethodChange(nextMethod) {
    setMethod(nextMethod);
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setAnalysisError('');
    setProgress(0);
    onResult(null);
  }

  function handleFileChange(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setText('');
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setProgress(0);
    onResult(null);
  }

  async function handleExtract() {
    setIsExtracting(true);
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setProgress(10);

    try {
      const result = await extractTextWithEasyOCR(file);
      const extracted = result.text;
      setOcrEngine(result.engine || 'EasyOCR');
      setProgress(100);
      setText(extracted);
      if (!extracted) {
        setOcrError('Aucun texte clair détecté. Vous pouvez saisir les ingrédients manuellement.');
      }
    } catch (error) {
      setOcrWarning(error.message);
      setProgress(0);
    } finally {
      setIsExtracting(false);
    }
  }

  function switchToManualInput() {
    setMethod('manual');
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setProgress(0);
    onResult(null);
  }

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setAnalysisError('');
    setSaved(false);

    try {
      const result = await fullAnalysis(text);
      onResult({ ...result, text, inputType: method });
    } catch (error) {
      setAnalysisError(error.message || 'Impossible d’analyser les ingrédients pour le moment.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSave() {
    if (!latestResult) return;
    saveAnalysis({
      inputType: latestResult.inputType,
      textPreview: textPreview(latestResult.text),
      fullText: latestResult.text,
      analysis: latestResult.analysis,
      explanation: latestResult.explanation,
    });
    setSaved(true);
  }

  return (
    <section id="analyse" className="page-shell py-14">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Analyse</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Analyser un produit</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Importez une image, prenez une photo ou saisissez les ingrédients manuellement. Le verdict vient toujours du
          moteur de règles.
        </p>
        <p className="mt-2 text-sm font-bold text-emerald-700">Langues supportées : Français, Anglais, Espagnol, Chinois</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr]">
        <div className="glass-card rounded-3xl p-5 sm:p-7">
          <InputMethodTabs value={method} onChange={handleMethodChange} />
          <div className="mt-6 space-y-5">
            {isImageMode ? (
              <>
                <ImageUploader
                  mode={method}
                  preview={preview}
                  isExtracting={isExtracting}
                  onFileChange={handleFileChange}
                  onExtract={handleExtract}
                />
                {ocrEngine && !ocrWarning && (
                  <p className="inline-flex min-h-10 items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800">
                    OCR utilisé : {ocrEngine}
                  </p>
                )}
                <OcrProgress progress={progress} error={ocrError} active={isExtracting} />
                {ocrWarning && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-6 text-amber-900">{ocrWarning}</p>
                        <button
                          type="button"
                          onClick={switchToManualInput}
                          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 text-sm font-black text-white transition hover:bg-amber-800"
                        >
                          <Keyboard size={18} />
                          Passer à la saisie manuelle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {(text || ocrError) && (
                  <ExtractedTextEditor text={text} onChange={setText} onAnalyze={handleAnalyze} onReset={resetAll} loading={isAnalyzing} />
                )}
              </>
            ) : (
              <ExtractedTextEditor
                title="Saisie manuelle"
                text={text}
                onChange={setText}
                onAnalyze={handleAnalyze}
                onReset={resetAll}
                loading={isAnalyzing}
              />
            )}
            {analysisError && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{analysisError}</p>}
          </div>
        </div>

        <div className="space-y-5">
          {latestResult ? (
            <ResultCard
              analysis={latestResult.analysis}
              explanation={latestResult.explanation}
              onSave={handleSave}
              saved={saved}
              onNew={resetAll}
              onHistory={() => onNavigate('historique')}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">Résultat de l’analyse</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Le résultat apparaîtra ici avec le statut, la confiance, les mots détectés et une explication prudente.
              </p>
              <div className="mt-6 grid gap-3">
                {['Contient du gluten', 'Risque possible', 'Aucun gluten détecté', 'Information insuffisante'].map((label) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
