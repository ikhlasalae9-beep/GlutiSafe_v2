import { Camera, Check, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function CameraCapture({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [capturedUrl, setCapturedUrl] = useState('');

  useEffect(() => {
    if (!open) return undefined;

    let mounted = true;
    setError('');
    setCapturedUrl('');

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("La caméra n'est pas disponible dans ce navigateur. Vous pouvez importer une image.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Accès caméra refusé ou indisponible. Importez une photo nette de l'étiquette.");
      }
    }

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedUrl(canvas.toDataURL('image/jpeg', 0.92));
    stopCamera();
  }

  async function retakePhoto() {
    setCapturedUrl('');
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Impossible de relancer la caméra. Importez une image si besoin.");
    }
  }

  async function usePhoto() {
    if (!capturedUrl) return;
    const blob = await (await fetch(capturedUrl)).blob();
    const file = new File([blob], `glutisafe-camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file, capturedUrl);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#1d252b]/45 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="camera-title">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_30px_90px_rgba(29,37,43,0.24)]">
        <div className="flex items-center justify-between gap-4 border-b border-[#dfe8df] px-5 py-4">
          <div>
            <p className="brand-kicker">Caméra</p>
            <h2 id="camera-title" className="mt-1 text-2xl font-extrabold text-[#1d252b]">Photographier l'étiquette</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7f8f6] text-slate-600 transition hover:text-[#008f45] focus:outline-none focus:ring-4 focus:ring-[#a8cfa5]/35" aria-label="Fermer la caméra">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[#dfe8df] bg-[#f7f8f6]">
            {capturedUrl ? (
              <img src={capturedUrl} alt="Photo capturée de l'étiquette" className="h-full w-full object-contain" />
            ) : (
              <video ref={videoRef} className="h-full w-full bg-black object-cover" playsInline muted />
            )}
            {!capturedUrl && !error ? (
              <div className="pointer-events-none absolute inset-6 rounded-[1.25rem] border-2 border-white/80 shadow-[inset_0_0_0_999px_rgba(255,255,255,0.02)]">
                <span className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-[#008f45]" />
                <span className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-[#008f45]" />
                <span className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-[#008f45]" />
                <span className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-[#008f45]" />
              </div>
            ) : null}
            {error ? (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <Camera className="mx-auto h-10 w-10 text-[#a8cfa5]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{error}</p>
                </div>
              </div>
            ) : null}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {capturedUrl ? (
              <>
                <button type="button" onClick={retakePhoto} className="secondary-btn">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reprendre
                </button>
                <button type="button" onClick={usePhoto} className="primary-btn">
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Utiliser cette photo
                </button>
              </>
            ) : (
              <button type="button" onClick={takePhoto} disabled={Boolean(error)} className="primary-btn sm:min-w-56">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Prendre une photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
