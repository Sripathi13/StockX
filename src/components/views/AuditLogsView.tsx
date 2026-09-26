// StockX Enterprise Audit Logs View
import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  Lock,
  UserCheck,
  Activity,
  Terminal,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    const matchesEntity = selectedEntity === 'ALL' || log.entityType === selectedEntity;
    return matchesSearch && matchesEntity;
  });

  const exportAuditCSV = () => {
    const headers = [
      'Timestamp',
      'Action',
      'Entity Type',
      'Entity ID',
      'Operator Name',
      'Operator Email',
      'Role',
      'IP Address',
      'Audit Event Details',
    ];
    const rows = filteredLogs.map((l) => [
      `"${l.createdAt}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId || ''}"`,
      `"${l.userName}"`,
      `"${l.userEmail}"`,
      `"${l.userRole}"`,
      `"${l.ipAddress}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stockx_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 uppercase">
              Security & Compliance
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Audit Trails
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail recording user logins, entity creation, edits, and state transitions
          </p>
        </div>

        <button
          onClick={exportAuditCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-300" />
          <span>Export Audit CSV</span>
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
            placeholder="Search by action, user name, IP address, or details..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 font-sans"
          />
        </div>

        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer w-full md:w-auto"
        >
          <option value="ALL">All Entity Scopes</option>
          <option value="AUTH">Authentication</option>
          <option value="PRODUCT">Product Management</option>
          <option value="RECEIPT">Inbound Receipts</option>
          <option value="DELIVERY">Outbound Deliveries</option>
          <option value="TRANSFER">Internal Transfers</option>
          <option value="STOCK_ADJUSTMENT">Stock Adjustments</option>
          <option value="USER">User Administration</option>
          <option value="SETTINGS">System Settings</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Authorized User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Event Details & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No audit records match the current criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.userRole}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.ipAddress}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 max-w-md truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
