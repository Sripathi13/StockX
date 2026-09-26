import React, { useState } from 'react';
import {
  Boxes,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Barcode as BarcodeIcon,
  Search,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { ShelvingTask } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const ShelvingOperations: React.FC = () => {
  const { shelvingTasks, completeShelvingTask, items } = useInventory();
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [editingBinTaskId, setEditingBinTaskId] = useState<string | null>(null);
  const [customBin, setCustomBin] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const displayedTasks = shelvingTasks.filter((t) =>
    filter === 'pending' ? t.status === 'pending' : t.status === 'completed'
  );

  const handleStartEditBin = (task: ShelvingTask) => {
    setEditingBinTaskId(task.id);
    setCustomBin(task.targetBin);
  };

  const handleConfirmShelve = (task: ShelvingTask) => {
    const finalBin = editingBinTaskId === task.id && customBin.trim() ? customBin.trim().toUpperCase() : task.targetBin;
    completeShelvingTask(task.id, finalBin);
    setEditingBinTaskId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Dock Put-away & Rack Shelving
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stow incoming received freight from receiving staging docks into designated warehouse storage bins.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <BarcodeIcon className="w-4 h-4" />
          <span>Scan Bin or Item Tag</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit text-xs">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
            filter === 'pending'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending Put-away ({shelvingTasks.filter((t) => t.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
            filter === 'completed'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed History
        </button>
      </div>

      {/* Shelving Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 text-xs">
            {filter === 'pending'
              ? 'Dock staging is clear. No items awaiting shelving.'
              : 'No completed shelving tasks on record.'}
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isPending = task.status === 'pending';
            const catalogItem = items.find((i) => i.id === task.itemId);

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-blue-700">
                          {task.sku}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {task.taskNumber}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1 line-clamp-2">
                        {task.name}
                      </h3>
                    </div>
                  </div>

                  {/* Quantity to stow */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Stow Quantity:</span>
                    <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                      {task.qtyToShelve}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        {catalogItem?.unit || 'units'}
                      </span>
                    </span>
                  </div>

                  {/* Target Bin Coordinate */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>Target Shelf Coordinate:</span>
                      {isPending && editingBinTaskId !== task.id && (
                        <button
                          onClick={() => handleStartEditBin(task)}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          Change Bin
                        </button>
                      )}
                    </div>

                    {editingBinTaskId === task.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customBin}
                          onChange={(e) => setCustomBin(e.target.value.toUpperCase())}
                          placeholder="e.g. B01-R02-S03"
                          className="w-full px-2.5 py-1 bg-white border border-blue-400 rounded text-xs font-mono font-bold uppercase"
                        />
                        <button
                          onClick={() => setEditingBinTaskId(null)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 font-mono font-bold text-sm bg-slate-900 text-white px-3 py-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{task.targetBin}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span>Source PO: {task.sourcePoNumber}</span>
                    <span>Staff: {task.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 border-t border-slate-100">
                  {isPending ? (
                    <button
                      onClick={() => handleConfirmShelve(task)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Shelved into Bin</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-medium text-emerald-700 bg-emerald-50 py-1.5 rounded flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Shelved at {task.targetBin}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};
