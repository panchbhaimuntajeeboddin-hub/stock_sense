import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { requestOTP, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const result = await requestOTP(email);
    if (result.success) {
      navigate('/verify-otp', { state: { email, otpHint: result.otp } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-purple-400" /> Forgot Password (OTP)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your registered email address to receive a 6-digit verification code.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="user@stocksense.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Generating OTP...' : 'Send OTP Verification Code'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-purple-400 font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};
