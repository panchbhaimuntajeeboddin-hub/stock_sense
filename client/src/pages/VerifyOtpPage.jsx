import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const VerifyOtpPage = () => {
  const { verifyOTP, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpHint = location.state?.otpHint;

  const handleOtpChange = (index, val) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const code = otp.join('');
    const result = await verifyOTP(email, code);
    if (result.success) {
      navigate('/reset-password', { state: { email, otp: code } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" /> Verify 6-Digit OTP Code
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter the OTP code sent to <strong className="text-purple-300">{email || 'your email'}</strong>
          </p>
          {otpHint && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-2">
              Generated OTP Code: <strong className="font-mono text-white tracking-widest">{otpHint}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!location.state?.email && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="user@stocksense.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-purple-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex gap-2 justify-between">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-input-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                className="w-11 h-12 text-center text-lg font-bold bg-slate-950 border border-slate-700 rounded-xl text-purple-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Verifying OTP...' : 'Verify OTP Code'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Didn't receive a code?{' '}
          <Link to="/forgot-password" className="text-purple-400 font-semibold hover:underline">
            Request New OTP
          </Link>
        </p>
      </div>
    </div>
  );
};
