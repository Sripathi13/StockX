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
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem } from '../../types';
import { soundService } from '../../utils/audio';
import { BarcodeDisplay } from '../common/BarcodeDisplay';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemScanned?: (item: InventoryItem) => void;
  targetSkuPrompt?: string; // Optional prompt if staff is looking for a specific SKU
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onItemScanned,
  targetSkuPrompt,
}) => {
  const { items, currentUser, activeWarehouseId, updateItem } = useInventory();
  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [quickActionSuccess, setQuickActionSuccess] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedItem(null);
      setManualCode('');
      setLookupError(null);
      setQuickActionSuccess(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera access unavailable or permission denied. Use manual barcode input or quick tags below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
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
      soundService.playScanBeep();
      setScannedItem(found);
      setQuickActionSuccess(null);
      if (onItemScanned) {
        onItemScanned(found);
      }
    } else {
      soundService.playAlertTone();
      setLookupError(`No inventory item matched barcode or SKU: "${code}"`);
    }
  };

  const handleSimulatedScan = (item: InventoryItem) => {
    soundService.playScanBeep();
    setScannedItem(item);
    setLookupError(null);
    setQuickActionSuccess(null);
    if (onItemScanned) {
      onItemScanned(item);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Optical Barcode Terminal & SKU Lookup
              </h2>
              <p className="text-xs text-slate-500">
                Point handheld scanner, connect camera, or enter SKU
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {targetSkuPrompt && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Task in progress. Please scan or select target SKU: <strong className="font-mono">{targetSkuPrompt}</strong>
              </span>
            </div>
          )}

          {/* Camera Viewfinder section */}
          <div className="bg-slate-900 rounded-lg overflow-hidden relative min-h-[200px] flex flex-col items-center justify-center text-white">
            {cameraActive ? (
              <div className="relative w-full aspect-video flex items-center justify-center overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                {/* Laser scan line overlay */}
                <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                <div className="absolute inset-12 border-2 border-red-500/60 rounded pointer-events-none" />
                <button
                  onClick={stopCamera}
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 text-xs text-white rounded hover:bg-black/90 transition-colors"
                >
                  Turn Off Camera
                </button>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Optical Barcode Video Feed
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Activate device camera for live scanning, or use the instant simulation tags below.
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Launch Scanner Camera
                  </button>
                </div>
                {cameraError && (
                  <p className="text-xs text-amber-400 pt-1">{cameraError}</p>
                )}
              </div>
            )}
          </div>

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
                placeholder="Scan barcode number or type SKU (e.g., SEN-OPT-082, 741029384011)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono text-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              Scan / Lookup
            </button>
          </form>

          {lookupError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Scanned Result Card */}
          {scannedItem && (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-700 font-semibold">
                    <span>{scannedItem.sku}</span>
                    <span aria-hidden="true">·</span>
                    <span>{scannedItem.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Barcode: {scannedItem.barcode}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-1">
                    {scannedItem.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">{scannedItem.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    {scannedItem.stockOnHand}{' '}
                    <span className="text-xs font-normal text-slate-500">{scannedItem.unit}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Avail: <strong className="font-mono text-emerald-700">{scannedItem.stockOnHand - scannedItem.stockReserved}</strong>
                    {scannedItem.stockReserved > 0 && ` (${scannedItem.stockReserved} reserved)`}
                  </div>
                </div>
              </div>

              {/* Location & Details Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200 text-xs text-slate-700">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    Bin: <strong className="font-mono text-slate-900">{scannedItem.binLocation}</strong>
                  </span>
                </div>
                <div>
                  Min Level: <strong className="font-mono">{scannedItem.minThreshold}</strong>
                </div>
                <div>
                  Unit Value: <strong className="font-mono tabular-nums">${scannedItem.unitPrice.toFixed(2)}</strong>
                </div>
              </div>

              {quickActionSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{quickActionSuccess}</span>
                </div>
              )}

              {/* Quick Actions for Staff */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    updateItem(scannedItem.id, { stockOnHand: scannedItem.stockOnHand + 1 });
                    setScannedItem((prev) => prev ? { ...prev, stockOnHand: prev.stockOnHand + 1 } : null);
                    setQuickActionSuccess(`Added +1 ${scannedItem.unit} to stock on hand.`);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-blue-600" />
                  Quick Count +1
                </button>
                <button
                  onClick={() => {
                    soundService.playSuccessChime();
                    setQuickActionSuccess(`Verified location ${scannedItem.binLocation} for ${scannedItem.sku}`);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Verify Shelf Bin
                </button>
              </div>
            </div>
          )}

          {/* Quick-Scan Shelf Tag Drawer for testing */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Quick-Scan Shelf Barcode Tags (Warehouse Live Catalog)</span>
              <span className="text-[11px] text-slate-500 font-normal">Click any tag to simulate optical scan</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSimulatedScan(item)}
                  className={`text-left p-2 rounded border bg-white hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between ${
                    targetSkuPrompt === item.sku ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 w-full mb-1">
                    <span className="font-semibold text-blue-700 truncate">{item.sku}</span>
                    <span className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded">{item.binLocation}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-800 line-clamp-1">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center justify-between">
                    <span>{item.barcode}</span>
                    <span className="text-slate-600 font-semibold">{item.stockOnHand} {item.unit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Active Warehouse: <strong>Alpha Logistics Hub</strong></span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
