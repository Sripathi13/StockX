// StockX Enterprise Authentication Portal
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
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Sparkles,
  UserPlus,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { UserRole } from '../../types';

type AuthView = 'login' | 'register' | 'forgot_password' | 'verify_otp' | 'reset_password';

export const LoginPage: React.FC = () => {
  const {
    login,
    register,
    requestPasswordResetOTP,
    verifyPasswordResetOTP,
    resetPassword,
  } = useInventory();

  const [currentView, setCurrentView] = useState<AuthView>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('INVENTORY_MANAGER');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('INVENTORY_MANAGER');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regTitle, setRegTitle] = useState('');

  // Password Reset / OTP state
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOTP, setSimulatedOTP] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Feedback state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    if (score <= 1) return { level: 'Weak', color: 'bg-red-500', text: 'text-red-600', percent: 25 };
    if (score === 2) return { level: 'Moderate', color: 'bg-amber-500', text: 'text-amber-600', percent: 50 };
    if (score === 3) return { level: 'Good', color: 'bg-blue-500', text: 'text-blue-600', percent: 75 };
    return { level: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600', percent: 100 };
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your corporate email address.');
      return;
    }
    const success = login(email, selectedRole);
    if (!success) {
      setError('Unable to authenticate with provided credentials.');
    }
  };

  const handleQuickLogin = (quickEmail: string, role: UserRole) => {
    setEmail(quickEmail);
    setSelectedRole(role);
    login(quickEmail, role);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName.trim() || !regEmail.trim()) {
      setError('Please provide full name and corporate email.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const res = register({
      name: regName,
      email: regEmail,
      role: regRole,
      title: regTitle,
    });

    if (!res.success) {
      setError(res.error || 'Failed to create user account.');
    } else {
      setSuccessMessage('Account registered successfully! Redirecting to workspace...');
    }
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!resetEmail) {
      setError('Please enter the email address linked to your account.');
      return;
    }
    const res = requestPasswordResetOTP(resetEmail);
    if (!res.success) {
      setError(res.error || 'User not found.');
    } else {
      setSimulatedOTP(res.code || '849201');
      setSuccessMessage('A 6-digit verification code has been dispatched.');
      setCurrentView('verify_otp');
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    const valid = verifyPasswordResetOTP(resetEmail, otpCode);
    if (!valid && otpCode !== simulatedOTP) {
      setError('Invalid or expired OTP code.');
      return;
    }
    setSuccessMessage('Verification confirmed. Please establish your new security key.');
    setCurrentView('reset_password');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    resetPassword(resetEmail, newPassword);
    setSuccessMessage('Security key updated! You can now log into your account.');
    setCurrentView('login');
    setEmail(resetEmail);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs font-bold font-mono text-sm tracking-wider">
            SX
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">
              Stock<span className="text-blue-500">X</span>
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 ml-2 font-mono">
              Enterprise IMS v1.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            PostgreSQL Cluster Online
          </span>
          <span className="hidden sm:inline font-mono text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
            Chera Logistics Hub
          </span>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-mono text-blue-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Production Infrastructure</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Centralized Stock Operations Platform
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Digitizing manual registers, excel sheets, and warehouse logs into real-time stock control and immutable ledger audit trails.
            </p>
          </div>

          {/* Feedback banners */}
          {error && (
            <div className="bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* AUTH VIEW 1: LOGIN */}
          {currentView === 'login' && (
            <div className="space-y-6">
              {/* Authorized Operator Profiles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
                    Direct Corporate Sign-In Profiles
                  </span>
                  <span>Select role to sign in instantly</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Admin */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@stockx.corp', 'ADMIN')}
                    className="p-4 bg-slate-950/70 border border-slate-800 hover:border-purple-500 rounded-xl text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-950/80 border border-purple-800 text-purple-300">
                          System Admin
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="font-semibold text-white text-sm">Administrator</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">admin@stockx.corp</div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                      Full access, users, settings & audit logs
                    </div>
                  </button>

                  {/* Manager */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('sarah.vance@stockx.corp', 'INVENTORY_MANAGER')}
                    className="p-4 bg-slate-950/70 border border-slate-800 hover:border-blue-500 rounded-xl text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950/80 border border-blue-800 text-blue-300">
                          Stock Manager
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="font-semibold text-white text-sm">Sarah Vance</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">sarah.vance@stockx.corp</div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                      Receipts, deliveries, adjustments & reports
                    </div>
                  </button>

                  {/* Warehouse Staff */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('marcus.chen@stockx.corp', 'WAREHOUSE_STAFF')}
                    className="p-4 bg-slate-950/70 border border-slate-800 hover:border-emerald-500 rounded-xl text-left transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                          Warehouse Staff
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <div className="font-semibold text-white text-sm">Marcus Chen</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">marcus.chen@stockx.corp</div>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                      Picking, shelving, transfers & counting
                    </div>
                  </button>
                </div>
              </div>

              {/* Standard Credentials Form */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-sm font-semibold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-400" />
                      Standard Credentials Authentication
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentView('register')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Create New Account
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Workplace Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. operator@stockx.corp"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmail(email);
                            setCurrentView('forgot_password');
                          }}
                          className="text-[11px] text-blue-400 hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Target Role Access Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('ADMIN')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                          selectedRole === 'ADMIN'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('INVENTORY_MANAGER')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                          selectedRole === 'INVENTORY_MANAGER'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Inventory Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole('WAREHOUSE_STAFF')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                          selectedRole === 'WAREHOUSE_STAFF'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        Warehouse Staff
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                      />
                      <span>Keep signed in (Persistent Session)</span>
                    </label>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* AUTH VIEW 2: REGISTER */}
          {currentView === 'register' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Create Employee Account</h2>
                  <p className="text-xs text-slate-400">Register new authorized personnel for StockX</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('login')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Thomas Vance"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Workplace Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. t.vance@stockx.corp"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      System Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as UserRole)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="ADMIN">System Administrator</option>
                      <option value="INVENTORY_MANAGER">Inventory Manager</option>
                      <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={regTitle}
                      onChange={(e) => setRegTitle(e.target.value)}
                      placeholder="e.g. Inventory Logistics Specialist"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {regPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrength(regPassword).color} transition-all`}
                          style={{ width: `${getPasswordStrength(regPassword).percent}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Password Strength:</span>
                        <span className={getPasswordStrength(regPassword).text}>
                          {getPasswordStrength(regPassword).level}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentView('login')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                  >
                    Complete Registration
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* AUTH VIEW 3: FORGOT PASSWORD */}
          {currentView === 'forgot_password' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-md mx-auto">
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Reset Security Access</h2>
                <p className="text-xs text-slate-400">
                  Enter your verified workplace email to receive a 6-digit authentication token.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="e.g. sarah.vance@stockx.corp"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <span>Dispatch Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentView('login')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Return to Sign In
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* AUTH VIEW 4: OTP VERIFICATION */}
          {currentView === 'verify_otp' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-md mx-auto">
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Security Verification</h2>
                <p className="text-xs text-slate-400">
                  Enter the 6-digit OTP code sent for <span className="text-slate-200 font-mono">{resetEmail}</span>
                </p>
              </div>

              {simulatedOTP && (
                <div className="mb-4 p-3 bg-blue-950/50 border border-blue-800/80 rounded-xl text-xs text-blue-300 flex items-center justify-between">
                  <span className="font-mono">Security Dispatch OTP:</span>
                  <span className="font-mono font-bold tracking-widest text-sm text-white bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700">
                    {simulatedOTP}
                  </span>
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                    6-Digit Verification Token
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <span>Verify Security Code</span>
                  <CheckCircle className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSendOTP({ preventDefault: () => {} } as React.FormEvent)}
                    className="hover:text-blue-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentView('login')}
                    className="hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* AUTH VIEW 5: RESET PASSWORD */}
          {currentView === 'reset_password' && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-md mx-auto">
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Create New Password</h2>
                <p className="text-xs text-slate-400">
                  Update your security credentials for <span className="text-slate-200 font-mono">{resetEmail}</span>
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrength(newPassword).color} transition-all`}
                          style={{ width: `${getPasswordStrength(newPassword).percent}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between">
                        <span>Password Strength:</span>
                        <span className={getPasswordStrength(newPassword).text}>
                          {getPasswordStrength(newPassword).level}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  Save New Security Key
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <span>&copy; {new Date().getFullYear()} StockX Global Systems. All rights reserved.</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="hidden sm:inline">SOC2 Type II Certified</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>Cluster: US-EAST-01</span>
          <span>Latency: 14ms</span>
          <span className="text-emerald-400">99.99% SLA</span>
        </div>
      </footer>
    </div>
  );
};
