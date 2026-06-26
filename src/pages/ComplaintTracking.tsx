import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ShieldAlert, MapPin } from 'lucide-react';
import apiClient from '../services/api';
import { Complaint } from '../data/mockData';

const ComplaintTracking: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await apiClient.get('/complaints');
        if (response.data && response.data.success) {
          setComplaints(response.data.complaints);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch tracking details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusPercentage = (status: string) => {
    switch (status) {
      case 'Submitted': return 16;
      case 'Under Review': return 33;
      case 'Assigned': return 50;
      case 'In Progress': return 66;
      case 'Resolved': return 83;
      case 'Closed': return 100;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-bold text-slate-450 animate-pulse">
        Loading Grievance Registry Tracking Details...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in font-sans">
      
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-650 animate-pulse" /> Live Grievance Tracking Rooms
        </h2>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Monitor the direct progression of your logged reports from submission to archive</p>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
          <span>Operating in client-side demonstration mode.</span>
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-4">
          <Activity className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-sm">No Grievances Logged</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Submit a ticket to monitor infrastructure repair dispatches in real-time.</p>
          <Link 
            to="/complaints/new" 
            className="inline-block px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl transition-all"
          >
            Submit Grievance
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {complaints.map((c) => {
            const progress = getStatusPercentage(c.status);
            
            return (
              <div 
                key={c.complaint_id}
                className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-4 font-bold text-xs"
              >
                
                {/* Upper header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 font-mono">
                      <span>{c.complaint_id}</span>
                      <span>•</span>
                      <span>{c.category}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-sm leading-snug">{c.title}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border ${
                      c.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                      c.priority === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                      'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      {c.priority} Priority
                    </span>
                    
                    <span className="text-[10px] text-slate-800 uppercase px-2.5 py-1 bg-slate-100 rounded-lg">
                      {c.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    <span>Submitted</span>
                    <span>Assigned</span>
                    <span>Active Repair</span>
                    <span>Resolved</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Lower footer actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-slate-100">
                  <p className="text-slate-500 text-[11px] flex items-center gap-1 font-semibold truncate max-w-md">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" /> Snapped Address: {c.address || c.location_address}
                  </p>
                  
                  <Link 
                    to={`/complaints/${c.complaint_id}`}
                    className="px-4 py-2 bg-slate-50 border border-slate-250 hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    Open Tracking Room <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ComplaintTracking;
