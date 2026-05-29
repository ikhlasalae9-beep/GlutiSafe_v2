import { AlertTriangle, CheckCircle2, Keyboard, ScanLine, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fullAnalysis } from '../lib/api.js';
import { extractTextWithEasyOCR } from '../lib/ocrApi.js';
import { assertCanAnalyze, formatTokenReset, getTokenSnapshot } from '../lib/packUsage.js';
import { logCompletedScan } from '../lib/scanStats.js';
import CameraCapture from './CameraCapture.jsx';
import ExtractedTextEditor from './ExtractedTextEditor.jsx';
import ImageUploader from './ImageUploader.jsx';
import InputMethodTabs from './InputMethodTabs.jsx';
import OcrProgress from './OcrProgress.jsx';
import ResultCard from './ResultCard.jsx';

const CHATBOT_CONTEXT_KEY = 'glutisafe_last_scan_context';

export default function Analyzer({ latestResult, onResult, onNavigate }) {
  const [method, setMethod] = useState('upload');
  const [file, setFile] = useState(null);
  const [productName, setProductName] = useState('');
  const [preview, setPreview] = useState('');
  const [imageData, setImageData] = useState('');
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [ocrError, setOcrError] = useState('');
  const [ocrWarning, setOcrWarning] = useState('');
  const [ocrEngine, setOcrEngine] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const [saved, setSaved] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  const isImageMode = useMemo(() => method === 'upload' || method === 'camera', [method]);

  useEffect(() => {
    let active = true;
    getTokenSnapshot()
      .then((snapshot) => {
        if (active) setTokenInfo(snapshot);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  function resetAll() {
    setFile(null);
    setProductName('');
    setPreview('');
    setImageData('');
    setText('');
    setProgress(0);
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setAnalysisError('');
    setSaveWarning('');
    setSaved(false);
    onResult(null);
  }

  function handleMethodChange(nextMethod) {
    setMethod(nextMethod);
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setAnalysisError('');
    setSaveWarning('');
    setProgress(0);
    onResult(null);
  }

  async function handleFileChange(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    await setSelectedImage(selected);
    event.target.value = '';
  }

  async function setSelectedImage(selected, dataUrl) {
    const nextPreview = dataUrl || (await fileToDataUrl(selected));
    setFile(selected);
    setPreview(nextPreview);
    setImageData(nextPreview);
    setText('');
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setProgress(0);
    setSaved(false);
    onResult(null);
  }

  function handleCameraCapture(selected, dataUrl) {
    setSelectedImage(selected, dataUrl);
  }

  async function handleExtract() {
    setIsExtracting(true);
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setProgress(10);

    try {
      await assertCanAnalyze();
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
    setSaveWarning('');
    setSaved(false);

    try {
      const usage = await assertCanAnalyze();
      const result = await fullAnalysis(text);
      const savedAnalysis = await logCompletedScan({ result, text, inputType: method, productName, imageFile: file });
      setTokenInfo(await getTokenSnapshot());
      if (savedAnalysis?.imageUploadWarning) setSaveWarning(savedAnalysis.imageUploadWarning);
      saveChatbotScanContext(result, text);
      onResult({
        ...result,
        text,
        inputType: method,
        imageData,
        showAiExplanation: Boolean(usage.isPaid),
        savedAnalysisId: savedAnalysis?.id,
        productName: savedAnalysis?.productName || productName || 'Produit sans nom',
      });
    } catch (error) {
      setAnalysisError(error.message || "Impossible d'analyser les ingrédients pour le moment.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleSave() {
    if (!latestResult) return;
    setSaved(true);
  }

  return (
    <section className="page-shell page-section">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_0.78fr] lg:items-end">
        <div>
          <p className="brand-kicker">Analyse produit</p>
          <h1 className="mt-3 brand-heading">Scannez une étiquette, vérifiez le risque gluten.</h1>
          <p className="mt-4 brand-copy max-w-3xl">
            Importez une photo, ouvrez la caméra ou saisissez les ingrédients. GlutiSafe garde le même flux OCR et le
            même moteur de règles, avec une interface plus claire.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-[#dfe8df] bg-white/80 p-3 shadow-sm">
          <MiniMetric icon={ScanLine} label="OCR" value={ocrEngine || 'EasyOCR'} />
          <MiniMetric icon={ShieldCheck} label="Verdict" value="Règles" />
          <MiniMetric icon={CheckCircle2} label="Langues" value="FR EN ES" />
        </div>
      </div>

      {tokenInfo ? <TokenBadge tokenInfo={tokenInfo} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-card organic-panel p-5 sm:p-6">
          <div className="relative">
            <InputMethodTabs value={method} onChange={handleMethodChange} />
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nom du produit (optionnel)</span>
                <input
                  className="field-control mt-2"
                  placeholder="Ex: Yaourt fraise, Pâtes Barilla, Biscuit sans gluten…"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                />
              </label>
              {isImageMode ? (
                <>
                  <ImageUploader
                    mode={method}
                    preview={preview}
                    isExtracting={isExtracting}
                    onFileChange={handleFileChange}
                    onExtract={handleExtract}
                    onCameraOpen={() => setCameraOpen(true)}
                  />
                  {ocrEngine && !ocrWarning ? (
                    <p className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      OCR utilisé : {ocrEngine}
                    </p>
                  ) : null}
                  <OcrProgress progress={progress} error={ocrError} active={isExtracting} />
                  {ocrWarning ? (
                    <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-6 text-amber-900">{ocrWarning}</p>
                          <button type="button" onClick={switchToManualInput} className="secondary-btn mt-4">
                            <Keyboard size={18} aria-hidden="true" />
                            Passer à la saisie manuelle
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
              {analysisError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{analysisError}</p>
              ) : null}
              {saveWarning ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{saveWarning}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5">
              {latestResult ? (
            <ResultCard
              analysis={latestResult.analysis}
              explanation={latestResult.explanation}
              text={latestResult.text}
              showAiExplanation={latestResult.showAiExplanation ?? Boolean(tokenInfo?.isPaid)}
              onSave={handleSave}
              saved={saved}
              onNew={resetAll}
              onHistory={() => onNavigate?.('/history')}
            />
          ) : (
            <div className="surface-card p-6">
              <p className="brand-kicker">Résultat</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#1d252b]">Prêt pour l'analyse</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Le résultat apparaîtra ici après l'analyse, avec le verdict, les mots détectés et une explication prudente.
              </p>
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#a8cfa5] bg-[#f7f8f6] p-6 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-[#a8cfa5]" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Aucun verdict affiché avant l'analyse.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCameraCapture} />
    </section>
  );
}

function saveChatbotScanContext(result, text) {
  try {
    sessionStorage.setItem(
      CHATBOT_CONTEXT_KEY,
      JSON.stringify({
        lastScanResult: result.analysis,
        ingredients: text,
        verdict: result.analysis?.status || result.analysis?.label,
        detectedRiskyIngredients: result.analysis?.detectedWords || [],
        warnings: result.analysis?.possibleWords || [],
      }),
    );
  } catch {
    // Chat context is optional; scanning must not depend on storage availability.
  }
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f8f6] p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-[#008f45]" aria-hidden="true" />
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#1d252b]">{value}</p>
    </div>
  );
}

function TokenBadge({ tokenInfo }) {
  const isPaid = tokenInfo.packStatus === 'active' && tokenInfo.packType !== 'none';
  const packLabel = tokenInfo.packType === 'yearly' ? 'Pack Annuel' : 'Pack Mensuel';
  const freeLabel = `Pack Gratuit - Tokens restants : ${tokenInfo.remaining}/${tokenInfo.limit} - Reset ${formatTokenReset(tokenInfo.periodEnd)}`;
  const paidLabel = `${packLabel} actif - Tokens restants : ${tokenInfo.remaining}/${tokenInfo.limit} - Jusqu'au ${formatDate(tokenInfo.packEndAt)} - Reset ${formatTokenReset(tokenInfo.periodEnd)}`;

  return (
    <div className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">
      <span>{isPaid ? paidLabel : freeLabel}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error("Impossible de préparer l'aperçu de l'image."));
    reader.readAsDataURL(file);
  });
}
