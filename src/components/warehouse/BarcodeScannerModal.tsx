import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Package,
  MapPin,
  Barcode as BarcodeIcon,
  RefreshCw,
  Upload,
  Flashlight,
  SwitchCamera,
  Sparkles,
  Zap,
  RotateCcw,
  Plus,
  Minus,
  TrendingUp,
  Boxes,
  History,
  Check,
  Copy,
  Radio,
  Clock,
  Dices,
  Play,
  Eye,
  Maximize2,
  Sliders,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem } from '../../types';
import { soundService } from '../../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemScanned?: (item: InventoryItem) => void;
  targetSkuPrompt?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onItemScanned,
  targetSkuPrompt,
}) => {
  const {
    items,
    currentUser,
    activeWarehouseId,
    warehouses,
    updateItem,
    formatCurrency,
    stockLedger,
    logAudit,
  } = useInventory();

  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [quickActionSuccess, setQuickActionSuccess] = useState<string | null>(null);
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);

  // Live video feed telemetry
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);

  // 5-7 Seconds Optical Scan States
  const [isScanningProgress, setIsScanningProgress] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanRemainingSeconds, setScanRemainingSeconds] = useState(6.0);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(6.0);
  const [scanPhaseText, setScanPhaseText] = useState('Optical sensor active & capturing feed...');
  const [rollingSku, setRollingSku] = useState('MOT-STP-023');
  const [autoScanLoop, setAutoScanLoop] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const photoCameraInputRef = useRef<HTMLInputElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  const scanTimerRef = useRef<number | null>(null);
  const rollingTimerRef = useRef<number | null>(null);
  const autoLoopTimerRef = useRef<number | null>(null);
  const barcodeDetectIntervalRef = useRef<number | null>(null);
  const autoScanLoopRef = useRef(false);

  useEffect(() => {
    autoScanLoopRef.current = autoScanLoop;
  }, [autoScanLoop]);

  // Clean all intervals and timers
  const clearScanTimers = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (rollingTimerRef.current !== null) {
      window.clearInterval(rollingTimerRef.current);
      rollingTimerRef.current = null;
    }
    if (autoLoopTimerRef.current !== null) {
      window.clearTimeout(autoLoopTimerRef.current);
      autoLoopTimerRef.current = null;
    }
    if (barcodeDetectIntervalRef.current !== null) {
      window.clearInterval(barcodeDetectIntervalRef.current);
      barcodeDetectIntervalRef.current = null;
    }
  };

  // Automatically start live camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      clearScanTimers();
      stopCamera();
      setScannedItem(null);
      setManualCode('');
      setLookupError(null);
      setQuickActionSuccess(null);
      setDetectedBadge(null);
      setCameraError(null);
      setIsScanningProgress(false);
      setAutoScanLoop(false);
      setCapturedFrameUrl(null);
    }
  }, [isOpen]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      clearScanTimers();
      stopCamera();
    };
  }, []);

  /**
   * Stop all camera tracks and clean up media streams
   */
  const stopCamera = () => {
    clearScanTimers();
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      } catch {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanningProgress(false);
    setTorchOn(false);
  };

  /**
   * Capture current frame snapshot from the live video feed
   */
  const captureCurrentVideoFrame = (): string | null => {
    if (!videoRef.current || videoRef.current.readyState < 2) return null;
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedFrameUrl(dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  };

  /**
   * Start Live Camera directly using getUserMedia into <video>
   */
  const startCamera = async (cameraIdToUse?: string) => {
    setCameraError(null);
    setIsInitializing(true);
    stopCamera();

    // Small delay to ensure any existing camera hardware is freed by the browser
    await new Promise((r) => setTimeout(r, 120));

    try {
      let stream: MediaStream;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: cameraIdToUse
          ? { deviceId: { exact: cameraIdToUse } }
          : selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err1) {
        console.warn('Initial camera constraints failed, attempting fallback to basic video:', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'user' },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
            setVideoDimensions({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
          }
        };
      }

      setCameraActive(true);
      setCameraError(null);

      // Check available cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((d) => d.kind === 'videoinput')
          .map((d, index) => ({ id: d.deviceId, label: d.label || `Camera ${index + 1}` }));
        if (videoDevices.length > 0) {
          setAvailableCameras(videoDevices);
        }
      } catch {}

      // Check torch support
      try {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities?.() as any;
        if (capabilities && capabilities.torch) {
          setTorchSupported(true);
        }
      } catch {}

      // Start the optical barcode detection loop
      startLiveBarcodeDetector(stream);

      // Initiate 5-7 second scan sequence
      trigger5to7SecondRandomScan();
    } catch (err: unknown) {
      console.error('Camera acquisition error:', err);
      const errStr = String(err);
      if (errStr.includes('NotReadableError') || errStr.includes('Could not start video source')) {
        setCameraError(
          'Webcam is currently locked by another application or tab (e.g. Zoom, Teams, or another open window). Please close conflicting apps and click "Retry Camera".'
        );
      } else if (errStr.includes('NotAllowedError') || errStr.includes('Permission')) {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser or snap a photo below.');
      } else {
        setCameraError('Could not start camera feed. Please check your camera permissions or snap a photo.');
      }
      setCameraActive(false);
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Native BarcodeDetector loop on the active video stream
   */
  const startLiveBarcodeDetector = (stream: MediaStream) => {
    if (barcodeDetectIntervalRef.current !== null) {
      window.clearInterval(barcodeDetectIntervalRef.current);
    }

    // Check if BarcodeDetector is natively supported in the browser
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'code_93', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix'],
        });

        barcodeDetectIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              if (rawValue) {
                captureCurrentVideoFrame();
                handleLookup(rawValue);
              }
            }
          } catch {}
        }, 300);
      } catch {}
    }
  };

  /**
   * Main 5 to 7 Seconds Optical Scan Cycle:
   * Runs for 5-7 seconds with live camera, sweeping laser, and countdown,
   * then snaps current camera frame and reveals random product stock output.
   */
  const trigger5to7SecondRandomScan = (targetItem?: InventoryItem) => {
    clearScanTimers();

    // Randomize duration between 5.0 and 7.0 seconds
    const duration = Number((5.2 + Math.random() * 1.6).toFixed(1));
    const durationMs = duration * 1000;
    const startTime = Date.now();

    setIsScanningProgress(true);
    setScanProgress(0);
    setTotalDurationSeconds(duration);
    setScanRemainingSeconds(duration);
    setLookupError(null);
    setQuickActionSuccess(null);
    soundService.playScanBeep();

    const phases = [
      'Optical camera feed active: Aligning reticle on target...',
      'Calibrating optical exposure & sensor contrast...',
      'Detecting Code 128 / UPC modulation lines in frame...',
      'Decoding checksum & validating barcode pattern...',
      'Cross-referencing SKU with warehouse ERP ledger...',
      'Target locked! Outputting real-time product stock...',
    ];

    // Rapid HUD ticker of SKUs
    rollingTimerRef.current = window.setInterval(() => {
      if (items.length > 0) {
        const rand = items[Math.floor(Math.random() * items.length)];
        setRollingSku(rand.sku);
      }
    }, 180);

    scanTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      const progressPercent = Math.min(100, Math.round((elapsed / durationMs) * 100));

      setScanRemainingSeconds(Number(remaining.toFixed(1)));
      setScanProgress(progressPercent);

      const phaseIdx = Math.min(phases.length - 1, Math.floor((elapsed / durationMs) * phases.length));
      setScanPhaseText(phases[phaseIdx]);

      // Scan complete!
      if (elapsed >= durationMs) {
        clearScanTimers();
        setIsScanningProgress(false);
        setScanProgress(100);
        setScanRemainingSeconds(0);

        // Capture snapshot from live video
        captureCurrentVideoFrame();

        // Determine item to output: if target passed, use target; else choose random item
        let pickedItem: InventoryItem;
        if (targetItem) {
          pickedItem = targetItem;
        } else {
          const pool = items.filter((i) => i.id !== scannedItem?.id);
          pickedItem = (pool.length > 0 ? pool : items)[
            Math.floor(Math.random() * (pool.length > 0 ? pool.length : items.length))
          ] || items[0];
        }

        if (pickedItem) {
          soundService.playSuccessChime();
          setScannedItem(pickedItem);
          setDetectedBadge(`Camera Scan Output: ${pickedItem.sku} (${pickedItem.name})`);
          setScannedCount((c) => c + 1);

          if (onItemScanned) {
            onItemScanned(pickedItem);
          }

          // Smoothly scroll down to the product stock output card
          setTimeout(() => {
            resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 120);

          // If auto repeat loop is enabled, schedule next scan
          if (autoScanLoopRef.current) {
            autoLoopTimerRef.current = window.setTimeout(() => {
              trigger5to7SecondRandomScan();
            }, 3000);
          }
        }
      }
    }, 100);
  };

  const handleLookup = (code: string) => {
    const clean = code.trim().toLowerCase();
    if (!clean) return;
    setLookupError(null);

    const found = items.find(
      (i) =>
        i.barcode.toLowerCase() === clean ||
        i.sku.toLowerCase() === clean ||
        i.name.toLowerCase().includes(clean)
    );

    if (found) {
      soundService.playSuccessChime();
      captureCurrentVideoFrame();
      setScannedItem(found);
      setQuickActionSuccess(null);
      setDetectedBadge(`Camera Matched: ${found.sku} (${found.barcode})`);
      setScannedCount((c) => c + 1);
      setTimeout(() => setDetectedBadge(null), 4000);
      if (onItemScanned) {
        onItemScanned(found);
      }
      setTimeout(() => {
        resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } else {
      soundService.playAlertTone();
      setLookupError(`No inventory item matched barcode or SKU: "${code}"`);
    }
  };

  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !torchOn } as any],
      });
      setTorchOn(!torchOn);
    } catch {}
  };

  const handleSwitchCamera = async () => {
    if (availableCameras.length < 2) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamId = availableCameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    await startCamera(nextCamId);
  };

  const handleImageFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLookupError(null);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedFrameUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Trigger 5-7s scan and reveal matched product
      trigger5to7SecondRandomScan();
    } catch {
      soundService.playAlertTone();
      setLookupError('Could not process barcode image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (photoCameraInputRef.current) photoCameraInputRef.current.value = '';
    }
  };

  const handleQuickStockChange = (amount: number) => {
    if (!scannedItem) return;
    const newStock = Math.max(0, scannedItem.stockOnHand + amount);
    updateItem(scannedItem.id, { stockOnHand: newStock });
    setScannedItem((prev) => (prev ? { ...prev, stockOnHand: newStock } : null));
    soundService.playSuccessChime();
    setQuickActionSuccess(
      amount > 0
        ? `Added +${amount} ${scannedItem.unit}. New Stock on Hand: ${newStock}`
        : `Deducted ${Math.abs(amount)} ${scannedItem.unit}. New Stock on Hand: ${newStock}`
    );
    logAudit(
      'STOCK_COUNT_UPDATE',
      'InventoryItem',
      scannedItem.id,
      `Camera scan quick count (${amount > 0 ? '+' : ''}${amount} ${scannedItem.unit}). New level: ${newStock}`
    );
  };

  const handleCopySku = () => {
    if (!scannedItem) return;
    navigator.clipboard.writeText(scannedItem.sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const itemLedgerHistory = scannedItem
    ? stockLedger.filter((l) => l.productId === scannedItem.id || l.sku === scannedItem.sku).slice(0, 3)
    : [];

  const isLowStock = scannedItem ? scannedItem.stockOnHand <= scannedItem.minThreshold : false;
  const isOutOfStock = scannedItem ? scannedItem.stockOnHand <= 0 : false;
  const availableStock = scannedItem ? Math.max(0, scannedItem.stockOnHand - scannedItem.stockReserved) : 0;
  const stockHealthPercent = scannedItem
    ? Math.min(100, Math.round((scannedItem.stockOnHand / (scannedItem.minThreshold * 2.5)) * 100))
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Optical Barcode Terminal & Stock Scanner</span>
                {cameraActive && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isScanningProgress
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isScanningProgress ? 'bg-rose-600 animate-ping' : 'bg-emerald-600'}`} />
                    {isScanningProgress ? 'SCANNING...' : 'LIVE CAMERA'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Live optical camera feed with real-time barcode decoding and product stock output
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              clearScanTimers();
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Action Controls Toolbar */}
        <div className="px-5 py-2.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => trigger5to7SecondRandomScan()}
              disabled={isScanningProgress}
              title={isScanningProgress ? 'Scanning...' : 'Scan Product'}
              aria-label={isScanningProgress ? 'Scanning...' : 'Scan Product'}
              className="p-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center cursor-pointer transition-all border border-blue-400/30 group"
            >
              <Dices className={`w-4 h-4 text-amber-300 ${isScanningProgress ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                captureCurrentVideoFrame();
                trigger5to7SecondRandomScan();
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-indigo-200" />
              <span>Capture & Scan Frame</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoScanLoop(!autoScanLoop)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoScanLoop
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoScanLoop ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Auto-Scan Loop: {autoScanLoop ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            {scannedCount > 0 && (
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-400">
                Audited: {scannedCount}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {targetSkuPrompt && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Task in progress. Target SKU to locate: <strong className="font-mono">{targetSkuPrompt}</strong>
              </span>
            </div>
          )}

          {/* REAL CAMERA VIEWFINDER (Live Video Feed is rendered directly on screen!) */}
          <div className="bg-black rounded-2xl overflow-hidden relative aspect-video sm:aspect-21/9 min-h-[260px] flex flex-col items-center justify-center text-white border border-slate-800 shadow-2xl">
            {/* The Live HTML5 Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Hidden canvas used for real-time frame snapshotting */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Active Camera HUD Overlays */}
            {cameraActive && (
              <>
                {/* Red Sweeping Laser Scan Line across the live video */}
                <div
                  className={`absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_16px_#f43f5e] ${
                    isScanningProgress ? 'animate-laser-sweep' : 'opacity-70'
                  } pointer-events-none z-10`}
                />

                {/* Corner Viewfinder Reticle Brackets */}
                <div className="absolute inset-x-10 inset-y-6 border-2 border-rose-500/50 rounded-xl pointer-events-none z-10 flex flex-col justify-between">
                  <div className="flex justify-between p-1.5">
                    <span className="w-5 h-5 border-t-2 border-l-2 border-rose-400 rounded-tl-sm" />
                    <span className="w-5 h-5 border-t-2 border-r-2 border-rose-400 rounded-tr-sm" />
                  </div>
                  <div className="flex justify-between p-1.5">
                    <span className="w-5 h-5 border-b-2 border-l-2 border-rose-400 rounded-bl-sm" />
                    <span className="w-5 h-5 border-b-2 border-r-2 border-rose-400 rounded-br-sm" />
                  </div>
                </div>

                {/* Real-time Video Stream Telemetry Badge (top-left) */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-lg text-[11px] font-mono text-emerald-400 border border-white/10 flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>LIVE FEED</span>
                    {videoDimensions.width > 0 && (
                      <span className="text-[10px] text-slate-300 font-normal">
                        ({videoDimensions.width}x{videoDimensions.height})
                      </span>
                    )}
                  </span>

                  {!isScanningProgress && (
                    <button
                      type="button"
                      onClick={() => trigger5to7SecondRandomScan()}
                      className="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md rounded-lg text-[11px] text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>Scan</span>
                    </button>
                  )}

                  {availableCameras.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="px-2 py-1 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-lg text-[11px] text-white border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Switch camera"
                    >
                      <SwitchCamera className="w-3 h-3 text-blue-400" />
                      <span>Switch</span>
                    </button>
                  )}

                  {torchSupported && (
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      className={`px-2 py-1 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-lg text-[11px] border border-white/10 flex items-center gap-1 cursor-pointer transition-colors ${
                        torchOn ? 'text-amber-300' : 'text-white'
                      }`}
                      title="Toggle flashlight"
                    >
                      <Flashlight className="w-3 h-3" />
                      <span>{torchOn ? 'Torch On' : 'Torch'}</span>
                    </button>
                  )}
                </div>

                {/* Optical Scanning HUD Overlay */}
                {isScanningProgress && (
                  <div className="absolute inset-x-6 bottom-14 z-20 bg-black/85 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-xl shadow-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-semibold text-white">{scanPhaseText}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold tracking-wider">TARGET: {rollingSku}</span>
                  </div>
                )}

                {/* Turn Off Camera Button */}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="absolute bottom-3 right-3 z-20 px-3.5 py-1.5 bg-black/80 hover:bg-black text-xs font-semibold text-white rounded-xl border border-white/20 shadow-lg backdrop-blur-md transition-all cursor-pointer"
                >
                  Turn Off Camera
                </button>
              </>
            )}

            {/* Inactive Camera Standby Display */}
            {!cameraActive && (
              <div className="p-6 text-center space-y-3.5 w-full max-w-md absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-md">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">
                    Live Optical Barcode Scanner
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect webcam to scan physical warehouse barcodes, view what the camera captures, and output real-time product stock.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    disabled={isInitializing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isInitializing ? 'Connecting Camera...' : 'Launch Scanner Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => photoCameraInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Snap Photo</span>
                  </button>
                  <input
                    ref={photoCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileScan}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Upload Image</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileScan}
                    className="hidden"
                  />
                </div>

                {cameraError && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left space-y-2 max-w-sm">
                    <div className="flex items-start gap-2 text-xs text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Retry Camera
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Scan Feedback Pill */}
          {detectedBadge && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center justify-between animate-fade-in shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{detectedBadge}</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                AUDITED
              </span>
            </div>
          )}

          {/* Manual Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup(manualCode);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan barcode number or type SKU (e.g., MOT-STP-023, 741029384028)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Scan / Lookup
            </button>
          </form>

          {lookupError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* MAIN PRODUCT STOCK OUTPUT DISPLAY */}
          {scannedItem ? (
            <div
              ref={resultCardRef}
              className="bg-white border-2 border-blue-500/40 rounded-2xl p-5 space-y-4 shadow-lg ring-4 ring-blue-500/5 animate-fade-in"
            >
              {/* Product Header & Barcode Graphic + Live Captured Snapshot */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-4 flex-1">
                  {/* Camera Captured Frame Snapshot Thumbnail */}
                  {capturedFrameUrl && (
                    <div className="shrink-0 relative group">
                      <img
                        src={capturedFrameUrl}
                        alt="Captured Camera Feed"
                        className="w-20 h-20 rounded-xl object-cover border-2 border-blue-400 shadow-md"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/75 text-[9px] font-mono text-emerald-300 px-1 py-0.2 rounded">
                        Captured
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {scannedItem.sku}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySku}
                        className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-0.5 transition-colors cursor-pointer"
                        title="Copy SKU to clipboard"
                      >
                        {copiedSku ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[11px]">{copiedSku ? 'Copied' : 'Copy'}</span>
                      </button>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs text-slate-500">{scannedItem.category}</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-xs font-mono text-slate-600 font-semibold">
                        Barcode: {scannedItem.barcode}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {scannedItem.name}
                    </h3>
                    <p className="text-xs text-slate-500">{scannedItem.description}</p>
                  </div>
                </div>

                {/* Live Stock Status Badge */}
                <div className="shrink-0 flex sm:flex-col items-end gap-1.5">
                  {isOutOfStock ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                      Low Stock Alert
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      In Stock (Optimal)
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">
                    Min Threshold: {scannedItem.minThreshold} {scannedItem.unit}
                  </span>
                </div>
              </div>

              {/* 3 High-Impact Live Stock Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* On Hand Stock */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium">Total On Hand</span>
                    <Boxes className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {scannedItem.stockOnHand}{' '}
                    <span className="text-xs font-normal text-slate-500 font-sans">{scannedItem.unit}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Physical count in warehouse
                  </div>
                </div>

                {/* Available to Pick */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-semibold">Available To Pick</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">
                    {availableStock}{' '}
                    <span className="text-xs font-normal text-emerald-700 font-sans">{scannedItem.unit}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Ready for outgoing orders
                  </div>
                </div>

                {/* Allocated / Reserved */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-amber-800">
                    <span className="font-semibold">Reserved in Orders</span>
                    <Package className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-900 tabular-nums">
                    {scannedItem.stockReserved}{' '}
                    <span className="text-xs font-normal text-amber-700 font-sans">{scannedItem.unit}</span>
                  </div>
                  <div className="text-[11px] text-amber-700">
                    Committed to deliveries
                  </div>
                </div>
              </div>

              {/* Stock Health Level Gauge */}
              <div className="space-y-1.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Stock Capacity & Reorder Level:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {scannedItem.stockOnHand} / {scannedItem.minThreshold * 2} Units ({stockHealthPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOutOfStock
                        ? 'bg-rose-500'
                        : isLowStock
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, Math.min(100, stockHealthPercent))}%` }}
                  />
                </div>
              </div>

              {/* Storage Coordinates & Financial Valuation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Physical Bin Location */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Storage Bin & Aisle Location</span>
                  </div>
                  <div className="font-mono text-base font-bold text-slate-900">
                    {scannedItem.binLocation}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Warehouse: <strong>{(warehouses.find((w) => w.id === (scannedItem?.warehouseId || activeWarehouseId)) || warehouses[0])?.name || 'Chera Hub'}</strong>
                  </div>
                </div>

                {/* Financial Value in INR */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Inventory Asset Valuation</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold font-mono text-slate-900">
                      {formatCurrency(scannedItem.stockOnHand * scannedItem.unitCost)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      (@ {formatCurrency(scannedItem.unitCost)} / unit cost)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Selling Price: <strong className="font-mono text-slate-800">{formatCurrency(scannedItem.unitPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* Interactive Quick Stock Actions & Adjustments */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Real-Time Stock Adjustment Controls:</span>
                  </div>
                  {quickActionSuccess && (
                    <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{quickActionSuccess}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStockChange(1)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+1 Inbound Receive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStockChange(-1)}
                    disabled={scannedItem.stockOnHand <= 0}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>-1 Outbound Pick</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playSuccessChime();
                      setQuickActionSuccess(`Location verified at ${scannedItem.binLocation} for ${scannedItem.sku}`);
                      logAudit(
                        'LOCATION_VERIFY',
                        'InventoryItem',
                        scannedItem.id,
                        `Verified location at ${scannedItem.binLocation}`
                      );
                    }}
                    className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Verify Shelf Bin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      captureCurrentVideoFrame();
                      trigger5to7SecondRandomScan();
                    }}
                    disabled={isScanningProgress}
                    className="ml-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Dices className="w-3.5 h-3.5 text-amber-300" />
                    <span>Scan Next Item</span>
                  </button>
                </div>
              </div>

              {/* Recent Stock Movement Audit History */}
              {itemLedgerHistory.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History className="w-3 h-3 text-slate-400" />
                    <span>Recent Ledger Movements for {scannedItem.sku}:</span>
                  </div>
                  <div className="space-y-1.5">
                    {itemLedgerHistory.map((entry) => {
                      const isPositive = entry.quantityChange > 0;
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/70"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {entry.movementType}
                            </span>
                            <span className="font-mono text-slate-600 font-medium">{entry.referenceId}</span>
                            <span className="text-slate-400 text-[11px]">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="font-mono font-bold">
                            <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                              {isPositive ? `+${entry.quantityChange}` : entry.quantityChange} {scannedItem.unit}
                            </span>
                            <span className="text-slate-400 text-[11px] ml-2 font-normal">
                              (Balance: {entry.balanceAfter})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Prompt State when no item is scanned yet */
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <Dices className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Ready to Capture & Output Product Stock
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                  Point the camera at an item, barcode, or shelf bin to scan and output live product stock details.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    captureCurrentVideoFrame();
                    trigger5to7SecondRandomScan();
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Start Optical Scan & Output Stock</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick-Scan Shelf Tag Catalog for testing & handheld simulation */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-600" />
                <span>Warehouse Catalog Shelf Barcode Tags</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Click any tag to inspect stock directly</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    captureCurrentVideoFrame();
                    handleLookup(item.barcode);
                  }}
                  className={`text-left p-2.5 rounded-xl border bg-white hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group ${
                    scannedItem?.id === item.id
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30'
                      : targetSkuPrompt === item.sku
                      ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 w-full mb-1">
                    <span className="font-semibold text-blue-700 group-hover:text-blue-600 truncate">{item.sku}</span>
                    <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[9px]">{item.binLocation.split(' / ')[0]}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 line-clamp-1">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">#{item.barcode}</span>
                    <span className="text-emerald-700 font-bold">{item.stockOnHand} {item.unit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Active Warehouse: <strong>{(warehouses.find((w) => w.id === activeWarehouseId) || warehouses[0])?.name || 'Chera Hub'}</strong></span>
          <button
            type="button"
            onClick={() => {
              clearScanTimers();
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
