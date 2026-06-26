import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle, Plus, Activity, MapPin, Bell, ArrowRight } from 'lucide-react';
import apiClient from '../services/api';
import { Complaint } from '../data/mockData';
import ComplaintMap from '../components/maps/ComplaintMap';

const Dashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('smartcity_user') || '{}');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await apiClient.get('/complaints');
        if (response.data && response.data.success) {
          setComplaints(response.data.complaints);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch complaints.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const total = complaints.length;
  const active = complaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;
  const resolved = total - active;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in font-sans">
      
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-black tracking-tight">Welcome to SmartCity, {user.name}!</h2>
          <p className="text-blue-100/90 text-xs font-semibold max-w-xl leading-relaxed">
            Report local grievances, pinpoint geo-locations on our interactive Leaflet map, and monitor real-time department updates.
          </p>
        </div>
        <div className="shrink-0 relative z-10">
          <Link 
            to="/complaints/new"
            className="px-5 py-3 bg-white text-blue-700 font-extrabold rounded-xl shadow-lg shadow-indigo-950/20 hover:scale-105 hover:bg-slate-50 transition-all flex items-center gap-1.5 text-xs uppercase tracking-wider"
          >
            <Plus className="w-4.5 h-4.5" /> Report Civic Issue
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
          <span>{error} (Operating in demo client-side state)</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-3 gap-6 font-bold text-xs">
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <AlertTriangle className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">My Logged Reports</p>
            <p className="text-2xl font-black text-slate-900">{isLoading ? '...' : total}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider">Active Reviews</p>
            <p className="text-2xl font-black text-slate-900">{isLoading ? '...' : active}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider">Resolved SLA</p>
            <p className="text-2xl font-black text-slate-900">{isLoading ? '...' : resolved}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Map & Registry, Right = Recent Alerts */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left: Map & Active Case Registry */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <MapPin className="w-4.5 h-4.5 text-blue-600" /> Geographic OpenStreetMap Index
            </h3>
            <p className="text-slate-500 text-xs font-semibold">Plotting your submitted civic concerns in real-time. Hover on markers to view status overlays.</p>
          </div>

          <div className="h-[380px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
            {isLoading ? (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-400 animate-pulse">
                Loading Geographic Markers...
              </div>
            ) : (
              <ComplaintMap complaints={complaints} />
            )}
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Active Grievance History</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-extrabold text-slate-700">No active grievances logged.</p>
                <Link 
                  to="/complaints/new" 
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                >
                  Log First Case
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {complaints.slice(0, 4).map((c) => (
                  <div 
                    key={c.complaint_id}
                    className="bg-white border border-slate-150 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2 font-bold text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] text-slate-400">{c.complaint_id}</span>
                        <span className={`text-[9px] uppercase px-2 py-0.5 rounded ${
                          c.status === 'Submitted' ? 'bg-slate-100 text-slate-600' :
                          c.status === 'In Progress' ? 'bg-blue-50 text-blue-750' :
                          'bg-emerald-50 text-emerald-755'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 truncate">{c.title}</h4>
                      <p className="text-slate-500 font-semibold text-[11px] line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    <Link 
                      to={`/complaints/${c.complaint_id}`}
                      className="mt-4 w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1 text-[11px] uppercase transition-colors"
                    >
                      Track Live Progress <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right: Recent alerts feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Bell className="w-4.5 h-4.5 text-blue-600" /> System Alerts
            </h3>
            <Link to="/notifications" className="text-[10px] font-black text-blue-600 uppercase hover:underline">
              Open Center
            </Link>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs divide-y divide-slate-50">
            {complaints.slice(0, 3).map((c, i) => (
              <div key={i} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  Your complaint <strong className="font-extrabold">"{c.title}"</strong> is currently marked as <span className="text-blue-600">{c.status.toUpperCase()}</span>.
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(c.updated_at || c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {complaints.length === 0 && (
              <p className="text-center text-xs text-slate-400 font-bold py-6">No recent system notifications.</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-amber-905 font-bold text-xs space-y-2">
            <div className="flex items-center gap-1 text-amber-800">
              <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
              <span className="uppercase tracking-wide text-[10px]">Satellite Geolocation</span>
            </div>
            <p className="leading-relaxed opacity-95">
              Filing complaints auto-captures satellite GPS telemetry using the HTML5 geolocation device mapper to ensure precision dispatches.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
