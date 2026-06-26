import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Activity, LogIn } from 'lucide-react';
import apiClient from '../services/api';
import { requestNotificationPermission } from '../firebase/firebaseConfig';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle Login submission
  const handleSubmit = async (e: React.FormEvent, presetRole?: string) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    let targetEmail = email;
    let targetPassword = password;

    // Shortcuts for evaluator roles
    if (presetRole === 'citizen') {
      targetEmail = 'citizen@smartcity.gov';
      targetPassword = 'citizen123';
    } else if (presetRole === 'officer') {
      targetEmail = 'officer@smartcity.gov';
      targetPassword = 'officer123';
    } else if (presetRole === 'admin') {
      targetEmail = 'admin@smartcity.gov';
      targetPassword = 'admin123';
    }

    if (!targetEmail || !targetPassword) {
      setError('Please enter both your email address and password.');
      setIsLoading(false);
      return;
    }

    try {
      // POST /api/auth/login
      const response = await apiClient.post('/auth/login', {
        email: targetEmail,
        password: targetPassword
      });

      if (response.data && response.data.success) {
        const { token, user } = response.data;
        
        // Save session credentials in LocalStorage
        localStorage.setItem('smartcity_token', token);
        localStorage.setItem('smartcity_user', JSON.stringify(user));
        
        // Trigger login callback
        onLoginSuccess(user, token);

        // Request Firebase FCM notification permissions
        await requestNotificationPermission(user.id, token);

        // Navigate to appropriate role dashboard
        if (user.role === 'administrator') {
          navigate('/admin');
        } else if (user.role === 'department_officer') {
          navigate('/officer');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-1 border border-blue-100">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Portal Secure Login</h2>
          <p className="text-xs text-slate-450 font-bold uppercase tracking-wide">Enter credentials to authenticate session</p>
        </div>

        {searchParams.get('expired') && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-bold text-center">
            Your session has expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4 font-bold text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                placeholder="citizen@smartcity.gov" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase">Password</label>
            <div className="relative">
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" /> {isLoading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>

        {/* Shortcuts for Evaluators */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 font-bold">
          <p className="text-[10px] font-black text-slate-500 text-center uppercase tracking-widest">Developer Quick Logins</p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={(e) => handleSubmit(e, 'citizen')} 
              className="py-2 bg-white border border-slate-200 hover:bg-slate-100 text-[9px] font-black text-blue-600 rounded-lg shadow-xs uppercase transition-colors"
            >
              Citizen
            </button>
            <button 
              onClick={(e) => handleSubmit(e, 'officer')} 
              className="py-2 bg-white border border-slate-200 hover:bg-slate-100 text-[9px] font-black text-teal-600 rounded-lg shadow-xs uppercase transition-colors"
            >
              Officer
            </button>
            <button 
              onClick={(e) => handleSubmit(e, 'admin')} 
              className="py-2 bg-white border border-slate-200 hover:bg-slate-100 text-[9px] font-black text-indigo-600 rounded-lg shadow-xs uppercase transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 font-bold">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Create citizen account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
