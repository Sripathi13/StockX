// StockX Enterprise Analytical Reports Engine
import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  IndianRupee,
  AlertTriangle,
  Activity,
  Building2,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

type ReportType = 'valuation' | 'reorder' | 'velocity' | 'capacity' | 'discrepancy';

export const ReportsView: React.FC = () => {
  const {
    items,
    categories,
    warehouses,
    suppliers,
    adjustments,
    stockLedger,
    formatCurrency,
    currencySymbol,
  } = useInventory();
  const [activeReport, setActiveReport] = useState<ReportType>('valuation');

  // 1. Valuation Calculations
  const totalCostValuation = items.reduce((acc, i) => acc + i.stockOnHand * i.unitCost, 0);
  const totalSellingValuation = items.reduce((acc, i) => acc + i.stockOnHand * i.unitPrice, 0);
  const grossMarginPotential = totalSellingValuation - totalCostValuation;
  const grossMarginPercent =
    totalSellingValuation > 0 ? (grossMarginPotential / totalSellingValuation) * 100 : 0;

  // 2. Low Stock Calculations
  const reorderAlerts = items.filter((i) => i.stockOnHand <= i.minThreshold);
  const totalReorderCapitalNeeded = reorderAlerts.reduce(
    (acc, i) => acc + i.reorderQuantity * i.unitCost,
    0
  );

  // 3. Velocity Calculations
  const velocityData = items.map((item) => {
    const itemMovements = stockLedger.filter((l) => l.productId === item.id);
    const outboundCount = itemMovements
      .filter((l) => l.movementType === 'DELIVERY')
      .reduce((acc, l) => acc + Math.abs(l.quantityChange), 0);
    const inboundCount = itemMovements
      .filter((l) => l.movementType === 'RECEIPT')
      .reduce((acc, l) => acc + l.quantityChange, 0);

    let velocityClass: 'Fast-Moving' | 'Medium' | 'Slow-Moving' = 'Medium';
    if (outboundCount > 15) velocityClass = 'Fast-Moving';
    else if (outboundCount === 0) velocityClass = 'Slow-Moving';

    return {
      ...item,
      outboundCount,
      inboundCount,
      turnoverRatio: item.stockOnHand > 0 ? (outboundCount / item.stockOnHand).toFixed(2) : '0.00',
      velocityClass,
    };
  });

  // 4. Warehouse Utilization
  const warehouseCapacityStats = warehouses.map((wh) => {
    const whItems = items.filter((i) => i.warehouseId === wh.id);
    const currentUnits = whItems.reduce((acc, i) => acc + i.stockOnHand, 0);
    const currentValuation = whItems.reduce((acc, i) => acc + i.stockOnHand * i.unitCost, 0);
    const occupancy = wh.capacity > 0 ? (currentUnits / wh.capacity) * 100 : 0;
    return {
      ...wh,
      currentUnits,
      currentValuation,
      occupancy,
    };
  });

  // 5. Discrepancy & Adjustment
  const totalAdjustmentsValue = adjustments.reduce(
    (acc, a) => acc + Math.abs(a.totalVarianceValue),
    0
  );
  const damageAdjustments = adjustments.filter((a) => a.reason === 'Damage');
  const recountAdjustments = adjustments.filter((a) => a.reason === 'Recount');

  const exportCurrentReportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `stockx_${activeReport}_report.csv`;

    if (activeReport === 'valuation') {
      headers = ['SKU', 'Product Name', 'Category', 'Stock On Hand', 'Unit Cost (INR)', 'Unit Price (INR)', 'Total Cost Valuation (INR)', 'Total Selling Valuation (INR)', 'Potential Margin (INR)'];
      rows = items.map((i) => [
        i.sku,
        `"${i.name}"`,
        i.category,
        i.stockOnHand,
        i.unitCost.toFixed(2),
        i.unitPrice.toFixed(2),
        (i.stockOnHand * i.unitCost).toFixed(2),
        (i.stockOnHand * i.unitPrice).toFixed(2),
        ((i.stockOnHand * (i.unitPrice - i.unitCost))).toFixed(2),
      ]);
    } else if (activeReport === 'reorder') {
      headers = ['SKU', 'Product Name', 'Supplier', 'Stock On Hand', 'Min Reorder Threshold', 'Suggested Order Qty', 'Unit Cost (INR)', 'Capital Required (INR)'];
      rows = reorderAlerts.map((i) => [
        i.sku,
        `"${i.name}"`,
        `"${i.supplierName}"`,
        i.stockOnHand,
        i.minThreshold,
        i.reorderQuantity,
        i.unitCost.toFixed(2),
        (i.reorderQuantity * i.unitCost).toFixed(2),
      ]);
    } else if (activeReport === 'velocity') {
      headers = ['SKU', 'Product Name', 'Velocity Classification', 'Units Dispatched', 'Units Received', 'Stock On Hand', 'Turnover Ratio'];
      rows = velocityData.map((v) => [
        v.sku,
        `"${v.name}"`,
        v.velocityClass,
        v.outboundCount,
        v.inboundCount,
        v.stockOnHand,
        v.turnoverRatio,
      ]);
    } else if (activeReport === 'capacity') {
      headers = ['Warehouse Code', 'Warehouse Name', 'Location', 'Capacity (Units)', 'Current Units', 'Occupancy (%)', 'Total Valuation'];
      rows = warehouseCapacityStats.map((w) => [
        w.code,
        `"${w.name}"`,
        `"${w.location}"`,
        w.capacity,
        w.currentUnits,
        w.occupancy.toFixed(1),
        w.currentValuation.toFixed(2),
      ]);
    } else {
      headers = ['Adjustment #', 'Reason', 'Warehouse ID', 'Items Affected', 'Total Variance Value', 'Status', 'Date'];
      rows = adjustments.map((a) => [
        a.adjustmentNumber,
        a.reason,
        a.warehouseId,
        a.items.length,
        a.totalVarianceValue.toFixed(2),
        a.status,
        a.createdAt.split('T')[0],
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Enterprise Analytical Reports
          </h1>
          <p className="text-xs text-slate-500">
            Real-time financial valuation, procurement reordering forecasts, and warehouse velocity metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={exportCurrentReportCSV}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveReport('valuation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'valuation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span>Stock Valuation</span>
        </button>

        <button
          onClick={() => setActiveReport('reorder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'reorder'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Low Stock & Reorder</span>
          {reorderAlerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-white">
              {reorderAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveReport('velocity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'velocity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Stock Movement Velocity</span>
        </button>

        <button
          onClick={() => setActiveReport('capacity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'capacity'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Warehouse Utilization</span>
        </button>

        <button
          onClick={() => setActiveReport('discrepancy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeReport === 'discrepancy'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Discrepancy & Shrinkage</span>
        </button>
      </div>

      {/* REPORT CONTENT 1: VALUATION */}
      {activeReport === 'valuation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Total Asset Cost Basis
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {formatCurrency(totalCostValuation)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct supplier procurement value</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Total Selling Valuation
              </span>
              <div className="text-2xl font-bold font-mono text-blue-600 mt-2">
                {formatCurrency(totalSellingValuation)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Retail dispatch value</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Unrealized Margin Spread
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
                {formatCurrency(grossMarginPotential)} ({grossMarginPercent.toFixed(1)}%)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Projected gross profit yield</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">SKU Item Valuation Matrix</span>
              <span className="text-xs text-slate-500 font-mono">{items.length} Tracked Assets</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Units on Hand</th>
                  <th className="py-3 px-4 text-right">Unit Cost ({currencySymbol})</th>
                  <th className="py-3 px-4 text-right">Selling Price ({currencySymbol})</th>
                  <th className="py-3 px-4 text-right">Total Cost Value ({currencySymbol})</th>
                  <th className="py-3 px-4 text-right">Gross Spread ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {items.map((i) => {
                  const costVal = i.stockOnHand * i.unitCost;
                  const sellVal = i.stockOnHand * i.unitPrice;
                  return (
                    <tr key={i.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                        {i.name} <span className="font-mono text-slate-400 font-normal">({i.sku})</span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">{i.category}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">{i.stockOnHand}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">{formatCurrency(i.unitCost)}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">{formatCurrency(i.unitPrice)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatCurrency(costVal)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{formatCurrency(sellVal - costVal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 2: REORDER */}
      {activeReport === 'reorder' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>{reorderAlerts.length} Products Below Safety Threshold</strong>
                <p className="text-amber-700 mt-0.5">
                  Procurement capital required to restore safety levels: <span className="font-mono font-bold">{formatCurrency(totalReorderCapitalNeeded)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Authorized Supplier</th>
                  <th className="py-3 px-4 text-right">Physical On Hand</th>
                  <th className="py-3 px-4 text-right">Safety Reorder Point</th>
                  <th className="py-3 px-4 text-right">Suggested Order Qty</th>
                  <th className="py-3 px-4 text-right">Estimated Cost ({currencySymbol})</th>
                  <th className="py-3 px-4">Lead Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {reorderAlerts.map((i) => {
                  const sup = suppliers.find((s) => s.id === i.supplierId);
                  return (
                    <tr key={i.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                        {i.name} <span className="font-mono text-slate-400 font-normal">({i.sku})</span>
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">{i.supplierName}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-amber-600">{i.stockOnHand}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500">{i.minThreshold}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-blue-600">+{i.reorderQuantity}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(i.reorderQuantity * i.unitCost)}
                      </td>
                      <td className="py-2.5 px-4 font-sans text-slate-500">{sup?.leadTimeDays || 3} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT 3: VELOCITY */}
      {activeReport === 'velocity' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">Stock Turnover & Movement Velocity</span>
            <span className="text-xs text-slate-500 font-mono">Based on complete audit trail</span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4 text-center">Velocity Classification</th>
                <th className="py-3 px-4 text-right">Units Dispatched (Out)</th>
                <th className="py-3 px-4 text-right">Units Received (In)</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-right">Velocity Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {velocityData.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                    {v.name} <span className="font-mono text-slate-400 font-normal">({v.sku})</span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        v.velocityClass === 'Fast-Moving'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.velocityClass === 'Medium'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {v.velocityClass}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-600">{v.outboundCount}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{v.inboundCount}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">{v.stockOnHand}</td>
                  <td className="py-2.5 px-4 text-right text-slate-700">{v.turnoverRatio}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORT CONTENT 4: CAPACITY */}
      {activeReport === 'capacity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warehouseCapacityStats.map((wh) => (
            <div key={wh.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-blue-600 font-bold">{wh.code}</span>
                  <h3 className="text-base font-bold text-slate-900">{wh.name}</h3>
                  <div className="text-xs text-slate-500">{wh.address}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                  {wh.occupancy.toFixed(1)}% Full
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      wh.occupancy > 80 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, wh.occupancy)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>{wh.currentUnits.toLocaleString()} units stored</span>
                  <span>{wh.capacity.toLocaleString()} max capacity</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400">Total Stock Value</span>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    {formatCurrency(wh.currentValuation)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Manager Lead</span>
                  <div className="font-semibold text-slate-900 mt-0.5 truncate">{wh.managerName}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORT CONTENT 5: DISCREPANCY */}
      {activeReport === 'discrepancy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Total Shrinkage / Damage Value
              </span>
              <div className="text-2xl font-bold font-mono text-rose-600 mt-2">
                {formatCurrency(totalAdjustmentsValue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Recorded audit reconciliations</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Damaged Goods Incidents
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
                {damageAdjustments.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Crushed cartons / handling write-offs</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Physical Cycle Counts
              </span>
              <div className="text-2xl font-bold font-mono text-blue-600 mt-2">
                {recountAdjustments.length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Shelf audits reconciled</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <th className="py-3 px-4">Adjustment #</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4 text-right">Variance Value ({currencySymbol})</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-bold text-blue-600">{a.adjustmentNumber}</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{a.reason}</td>
                    <td className="py-2.5 px-4 text-slate-600">{a.warehouseId}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-600">{formatCurrency(Math.abs(a.totalVarianceValue))}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{a.createdAt.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
