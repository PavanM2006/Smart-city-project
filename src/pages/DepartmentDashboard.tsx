import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, Activity, MapPin, AlertTriangle } from 'lucide-react';
import apiClient from '../services/api';
import { Complaint } from '../data/mockData';
import DepartmentMap from '../components/maps/DepartmentMap';

const DepartmentDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const user = JSON.parse(localStorage.getItem('smartcity_user') || '{}');

  useEffect(() => {
    const fetchAssignedComplaints = async () => {
      try {
        // GET /api/complaints
        const response = await apiClient.get('/complaints');
        if (response.data && response.data.success) {
          setComplaints(response.data.complaints);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch assigned complaints.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedComplaints();
  }, []);

  // Filter complaints list
  const filteredComplaints = complaints.filter(c => {
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || c.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const total = complaints.length;
  const active = complaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;
  const resolved = total - active;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-bold text-slate-450 animate-pulse">
        Loading Department Dispatches Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-teal-600 animate-pulse" /> Department Officer Dashboard
          </h2>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Logged in: {user.name} • Municipal Department: Public Works & Roads
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>Operating in client-side simulated officer mode.</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 font-bold text-xs">
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Briefcase className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Assigned Cases</p>
            <p className="text-2xl font-black text-slate-900">{total}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider">Active Dispatches</p>
            <p className="text-2xl font-black text-slate-900">{active}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider">Resolved SLA</p>
            <p className="text-2xl font-black text-slate-900">{resolved}</p>
          </div>
        </div>
      </div>

      {/* Grid Layout: Left Map View, Right Cases List */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Map */}
        <div className="lg:col-span-2 space-y-4 z-0">
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-black text-slate-905 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4.5 h-4.5 text-teal-650" /> Department Ward Plot
              </h3>
              <p className="text-[9px] text-slate-400 font-bold">Showing geographic coordinates of cases routed to your unit</p>
            </div>

            <div className="h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <DepartmentMap complaints={filteredComplaints} />
            </div>
          </div>
        </div>

        {/* Right Active Grievances Table */}
        <div className="lg:col-span-3 bg-white border border-slate-155 rounded-3xl p-6 shadow-xs space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-teal-650 animate-pulse" /> Assigned Case Registry
            </h3>

            {/* Filters */}
            <div className="flex gap-2 font-bold text-xs">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-255 rounded-xl focus:outline-none"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black uppercase tracking-wider">
                  <th className="p-4 font-mono w-28">Case ID</th>
                  <th className="p-4">Grievance Title</th>
                  <th className="p-4 w-24">Priority</th>
                  <th className="p-4 w-28">Status</th>
                  <th className="p-4 w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredComplaints.map(c => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50/30">
                    <td className="p-4 font-mono font-bold text-slate-400">{c.complaint_id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-black text-slate-900">{c.title}</p>
                        <p className="text-[9px] text-slate-400 font-semibold truncate max-w-xs">{c.address || c.location_address}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase border ${
                        c.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        c.priority === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${
                        c.status === 'Submitted' ? 'bg-slate-100 text-slate-700' :
                        c.status === 'In Progress' ? 'bg-blue-50 text-blue-750 border border-blue-200' :
                        'bg-emerald-50 text-emerald-755 border border-emerald-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link 
                        to={`/complaints/${c.complaint_id}`}
                        className="px-3 py-1.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-755 font-bold rounded-lg transition-colors inline-block text-center"
                      >
                        Update
                      </Link>
                    </td>
                  </tr>
                ))}
                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">No grievances matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DepartmentDashboard;
