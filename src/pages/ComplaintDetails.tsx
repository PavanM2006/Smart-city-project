import React, { useEffect, useState } from 'react';
import { useParams as getParams, useNavigate as getNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Briefcase, 
  Trash2, Send, Sliders, CheckCircle2, MessageSquare, AlertTriangle 
} from 'lucide-react';
import apiClient from '../services/api';
import { Complaint, Department } from '../data/mockData';
import ComplaintMap from '../components/maps/ComplaintMap';

// Extended type for SQL JOIN queries return structure
interface DetailedComplaint extends Complaint {
  citizen_email?: string;
  citizen_phone?: string;
  department_name?: string;
  head_officer?: string;
  department_contact?: string;
}

interface CommentType {
  comment_id: number;
  complaint_id: string;
  user_id: number;
  comment: string;
  created_at: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
}

const ComplaintDetails: React.FC = () => {
  const { id } = getParams<{ id: string }>();
  const navigate = getNavigate();

  const [complaint, setComplaint] = useState<DetailedComplaint | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Administrative action forms
  const [status, setStatus] = useState<Complaint['status']>('Submitted');
  const [assignedDept, setAssignedDept] = useState<number | null>(null);
  const [priority, setPriority] = useState<Complaint['priority']>('Medium');
  const [remarks, setRemarks] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('smartcity_user') || '{}');
  const isAdmin = currentUser.role === 'administrator';
  const isOfficer = currentUser.role === 'department_officer';
  const isStaff = isAdmin || isOfficer;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch details (includes comments)
        const detailsRes = await apiClient.get(`/complaints/${id}`);
        if (detailsRes.data && detailsRes.data.success) {
          const c = detailsRes.data.complaint;
          setComplaint(c);
          setComments(detailsRes.data.comments || []);
          
          // Pre-fill action forms
          setStatus(c.status);
          setAssignedDept(c.department_id);
          setPriority(c.priority);
          setRemarks(c.remarks || '');
        }

        // Fetch departments for admins/officers routing
        if (isStaff) {
          const deptRes = await apiClient.get('/departments');
          if (deptRes.data && deptRes.data.success) {
            setDepartments(deptRes.data.departments);
          }
        }
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isStaff]);

  // Handle posting comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      // POST /api/complaints/:id/comments
      const response = await apiClient.post(`/complaints/${id}/comments`, {
        comment: newComment
      });

      if (response.data && response.data.success) {
        setComments(prev => [...prev, response.data.comment]);
        setNewComment('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to post comment.');
    } finally {
      setCommentLoading(false);
    }
  };

  // Handle updating complaint workflow
  const handleUpdateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      // PUT /api/complaints/:id
      const response = await apiClient.put(`/complaints/${id}`, {
        status,
        department_id: assignedDept,
        priority,
        remarks
      });

      if (response.data && response.data.success) {
        setComplaint(prev => prev ? {
          ...prev,
          status,
          department_id: assignedDept,
          priority,
          remarks,
          updated_at: new Date().toISOString()
        } : null);
        alert('Complaint workflow updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update workflow.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle case deletion (Admins only)
  const handleDeleteComplaint = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this complaint from the city archives?')) return;

    try {
      // DELETE /api/complaints/:id
      const response = await apiClient.delete(`/complaints/${id}`);
      if (response.data && response.data.success) {
        alert('Complaint deleted successfully.');
        navigate(isAdmin ? '/admin' : '/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete complaint.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-bold text-slate-450 animate-pulse">
        Fetching Complaint Registry Records...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-bold text-xs">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <p className="text-slate-805">Complaint record not found or access restricted.</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-xl uppercase">
          Go back
        </button>
      </div>
    );
  }

  const stages: { label: Complaint['status']; desc: string; num: number }[] = [
    { label: 'Submitted', desc: 'Grievance logged and queued.', num: 1 },
    { label: 'Under Review', desc: 'Administrator validating details.', num: 2 },
    { label: 'Assigned', desc: 'Routed to municipal department.', num: 3 },
    { label: 'In Progress', desc: 'Repair crews active on grid.', num: 4 },
    { label: 'Resolved', desc: 'Repair completed & certified.', num: 5 },
    { label: 'Closed', desc: 'Archived and confirmed.', num: 6 }
  ];

  const currentStep = stages.findIndex(s => s.label === complaint.status);

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
          <div className="font-bold">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 font-mono uppercase">
              <span>{complaint.complaint_id}</span>
              <span className="bullet text-slate-300">•</span>
              <span>{complaint.category}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-snug">{complaint.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={handleDeleteComplaint}
              className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-black text-[10px] rounded-xl hover:bg-rose-100 uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Case
            </button>
          )}
          
          <span className={`inline-block px-3 py-1.5 text-[9px] font-black uppercase rounded-xl border ${
            complaint.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-700' :
            complaint.priority === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700' :
            complaint.priority === 'Medium' ? 'bg-blue-50 border-blue-200 text-blue-700' :
            'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {complaint.priority} Priority
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Column: Case Details & OSM map */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Timeline workflow */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
            <h4 className="font-black text-slate-905 text-xs uppercase tracking-wider">Workflow Progression Timeline</h4>
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 font-bold text-[10px]">
              {stages.map((stage, idx) => {
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;
                
                return (
                  <div key={stage.num} className="flex flex-col items-center text-center space-y-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white border-slate-250 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-blue-100 scale-105' : ''}`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[9px]">{stage.num}</span>}
                    </div>
                    <span className={`font-black uppercase tracking-wide text-[8px] ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core Info */}
          <div className="bg-white border border-slate-155 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 font-bold text-xs">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Grievance description</span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200 font-semibold">{complaint.description}</p>
            </div>

            {complaint.image && (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Evidence Photograph</span>
                <div className="relative h-64 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                  <img 
                    src={complaint.image.startsWith('uploads') ? `http://localhost:5000/${complaint.image}` : complaint.image} 
                    alt="Evidence" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* OpenStreetMap display */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4.5 h-4.5 text-blue-600" /> OSM Coordinates Pinpoint
            </h4>
            
            <div className="h-[350px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
              <ComplaintMap complaints={[complaint]} />
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Address Snapped: <strong className="text-slate-800 font-extrabold">{complaint.address || complaint.location_address}</strong> (Lat {complaint.latitude || complaint.location_lat}, Lng {complaint.longitude || complaint.location_lng})</span>
            </div>
          </div>

        </div>

        {/* Right Column: Assigned department, Chat Thread, Status actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Department card */}
          {complaint.department_id ? (
            <div className="bg-teal-950 text-white rounded-3xl p-6 shadow-xl space-y-4 font-bold text-xs">
              <h4 className="text-[9px] font-black text-teal-400 uppercase tracking-widest flex items-center gap-1">
                <Briefcase className="w-4 h-4" /> Assigned City Department
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] font-black text-teal-300 uppercase">Department</span>
                  <p className="mt-0.5">{complaint.department_name}</p>
                </div>
                <div>
                  <span className="text-[8px] font-black text-teal-300 uppercase">Officer in Charge</span>
                  <p className="mt-0.5">{complaint.head_officer}</p>
                </div>
                <div className="col-span-2 border-t border-teal-900 pt-3 flex items-center justify-between text-[10px]">
                  <p className="text-teal-200">Email: <strong className="text-white">{complaint.department_contact}</strong></p>
                  <a 
                    href={`mailto:${complaint.department_contact}`}
                    className="px-3 py-1.5 bg-teal-800 text-white hover:bg-teal-700 rounded-lg text-[9px] font-black uppercase tracking-wider border border-teal-600"
                  >
                    Direct Mail
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl text-xs font-bold text-amber-800">
              This grievance is currently in the administrative review queue. A specialized department (Water, Electric, Roads) will be routed shortly.
            </div>
          )}

          {/* Administrative update controls (Officers & Admins only) */}
          {isStaff && (
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-blue-600" /> Administrative Action Room
              </h4>
              
              <form onSubmit={handleUpdateWorkflow} className="space-y-4 font-bold text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Workflow Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="Submitted">Submitted (Queued)</option>
                    <option value="Under Review">Under Review (Verifying)</option>
                    <option value="Assigned">Assigned (Department Routed)</option>
                    <option value="In Progress">In Progress (Crews Active)</option>
                    <option value="Resolved">Resolved (Completed)</option>
                    <option value="Closed">Closed (Archived)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Route Department</label>
                  <select
                    value={assignedDept || ''}
                    onChange={(e) => setAssignedDept(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => (
                      <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Priority Tier</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Priority</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase">Official Remarks (Citizen Visible)</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter dispatch notes, road work updates, etc..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-blue-650 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  Commit Changes & Alert Citizen
                </button>
              </form>
            </div>
          )}

          {/* Comments direct thread */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-blue-600" /> Direct Communication Chat
            </h4>

            {/* Comment List */}
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {comments.map((c) => (
                <div 
                  key={c.comment_id}
                  className={`flex flex-col max-w-[85%] text-xs p-3 rounded-2xl font-bold leading-normal ${
                    c.user_id === currentUser.id 
                      ? 'bg-blue-600 text-white rounded-tr-none ml-auto'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none mr-auto'
                  }`}
                >
                  <span className="text-[8px] font-black uppercase tracking-wide opacity-75 mb-0.5">
                    {c.author_name} ({c.author_role.replace('_', ' ')})
                  </span>
                  <p className="font-semibold">{c.comment}</p>
                  <span className="text-[7px] opacity-60 self-end mt-1 font-mono">
                    {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-xs text-slate-400 font-bold py-6 italic">No comments posted on this grievance.</p>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2 font-bold text-xs">
              <input 
                type="text" 
                placeholder="Type response, upload updates..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                required
              />
              <button
                type="submit"
                disabled={commentLoading}
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

export default ComplaintDetails;
