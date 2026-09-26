// StockX Enterprise Storage Locations View (Zones, Racks, Shelves, Bins)
import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Warehouse as WarehouseIcon,
  Layers,
  Edit,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { WarehouseLocation } from '../../types';

export const LocationsView: React.FC = () => {
  const { locations, warehouses, items, addLocation, updateLocation } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<WarehouseLocation | null>(null);

  // Form
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [zone, setZone] = useState('Zone A');
  const [rack, setRack] = useState('Rack A-01');
  const [shelf, setShelf] = useState('Shelf A-01-01');
  const [bin, setBin] = useState('Bin B-01');
  const [locationName, setLocationName] = useState('');
  const [capacity, setCapacity] = useState(300);
  const [isActive, setIsActive] = useState(true);

  // Derive all unique zones
  const uniqueZones = Array.from(new Set(locations.map((l) => l.zone)));

  const openAddModal = () => {
    setWarehouseId(warehouses[0]?.id || 'wh_alpha');
    setZone('Zone A');
    setRack('Rack A-01');
    setShelf('Shelf A-01-01');
    setBin('Bin B-01');
    setLocationName('Standard Storage Bin');
    setCapacity(300);
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (loc: WarehouseLocation) => {
    setEditingLoc(loc);
    setWarehouseId(loc.warehouseId);
    setZone(loc.zone);
    setRack(loc.rack);
    setShelf(loc.shelf);
    setBin(loc.bin);
    setLocationName(loc.locationName);
    setCapacity(loc.capacity);
    setIsActive(loc.isActive);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whObj = warehouses.find((w) => w.id === warehouseId);
    const whPrefix = whObj?.code?.replace('WH-', '') || 'A';
    const locationCode = `WH-${whPrefix}-${zone.replace('Zone ', 'Z')}-${rack.replace('Rack ', 'R')}-${shelf.replace('Shelf ', 'S')}-${bin.replace('Bin ', 'B')}`;

    if (editingLoc) {
      updateLocation(editingLoc.id, {
        warehouseId,
        zone,
        rack,
        shelf,
        bin,
        locationCode,
        locationName,
        capacity,
        isActive,
      });
      setEditingLoc(null);
    } else {
      addLocation({
        warehouseId,
        zone,
        rack,
        shelf,
        bin,
        locationCode,
        locationName,
        capacity,
        isActive,
      });
      setIsAddModalOpen(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.locationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.zone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWarehouse = selectedWarehouse === 'ALL' || loc.warehouseId === selectedWarehouse;
    const matchesZone = selectedZone === 'ALL' || loc.zone === selectedZone;

    return matchesSearch && matchesWarehouse && matchesZone;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouse Storage Locations</h1>
          <p className="text-xs text-slate-500">
            Hierarchical tracking by Zone, Rack, Shelf, and Bin coordinates for high-density picking
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Location Code, Name, or Zone..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code}
              </option>
            ))}
          </select>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Zones</option>
            {uniqueZones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Location Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Rack & Shelf</th>
                <th className="py-3 px-4">Bin</th>
                <th className="py-3 px-4 text-right">Capacity</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLocations.map((loc) => {
                const wh = warehouses.find((w) => w.id === loc.warehouseId);
                return (
                  <tr key={loc.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {loc.locationCode}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-medium">
                      {loc.locationName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {wh?.name || wh?.code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {loc.zone}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {loc.rack} / {loc.shelf}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 font-semibold">
                      {loc.bin}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {loc.capacity} units
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          loc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {loc.isActive ? 'ACTIVE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Location"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {(isAddModalOpen || editingLoc) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingLoc ? 'Edit Location Coordinates' : 'Define New Storage Bin'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingLoc(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zone Tag</label>
                  <input
                    type="text"
                    required
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="e.g. Zone A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rack</label>
                  <input
                    type="text"
                    required
                    value={rack}
                    onChange={(e) => setRack(e.target.value)}
                    placeholder="e.g. Rack A-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shelf</label>
                  <input
                    type="text"
                    required
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder="e.g. Shelf A-01-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bin</label>
                  <input
                    type="text"
                    required
                    value={bin}
                    onChange={(e) => setBin(e.target.value)}
                    placeholder="e.g. Bin B-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location Descriptive Name</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Optical Sensor High-Speed Tray"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bin Capacity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="locActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="locActive" className="font-semibold text-slate-700 cursor-pointer">
                    Active Storage Bin
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingLoc(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  {editingLoc ? 'Save Location' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
