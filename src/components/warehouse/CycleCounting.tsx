import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Barcode as BarcodeIcon,
  MapPin,
  RefreshCw,
  Search,
  Check,
  FileCheck,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { CycleCountSession } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const CycleCounting: React.FC = () => {
  const {
    cycleCounts,
    createCycleCountSession,
    recordCycleCountItem,
    reconcileCycleCount,
    warehouses,
    activeWarehouseId,
    currentUser,
  } = useInventory();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newAisle, setNewAisle] = useState('Aisle A01 (Sensors & Optics)');
  const [newWarehouseId, setNewWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Active sessions
  const activeSessions = cycleCounts;
  const currentSession =
    activeSessions.find((s) => s.id === selectedSessionId) || activeSessions[0] || null;

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    createCycleCountSession(newWarehouseId, newAisle);
    setIsNewSessionModalOpen(false);
  };

  const handleCountChange = (itemId: string, val: string, note?: string) => {
    if (!currentSession) return;
    const num = val === '' ? null : Number(val);
    if (num !== null && !isNaN(num)) {
      recordCycleCountItem(currentSession.id, itemId, num, note);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Physical Inventory Cycle Counting
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit actual physical shelf units, detect shrinkage, and calculate live stock discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BarcodeIcon className="w-4 h-4 text-emerald-400" />
            <span>Scan Shelf Barcode</span>
          </button>
          <button
            onClick={() => setIsNewSessionModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Aisle Audit Run</span>
          </button>
        </div>
      </div>

      {activeSessions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
          No active cycle count sessions. Click "New Aisle Audit Run" to begin a count.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Session Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
              Audit Count Sessions ({activeSessions.length})
            </div>

            <div className="space-y-2.5">
              {activeSessions.map((session) => {
                const isSelected = session.id === currentSession?.id;
                const countedCount = session.items.filter((i) => i.countedQty !== null).length;
                const discrepancyCount = session.items.filter(
                  (i) => i.countedQty !== null && i.discrepancy !== 0
                ).length;
                const isReconciled = session.status === 'reconciled';

                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {session.sessionNumber}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded capitalize ${
                          isReconciled
                            ? 'bg-emerald-100 text-emerald-800'
                            : session.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {session.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-800 truncate">
                      {session.aisle}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                      <span>
                        Counted: {countedCount}/{session.items.length} SKUs
                      </span>
                      {discrepancyCount > 0 && (
                        <span className="text-rose-600 font-bold">
                          {discrepancyCount} discrepancy
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Session Counter (8 cols) */}
          {currentSession && (
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-slate-900">
                      {currentSession.sessionNumber}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                      {currentSession.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Audited Zone: <strong>{currentSession.aisle}</strong> · Staff: {currentSession.assignedStaffName}
                  </div>
                </div>

                {/* Reconcile button */}
                {currentSession.status !== 'reconciled' && (
                  <button
                    onClick={() => reconcileCycleCount(currentSession.id)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Reconcile System Stock</span>
                  </button>
                )}
              </div>

              {/* Items in session */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                  Physical Count Verification Lines
                </div>

                <div className="space-y-3">
                  {currentSession.items.map((ci) => {
                    const hasDiscrepancy = ci.countedQty !== null && ci.discrepancy !== 0;

                    return (
                      <div
                        key={ci.itemId}
                        className={`p-4 rounded-xl border transition-all ${
                          hasDiscrepancy
                            ? 'bg-amber-50/50 border-amber-300'
                            : ci.countedQty !== null
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-400" />
                                {ci.binLocation}
                              </span>
                              <span className="font-mono font-bold text-xs text-blue-700">
                                {ci.sku}
                              </span>
                            </div>
                            <div className="text-sm font-semibold text-slate-900">
                              {ci.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              System Registered On Hand: <strong className="text-slate-800">{ci.systemQty}</strong>
                            </div>
                          </div>

                          {/* Count Input & Discrepancy */}
                          <div className="flex items-center gap-4 self-end sm:self-auto">
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-500 block">Physical Count</label>
                              <input
                                type="number"
                                min={0}
                                placeholder="0"
                                value={ci.countedQty !== null ? ci.countedQty : ''}
                                onChange={(e) => handleCountChange(ci.itemId, e.target.value)}
                                className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded font-mono text-base font-bold text-slate-900 tabular-nums focus:outline-hidden focus:border-blue-500"
                              />
                            </div>

                            {ci.countedQty !== null && (
                              <div className="text-right font-mono min-w-[70px]">
                                <div className="text-[11px] text-slate-400">Variance</div>
                                <div
                                  className={`text-base font-bold tabular-nums ${
                                    ci.discrepancy === 0
                                      ? 'text-emerald-600'
                                      : ci.discrepancy < 0
                                      ? 'text-rose-600'
                                      : 'text-amber-600'
                                  }`}
                                >
                                  {ci.discrepancy > 0 ? `+${ci.discrepancy}` : ci.discrepancy}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Note row */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add floor audit observation note..."
                            value={ci.note || ''}
                            onChange={(e) => {
                              if (ci.countedQty !== null) {
                                handleCountChange(ci.itemId, String(ci.countedQty), e.target.value);
                              }
                            }}
                            className="w-full px-2.5 py-1 text-xs bg-transparent border-0 placeholder-slate-400 focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Aisle Audit Modal */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Initialize New Physical Cycle Count Session
            </h2>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Target Warehouse</label>
                <select
                  value={newWarehouseId}
                  onChange={(e) => setNewWarehouseId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded mt-1"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700">Aisle / Zone Description</label>
                <input
                  type="text"
                  required
                  value={newAisle}
                  onChange={(e) => setNewAisle(e.target.value)}
                  placeholder="e.g. Aisle A03 (Fasteners & Packaging)"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Start Count Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemScanned={(item) => {
          setIsScannerOpen(false);
          // Highlight or alert
          alert(`Scanned: ${item.sku} (${item.binLocation}) - System Stock: ${item.stockOnHand}`);
        }}
      />
    </div>
  );
};
