import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCheck, Activity } from 'lucide-react';
import apiClient from '../services/api';
import { requestNotificationPermission } from '../firebase/firebaseConfig';

interface RegisterProps {
  onRegisterSuccess: (user: any, token: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'department_officer' | 'administrator'>('citizen');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name || !email || !password) {
      setError('Please fill in all required fields: name, email, and password.');
      setIsLoading(false);
      return;
    }

    try {
      // POST /api/auth/register
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        phone,
        password,
        role
      });

      if (response.data && response.data.success) {
        const { token, user } = response.data;
        
        // Save token & user in LocalStorage
        localStorage.setItem('smartcity_token', token);
        localStorage.setItem('smartcity_user', JSON.stringify(user));
        
        onRegisterSuccess(user, token);

        // Request FCM Push permissions
        await requestNotificationPermission(user.id, token);

        // Redirect based on role
        if (user.role === 'administrator') {
          navigate('/admin');
        } else if (user.role === 'department_officer') {
          navigate('/officer');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl mb-1 border border-blue-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="text-sm text-slate-500 font-semibold">Join the Smart City Citizens network.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-bold text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase">Role Profile Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('citizen')}
                className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                  role === 'citizen'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setRole('department_officer')}
                className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                  role === 'department_officer'
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => setRole('administrator')}
                className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                  role === 'administrator'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase">Full Name</label>
            <input 
              type="text" 
              placeholder="Jane Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase">Email Address</label>
            <input 
              type="email" 
              placeholder="jane.doe@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase">Phone Number</label>
            <input 
              type="tel" 
              placeholder="+1 (555) 019-2834" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-bold">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;
