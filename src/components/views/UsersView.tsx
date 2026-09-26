// StockX Enterprise User Management View
import React, { useState } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Shield,
  Edit,
  UserCheck,
  UserX,
  X,
  Mail,
  Building2,
  Calendar,
  Lock,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { User, UserRole } from '../../types';

export const UsersView: React.FC = () => {
  const { users, warehouses, createUser, updateUserRole, toggleUserStatus, currentUser } =
    useInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('INVENTORY_MANAGER');
  const [title, setTitle] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh_alpha');

  const openAddModal = () => {
    setName('');
    setEmail('');
    setRole('INVENTORY_MANAGER');
    setTitle('Inventory Operations Specialist');
    setWarehouseId(warehouses[0]?.id || 'wh_alpha');
    setIsAddModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    createUser({
      name,
      email,
      role,
      title,
      warehouseId,
      isActive: true,
      lastLoginAt: 'Never logged in',
    });

    setIsAddModalOpen(false);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    updateUserRole(userId, newRole);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'INVENTORY_MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WAREHOUSE_STAFF':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500">
            Control user access roles, facility assignments, and security permissions across StockX
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role Permission</th>
                <th className="py-3 px-4">Facility Allocation</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const wh = warehouses.find((w) => w.id === user.warehouseId);
                const isCurrent = currentUser?.id === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-600'
                              : user.role === 'INVENTORY_MANAGER'
                              ? 'bg-blue-600'
                              : 'bg-emerald-600'
                          }`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${getRoleBadge(
                          user.role
                        )} cursor-pointer focus:outline-none`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="INVENTORY_MANAGER">INVENTORY_MANAGER</option>
                        <option value="WAREHOUSE_STAFF">WAREHOUSE_STAFF</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {wh?.name || 'All Facilities'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isCurrent && (
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            user.isActive
                              ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                              : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Provision New Staff User</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jessica Taylor"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. j.taylor@stockx.corp"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  >
                    <option value="ADMIN">System Administrator</option>
                    <option value="INVENTORY_MANAGER">Inventory Manager</option>
                    <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Facility</label>
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
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inbound Dock Supervisor"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
