import { AlertTriangle, CheckCircle2, Keyboard, ScanLine, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { explainAnalysis } from '../lib/api.js';
import { extractTextWithEasyOCR } from '../lib/ocrApi.js';
import { assertCanAnalyze, formatTokenReset, getTokenSnapshot } from '../lib/packUsage.js';
import { logCompletedScan } from '../lib/scanStats.js';
import { analyzeIngredients } from '../server/glutenRules.js';
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
  const [progressStep, setProgressStep] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrWarning, setOcrWarning] = useState('');
  const [ocrEngine, setOcrEngine] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [tokenLimitInfo, setTokenLimitInfo] = useState(null);
  const [saveWarning, setSaveWarning] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [flowState, setFlowState] = useState('idle');
  const [editingAfterResult, setEditingAfterResult] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const selectedImageRef = useRef(null);
  const imageSelectionIdRef = useRef(0);
  const readingAbortRef = useRef(null);
  const processingImageKeyRef = useRef('');
  const sessionImageCacheRef = useRef(new Map());

  const isImageMode = useMemo(() => method === 'upload' || method === 'camera', [method]);

  function abortCurrentReading() {
    if (readingAbortRef.current) {
      readingAbortRef.current.abort();
      readingAbortRef.current = null;
    }
  }

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
    imageSelectionIdRef.current += 1;
    abortCurrentReading();
    processingImageKeyRef.current = '';
    sessionImageCacheRef.current.clear();
    selectedImageRef.current = null;
    setFile(null);
    setProductName('');
    setPreview('');
    setImageData('');
    resetAnalysisState();
  }

  function resetAnalysisState() {
    setText('');
    setProgress(0);
    setProgressStep('');
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setAnalysisError('');
    setTokenLimitInfo(null);
    setSaveWarning('');
    setSaveStatus('');
    setSaved(false);
    setExplanationLoading(false);
    setFlowState('idle');
    setEditingAfterResult(false);
    setIsExtracting(false);
    setIsAnalyzing(false);
    onResult(null);
  }

  function handleMethodChange(nextMethod) {
    setMethod(nextMethod);
    resetAnalysisState();
  }

  async function handleFileChange(event) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    await setSelectedImage(selected);
    event.target.value = '';
  }

  async function setSelectedImage(selected, dataUrl) {
    const selectionId = imageSelectionIdRef.current + 1;
    imageSelectionIdRef.current = selectionId;
    abortCurrentReading();
    processingImageKeyRef.current = '';
    sessionImageCacheRef.current.clear();
    selectedImageRef.current = selected;
    resetAnalysisState();
    setFile(selected);
    setFlowState('image_selected');
    setPreview(dataUrl || URL.createObjectURL(selected));
    setImageData(dataUrl || '');
    const nextPreview = dataUrl || (await fileToDataUrl(selected));
    if (selectionId !== imageSelectionIdRef.current) return;
    setPreview(nextPreview);
    setImageData(nextPreview);
  }

  function handleCameraCapture(selected, dataUrl) {
    setSelectedImage(selected, dataUrl);
  }

  async function handleExtract() {
    const selectedImage = selectedImageRef.current || file;
    if (!selectedImage) {
      setOcrWarning('Ajoutez une image pour lancer la lecture de l’étiquette.');
      return;
    }
    const extractionSelectionId = imageSelectionIdRef.current;
    const imageKey = imageCacheKey(selectedImage);
    if (isExtracting || processingImageKeyRef.current === imageKey) return;

    console.time('[ANALYSE] total');
    setIsExtracting(true);
    setFlowState('reading_label');
    processingImageKeyRef.current = imageKey;
    setText('');
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setAnalysisError('');
    setTokenLimitInfo(null);
    setSaveWarning('');
    setSaveStatus('');
    setSaved(false);
    setExplanationLoading(false);
    setProgress(12);
    setProgressStep('Préparation de l’image...');
    onResult(null);

    try {
      const usage = await assertCanAnalyze();
      let result = sessionImageCacheRef.current.get(imageKey);
      if (!result) {
        abortCurrentReading();
        readingAbortRef.current = new AbortController();
        setProgress(42);
        setProgressStep('Lecture de l’étiquette...');
        result = await extractTextWithEasyOCR(selectedImage, { signal: readingAbortRef.current.signal });
        sessionImageCacheRef.current.set(imageKey, result);
      }
      if (extractionSelectionId !== imageSelectionIdRef.current || selectedImageRef.current !== selectedImage) return;
      const extracted = result.text;
      setText(extracted);
      if (extracted.trim().length >= 5) {
        setOcrEngine('done');
        setProgress(82);
        setProgressStep('Vérification du texte...');
        setFlowState('label_read');
      } else {
        setOcrEngine('');
        setProgress(0);
        setFlowState('error');
        setOcrError('Nous n’avons pas pu lire suffisamment de texte sur cette image. Essayez une photo plus proche et plus nette, ou saisissez les ingrédients manuellement.');
      }
      if (extracted.trim().length >= 5 && result.lowConfidence) {
        setOcrWarning('Texte peu lisible. Essayez une photo plus proche et plus nette, ou corrigez les ingrédients manuellement.');
      }
    } catch (error) {
      if (extractionSelectionId !== imageSelectionIdRef.current || selectedImageRef.current !== selectedImage) return;
      if (error.name === 'AbortError') return;
      safeTimeEnd('[ANALYSE] total');
      if (error.usage?.packStatus === 'free' && error.usage?.remaining <= 0) {
        setTokenLimitInfo(error.usage);
        setOcrWarning('');
      } else {
        const guidance = error.guidance ? ` ${error.guidance}` : '';
        setOcrError(`${error.message || 'Lecture de l’étiquette trop longue. Essayez une photo plus nette ou passez à la saisie manuelle.'}${guidance}`);
      }
      setProgress(0);
      setProgressStep('');
      setFlowState('error');
    } finally {
      if (extractionSelectionId === imageSelectionIdRef.current) {
        setIsExtracting(false);
        processingImageKeyRef.current = '';
        readingAbortRef.current = null;
      }
    }
  }

  function switchToManualInput() {
    setMethod('manual');
    setOcrError('');
    setOcrWarning('');
    setOcrEngine('');
    setProgress(0);
    setProgressStep('');
    setSaveStatus('');
    setExplanationLoading(false);
    setFlowState('idle');
    setEditingAfterResult(false);
    onResult(null);
  }

  function handleTextChange(nextText) {
    setText(nextText);
    if (method === 'manual' && !latestResult) {
      setFlowState(String(nextText || '').trim() ? 'label_read' : 'idle');
    }
  }

  async function handleAnalyze() {
    const analysisSelectionId = imageSelectionIdRef.current;
    const analysisText = text.trim();
    if (!analysisText) {
      setAnalysisError('Saisissez les ingrédients avant de lancer l’analyse.');
      return;
    }

    console.time('[ANALYSE] total');
    setIsAnalyzing(true);
    setFlowState('analyzing');
    setAnalysisError('');
    setTokenLimitInfo(null);
    setSaveWarning('');
    setSaveStatus('');
    setSaved(false);
    setExplanationLoading(false);
    setProgressStep('Vérification des ingrédients...');

    try {
      const usage = await assertCanAnalyze();
      showVerdictImmediately(analysisText, { usage, selectionId: analysisSelectionId, imageFile: method === 'manual' ? null : file });
    } catch (error) {
      if (analysisSelectionId !== imageSelectionIdRef.current) return;
      safeTimeEnd('[ANALYSE] total');
      if (error.usage?.packStatus === 'free' && error.usage?.remaining <= 0) {
        setTokenLimitInfo(error.usage);
        setAnalysisError('Vous avez utilisé toutes vos analyses gratuites.');
      } else {
        setAnalysisError(error.message || "Impossible d'analyser les ingrédients pour le moment.");
      }
      setFlowState('error');
    } finally {
      if (analysisSelectionId === imageSelectionIdRef.current) {
        setIsAnalyzing(false);
      }
    }
  }

  function showVerdictImmediately(analysisText, { usage, selectionId, imageFile }) {
    console.time('[ANALYSE] gluten_detection');
    const analysis = analyzeIngredients(analysisText);
    console.timeEnd('[ANALYSE] gluten_detection');

    if (selectionId !== imageSelectionIdRef.current) return;

    const result = { analysis, explanation: '' };
    const isPaid = Boolean(usage.isPaid);
    setProgress(100);
    setProgressStep('Résultat prêt');
    setFlowState('result_ready');
    setEditingAfterResult(false);
    setExplanationLoading(isPaid);
    saveChatbotScanContext(result, analysisText, {
      productName: productName || 'Produit sans nom',
      userPack: tokenInfo?.packType || usage.packType || (usage.isPaid ? 'premium' : 'free'),
      packStatus: tokenInfo?.packStatus || usage.packStatus || (usage.isPaid ? 'active' : 'free'),
    });
    onResult({
      ...result,
      text: analysisText,
      inputType: method,
      imageData,
      showAiExplanation: isPaid,
      explanationLoading: isPaid,
      productName: productName || 'Produit sans nom',
    });
    safeTimeEnd('[ANALYSE] total');
    runBackgroundAfterVerdict({ result, text: analysisText, usage, selectionId, imageFile });
  }

  async function runBackgroundAfterVerdict({ result, text: analysisText, usage, selectionId, imageFile }) {
    let finalResult = result;

    if (usage.isPaid) {
      try {
        console.time('[ANALYSE] ai_explanation');
        const payload = await explainAnalysis({ analysis: result.analysis, text: analysisText });
        const explanation = payload.explanation || '';
        finalResult = { ...result, explanation };
        if (selectionId === imageSelectionIdRef.current) {
          setExplanationLoading(false);
          onResult((current) => current ? { ...current, explanation, explanationLoading: false } : current);
        }
      } catch {
        if (selectionId === imageSelectionIdRef.current) {
          setExplanationLoading(false);
          onResult((current) => current ? { ...current, explanationLoading: false } : current);
        }
      } finally {
        safeTimeEnd('[ANALYSE] ai_explanation');
      }
    }

    try {
      if (selectionId === imageSelectionIdRef.current) setFlowState('save_pending');
      console.time('[ANALYSE] save_history');
      const savedAnalysis = await logCompletedScan({ result: finalResult, text: analysisText, inputType: method, productName, imageFile });
      if (selectionId !== imageSelectionIdRef.current) return;
      setTokenInfo(await getTokenSnapshot());
      if (savedAnalysis?.imageUploadWarning) {
        setSaveWarning("Résultat affiché. L’image n’a pas pu être enregistrée.");
        setSaveStatus('');
      } else {
        setSaveStatus('Analyse enregistrée.');
        setFlowState('saved');
      }
      onResult((current) => current ? {
        ...current,
        savedAnalysisId: savedAnalysis?.id,
        productName: savedAnalysis?.productName || current.productName || productName || 'Produit sans nom',
      } : current);
    } catch {
      if (selectionId === imageSelectionIdRef.current) {
        setSaveWarning("Résultat affiché. L’image n’a pas pu être enregistrée.");
      }
    } finally {
      safeTimeEnd('[ANALYSE] save_history');
    }
  }

  function handleSave() {
    if (!latestResult) return;
    setSaved(true);
  }

  function handleEditAfterResult() {
    setEditingAfterResult(true);
    setFlowState('label_read');
    setSaveStatus('');
  }

  const resultReady = Boolean(latestResult);
  const showReadButton = isImageMode && !resultReady && !isExtracting && Boolean(preview);
  const showAnalyzeButton = !resultReady || editingAfterResult;
  const showTextEditor = method === 'manual' || Boolean(text) || Boolean(ocrError) || Boolean(ocrWarning) || editingAfterResult;

  return (
    <section className="page-shell page-section">
      <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_0.78fr] lg:items-end">
        <div>
          <p className="brand-kicker">Analyse produit</p>
          <h1 className="mt-3 brand-heading">Scannez une étiquette, vérifiez le risque de gluten.</h1>
          <p className="mt-4 brand-copy max-w-3xl">
            Importez une photo, prenez une image ou saisissez les ingrédients manuellement. GlutiSafe analyse les ingrédients visibles et vous aide à faire un choix plus sûr.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-[#dfe8df] bg-white/80 p-3 shadow-sm">
          <MiniMetric icon={ScanLine} label="Lecture" value="Automatique" />
          <MiniMetric icon={ShieldCheck} label="Verdict" value="Gluten" />
          <MiniMetric icon={CheckCircle2} label="Langue détectée automatiquement" />
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
                  placeholder="Ex. yaourt fraise, pâtes, biscuit sans gluten"
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
                    showReadButton={showReadButton || (flowState === 'label_read' && !resultReady)}
                    onFileChange={handleFileChange}
                    onExtract={handleExtract}
                    onCameraOpen={() => setCameraOpen(true)}
                  />
                  {ocrEngine && !ocrWarning ? (
                    <p className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Lecture de l’étiquette terminée
                    </p>
                  ) : null}
                  <OcrProgress progress={progress} error={ocrError} active={isExtracting} step={progressStep} />
                  {ocrWarning ? (
                    <LabelReadingWarning
                      message={ocrWarning}
                      onRetry={handleExtract}
                      onManual={switchToManualInput}
                      retryDisabled={isExtracting || !file}
                    />
                  ) : null}
                  {showTextEditor && !resultReady ? (
                    <ExtractedTextEditor text={text} onChange={handleTextChange} onAnalyze={handleAnalyze} onReset={resetAll} loading={isAnalyzing} hideAnalyze={!showAnalyzeButton} />
                  ) : null}
                  {editingAfterResult ? (
                    <ExtractedTextEditor
                      title="Modifier le texte"
                      text={text}
                      onChange={handleTextChange}
                      onAnalyze={handleAnalyze}
                      onReset={resetAll}
                      loading={isAnalyzing}
                      analyzeLabel="Relancer l’analyse"
                      helper="Corrigez le texte détecté, puis relancez l’analyse pour remplacer le résultat actuel."
                    />
                  ) : null}
                </>
              ) : (
                !resultReady || editingAfterResult ? (
                  <ExtractedTextEditor
                    title={editingAfterResult ? 'Modifier le texte' : 'Saisie manuelle'}
                    text={text}
                    onChange={handleTextChange}
                    onAnalyze={handleAnalyze}
                    onReset={resetAll}
                    loading={isAnalyzing}
                    analyzeLabel={editingAfterResult ? 'Relancer l’analyse' : 'Analyser les ingrédients'}
                    helper={editingAfterResult ? 'Corrigez le texte, puis relancez l’analyse pour remplacer le résultat actuel.' : undefined}
                  />
                ) : null
              )}
              {tokenLimitInfo ? (
                <FreeLimitCard usage={tokenLimitInfo} onNavigate={onNavigate} />
              ) : analysisError ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{analysisError}</p>
              ) : null}
              {saveWarning ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{saveWarning}</p>
              ) : null}
              {saveStatus ? (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">{saveStatus}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5">
              {latestResult ? (
            <ResultCard
              analysis={latestResult.analysis}
              explanation={latestResult.explanation}
              explanationLoading={latestResult.explanationLoading ?? explanationLoading}
              text={latestResult.text}
              showAiExplanation={latestResult.showAiExplanation ?? Boolean(tokenInfo?.isPaid)}
              onEditText={handleEditAfterResult}
              onNew={resetAll}
              onHistory={() => onNavigate?.('/history')}
            />
          ) : (
            <div className="surface-card p-6">
              <p className="brand-kicker">Résultat</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#1d252b]">Prêt pour l'analyse</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Le résultat apparaîtra ici après l’analyse, avec le verdict, les ingrédients repérés et une explication claire.
              </p>
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-[#a8cfa5] bg-[#f7f8f6] p-6 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-[#a8cfa5]" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold text-slate-500">Aucun verdict affiché avant l’analyse.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleCameraCapture} />
    </section>
  );
}

function saveChatbotScanContext(result, text, meta = {}) {
  try {
    sessionStorage.setItem(
      CHATBOT_CONTEXT_KEY,
      JSON.stringify({
        lastScanResult: result.analysis,
        productName: meta.productName || 'Produit sans nom',
        ingredients: text,
        detectedText: text,
        verdict: result.analysis?.status || result.analysis?.label,
        detectedRiskyIngredients: result.analysis?.detectedWords || [],
        warnings: result.analysis?.possibleWords || [],
        userPack: meta.userPack || 'unknown',
        packStatus: meta.packStatus || 'unknown',
      }),
    );
  } catch {
    // Chat context is optional; scanning must not depend on storage availability.
  }
}

function imageCacheKey(file) {
  return [file?.name || 'image', file?.size || 0, file?.lastModified || 0].join(':');
}

function safeTimeEnd(label) {
  try {
    console.timeEnd(label);
  } catch {
    // Development-only timing guard.
  }
}

function MiniMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#f7f8f6] p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-[#008f45]" aria-hidden="true" />
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {value ? <p className="mt-1 truncate text-sm font-bold text-[#1d252b]">{value}</p> : null}
    </div>
  );
}

function LabelReadingWarning({ message, onRetry, onManual, retryDisabled }) {
  const isLowQuality = message.startsWith('Texte peu lisible');
  const title = isLowQuality ? 'Texte peu lisible' : 'Lecture de l’étiquette indisponible';
  const displayMessage = isLowQuality
    ? message
    : "Nous n’avons pas pu lire automatiquement cette image. Essayez avec une photo plus nette ou saisissez les ingrédients manuellement.";

  return (
    <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-black text-amber-950">{title}</p>
          <p className="mt-1 text-sm font-bold leading-6 text-amber-900">{displayMessage}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={onRetry} disabled={retryDisabled} className="secondary-btn disabled:cursor-not-allowed disabled:opacity-60">
              <ScanLine size={18} aria-hidden="true" />
              Réessayer
            </button>
            <button type="button" onClick={onManual} className="secondary-btn">
              <Keyboard size={18} aria-hidden="true" />
              Passer à la saisie manuelle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TokenBadge({ tokenInfo }) {
  const isPaid = tokenInfo.packStatus === 'active' && tokenInfo.packType !== 'none';
  const packLabel = tokenInfo.packType === 'yearly' ? 'Pack Annuel' : 'Pack Mensuel';
  const freeLabel = `Pack Gratuit - Analyses restantes : ${tokenInfo.remaining}/${tokenInfo.limit} - Renouvellement ${formatTokenReset(tokenInfo.resetAt || tokenInfo.periodEnd)}`;
  const paidLabel = `${packLabel} actif - Analyses restantes : ${tokenInfo.remaining}/${tokenInfo.limit} - Jusqu'au ${formatDate(tokenInfo.packEndAt)} - Renouvellement ${formatTokenReset(tokenInfo.periodEnd)}`;

  return (
    <div className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">
      <span>{isPaid ? paidLabel : freeLabel}</span>
    </div>
  );
}

function FreeLimitCard({ usage, onNavigate }) {
  return (
    <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5">
      <p className="text-base font-black text-amber-950">Vous avez utilisé toutes vos analyses gratuites.</p>
      <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
        Vos analyses seront renouvelées {formatResetSentence(usage.resetAt || usage.periodEnd)}.
      </p>
      <p className="mt-1 text-sm font-bold leading-6 text-amber-900">Passez à un pack premium pour continuer immédiatement.</p>
      <button type="button" onClick={() => onNavigate?.('/packs')} className="mt-4 rounded-2xl bg-[#008f45] px-5 py-3 text-sm font-black text-white transition hover:bg-[#004b3a]">
        Voir les packs
      </button>
    </div>
  );
}

function formatResetSentence(value) {
  if (!value) return 'après la prochaine réinitialisation';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'après la prochaine réinitialisation';
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === today.toDateString()) return `aujourd'hui à ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `demain à ${time}`;
  return `le ${date.toLocaleDateString('fr-FR')} à ${time}`;
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

