import React from 'react';
import { Building2, Phone, Mail, Clock, Star, Package, ShieldCheck } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const SuppliersView: React.FC = () => {
  const { suppliers, items, purchaseOrders } = useInventory();

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Approved Suppliers & Procurement Registry
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Vendor lead times, contact channels, active purchase orders, and linked catalog SKUs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((supplier) => {
          const supplierItems = items.filter((i) => i.supplierId === supplier.id);
          const activeOrders = purchaseOrders.filter(
            (po) => po.supplierId === supplier.id && po.status !== 'received'
          );

          return (
            <div
              key={supplier.id}
              className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {supplier.code}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {supplier.rating}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 mt-1.5">
                    {supplier.name}
                  </h2>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-500">Lead Time:</span>{' '}
                  <strong className="font-mono text-slate-900">{supplier.leadTimeDays} days</strong>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{supplier.phone}</span>
                </div>
              </div>

              {/* Linked categories & stats */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <span>Contact: <strong>{supplier.contactPerson}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{supplierItems.length} SKUs supplied</span>
                  <span aria-hidden="true">·</span>
                  <span className={activeOrders.length > 0 ? 'text-blue-600 font-semibold' : ''}>
                    {activeOrders.length} active POs
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
