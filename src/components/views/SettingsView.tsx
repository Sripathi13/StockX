// StockX Enterprise Settings & Configuration View
import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  IndianRupee,
  Shield,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataAsJSON,
    importDataFromJSON,
    exportProductsCSV,
    exportStockLedgerCSV,
    resetDatabase,
    currentUser,
  } = useInventory();

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [address, setAddress] = useState(settings.address);
  const [taxId, setTaxId] = useState(settings.taxId);
  const [currency, setCurrency] = useState(settings.currency);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold);
  const [autoReserveStock, setAutoReserveStock] = useState(settings.autoReserveStock);
  const [requireAdjustmentApproval, setRequireAdjustmentApproval] = useState(
    settings.requireAdjustmentApproval
  );
  const [notificationEmail, setNotificationEmail] = useState(settings.notificationEmail);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      address,
      taxId,
      currency,
      timezone,
      lowStockThreshold,
      autoReserveStock,
      requireAdjustmentApproval,
      notificationEmail,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDataFromJSON(content);
      if (ok) {
        setImportStatus('Successfully restored database from JSON backup file.');
      } else {
        setImportStatus('Failed to parse JSON backup. Format invalid.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-xs text-slate-500">
          Configure corporate entity parameters, automated inventory rules, and data preservation
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration successfully updated.</span>
        </div>
      )}

      {importStatus && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Company Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Corporate Entity Profile</span>
            </h2>
            <p className="text-[11px] text-slate-500">Company branding and tax identification</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corporate Tax ID / EIN</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Headquarters Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Accounting Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD ($ - Canadian Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                <option value="America/Chicago (CST)">America/Chicago (CST)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operations Notification Email</label>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Operational Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Automated Inventory Operations Rules</span>
            </h2>
            <p className="text-[11px] text-slate-500">Stock thresholds, reservations, and compliance gates</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReserveStock}
                onChange={(e) => setAutoReserveStock(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Automatic Stock Reservation on Outbound Order Creation
                </span>
                <span className="text-slate-500 text-[11px]">
                  Immediately locks physical stock upon sales order creation to prevent duplicate allocation.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAdjustmentApproval}
                onChange={(e) => setRequireAdjustmentApproval(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="font-semibold text-slate-900 block">
                  Enforce Dual-Signoff for Stock Adjustments & Write-Offs
                </span>
                <span className="text-slate-500 text-[11px]">
                  All warehouse staff inventory adjustments require approval from an Inventory Manager or Admin before posting to the stock ledger.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Save Configuration Settings
            </button>
          </div>
        </div>
      </form>

      {/* Data Management & Preservation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
            <span>Database Backup, Restore & Portability</span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Export complete JSON schema state, restore previous backups, or export master spreadsheets
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* JSON Backup */}
          <button
            onClick={exportDataAsJSON}
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between cursor-pointer"
          >
            <div>
              <Download className="w-5 h-5 text-blue-600 mb-2" />
              <div className="font-bold text-slate-900">Backup JSON</div>
              <p className="text-[11px] text-slate-500 mt-1">Full database snapshot</p>
            </div>
            <span className="text-blue-600 font-semibold mt-3 text-[11px]">Download .JSON &rarr;</span>
          </button>

          {/* JSON Restore */}
          <label className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between cursor-pointer">
            <div>
              <Upload className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-slate-900">Restore Backup</div>
              <p className="text-[11px] text-slate-500 mt-1">Upload JSON archive</p>
            </div>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            <span className="text-emerald-600 font-semibold mt-3 text-[11px]">Select File &rarr;</span>
          </label>

          {/* Catalog CSV */}
          <button
            onClick={exportProductsCSV}
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors flex flex-col justify-between cursor-pointer"
          >
            <div>
              <FileSpreadsheet className="w-5 h-5 text-purple-600 mb-2" />
              <div className="font-bold text-slate-900">Export Catalog</div>
              <p className="text-[11px] text-slate-500 mt-1">Excel-ready product CSV</p>
            </div>
            <span className="text-purple-600 font-semibold mt-3 text-[11px]">Download .CSV &rarr;</span>
          </button>

          {/* Seed Data Reset */}
          <button
            onClick={() => {
              if (window.confirm('Reset all records to initial enterprise dataset?')) {
                resetDatabase();
              }
            }}
            className="p-4 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-left transition-colors flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <RefreshCw className="w-5 h-5 text-rose-600 mb-2 group-hover:rotate-180 transition-transform duration-500" />
              <div className="font-bold text-slate-900">Reset Seed Data</div>
              <p className="text-[11px] text-slate-500 mt-1">Revert to fresh setup</p>
            </div>
            <span className="text-rose-600 font-semibold mt-3 text-[11px]">Reset Registry &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
