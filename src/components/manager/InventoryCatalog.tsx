import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Barcode as BarcodeIcon,
  Edit2,
  Trash2,
  AlertCircle,
  MapPin,
  Sliders,
  Printer,
  X,
  Check,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { InventoryItem } from '../../types';
import { BarcodeDisplay } from '../common/BarcodeDisplay';

export const InventoryCatalog: React.FC = () => {
  const {
    items,
    warehouses,
    suppliers,
    addItem,
    updateItem,
    deleteItem,
    manualStockAdjust,
    exportItemsCSV,
    activeWarehouseId,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'nominal'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [labelItem, setLabelItem] = useState<InventoryItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [isWriteOff, setIsWriteOff] = useState(false);

  // New Item form state
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newUnit, setNewUnit] = useState('pcs');
  const [newWarehouseId, setNewWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');
  const [newBin, setNewBin] = useState('A01-R01-S01');
  const [newStock, setNewStock] = useState(50);
  const [newMin, setNewMin] = useState(15);
  const [newCost, setNewCost] = useState(10);
  const [newPrice, setNewPrice] = useState(25);
  const [newSupplierId, setNewSupplierId] = useState(suppliers[0]?.id || 'sup_01');
  const [newBarcode, setNewBarcode] = useState('');

  // Extract categories
  const categories = Array.from(new Set(items.map((i) => i.category)));

  // Filter items
  const filteredItems = items.filter((item) => {
    // Warehouse filter
    if (activeWarehouseId !== 'all' && item.warehouseId !== activeWarehouseId) {
      return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    // Stock Status
    if (stockStatusFilter === 'low' && item.stockOnHand > item.minThreshold) {
      return false;
    }
    if (stockStatusFilter === 'nominal' && item.stockOnHand <= item.minThreshold) {
      return false;
    }
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.barcode.includes(q) ||
        item.binLocation.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) return;

    const supplier = suppliers.find((s) => s.id === newSupplierId);
    const genBarcode = newBarcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`;

    addItem({
      sku: newSku.toUpperCase(),
      name: newName,
      description: newDesc,
      category: newCategory,
      unit: newUnit,
      warehouseId: newWarehouseId,
      binLocation: newBin.toUpperCase(),
      stockOnHand: Number(newStock),
      stockReserved: 0,
      minThreshold: Number(newMin),
      maxCapacity: Number(newStock) * 3,
      unitCost: Number(newCost),
      unitPrice: Number(newPrice),
      supplierId: newSupplierId,
      supplierName: supplier?.name || 'Supplier',
      barcode: genBarcode,
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewSku('');
    setNewName('');
    setNewDesc('');
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateItem(editingItem.id, editingItem);
    setEditingItem(null);
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQty === 0) return;
    manualStockAdjust(adjustItem.id, adjustQty, adjustReason || 'Inventory Manager manual adjustment', isWriteOff);
    setAdjustItem(null);
    setAdjustQty(0);
    setAdjustReason('');
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Master Stock Catalog & Bin Allocations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single authoritative inventory registry with warehouse bin coordinates, thresholds, and valuation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportItemsCSV}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New SKU</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, item name, barcode, bin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setStockStatusFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              stockStatusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setStockStatusFilter('low')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              stockStatusFilter === 'low'
                ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Low Stock ({items.filter((i) => i.stockOnHand <= i.minThreshold).length})
          </button>
          <button
            onClick={() => setStockStatusFilter('nominal')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              stockStatusFilter === 'nominal'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nominal
          </button>
        </div>
      </div>

      {/* Main Stock Data Grid (SaaS single-elevation high density table) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Item Name & Category</th>
                <th className="py-3 px-4">Bin Location</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right">Reserved</th>
                <th className="py-3 px-4 text-right">Available</th>
                <th className="py-3 px-4 text-right">Min Reorder</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No items match the active query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stockOnHand <= item.minThreshold;
                  const available = Math.max(0, item.stockOnHand - item.stockReserved);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* SKU & Barcode */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{item.sku}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.barcode}</div>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 max-w-xs truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400 truncate max-w-[140px]">{item.supplierName}</span>
                        </div>
                      </td>

                      {/* Bin Location */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.binLocation}
                        </span>
                      </td>

                      {/* On Hand */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums font-semibold text-slate-900">
                        {item.stockOnHand}{' '}
                        <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                      </td>

                      {/* Reserved */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums text-slate-500">
                        {item.stockReserved > 0 ? (
                          <span className="text-amber-700 font-medium">{item.stockReserved}</span>
                        ) : (
                          '0'
                        )}
                      </td>

                      {/* Available */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums font-bold text-slate-900">
                        {available}
                      </td>

                      {/* Min Threshold */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums text-slate-500">
                        {item.minThreshold}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums text-slate-700">
                        ${item.unitPrice.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Print Barcode Label"
                            onClick={() => setLabelItem(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <BarcodeIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Manual Stock Adjustment"
                            onClick={() => {
                              setAdjustItem(item);
                              setAdjustQty(0);
                              setIsWriteOff(false);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Edit Item Details"
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete SKU"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${item.sku}?`)) {
                                deleteItem(item.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table summary bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items in registry
          </span>
          <span className="font-mono">
            Filtered Value: $
            {filteredItems
              .reduce((sum, i) => sum + i.stockOnHand * i.unitCost, 0)
              .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Add New SKU Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-900">
                Register New Inventory Item (SKU)
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SEN-PROX-01"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Sensors, Motors, Fasteners..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full descriptive commercial name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Description / Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Technical details, thread size, voltage rating..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Initial Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Unit of Measure</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Boxes (box)</option>
                    <option value="pack">Packs (pack)</option>
                    <option value="roll">Rolls (roll)</option>
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Min Reorder Level</label>
                  <input
                    type="number"
                    min={1}
                    value={newMin}
                    onChange={(e) => setNewMin(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Warehouse Bin Coordinate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A01-R02-S03"
                    value={newBin}
                    onChange={(e) => setNewBin(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Preferred Supplier</label>
                  <select
                    value={newSupplierId}
                    onChange={(e) => setNewSupplierId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Unit Wholesale Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Unit Sales Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">Barcode / EAN (Optional - auto-generated if empty)</label>
                <input
                  type="text"
                  placeholder="e.g. 741029384011"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Edit SKU: {editingItem.sku}
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Bin Location</label>
                  <input
                    type="text"
                    value={editingItem.binLocation}
                    onChange={(e) => setEditingItem({ ...editingItem, binLocation: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono uppercase mt-1"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Min Reorder Level</label>
                  <input
                    type="number"
                    value={editingItem.minThreshold}
                    onChange={(e) => setEditingItem({ ...editingItem, minThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.unitCost}
                    onChange={(e) => setEditingItem({ ...editingItem, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono mt-1"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Barcode Label Modal */}
      {labelItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Shelf Rack Barcode Label
              </h2>
              <button onClick={() => setLabelItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg flex flex-col items-center justify-center border border-slate-200">
              <BarcodeDisplay
                value={labelItem.barcode}
                sku={labelItem.sku}
                name={labelItem.name}
                binLocation={labelItem.binLocation}
                height={55}
                className="w-full shadow-md"
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Direct thermal 4x2" rack tag layout with human-readable SKU & bin coordinate.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLabelItem(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-900 text-white text-xs font-medium rounded hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Shelf Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Stock Adjustment & Reconciliation
                </h2>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  SKU: {adjustItem.sku} · Current: {adjustItem.stockOnHand} {adjustItem.unit}
                </p>
              </div>
              <button onClick={() => setAdjustItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-slate-700">Adjustment Quantity (+ or -)</label>
                  <span className="font-mono text-slate-500">Result: {adjustItem.stockOnHand + adjustQty} {adjustItem.unit}</span>
                </div>
                <input
                  type="number"
                  required
                  placeholder="e.g. -5 or +10"
                  value={adjustQty || ''}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded font-mono text-base font-semibold"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700">Adjustment Audit Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Damaged during forklift relocation, sample testing, discrepancy found"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded mt-1"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="writeoff"
                  checked={isWriteOff}
                  onChange={(e) => setIsWriteOff(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="writeoff" className="text-slate-700">
                  Record as Official Scrap / Write-Off Loss
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
