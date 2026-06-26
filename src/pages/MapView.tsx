import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Grid, Filter, AlertTriangle, ArrowLeft } from 'lucide-react';
import apiClient from '../services/api';
import { Complaint } from '../data/mockData';
import ComplaintMap from '../components/maps/ComplaintMap';

const MapView: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllComplaints = async () => {
      try {
        const response = await apiClient.get('/complaints');
        if (response.data && response.data.success) {
          setComplaints(response.data.complaints);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve city complaints.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllComplaints();
  }, []);

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesCategory = filterCategory === 'All' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-bold text-slate-450 animate-pulse">
        Initializing Municipal Map Layers...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-slate-750"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Map className="w-6 h-6 text-blue-650 animate-pulse" /> City Grievance Mapping Room
            </h2>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              High-fidelity GIS display plotting active municipal issues
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 font-bold text-xs">
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-bold text-xs"
            >
              <option value="All">All Categories</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Garbage">Garbage</option>
              <option value="Drainage">Drainage</option>
              <option value="Street Light">Street Light</option>
              <option value="Other">Other</option>
            </select>
            <Grid className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all font-bold text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>Operating in client-side demonstration map mode.</span>
        </div>
      )}

      {/* Map display */}
      <div className="h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
        <ComplaintMap 
          complaints={filteredComplaints} 
          onSelectComplaint={(id) => navigate(`/complaints/${id}`)}
        />
      </div>

      {/* Info card */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between font-bold text-xs text-slate-650">
        <p className="font-semibold leading-relaxed">
          The GIS system connects coordinates to specific wards and boundaries. Markers are color-coded based on the category of civil grievances reported.
        </p>
        <span className="px-3 py-1 bg-white border rounded-xl text-slate-700 uppercase shrink-0 font-black">
          {filteredComplaints.length} Plot Markers
        </span>
      </div>

    </div>
  );
};

export default MapView;
