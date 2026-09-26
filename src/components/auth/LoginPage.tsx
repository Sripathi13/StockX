import React, { useState } from 'react';
import {
  ShieldCheck,
  Package,
  Layers,
  ScanLine,
  Truck,
  ArrowRight,
  UserCheck,
  Lock,
  Mail,
  Warehouse,
  CheckCircle,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login } = useInventory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<UserRole>('manager');
  const [error, setError] = useState<string | null>(null);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your workplace email.');
      return;
    }
    const success = login(email, role);
    if (!success) {
      setError('Invalid credentials.');
    }
  };

  const handleFastLogin = (demoEmail: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    login(demoEmail, demoRole);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Brand Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs font-bold font-mono text-sm tracking-wider">
            SX
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">
              Stock<span className="text-emerald-400">X</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 ml-2 font-mono">
              v2.6 Modular IMS
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Central Cluster Online
          </span>
          <span className="hidden sm:inline font-mono">Chicago Alpha Hub</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="text-xs font-mono tracking-wider uppercase text-blue-400 font-semibold">
              Modular Inventory Management System
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Centralized Stock Operations Platform
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Digitizing manual registers, excel sheets, and floor logs into real-time stock control.
              Select your persona to enter the workspace.
            </p>
          </div>

          {/* Dual Persona Fast-Switch Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Persona 1: Inventory Manager */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 hover:border-blue-500 transition-all flex flex-col justify-between group shadow-lg">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-950/80 border border-blue-800/60 text-blue-400 rounded-xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900">
                    Lead Management Role
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Inventory Manager
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete governance over stock levels, purchasing, suppliers, and customer dispatch approvals.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Inbound PO creation & receiving verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Outbound dispatch authorization & pick lists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Reorder thresholds, stock valuation & write-offs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Audit ledger and CSV/Excel import & export</span>
                  </div>
                </div>

                <div className="pt-2 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>Demo Profile: Sarah Vance</span>
                  <span className="text-slate-500">sarah.vance@stockx.corp</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFastLogin('sarah.vance@stockx.corp', 'manager')}
                className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter as Inventory Manager</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Persona 2: Warehouse Staff */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 hover:border-emerald-500 transition-all flex flex-col justify-between group shadow-lg">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 rounded-xl">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                    Floor Operations Role
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    Warehouse Staff
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Hands-on floor operations: order picking, put-away shelving, rack-to-rack transfers, and cycle counts.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time picking queue with optical scan check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Put-away & Shelving into designated aisles/bins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Bin-to-bin and inter-warehouse stock transfers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Physical counting & cycle discrepancy recording</span>
                  </div>
                </div>

                <div className="pt-2 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>Demo Profile: Marcus Chen</span>
                  <span className="text-slate-500">marcus.chen@stockx.corp</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFastLogin('marcus.chen@stockx.corp', 'warehouse_staff')}
                className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter as Warehouse Staff</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Standard Credentials Form Accordion */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Custom Direct Sign-in
              </span>
              <span className="text-[11px] text-slate-500">Standard SSO / Enterprise Email</span>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Workplace Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@stockx.corp"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="manager">Inventory Manager</option>
                    <option value="warehouse_staff">Warehouse Staff</option>
                  </select>
                </div>
              </div>

              {error && <div className="text-xs text-rose-400">{error}</div>}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('sarah.vance@stockx.corp');
                      setRole('manager');
                    }}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Use Manager Credentials
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('marcus.chen@stockx.corp');
                      setRole('warehouse_staff');
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Use Staff Credentials
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-500">
        <span>StockX Modular Inventory Platform · Authorized Enterprise Operations Access Only</span>
      </footer>
    </div>
  );
};
