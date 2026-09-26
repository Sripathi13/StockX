// StockX Enterprise Warehouses Management View
import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  UserCheck,
  Edit,
  X,
  Package,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Warehouse } from '../../types';

export const WarehousesView: React.FC = () => {
  const { warehouses, items, locations, addWarehouse, updateWarehouse, users } = useInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState(10000);
  const [managerName, setManagerName] = useState('Sarah Vance');
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setCode(`WH-${String.fromCharCode(65 + warehouses.length)}`);
    setName('');
    setLocation('');
    setAddress('');
    setCapacity(8000);
    setManagerName('Sarah Vance');
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingWh(wh);
    setCode(wh.code);
    setName(wh.name);
    setLocation(wh.location);
    setAddress(wh.address);
    setCapacity(wh.capacity);
    setManagerName(wh.managerName);
    setIsActive(wh.isActive);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingWh) {
      updateWarehouse(editingWh.id, {
        code,
        name,
        location,
        address,
        capacity,
        managerName,
        isActive,
      });
      setEditingWh(null);
    } else {
      addWarehouse({
        code,
        name,
        location,
        address,
        capacity,
        managerName,
        isActive,
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouses & Logistics Hubs</h1>
          <p className="text-xs text-slate-500">
            Multi-facility network tracking, capacity limits, and operational managers
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse</span>
        </button>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {warehouses.map((wh) => {
          const whItems = items.filter((i) => i.warehouseId === wh.id);
          const whLocations = locations.filter((l) => l.warehouseId === wh.id);
          const totalUnits = whItems.reduce((acc, i) => acc + i.stockOnHand, 0);
          const occupancyPercent = wh.capacity > 0 ? (totalUnits / wh.capacity) * 100 : 0;
          const totalValuation = whItems.reduce((acc, i) => acc + i.stockOnHand * i.unitCost, 0);

          return (
            <div
              key={wh.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-blue-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {wh.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{wh.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      wh.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {wh.isActive ? 'OPERATIONAL' : 'INACTIVE'}
                  </span>
                  <button
                    onClick={() => openEditModal(wh)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Facility"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress and Capacity */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="font-semibold">Capacity Utilization</span>
                  <span className="font-mono">
                    {totalUnits.toLocaleString()} / {wh.capacity.toLocaleString()} units ({occupancyPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      occupancyPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                  />
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400">Designated Bins</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    {whLocations.length} Locations
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Stock Valuation</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Lead Manager</span>
                  <div className="font-semibold text-slate-900 mt-0.5 truncate">
                    {wh.managerName}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT WAREHOUSE MODAL */}
      {(isAddModalOpen || editingWh) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingWh ? 'Edit Warehouse Settings' : 'Add New Warehouse'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingWh(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Facility Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. WH-DELTA"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity (Units)</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Delta High-Bay Automated Hub"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Regional Location Tag</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Columbus Distribution Center"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 500 Enterprise Pkwy, Columbus, OH 43215"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Manager</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Sarah Vance"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="whActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="whActive" className="font-semibold text-slate-700 cursor-pointer">
                    Active Operational Status
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingWh(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  {editingWh ? 'Save Warehouse' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
