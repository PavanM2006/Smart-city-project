import React, { useState } from 'react';
import { User, ShieldAlert, Key, Save, Loader } from 'lucide-react';
import apiClient from '../services/api';

const Profile: React.FC = () => {
  const user = JSON.parse(localStorage.getItem('smartcity_user') || '{}');
  const token = localStorage.getItem('smartcity_token') || '';

  // Details form state
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  
  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isPwLoading, setIsPwLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // PUT /api/auth/profile
      const response = await apiClient.put('/auth/profile', {
        name,
        phone,
        avatar
      });

      if (response.data && response.data.success) {
        // Save updated details in storage
        localStorage.setItem('smartcity_user', JSON.stringify(response.data.user));
        setMessage('Profile details updated successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password update
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPwLoading(true);
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setIsPwLoading(false);
      return;
    }

    try {
      // POST /api/auth/change-password
      const response = await apiClient.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      if (response.data && response.data.success) {
        setMessage('Password reset successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Incorrect old password. Password change failed.');
    } finally {
      setIsPwLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in font-sans">
      
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-blue-650 animate-pulse" /> Profile Management Rooms
        </h2>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Configure credential details and secure password reset mechanisms</p>
      </div>

      {(message || error) && (
        <div className={`p-4 rounded-xl font-bold text-xs ${
          message ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message || error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Profile Details Form */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <User className="w-4.5 h-4.5 text-blue-600" /> Account Identity
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4 font-bold text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">Email Address (Read Only)</label>
              <input 
                type="email" 
                value={user.email} 
                disabled 
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold text-xs cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase">Avatar URL</label>
              <input 
                type="url" 
                value={avatar} 
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Identity Details
            </button>
          </form>
        </div>

        {/* Password Reset Form & JWT Metadata */}
        <div className="space-y-6">
          
          {/* Password Form */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Key className="w-4.5 h-4.5 text-blue-600" /> Secure Password Update
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4 font-bold text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Current Account Password</label>
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isPwLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPwLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Change Password Key
              </button>
            </form>
          </div>

          {/* Secure Web Token Card */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl space-y-2 text-indigo-950 font-bold text-xs shadow-xs">
            <div className="flex items-center gap-1.5 text-indigo-800">
              <ShieldAlert className="w-4.5 h-4.5 animate-pulse shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider">JWT Session Metadata</span>
            </div>
            <div className="font-mono text-[9px] text-slate-500 bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800 overflow-x-auto select-all break-all whitespace-pre-wrap">
              Bearer {token}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
