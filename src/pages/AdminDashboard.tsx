import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Users, Building2, Sliders, Plus, Trash2, 
  Activity, AlertTriangle, Grid, Edit, X 
} from 'lucide-react';
import apiClient from '../services/api';
import { Complaint, Department, User } from '../data/mockData';

const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Analytics summary state
  const [summary, setSummary] = useState<any>(null);

  // Forms states
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [newDeptContact, setNewDeptContact] = useState('');
  
  const [editDeptId, setEditDeptId] = useState<number | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptHead, setEditDeptHead] = useState('');
  const [editDeptContact, setEditDeptContact] = useState('');

  const [activeSubTab, setActiveSubTab] = useState<'complaints' | 'users' | 'departments'>('complaints');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      // 1. Fetch complaints
      const compRes = await apiClient.get('/complaints');
      if (compRes.data && compRes.data.success) {
        setComplaints(compRes.data.complaints);
      }

      // 2. Fetch users registry
      const usersRes = await apiClient.get('/users');
      if (usersRes.data && usersRes.data.success) {
        setUsers(usersRes.data.users);
      }

      // 3. Fetch departments registry
      const deptRes = await apiClient.get('/departments');
      if (deptRes.data && deptRes.data.success) {
        setDepartments(deptRes.data.departments);
      }

      // 4. Fetch analytics summaries
      const summaryRes = await apiClient.get('/analytics/dashboard');
      if (summaryRes.data && summaryRes.data.success) {
        setSummary(summaryRes.data.summary);
      }

      // 5. Fetch trends
      await apiClient.get('/analytics/monthly');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch administrator records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle department creation
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptHead || !newDeptContact) return;

    try {
      const response = await apiClient.post('/departments', {
        department_name: newDeptName,
        head_officer: newDeptHead,
        contact: newDeptContact
      });

      if (response.data && response.data.success) {
        setNewDeptName('');
        setNewDeptHead('');
        setNewDeptContact('');
        fetchData();
        alert('Department registered successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to register department.');
    }
  };

  // Handle department update
  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeptId) return;

    try {
      const response = await apiClient.put(`/departments/${editDeptId}`, {
        department_name: editDeptName,
        head_officer: editDeptHead,
        contact: editDeptContact
      });

      if (response.data && response.data.success) {
        setEditDeptId(null);
        fetchData();
        alert('Department updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update department.');
    }
  };

  // Handle department deletion
  const handleDeleteDept = async (id: number) => {
    if (!window.confirm('Are you sure you want to permanently delete this department?')) return;

    try {
      await apiClient.delete(`/departments/${id}`);
      fetchData();
      alert('Department deleted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to delete department.');
    }
  };

  // Handle user role promotion
  const handleUpdateUserRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'citizen' ? 'department_officer' : currentRole === 'department_officer' ? 'administrator' : 'citizen';
    if (!window.confirm(`Are you sure you want to alter user role to: ${newRole}?`)) return;

    try {
      await apiClient.put(`/users/${userId}`, { role: newRole });
      fetchData();
      alert('User role updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs font-bold text-slate-450 animate-pulse">
        Loading Administrator Control Center...
      </div>
    );
  }

  // Pre-calculate dashboard KPIs if database summary fails
  const totalCount = complaints.length;
  const activeCount = complaints.filter(c => !['Resolved', 'Closed'].includes(c.status)).length;
  const resolvedCount = totalCount - activeCount;
  const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600 animate-pulse" /> City Administrator Console
          </h2>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Configure municipal departments, audit accounts, and review urban analytics reports</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>Operating in client-side simulation dashboard mode.</span>
        </div>
      )}

      {/* KPI summaries cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 font-bold text-xs">
        
        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-2">
          <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Total Grievances</p>
          <p className="text-3xl font-black text-slate-900">{summary?.totalComplaints || totalCount}</p>
          <p className="text-[10px] text-slate-400 font-semibold">Indexed in MySQL database</p>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-2">
          <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Needs Assignment</p>
          <p className="text-3xl font-black text-purple-600">
            {complaints.filter(c => !c.department_id).length}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold">Awaiting officer routing</p>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-2">
          <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Active Field Crews</p>
          <p className="text-3xl font-black text-blue-600">
            {complaints.filter(c => c.status === 'In Progress').length}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold">Active dispatches on city grid</p>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-2">
          <p className="text-[9px] text-slate-450 font-black uppercase tracking-wider">Resolution Rate</p>
          <p className="text-3xl font-black text-emerald-600">{summary?.resolutionRate || resolutionRate}%</p>
          <p className="text-[10px] text-slate-400 font-semibold">SLA Target 95%</p>
        </div>

      </div>

      {/* Analytics Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Category workload chart */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
          <h4 className="font-black text-slate-905 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-4.5 h-4.5 text-indigo-600" /> Wards Workload Category Loads
          </h4>
          
          <div className="h-44 flex items-end gap-5 pt-6 pb-2 px-2 border-b border-slate-100">
            {(() => {
              const categories = ['Water Supply', 'Electricity', 'Road Damage', 'Garbage', 'Drainage', 'Street Light', 'Other'];
              const maxCount = Math.max(...categories.map(cat => complaints.filter(c => c.category === cat).length), 1);

              return categories.map(cat => {
                const count = complaints.filter(c => c.category === cat).length;
                const heightPercent = (count / maxCount) * 100;
                
                return (
                  <div key={cat} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                    <span className="absolute -top-6 bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {count} cases
                    </span>
                    <div 
                      className="bg-indigo-600 w-full rounded-t-md transition-all duration-550 ease-out"
                      style={{ height: `${heightPercent || 5}%` }}
                    ></div>
                    <span className="text-[8px] font-black text-slate-450 max-w-full truncate text-center" title={cat}>
                      {cat.replace(' Supply', '').replace(' Damage', '')}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Monthly trends chart */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
          <h4 className="font-black text-slate-905 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5 text-indigo-600" /> Resolution Monthly Progression
          </h4>

          <div className="h-44 pt-4 flex flex-col justify-between font-bold">
            <div className="flex-1 relative">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <path 
                  d="M 0 45 Q 25 35, 50 15 T 100 8 L 100 50 L 0 50 Z" 
                  fill="url(#adminTrendGrad)" 
                  opacity="0.25"
                />
                <path 
                  d="M 0 45 Q 25 35, 50 15 T 100 8" 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="2.5" 
                />
                <defs>
                  <linearGradient id="adminTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 tracking-wider font-black border-t border-slate-50 pt-2 px-1">
              <span>JANUARY 2026</span>
              <span>FEBRUARY 2026</span>
              <span>MARCH 2026 (CURRENT)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Sub Tabs Toggle */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('complaints')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'complaints' 
              ? 'border-indigo-600 text-slate-900 bg-indigo-50/10' 
              : 'border-transparent text-slate-500 hover:text-slate-750'
          }`}
        >
          <Sliders className="w-4.5 h-4.5" /> Grievance Registry
        </button>
        
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'users' 
              ? 'border-indigo-600 text-slate-900 bg-indigo-50/10' 
              : 'border-transparent text-slate-500 hover:text-slate-750'
          }`}
        >
          <Users className="w-4.5 h-4.5" /> User Directory
        </button>

        <button
          onClick={() => setActiveSubTab('departments')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'departments' 
              ? 'border-indigo-600 text-slate-900 bg-indigo-50/10' 
              : 'border-transparent text-slate-500 hover:text-slate-750'
          }`}
        >
          <Building2 className="w-4.5 h-4.5" /> Departments Registrar
        </button>
      </div>

      {/* Grid table panels */}

      {/* Panel 1: Master Grievance Registry */}
      {activeSubTab === 'complaints' && (
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Master Grievances</h3>
          
          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black uppercase tracking-wider">
                  <th className="p-4 font-mono w-28">Case ID</th>
                  <th className="p-4">Incident Title</th>
                  <th className="p-4">Reporter</th>
                  <th className="p-4 w-32">Category</th>
                  <th className="p-4 w-28">Priority</th>
                  <th className="p-4 w-36">Assigned Unit</th>
                  <th className="p-4 w-28">Status</th>
                  <th className="p-4 w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {complaints.map(c => {
                  const dept = departments.find(d => d.department_id === c.department_id);
                  return (
                    <tr key={c.complaint_id} className="hover:bg-slate-50/30">
                      <td className="p-4 font-mono font-bold text-slate-400">{c.complaint_id}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-black text-slate-900">{c.title}</p>
                          <p className="text-[9px] text-slate-400 font-semibold truncate max-w-xs">{c.address || c.location_address}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-bold">{c.citizen_name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold">{c.category}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                          c.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                          'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-650">
                        {dept ? dept.department_name : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
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
                          className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-755 font-bold rounded-lg transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel 2: User Directory */}
      {activeSubTab === 'users' && (
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4 animate-fade-in">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">User accounts list</h3>
          
          <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black uppercase tracking-wider">
                  <th className="p-4 w-16">ID</th>
                  <th className="p-4">Identity Name</th>
                  <th className="p-4">Email address</th>
                  <th className="p-4 w-32">Phone</th>
                  <th className="p-4 w-36">Role Profile</th>
                  <th className="p-4 w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/30">
                    <td className="p-4 font-mono font-bold text-slate-400">{u.id}</td>
                    <td className="p-4 flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-lg object-cover border" />
                      <span className="font-black text-slate-900">{u.name}</span>
                    </td>
                    <td className="p-4 text-slate-700">{u.email}</td>
                    <td className="p-4 text-slate-600 font-mono">{u.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${
                        u.role === 'administrator' ? 'bg-indigo-50 text-indigo-755 border-indigo-200' :
                        u.role === 'department_officer' ? 'bg-teal-50 text-teal-755 border-teal-200' :
                        'bg-blue-50 text-blue-755 border-blue-200'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleUpdateUserRole(u.id, u.role)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 rounded-lg font-bold text-[10px] uppercase transition-colors cursor-pointer"
                      >
                        Change Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel 3: Departments Registrar */}
      {activeSubTab === 'departments' && (
        <div className="grid lg:grid-cols-5 gap-8 animate-fade-in">
          
          {/* Left Form */}
          <div className="lg:col-span-2 bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Building2 className="w-4.5 h-4.5 text-indigo-600" />
              {editDeptId ? 'Modify Department' : 'Register Department'}
            </h3>

            <form 
              onSubmit={editDeptId ? handleUpdateDept : handleCreateDept} 
              className="space-y-4 font-bold text-xs"
            >
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase">Department Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Drainage & Canal Management"
                  value={editDeptId ? editDeptName : newDeptName}
                  onChange={(e) => editDeptId ? setEditDeptName(e.target.value) : setNewDeptName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase">Head Officer in Charge</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sarah Jenkins"
                  value={editDeptId ? editDeptHead : newDeptHead}
                  onChange={(e) => editDeptId ? setEditDeptHead(e.target.value) : setNewDeptHead(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase">Official Contact Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. drainage@smartcity.gov"
                  value={editDeptId ? editDeptContact : newDeptContact}
                  onChange={(e) => editDeptId ? setEditDeptContact(e.target.value) : setNewDeptContact(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {editDeptId ? 'Save Changes' : 'Commit Register'}
                </button>
                
                {editDeptId && (
                  <button 
                    type="button"
                    onClick={() => setEditDeptId(null)}
                    className="p-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right List */}
          <div className="lg:col-span-3 bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Active municipal units</h3>
            
            <div className="space-y-3">
              {departments.map((d) => (
                <div 
                  key={d.department_id}
                  className="p-4 border border-slate-150 rounded-2xl flex items-center justify-between font-bold text-xs"
                >
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900">{d.department_name}</h4>
                    <p className="text-slate-500 font-semibold">Chief: <strong className="text-slate-700">{d.head_officer}</strong> | Email: {d.contact}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => {
                        setEditDeptId(d.department_id);
                        setEditDeptName(d.department_name);
                        setEditDeptHead(d.head_officer);
                        setEditDeptContact(d.contact);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                      title="Modify Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteDept(d.department_id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Delete Unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
