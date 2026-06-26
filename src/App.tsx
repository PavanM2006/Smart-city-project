import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  Trash2, 
  Droplets, 
  Lightbulb, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Download, 
  User, 
  Database, 
  Terminal, 
  FileText, 
  Lock, 
  Mail, 
  Plus, 
  X, 
  Send, 
  RefreshCw, 
  Sliders, 
  Bell, 
  BookOpen, 
  Shield, 
  Grid,
  CheckCircle,
  FileCode,
  Info,
  Map,
  Upload,
  UserCheck,
  Check,
  Briefcase
} from 'lucide-react';
import { 
  INITIAL_COMPLAINTS, 
  INITIAL_USERS, 
  INITIAL_DEPARTMENTS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_LOGS, 
  Complaint, 
  User as UserType, 
  Department, 
  Notification, 
  TerminalLog,
  MOCK_IMAGES
} from './data/mockData';
import { executeSQL, SQLResult } from './utils/sqlParser';
import { downloadProjectZip } from './utils/zipGenerator';
import { FILE_CONTENTS } from './utils/fileContents';
import LocationPicker from './components/maps/LocationPicker';

export default function App() {
  // --- MASTER STATE ---
  const [users, setUsers] = useState<UserType[]>(INITIAL_USERS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [logs, setLogs] = useState<TerminalLog[]>(INITIAL_LOGS);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Navigation State
  // 'home' | 'login' | 'register' | 'citizen-dashboard' | 'submit-complaint' | 'track-complaints' | 'department-dashboard' | 'admin-dashboard' | 'profile' | 'developer-sandbox'
  const [activeTab, setActiveTab] = useState<string>('home');
  const [sandboxTab, setSandboxTab] = useState<'terminal' | 'database' | 'api-docs' | 'code-explorer'>('terminal');
  
  // Auth Forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerRole, setRegisterRole] = useState<'citizen' | 'department_officer' | 'administrator'>('citizen');

  // Submit Complaint Form State
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compCategory, setCompCategory] = useState<Complaint['category']>('Road Damage');
  const [compPriority, setCompPriority] = useState<Complaint['priority']>('Medium');
  const [compLat, setCompLat] = useState<number>(40.7128);
  const [compLng, setCompLng] = useState<number>(-74.0060);
  const [compAddress, setCompAddress] = useState<string>('425 Oak Avenue, Central District, SmartCity');
  const [compImagePreview, setCompImagePreview] = useState<string>('');
  const [customAddressInput, setCustomAddressInput] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // New Department Form State (Admin Dashboard)
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [newDeptContact, setNewDeptContact] = useState('');

  // Complaint Tracking & Chat State
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [citizenChatMsg, setCitizenChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState<Record<string, {sender: string, text: string, time: string}[]>>({
    'CC-2026-001': [
      { sender: 'department_officer', text: 'Road repair team has been dispatched. Asphalt filling is scheduled for tomorrow morning.', time: '2026-03-02T14:30:00Z' }
    ],
    'CC-2026-002': [
      { sender: 'department_officer', text: 'Assigned to Sanitation Crew Area B. Expected pickup within 24 hours.', time: '2026-03-03T16:00:00Z' }
    ],
    'CC-2026-003': [
      { sender: 'department_officer', text: 'Complaint received and queued for emergency review.', time: '2026-03-04T07:20:00Z' }
    ]
  });

  // Dashboards Filtering State
  const [mgmtSearch, setMgmtSearch] = useState('');
  const [mgmtStatusFilter, setMgmtStatusFilter] = useState<string>('All');
  const [mgmtCategoryFilter, setMgmtCategoryFilter] = useState<string>('All');
  const [mgmtPriorityFilter, setMgmtPriorityFilter] = useState<string>('All');
  const [selectedMgmtComplaint, setSelectedMgmtComplaint] = useState<Complaint | null>(null);
  
  // Management actions state (Modal)
  const [updateStatus, setUpdateStatus] = useState<Complaint['status']>('Submitted');
  const [updateDept, setUpdateDept] = useState<number | null>(null);
  const [updatePriority, setUpdatePriority] = useState<Complaint['priority']>('Medium');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [authorityChatMsg, setAuthorityChatMsg] = useState('');

  // SQL Developer Sandbox State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM complaints;');
  const [sqlResult, setSqlResult] = useState<SQLResult | null>(null);
  
  // Code Explorer State
  const [selectedCodeFile, setSelectedCodeFile] = useState<string>('backend/server.js');

  // Toast State
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'info' | 'error' | 'warning'; message: string }[]>([]);
  const [notificationBellOpen, setNotificationBellOpen] = useState(false);

  // Terminal autoscroll ref
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // --- TOAST TRIGGER ---
  const addToast = (type: 'success' | 'info' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // --- LOGGING HELPER ---
  const logAPI = (method: string, url: string, status: number, reqBody?: any, resBody?: any) => {
    const timestamp = new Date().toISOString();
    const logMsg = `[API REQUEST] ${method} ${url} - Status ${status}`;
    const details = reqBody ? `\nRequest: ${JSON.stringify(reqBody)}` : '';
    const response = resBody ? `\nResponse: ${JSON.stringify(resBody)}` : '';

    const newLog: TerminalLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp,
      type: status >= 400 ? 'error' : 'request',
      message: `${logMsg}${details}${response}`
    };

    setLogs(prev => [...prev, newLog]);
  };

  const logSystem = (type: 'info' | 'success' | 'error', message: string) => {
    const timestamp = new Date().toISOString();
    const newLog: TerminalLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp,
      type,
      message
    };
    setLogs(prev => [...prev, newLog]);
  };

  // Autoscroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Run initial SQL query output
  useEffect(() => {
    handleRunSQL('SELECT * FROM complaints;');
  }, []);

  // --- RESTART TERMINAL SERVER ---
  const handleRestartServer = () => {
    setLogs([]);
    setTimeout(() => {
      INITIAL_LOGS.forEach((l, idx) => {
        setTimeout(() => {
          setLogs(prev => [...prev, l]);
        }, idx * 150);
      });
      addToast('success', 'Simulated Express REST server and MySQL pool reconnected!');
    }, 100);
  };

  // --- BROWSER GEOLOCATION DETECTION ---
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      addToast('error', 'Browser Geolocation API is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    addToast('info', 'Querying satellite GPS coordinates via Browser Geolocation API...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const detectedLat = Number(position.coords.latitude.toFixed(6));
        const detectedLng = Number(position.coords.longitude.toFixed(6));
        
        setCompLat(detectedLat);
        setCompLng(detectedLng);
        
        let geocodedAddress = `Lat: ${detectedLat}, Lng: ${detectedLng}`;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${detectedLat}&lon=${detectedLng}&zoom=18&addressdetails=1`
          );

          if (response.ok) {
            const data = await response.json();

            if (data && data.display_name) {
              geocodedAddress = data.display_name;
            }
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        }

        setCompAddress(geocodedAddress);
        
        setIsLocating(false);
        addToast('success', `Location detected successfully! Address: ${geocodedAddress}`);
        
        logSystem('success', `OSM Geolocation: Snapped browser coords. Lat: ${detectedLat}, Lng: ${detectedLng}. Address: ${geocodedAddress}`);
      },
      (error) => {
        setIsLocating(false);
        // Fallback demo coordinates
        const fallbackLat = 40.7180;
        const fallbackLng = -74.0090;
        setCompLat(fallbackLat);
        setCompLng(fallbackLng);
        setCompAddress(`Lat: ${fallbackLat}, Lng: ${fallbackLng}`);
        
        addToast('warning', `Geolocation query failed: ${error.message}. Snapped to municipal fallback coordinates.`);
        logSystem('error', `OSM Geolocation: Query error. Using municipal boundary limits fallback.`);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // --- AUTHENTICATION ACTIONS ---
  const handleLogin = (e: React.FormEvent, presetRole?: 'citizen' | 'department_officer' | 'administrator') => {
    if (e) e.preventDefault();
    
    let targetEmail = loginEmail;
    let targetPass = loginPassword;

    if (presetRole === 'citizen') {
      targetEmail = 'citizen@smartcity.gov';
      targetPass = 'citizen123';
    } else if (presetRole === 'department_officer') {
      targetEmail = 'officer@smartcity.gov';
      targetPass = 'officer123';
    } else if (presetRole === 'administrator') {
      targetEmail = 'admin@smartcity.gov';
      targetPass = 'admin123';
    }

    if (!targetEmail || !targetPass) {
      addToast('error', 'Please enter both email and password.');
      return;
    }

    // Find user
    const user = users.find(u => u.email === targetEmail);
    if (!user) {
      logAPI('POST', '/api/auth/login', 401, { email: targetEmail }, { success: false, message: 'Invalid credentials. User not found.' });
      addToast('error', 'Login failed: Incorrect email or password.');
      return;
    }

    // Success
    const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(user))}.signature`;
    setToken(fakeToken);
    setCurrentUser(user);
    
    // Clear forms
    setLoginEmail('');
    setLoginPassword('');

    logAPI('POST', '/api/auth/login', 200, { email: targetEmail }, { success: true, token: 'JWT ...', user });
    logSystem('success', `JWT Authenticated successfully for: ${user.name} (${user.role.toUpperCase()})`);
    
    addToast('success', `Welcome back, ${user.name}!`);

    // Redirect
    if (user.role === 'administrator') {
      setActiveTab('admin-dashboard');
    } else if (user.role === 'department_officer') {
      setActiveTab('department-dashboard');
    } else {
      setActiveTab('citizen-dashboard');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerName || !registerEmail || !registerPassword) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    if (users.some(u => u.email === registerEmail)) {
      logAPI('POST', '/api/auth/register', 400, { email: registerEmail }, { success: false, message: 'Email already exists.' });
      addToast('error', 'Registration failed: Email address already registered.');
      return;
    }

    const newId = users.length + 1;
    let defaultAvatar = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'; // Citizen
    if (registerRole === 'department_officer') {
      defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
    } else if (registerRole === 'administrator') {
      defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80';
    }

    const newUser: UserType = {
      id: newId,
      name: registerName,
      email: registerEmail,
      role: registerRole,
      phone: registerPhone || undefined,
      avatar: defaultAvatar
    };

    setUsers(prev => [...prev, newUser]);
    
    const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(newUser))}.signature`;
    setToken(fakeToken);
    setCurrentUser(newUser);

    logAPI('POST', '/api/auth/register', 201, { name: registerName, email: registerEmail, role: registerRole }, { success: true, token: 'JWT ...', user: newUser });
    logSystem('success', `New user registered with role: ${registerRole.toUpperCase()} -> ${registerName}`);
    logSystem('info', `Nodemailer: Welcoming email dispatched successfully to: ${registerEmail}`);

    // Clean form
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterPhone('');
    
    addToast('success', `Registration successful! Welcome, ${registerName}!`);
    
    if (registerRole === 'administrator') {
      setActiveTab('admin-dashboard');
    } else if (registerRole === 'department_officer') {
      setActiveTab('department-dashboard');
    } else {
      setActiveTab('citizen-dashboard');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      logSystem('info', `User ${currentUser.name} logged out.`);
      addToast('info', 'You have been logged out.');
    }
    setCurrentUser(null);
    setToken(null);
    setSelectedComplaintId(null);
    setSelectedMgmtComplaint(null);
    setActiveTab('home');
  };

  // --- SUBMIT COMPLAINT ACTION ---
  const handleMapClick = (xPercent: number, yPercent: number) => {
    // Coordinate mapping relative to city bounds
    const calculatedLat = 40.7000 + ((100 - yPercent) / 100) * 0.0300;
    const calculatedLng = -74.0200 + (xPercent / 100) * 0.0300;
    
    setCompLat(Number(calculatedLat.toFixed(4)));
    setCompLng(Number(calculatedLng.toFixed(4)));

    // Geocoding snapping simulator
    let address = 'SmartCity Boulevard, Central Ward';
    if (xPercent < 30 && yPercent < 35) {
      address = 'Riverside Park Main Gate, West Ward';
    } else if (xPercent < 30 && yPercent >= 35) {
      address = 'Riverside Promenade (Pier 14), River District';
    } else if (xPercent >= 30 && xPercent < 65 && yPercent < 35) {
      address = '880 5th Street, East Ward';
    } else if (xPercent >= 30 && xPercent < 65 && yPercent >= 35 && yPercent < 70) {
      address = '425 Oak Avenue, Central District';
    } else if (xPercent >= 65 && yPercent < 35) {
      address = 'East Ward Apartments Block D';
    } else if (xPercent >= 65 && yPercent >= 35) {
      address = 'Industrial Park Highway, South Ward';
    }

    setCompAddress(address);
    addToast('info', `OSM Snapped: ${address}`);
  };

  const selectPresetImage = (category: keyof typeof MOCK_IMAGES) => {
    const mockUrl = MOCK_IMAGES[category];
    setCompImagePreview(mockUrl);
    addToast('success', `Evidence photo attached.`);
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!compTitle || !compDesc) {
      addToast('error', 'Please provide a title and description.');
      return;
    }

    // Generate unique complaint ID
    const year = new Date().getFullYear();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const complaintId = `CC-${year}-${randNum}`;
    const complaintImage = compImagePreview || 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=800&q=80';

    const newComp: Complaint = {
      complaint_id: complaintId,
      user_id: currentUser.id,
      citizen_name: currentUser.name,
      title: compTitle,
      description: compDesc,
      category: compCategory,
      image: complaintImage,
      location_lat: compLat,
      location_lng: compLng,
      location_address: compAddress,
      status: 'Submitted',
      department_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      remarks: 'Complaint registered and queued for officer review.',
      priority: compPriority
    };

    setComplaints(prev => [newComp, ...prev]);

    // Send notification
    const newNotif: Notification = {
      notification_id: notifications.length + 1,
      user_id: currentUser.id,
      message: `Your complaint "${compTitle}" has been successfully logged! (ID: ${complaintId})`,
      type: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Clear form
    setCompTitle('');
    setCompDesc('');
    setCompCategory('Road Damage');
    setCompPriority('Medium');
    setCompImagePreview('');

    // API Logging
    logAPI('POST', '/api/complaints', 201, 
      { title: compTitle, category: compCategory, lat: compLat, lng: compLng, priority: compPriority }, 
      { success: true, complaint_id: complaintId }
    );
    logSystem('info', `Multer: Processed uploaded image. Saved to uploads/`);
    logSystem('success', `MySQL: INSERT INTO complaints VALUES ('${complaintId}', '${currentUser.id}', '${compTitle}', ...)`);
    logSystem('info', `Nodemailer: Confirmation email dispatched successfully to ${currentUser.email}`);
    logSystem('info', `FCM: Dispatched push notification alert to citizen mobile.`);

    addToast('success', `Complaint Submitted! Tracking ID: ${complaintId}`);

    // Redirect to tracking page
    setSelectedComplaintId(complaintId);
    setActiveTab('track-complaints');
  };

  // --- DISPATCH CHAT REMARK ---
  const handleSendChat = (sender: 'citizen' | 'department_officer', complaintId: string) => {
    const msgText = sender === 'citizen' ? citizenChatMsg : authorityChatMsg;
    if (!msgText.trim()) return;

    const newMsg = {
      sender,
      text: msgText,
      time: new Date().toISOString()
    };

    setChatHistory(prev => ({
      ...prev,
      [complaintId]: [...(prev[complaintId] || []), newMsg]
    }));

    if (sender === 'citizen') {
      setCitizenChatMsg('');
      logAPI('POST', `/api/complaints/${complaintId}/comments`, 200, { sender: 'citizen', message: msgText });
      addToast('success', 'Message relayed to city officer.');
      
      // Auto reply simulation after 4 seconds
      setTimeout(() => {
        const reply = {
          sender: 'department_officer',
          text: 'Understood. We have updated the field crew with your remarks.',
          time: new Date().toISOString()
        };
        setChatHistory(prev => ({
          ...prev,
          [complaintId]: [...(prev[complaintId] || []), reply]
        }));
        logSystem('info', `System: Relayed status update from Assigned Department Officer.`);
      }, 4000);

    } else {
      setAuthorityChatMsg('');
      logAPI('POST', `/api/complaints/${complaintId}/comments`, 200, { sender: 'officer', message: msgText });
      addToast('success', 'Message dispatched to Citizen!');
      
      const target = complaints.find(c => c.complaint_id === complaintId);
      if (target) {
        const newNotif: Notification = {
          notification_id: notifications.length + 1,
          user_id: target.user_id,
          message: `Update from Department Officer on "${target.title}": "${msgText.substring(0, 40)}..."`,
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }
  };

  // --- UPDATE COMPLAINT FLOW ---
  const handleOpenMgmtModal = (complaint: Complaint) => {
    setSelectedMgmtComplaint(complaint);
    setUpdateStatus(complaint.status);
    setUpdateDept(complaint.department_id);
    setUpdatePriority(complaint.priority);
    setUpdateRemarks(complaint.remarks || '');
  };

  const handleUpdateComplaintStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMgmtComplaint) return;

    const updated = complaints.map(c => {
      if (c.complaint_id === selectedMgmtComplaint.complaint_id) {
        return {
          ...c,
          status: updateStatus,
          department_id: updateDept,
          priority: updatePriority,
          remarks: updateRemarks,
          updated_at: new Date().toISOString()
        };
      }
      return c;
    });

    setComplaints(updated);

    // Notify citizen
    const newNotif: Notification = {
      notification_id: notifications.length + 1,
      user_id: selectedMgmtComplaint.user_id,
      message: `Your complaint "${selectedMgmtComplaint.title}" status has been updated to [${updateStatus.toUpperCase()}]. Remarks: ${updateRemarks}`,
      type: updateStatus === 'Resolved' ? 'success' : 'info',
      is_read: false,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);

    logAPI('PUT', `/api/complaints/${selectedMgmtComplaint.complaint_id}`, 200, 
      { status: updateStatus, department_id: updateDept, remarks: updateRemarks },
      { success: true, message: 'Complaint updated.' }
    );
    logSystem('success', `MySQL: UPDATE complaints SET status='${updateStatus}', department_id=${updateDept}, remarks='${updateRemarks}' WHERE complaint_id='${selectedMgmtComplaint.complaint_id}'`);
    logSystem('info', `Nodemailer: Relayed HTML status update email to: ${selectedMgmtComplaint.citizen_name}`);
    logSystem('info', `FCM: Dispatched push notification alert.`);

    addToast('success', `Case ${selectedMgmtComplaint.complaint_id} updated successfully!`);
    setSelectedMgmtComplaint(null);
  };

  // --- ADMIN: MANAGE DEPARTMENTS ---
  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptHead || !newDeptContact) {
      addToast('error', 'Please fill in all fields.');
      return;
    }

    const newId = departments.length + 1;
    const newDept: Department = {
      department_id: newId,
      department_name: newDeptName,
      head_officer: newDeptHead,
      contact: newDeptContact
    };

    setDepartments(prev => [...prev, newDept]);
    
    setNewDeptName('');
    setNewDeptHead('');
    setNewDeptContact('');

    logAPI('POST', '/api/departments', 201, { department_name: newDeptName, head_officer: newDeptHead, contact: newDeptContact });
    logSystem('success', `MySQL: INSERT INTO departments VALUES (${newId}, '${newDeptName}', '${newDeptHead}', '${newDeptContact}')`);
    
    addToast('success', `Department "${newDeptName}" registered successfully!`);
  };

  // --- SQL EXECUTOR ---
  const handleRunSQL = (queryToRun?: string) => {
    const targetQuery = queryToRun || sqlQuery;
    logSystem('info', `MySQL Console: Executing query: ${targetQuery}`);

    const start = performance.now();
    const result = executeSQL(targetQuery, {
      users,
      complaints,
      departments,
      notifications
    });
    const end = performance.now();
    const timeTaken = ((end - start) / 1000).toFixed(4);

    if (result.error) {
      setSqlResult(result);
      logSystem('error', `MySQL Error: ${result.error}`);
    } else {
      setSqlResult(result);
      logSystem('success', `MySQL OK: ${result.count} rows returned (${timeTaken} sec)`);
    }
  };

  // --- ZIP PROJECT DOWNLOAD ---
  const handleDownloadZIP = async () => {
    addToast('info', 'Compiling full-stack workspace into ZIP archive...');
    logSystem('info', 'Developer Sandbox: Initiating project bundling process...');
    
    try {
      await downloadProjectZip({
        backendPackageJson: FILE_CONTENTS.backendPackageJson,
        backendEnvExample: FILE_CONTENTS.backendEnvExample,
        backendServerJs: FILE_CONTENTS.backendServerJs,
        backendDbConfig: FILE_CONTENTS.backendDbConfig,
        backendSchemaSql: FILE_CONTENTS.backendSchemaSql,
        backendAuthMiddleware: FILE_CONTENTS.backendAuthMiddleware,
        backendAuthController: FILE_CONTENTS.backendAuthController,
        backendComplaintController: FILE_CONTENTS.backendComplaintController,
        backendApiRoutes: FILE_CONTENTS.backendApiRoutes,
        backendReadme: FILE_CONTENTS.backendReadme,
        rootReadme: FILE_CONTENTS.rootReadme,
        frontendAppTsx: FILE_CONTENTS.frontendAppTsx,
        frontendMainTxs: FILE_CONTENTS.frontendMainTxs,
        frontendIndexCss: FILE_CONTENTS.frontendIndexCss,
        frontendViteConfig: FILE_CONTENTS.frontendViteConfig,
        frontendTsConfig: FILE_CONTENTS.frontendTsConfig,
        frontendIndexHtml: FILE_CONTENTS.frontendIndexHtml,
        frontendPackageJson: FILE_CONTENTS.frontendPackageJson,
      });

      logSystem('success', 'Developer Sandbox: ZIP successfully compiled and downloaded to client.');
      addToast('success', 'Workspace downloaded! Ready to deploy locally.');
    } catch (err: any) {
      logSystem('error', `Developer Sandbox: Bundling failed: ${err.message}`);
      addToast('error', `ZIP Generation failed: ${err.message}`);
    }
  };

  // --- DYNAMIC DASHBOARD STATS ---
  const stats = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'Submitted').length,
    underReview: complaints.filter(c => c.status === 'Under Review').length,
    assigned: complaints.filter(c => c.status === 'Assigned').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    closed: complaints.filter(c => c.status === 'Closed').length,
    resolutionRate: complaints.length > 0 
      ? Math.round(((complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length) / complaints.length) * 100) 
      : 100,
    urgentCount: complaints.filter(c => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Closed').length,
    avgResolutionTime: '24.2 Hours'
  };

  // --- NOTIFICATION MANAGEMENT ---
  const unreadNotifications = notifications.filter(n => !n.is_read);
  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    addToast('info', 'All notifications marked as read.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* --- TOAST NOTIFICATIONS DRAWER --- */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border text-xs animate-slide-in transition-all duration-300 ${
              t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              t.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
              t.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-blue-50 border-blue-200 text-blue-855'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />}
            
            <div className="flex-1">
              <p className="font-extrabold tracking-wide text-[10px] uppercase">{t.type}</p>
              <p className="opacity-95 mt-0.5 leading-relaxed font-semibold">{t.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* --- MASTER HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2.5 bg-gradient-to-br from-blue-650 to-indigo-700 rounded-xl text-white shadow-md shadow-indigo-100 group-hover:scale-105 transition-all">
              <Building2 className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 tracking-tight leading-none text-base">SmartCity</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizen Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button 
              onClick={() => setActiveTab('home')} 
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'home' ? 'bg-slate-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            {/* Citizen Panel links */}
            {currentUser?.role === 'citizen' && (
              <>
                <button 
                  onClick={() => setActiveTab('citizen-dashboard')} 
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'citizen-dashboard' ? 'bg-slate-100 text-blue-650' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Citizen Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('submit-complaint')} 
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'submit-complaint' ? 'bg-slate-100 text-blue-650' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Report Issue
                </button>
                <button 
                  onClick={() => {
                    setSelectedComplaintId(null);
                    setActiveTab('track-complaints');
                  }} 
                  className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    activeTab === 'track-complaints' ? 'bg-slate-100 text-blue-655' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Track Grievances
                </button>
              </>
            )}

            {/* Department Officer Dashboard Link */}
            {currentUser?.role === 'department_officer' && (
              <button 
                onClick={() => setActiveTab('department-dashboard')} 
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'department-dashboard' ? 'bg-teal-50 text-teal-750 border border-teal-200/50' : 'text-slate-650 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4 text-teal-650" /> Officer Dashboard
              </button>
            )}

            {/* Administrator Dashboard Link */}
            {currentUser?.role === 'administrator' && (
              <button 
                onClick={() => setActiveTab('admin-dashboard')} 
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin-dashboard' ? 'bg-indigo-50 text-indigo-750 border border-indigo-200/50' : 'text-slate-650 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-650" /> Admin Console
              </button>
            )}

            {/* Sandbox Developer Panel */}
            <button 
              onClick={() => setActiveTab('developer-sandbox')} 
              className={`px-3 py-2 text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'developer-sandbox' ? 'bg-amber-50 text-amber-700 border border-amber-250/60' : 'text-amber-600 hover:bg-amber-50/30'
              }`}
            >
              <Database className="w-4 h-4" /> Developer Sandbox
            </button>
          </nav>

          {/* User Profile / Notifications */}
          <div className="flex items-center gap-3">
            
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationBellOpen(!notificationBellOpen)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-all"
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Bell Dropdown */}
              {notificationBellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 max-h-[420px] flex flex-col animate-scale-up">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">System Alerts</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleMarkAllNotificationsRead}
                        className="text-[10px] text-blue-650 hover:underline font-bold"
                      >
                        Mark read
                      </button>
                      <button onClick={() => setNotificationBellOpen(false)}>
                        <X className="w-4 h-4 text-slate-450 hover:text-slate-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-xs text-slate-400">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.notification_id} 
                          className={`p-3 text-xs transition-colors ${
                            n.is_read ? 'bg-white opacity-70' : 'bg-blue-50/40'
                          }`}
                        >
                          <p className="text-slate-700 font-semibold leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-slate-400 font-bold">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="bullet text-slate-300">•</span>
                            <span className={`capitalize ${n.type === 'success' ? 'text-emerald-600' : 'text-blue-600'}`}>{n.type}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</span>
                  <span className={`text-[9px] uppercase font-black self-end px-1.5 py-0.5 rounded-md mt-0.5 border ${
                    currentUser.role === 'administrator' ? 'bg-indigo-50 text-indigo-750 border-indigo-200' :
                    currentUser.role === 'department_officer' ? 'bg-teal-50 text-teal-750 border-teal-200' :
                    'bg-blue-50 text-blue-750 border-blue-200'
                  }`}>
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="relative group">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-9 h-9 rounded-xl border border-slate-200 object-cover cursor-pointer hover:ring-2 hover:ring-indigo-500/30 transition-all"
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 hidden group-hover:block hover:block z-50">
                    <button 
                      onClick={() => {
                        if (currentUser.role === 'administrator') setActiveTab('admin-dashboard');
                        else if (currentUser.role === 'department_officer') setActiveTab('department-dashboard');
                        else setActiveTab('citizen-dashboard');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      My Dashboard
                    </button>
                    <button 
                      onClick={() => setActiveTab('profile')}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      View Profile
                    </button>
                    <hr className="my-1 border-slate-150" />
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 font-extrabold"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('login')} 
                  className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  Log In
                </button>
                <button 
                  onClick={() => setActiveTab('register')} 
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200"
                >
                  Sign Up
                </button>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* --- CONTENT WORKSPACE --- */}
      <main className="flex-1">

        {/* ==========================================
            TAB: 1. HOME / LANDING PAGE
           ========================================== */}
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-slate-850">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25"></div>
              
              <div className="max-w-7xl mx-auto text-center relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Activity className="w-4 h-4 animate-pulse" /> 2026 Smart Infrastructure Initiative
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">
                  Centralized City Services. <br />
                  <span className="bg-gradient-to-r from-blue-450 to-indigo-400 bg-clip-text">Empowering Citizens, Enabling Officers.</span>
                </h1>
                
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
                  A high-performance full-stack portal linking residents directly to city departments. Submit reports with Leaflet geocoding, upload evidence, and monitor repairs in real time.
                </p>
                
                {/* Hero Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  {currentUser ? (
                    <button 
                      onClick={() => {
                        if (currentUser.role === 'administrator') setActiveTab('admin-dashboard');
                        else if (currentUser.role === 'department_officer') setActiveTab('department-dashboard');
                        else setActiveTab('citizen-dashboard');
                      }}
                      className="px-8 py-4 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 group cursor-pointer"
                    >
                      Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setActiveTab('register')}
                      className="px-8 py-4 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 group cursor-pointer"
                    >
                      Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setActiveTab('developer-sandbox')}
                    className="px-8 py-4 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Database className="w-4.5 h-4.5 text-amber-450" /> Developer Sandbox
                  </button>
                </div>

                {/* Quick Access Roles for Evaluators */}
                <div className="pt-8 border-t border-slate-900 max-w-lg mx-auto">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Demo Role Shortcuts</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={(e) => handleLogin(e, 'citizen')}
                      className="px-4 py-2.5 bg-blue-950/40 hover:bg-blue-950/60 border border-blue-800/50 rounded-xl text-[10px] font-bold text-blue-300 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" /> Citizen Role
                    </button>
                    <button 
                      onClick={(e) => handleLogin(e, 'department_officer')}
                      className="px-4 py-2.5 bg-teal-950/40 hover:bg-teal-950/60 border border-teal-800/50 rounded-xl text-[10px] font-bold text-teal-300 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" /> Officer Role
                    </button>
                    <button 
                      onClick={(e) => handleLogin(e, 'administrator')}
                      className="px-4 py-2.5 bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-800/50 rounded-xl text-[10px] font-bold text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" /> Admin Role
                    </button>
                  </div>
                </div>

              </div>
            </section>

            {/* Quick Live Stats Panel */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="space-y-1 border-r border-slate-100 last:border-0 pr-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Reports Logged</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-[10px] text-slate-400">Indexed in MySQL complaints table</p>
                </div>

                <div className="space-y-1 border-r border-slate-100 last:border-0 pr-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Resolved Cases</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{stats.resolved + stats.closed}</p>
                  <p className="text-[10px] text-slate-400">{stats.resolutionRate}% resolution rate</p>
                </div>

                <div className="space-y-1 border-r border-slate-100 last:border-0 pr-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-4.5 h-4.5 text-blue-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Repair SLA</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{stats.avgResolutionTime}</p>
                  <p className="text-[10px] text-slate-400">Target response within 48h</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="w-4.5 h-4.5 text-indigo-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">City Wards</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{departments.length} Units</p>
                  <p className="text-[10px] text-slate-400">Interlinked municipal grid</p>
                </div>

              </div>
            </section>

            {/* Core Features Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Municipal Service Categories</h2>
                <p className="text-slate-500 text-sm max-w-2xl mx-auto">Select a category below to submit a complaint. Our integrated router will automatically dispatch it to the correct department.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Water Supply */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                    <Droplets className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-slate-900">Water Supply</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Report contaminated water supply, pipeline bursts, leakages, or pressure drops.</p>
                  </div>
                </div>

                {/* Electricity */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4 group">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                    <Lightbulb className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-slate-900">Electricity & Power</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Report power outages, hanging overhead cables, or transformer sparkings.</p>
                  </div>
                </div>

                {/* Road Damage */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4 group">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-500 group-hover:scale-105 transition-transform">
                    <AlertTriangle className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-slate-900">Road Damage</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Report asphalt potholes, cracking pavement, or missing manhole covers.</p>
                  </div>
                </div>

                {/* Garbage */}
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4 group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-500 group-hover:scale-105 transition-transform">
                    <Trash2 className="w-5.5 h-5.5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-slate-900">Garbage Accumulation</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">Report overflowed public garbage bins, dead animals, or illegal dumpings.</p>
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}


        {/* ==========================================
            TAB: 2. USER LOGIN
           ========================================== */}
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
              
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl mb-1">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Portal Secure Login</h2>
                <p className="text-sm text-slate-500">Access your role-based control dashboard.</p>
              </div>

              {/* Form */}
              <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      placeholder="citizen@smartcity.gov" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200 mt-2 cursor-pointer"
                >
                  Authenticate Session
                </button>
              </form>

              {/* Shortcuts for Evaluators */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
                <p className="text-[10px] font-extrabold text-slate-600 text-center uppercase tracking-wider">Quick Demo Login Shortcuts</p>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={(e) => handleLogin(e, 'citizen')} 
                    className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[9px] font-black uppercase text-blue-600 rounded-lg shadow-xs transition-colors"
                  >
                    Citizen
                  </button>
                  <button 
                    onClick={(e) => handleLogin(e, 'department_officer')} 
                    className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[9px] font-black uppercase text-teal-600 rounded-lg shadow-xs transition-colors"
                  >
                    Officer
                  </button>
                  <button 
                    onClick={(e) => handleLogin(e, 'administrator')} 
                    className="py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[9px] font-black uppercase text-indigo-600 rounded-lg shadow-xs transition-colors"
                  >
                    Admin
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">
                Don't have an account?{' '}
                <button onClick={() => setActiveTab('register')} className="text-blue-600 font-bold hover:underline">
                  Create Account
                </button>
              </p>

            </div>
          </div>
        )}


        {/* ==========================================
            TAB: 3. USER REGISTRATION
           ========================================== */}
        {activeTab === 'register' && (
          <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
              
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl mb-1">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Register Portal Account</h2>
                <p className="text-sm text-slate-500">Register with JWT role-based access control.</p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Role Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('citizen')}
                      className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                        registerRole === 'citizen'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('department_officer')}
                      className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                        registerRole === 'department_officer'
                          ? 'bg-teal-50 border-teal-500 text-teal-750 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      Officer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('administrator')}
                      className={`py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                        registerRole === 'administrator'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-750 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Jane Doe" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="jane.doe@example.com" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+1 (555) 019-2834" 
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200 mt-2 cursor-pointer"
                >
                  Create Secure Account
                </button>
              </form>

              <p className="text-center text-xs text-slate-500">
                Already have an account?{' '}
                <button onClick={() => setActiveTab('login')} className="text-blue-600 font-bold hover:underline">
                  Log In
                </button>
              </p>

            </div>
          </div>
        )}


        {/* ==========================================
            TAB: 4. CITIZEN DASHBOARD
           ========================================== */}
        {activeTab === 'citizen-dashboard' && currentUser?.role === 'citizen' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
            
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="space-y-2 relative z-10">
                <h2 className="text-2xl font-black tracking-tight">Welcome, {currentUser.name}!</h2>
                <p className="text-blue-100/90 text-xs max-w-xl font-medium">
                  Track your reported grievances, view department feedback, or submit a new infrastructure repair request.
                </p>
              </div>
              <div className="shrink-0 relative z-10">
                <button 
                  onClick={() => setActiveTab('submit-complaint')}
                  className="px-6 py-3.5 bg-white text-blue-700 font-extrabold rounded-xl shadow-lg shadow-indigo-950/20 hover:scale-105 hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer text-xs uppercase tracking-wider"
                >
                  <Plus className="w-5 h-5" /> Report Civic Issue
                </button>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <AlertTriangle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">My Total Reports</p>
                  <p className="text-2xl font-black text-slate-900">{complaints.filter(c => c.user_id === currentUser.id).length}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Active Reviews</p>
                  <p className="text-2xl font-black text-slate-900">
                    {complaints.filter(c => c.user_id === currentUser.id && c.status !== 'Resolved' && c.status !== 'Closed').length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Resolved Issues</p>
                  <p className="text-2xl font-black text-slate-900">
                    {complaints.filter(c => c.user_id === currentUser.id && (c.status === 'Resolved' || c.status === 'Closed')).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: List of reported grievances */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-blue-600" /> My Grievance Registry
                  </h3>
                  <button 
                    onClick={() => {
                      setSelectedComplaintId(null);
                      setActiveTab('track-complaints');
                    }}
                    className="text-xs font-bold text-blue-650 hover:underline"
                  >
                    View Timeline Tracker ({complaints.filter(c => c.user_id === currentUser.id).length})
                  </button>
                </div>

                {complaints.filter(c => c.user_id === currentUser.id).length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-250 rounded-3xl p-12 text-center space-y-4">
                    <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No complaints reported yet</p>
                    <button 
                      onClick={() => setActiveTab('submit-complaint')}
                      className="px-5 py-2.5 bg-blue-600 text-xs font-bold text-white rounded-xl"
                    >
                      Report First Issue
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {complaints.filter(c => c.user_id === currentUser.id).map(c => (
                      <div 
                        key={c.complaint_id} 
                        className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="relative h-40 bg-slate-100 shrink-0">
                          <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                          <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2.5 py-1 rounded-full text-white ${
                            c.priority === 'Urgent' ? 'bg-rose-600 shadow-sm animate-pulse' :
                            c.priority === 'High' ? 'bg-orange-500' :
                            c.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-500'
                          }`}>
                            {c.priority}
                          </span>
                          <span className={`absolute bottom-3 right-3 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md shadow-md ${
                            c.status === 'Submitted' ? 'bg-slate-100 text-slate-850' :
                            c.status === 'Under Review' ? 'bg-purple-100 text-purple-700' :
                            c.status === 'Assigned' ? 'bg-indigo-100 text-indigo-700' :
                            c.status === 'In Progress' ? 'bg-blue-100 text-blue-750' :
                            'bg-emerald-100 text-emerald-750'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase">{c.category} • {c.complaint_id}</span>
                            <h4 className="font-extrabold text-slate-900 line-clamp-1">{c.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-semibold">{c.description}</p>
                          </div>

                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 border-t border-slate-100 pt-3 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{c.location_address}</span>
                          </div>

                          <button 
                            onClick={() => {
                              setSelectedComplaintId(c.complaint_id);
                              setActiveTab('track-complaints');
                            }}
                            className="w-full py-2.5 bg-slate-50 border border-slate-250 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Track Live Progress <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Notifications & Sandbox Info */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Bell className="w-4.5 h-4.5 text-blue-600" /> Notifications Feed
                </h3>

                <div className="bg-white border border-slate-150 rounded-2xl p-4 divide-y divide-slate-100 shadow-xs max-h-[480px] overflow-y-auto">
                  {notifications.filter(n => n.user_id === currentUser.id).length === 0 ? (
                    <p className="p-6 text-center text-xs text-slate-400">No system notifications.</p>
                  ) : (
                    notifications.filter(n => n.user_id === currentUser.id).map(n => (
                      <div key={n.notification_id} className={`py-4 first:pt-0 last:pb-0 space-y-1.5`}>
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold">{n.message}</p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold">
                          <span>{new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                          {!n.is_read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ==========================================
            TAB: 5. COMPLAINT FORM WITH MAP & UPLOADER
           ========================================== */}
        {activeTab === 'submit-complaint' && currentUser && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-600" /> File a Civic Grievance
              </h2>
              <p className="text-slate-500 text-xs max-w-2xl font-semibold">Report local infrastructure damages, leaks, or blackouts. Pin coordinates using Leaflet map or detect your current GPS location.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              
              {/* Left 3/5: Form inputs */}
              <div className="lg:col-span-3 bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                
                <form onSubmit={handleSubmitComplaint} className="space-y-6">
                  
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Complaint Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Contaminated water supply line near Central Ward block B" 
                      value={compTitle}
                      onChange={(e) => setCompTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      required
                    />
                  </div>

                  {/* Category & Priority */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">Complaint Category</label>
                      <select 
                        value={compCategory} 
                        onChange={(e) => setCompCategory(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      >
                        <option value="Water Supply">Water Supply</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Road Damage">Road Damage</option>
                        <option value="Garbage">Garbage</option>
                        <option value="Drainage">Drainage</option>
                        <option value="Street Light">Street Light</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">Operational Priority</label>
                      <select 
                        value={compPriority} 
                        onChange={(e) => setCompPriority(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      >
                        <option value="Low">Low (Routine SLA)</option>
                        <option value="Medium">Medium (Normal SLA)</option>
                        <option value="High">High (Urgent Response)</option>
                        <option value="Urgent">Urgent (Safety Threat!)</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">Detailed Description</label>
                    <textarea 
                      rows={4}
                      placeholder="Please specify. Include landmarks, how long the issue has persisted, and if it poses any immediate threats to public safety." 
                      value={compDesc}
                      onChange={(e) => setCompDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                      required
                    />
                  </div>

                  {/* Photo Evidence */}
                  <div className="space-y-3 border-t border-slate-100 pt-5">
                    <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider block">Evidence Photo Attachment (Multer Uploader)</label>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Drag and Drop */}
                      <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-5 text-center transition-all cursor-pointer relative group bg-slate-50/50">
                        <div className="space-y-1 text-slate-500">
                          <Upload className="w-7 h-7 text-slate-400 mx-auto group-hover:scale-105 transition-transform" />
                          <p className="text-xs font-extrabold text-slate-700">Attach Evidence Photo</p>
                          <p className="text-[9px] text-slate-400 font-bold">JPEG, PNG, WEBP (Max 5MB)</p>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-bold">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Choose Demo Evidence Image:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button" 
                            onClick={() => selectPresetImage('waterleak')}
                            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-bold text-[10px]"
                          >
                            Water Leak
                          </button>
                          <button 
                            type="button" 
                            onClick={() => selectPresetImage('pothole')}
                            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-bold text-[10px]"
                          >
                            Road Pothole
                          </button>
                          <button 
                            type="button" 
                            onClick={() => selectPresetImage('garbage')}
                            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-bold text-[10px]"
                          >
                            Waste Pile
                          </button>
                          <button 
                            type="button" 
                            onClick={() => selectPresetImage('drainage')}
                            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded font-bold text-[10px]"
                          >
                            Drainage Clog
                          </button>
                        </div>
                      </div>
                    </div>

                    {compImagePreview && (
                      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-250 shadow-inner">
                        <img src={compImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setCompImagePreview('')}
                          className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Geolocation snapped info */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-3 gap-4 text-xs font-bold">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Latitude</p>
                      <p className="font-bold text-slate-800 font-mono mt-0.5">{compLat}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Longitude</p>
                      <p className="font-bold text-slate-800 font-mono mt-0.5">{compLng}</p>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLocating}
                        className="w-full h-full px-2 py-1.5 bg-white border border-slate-250 hover:bg-slate-50 hover:border-blue-450 rounded-xl font-black text-[9px] uppercase text-blue-650 flex items-center justify-center gap-1 shadow-xs transition-all disabled:opacity-50"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {isLocating ? 'Locating...' : 'Detect GPS'}
                      </button>
                    </div>
                    <div className="col-span-3 border-t border-slate-200/65 pt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">OSM Snapped Address</span>
                        <button 
                          type="button" 
                          onClick={() => setCustomAddressInput(!customAddressInput)}
                          className="text-[9px] font-black text-blue-650 uppercase"
                        >
                          {customAddressInput ? 'Lock Snapped' : 'Edit Manual'}
                        </button>
                      </div>
                      
                      {customAddressInput ? (
                        <input 
                          type="text"
                          value={compAddress}
                          onChange={(e) => setCompAddress(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      ) : (
                        <p className="font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {compAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl transition-all shadow-md shadow-indigo-150 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Log Grievance & Dispatch Alerts <Send className="w-4 h-4" />
                  </button>

                </form>

              </div>

              {/* Right 2/5: Interactive OpenStreetMap Leaflet */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Map className="w-4.5 h-4.5 text-blue-600" /> Interactive Map Locator
                      </h3>
                      <p className="text-[9px] text-slate-400 font-bold">Click on the map to drop a pin or adjust location</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded">Live Geocoder</span>
                  </div>

                  {/* Real Leaflet Map */}
                  <LocationPicker 
                    lat={compLat} 
                    lng={compLng} 
                    onChangeLocation={(lat, lng, address) => {
                      setCompLat(lat);
                      setCompLng(lng);
                      setCompAddress(address);
                    }}
                  />
                </div>
              </div>

            </div>

          </div>
        )}


        {/* ==========================================
            TAB: 6. COMPLAINT TRACKING & HISTORY TIMELINE
           ========================================== */}
        {activeTab === 'track-complaints' && currentUser && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" /> Grievance Tracker Room
              </h2>
              <p className="text-slate-500 text-xs font-semibold">Select a complaint from the registry on the left to inspect its live workflow status, assigned officer, or send remarks.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              
              {/* Left Column: Complaints Registry list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">My Reported Incidents</h3>
                
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                  {complaints.filter(c => c.user_id === currentUser.id).length === 0 ? (
                    <p className="p-8 text-center text-xs text-slate-400 bg-white border rounded-2xl">No complaints logged yet.</p>
                  ) : (
                    complaints.filter(c => c.user_id === currentUser.id).map(c => (
                      <div 
                        key={c.complaint_id} 
                        onClick={() => setSelectedComplaintId(c.complaint_id)}
                        className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition-all hover:border-blue-450 flex items-center gap-3 ${
                          selectedComplaintId === c.complaint_id 
                            ? 'border-blue-500 ring-2 ring-blue-550/10 bg-blue-50/10' 
                            : 'border-slate-150'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-50 border">
                          <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 font-bold">
                          <div className="flex items-center justify-between text-[8px] font-black">
                            <span className="text-slate-400 font-mono">{c.complaint_id}</span>
                            <span className={`uppercase px-1.5 py-0.5 rounded ${
                              c.status === 'Submitted' ? 'bg-slate-100 text-slate-600' :
                              c.status === 'Under Review' ? 'bg-purple-100 text-purple-700' :
                              c.status === 'Assigned' ? 'bg-indigo-100 text-indigo-700' :
                              c.status === 'In Progress' ? 'bg-blue-100 text-blue-750' :
                              'bg-emerald-100 text-emerald-750'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-900 truncate mt-0.5">{c.title}</h4>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5 font-medium">{c.location_address}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Timeline Detail */}
              <div className="lg:col-span-3">
                {selectedComplaintId ? (() => {
                  const comp = complaints.find(c => c.complaint_id === selectedComplaintId);
                  if (!comp) return <p className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl">Grievance not found.</p>;

                  const dept = departments.find(d => d.department_id === comp.department_id);

                  const stages: { label: Complaint['status']; desc: string; num: number }[] = [
                    { label: 'Submitted', desc: 'Grievance recorded in database and queued.', num: 1 },
                    { label: 'Under Review', desc: 'Municipal administrator verifying details.', num: 2 },
                    { label: 'Assigned', desc: 'Routed to specific municipal department.', num: 3 },
                    { label: 'In Progress', desc: 'Field repair crews active at coordinates.', num: 4 },
                    { label: 'Resolved', desc: 'Repair completed. Before/after verified.', num: 5 },
                    { label: 'Closed', desc: 'Case archiving and citizen confirmation.', num: 6 }
                  ];

                  const currentStepIndex = stages.findIndex(s => s.label === comp.status);

                  return (
                    <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-fade-in">
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6 font-bold">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 font-mono uppercase">
                            <span>{comp.complaint_id}</span>
                            <span className="bullet text-slate-300">•</span>
                            <span>{comp.category}</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 leading-snug">{comp.title}</h3>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {comp.location_address}
                          </p>
                        </div>
                        
                        <div className="shrink-0 text-right">
                          <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${
                            comp.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            comp.priority === 'High' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                            comp.priority === 'Medium' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                            'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            {comp.priority} Priority
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1 font-bold">Logged: {new Date(comp.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Visual Timeline */}
                      <div className="space-y-5">
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Workflow Tracker (MySQL State)</h4>
                        
                        <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-slate-200">
                          {stages.map((stage, idx) => {
                            const isCompleted = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            
                            return (
                              <div key={stage.num} className="relative text-xs font-bold">
                                <div className={`absolute left-[-28px] top-0.5 w-6.5 h-6.5 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isCompleted 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'bg-white border-slate-200 text-slate-400'
                                } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <span className="text-[9px] font-bold">{stage.num}</span>}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className={`font-black text-xs ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                      {stage.label}
                                    </h5>
                                    {isCurrent && (
                                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 animate-pulse">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-[11px] font-semibold ${isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {stage.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Department Officer Contacts */}
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs font-bold">
                        <h4 className="font-black text-slate-800 uppercase tracking-widest text-[9px] flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-slate-500" /> Assigned Department Contact
                        </h4>
                        
                        {dept ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase">Assigned Unit</span>
                              <p className="text-slate-800 mt-0.5">{dept.department_name}</p>
                            </div>
                            <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase">Officer in Charge</span>
                              <p className="text-slate-800 mt-0.5">{dept.head_officer}</p>
                            </div>
                            <div className="col-span-2 border-t border-slate-200/60 pt-2 flex items-center justify-between text-[10px]">
                              <p className="text-slate-500">Department Email: <span className="text-slate-700 font-extrabold">{dept.contact}</span></p>
                              <a 
                                href={`mailto:${dept.contact}`}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs text-[9px] text-blue-600 font-extrabold uppercase"
                              >
                                Send Inquiry
                              </a>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-500 font-semibold italic text-[11px]">
                            This grievance is currently in the administrative review queue. A specialized department (Water, Electric, Roads) will be assigned shortly, notifying the respective chief engineer.
                          </p>
                        )}
                      </div>

                      {/* Direct remarks */}
                      <div className="space-y-2 font-bold">
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">Official Action Remarks</h4>
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10px] leading-relaxed border border-slate-800">
                          <p className="text-slate-400">// Last updated: {new Date(comp.updated_at).toLocaleString()}</p>
                          <p className="text-blue-300 mt-1">remarks_log: <span className="text-white">"{comp.remarks || 'No remarks recorded.'}"</span></p>
                        </div>
                      </div>

                      {/* Direct Messaging */}
                      <div className="space-y-4 border-t border-slate-100 pt-6">
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Send className="w-4 h-4 text-blue-600" /> Direct Officer Messaging
                        </h4>
                        
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 max-h-[200px] overflow-y-auto space-y-3">
                          {(!chatHistory[comp.complaint_id] || chatHistory[comp.complaint_id].length === 0) ? (
                            <p className="text-center text-xs text-slate-400 py-4 font-semibold italic">No communications logged yet.</p>
                          ) : (
                            chatHistory[comp.complaint_id].map((msg, idx) => (
                              <div 
                                key={idx} 
                                className={`flex flex-col max-w-[85%] text-[11px] p-3 rounded-2xl ${
                                  msg.sender === 'citizen' 
                                    ? 'bg-blue-650 text-white rounded-tr-none self-end ml-auto font-semibold' 
                                    : 'bg-slate-100 text-slate-800 rounded-tl-none mr-auto font-semibold'
                                }`}
                              >
                                <span className="font-black text-[8px] uppercase tracking-wide opacity-75 mb-0.5">
                                  {msg.sender === 'citizen' ? 'Me (Citizen)' : 'Department Officer'}
                                </span>
                                <p className="leading-relaxed">{msg.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Input */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Type message to assigned department officer..." 
                            value={citizenChatMsg}
                            onChange={(e) => setCitizenChatMsg(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat('citizen', comp.complaint_id)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                          />
                          <button 
                            onClick={() => handleSendChat('citizen', comp.complaint_id)}
                            className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })() : (
                  <div className="bg-white border border-slate-150 rounded-3xl p-12 text-center space-y-4 shadow-xs">
                    <Activity className="w-16 h-16 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">No Grievance Selected</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto font-semibold">Click on any of the complaints in your registry on the left to review its live workflow, geocoding details, and message thread.</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}


        {/* ==========================================
            TAB: 7. DEPARTMENT DASHBOARD
           ========================================== */}
        {activeTab === 'department-dashboard' && currentUser?.role === 'department_officer' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 font-bold">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-teal-600" /> Department Officer Dashboard
                </h2>
                <p className="text-slate-500 text-xs font-semibold">Logged in: Chief Officer Robert Chen • Role authorized via JWT Middleware.</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs rounded-xl uppercase tracking-wider">
                  Public Works & Roads Unit
                </span>
              </div>
            </div>

            {/* Core KPI cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <Briefcase className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Assigned to Department</p>
                  <p className="text-2xl font-black text-slate-900">
                    {complaints.filter(c => c.department_id === 3).length} Cases
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-455 uppercase tracking-wider">Pending Action</p>
                  <p className="text-2xl font-black text-slate-900">
                    {complaints.filter(c => c.department_id === 3 && c.status !== 'Resolved' && c.status !== 'Closed').length} Cases
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-455 uppercase tracking-wider">Resolved SLA</p>
                  <p className="text-2xl font-black text-slate-900">
                    {complaints.filter(c => c.department_id === 3 && (c.status === 'Resolved' || c.status === 'Closed')).length} Cases
                  </p>
                </div>
              </div>
            </div>

            {/* Complaints Management Table for Department Officer */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Assigned Grievance Workflows</h3>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search assigned cases..." 
                    value={mgmtSearch}
                    onChange={(e) => setMgmtSearch(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 w-48"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider">
                      <th className="p-4 font-mono w-28">Case ID</th>
                      <th className="p-4">Incident Title</th>
                      <th className="p-4 w-32">Category</th>
                      <th className="p-4 w-24">Priority</th>
                      <th className="p-4 w-32">Status</th>
                      <th className="p-4 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {(() => {
                      // Filter department cases (Robert Chen is head of Department 3 - Public Works & Roads)
                      const deptCases = complaints.filter(c => {
                        const matchesDept = c.department_id === 3;
                        const matchesText = c.title.toLowerCase().includes(mgmtSearch.toLowerCase()) || c.complaint_id.toLowerCase().includes(mgmtSearch.toLowerCase());
                        return matchesDept && matchesText;
                      });

                      if (deptCases.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 italic">No grievances assigned to your department.</td>
                          </tr>
                        );
                      }

                      return deptCases.map(c => (
                        <tr key={c.complaint_id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono font-bold text-slate-400">{c.complaint_id}</td>
                          <td className="p-4">
                            <div>
                              <p className="font-black text-slate-900">{c.title}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{c.location_address}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700">{c.category}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase border ${
                              c.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-750' :
                              c.priority === 'High' ? 'bg-orange-50 border-orange-200 text-orange-750' :
                              'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                              {c.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${
                              c.status === 'Submitted' ? 'bg-slate-100 text-slate-700' :
                              c.status === 'In Progress' ? 'bg-blue-50 text-blue-750 border border-blue-200' :
                              'bg-emerald-50 text-emerald-750 border border-emerald-200'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => handleOpenMgmtModal(c)}
                              className="px-3 py-1.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-750 font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}


        {/* ==========================================
            TAB: 8. ADMINISTRATOR DASHBOARD
           ========================================== */}
        {activeTab === 'admin-dashboard' && currentUser?.role === 'administrator' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 font-bold">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-600" /> Administrator Console
                </h2>
                <p className="text-slate-500 text-xs font-semibold">City Director Admin Console • JWT Encrypted Endpoint Controls.</p>
              </div>
            </div>

            {/* Dynamic Analytics charts */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Category distribution chart */}
              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-4.5 h-4.5 text-indigo-600" /> Category Workloads
                </h4>
                
                <div className="h-44 flex items-end gap-5 pt-6 pb-2 px-2 border-b border-slate-100">
                  {(() => {
                    const categories: { name: Complaint['category']; color: string }[] = [
                      { name: 'Water Supply', color: 'bg-blue-500' },
                      { name: 'Electricity', color: 'bg-amber-500' },
                      { name: 'Road Damage', color: 'bg-rose-500' },
                      { name: 'Garbage', color: 'bg-emerald-500' }
                    ];

                    const maxCount = Math.max(...categories.map(cat => complaints.filter(c => c.category === cat.name).length), 1);

                    return categories.map(cat => {
                      const count = complaints.filter(c => c.category === cat.name).length;
                      const heightPercent = (count / maxCount) * 100;
                      
                      return (
                        <div key={cat.name} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                          <span className="absolute -top-6 bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                            {count} cases
                          </span>
                          
                          <div 
                            className={`${cat.color} w-full rounded-t-md transition-all duration-550 ease-out`} 
                            style={{ height: `${heightPercent || 5}%` }}
                          ></div>
                          
                          <span className="text-[9px] font-black text-slate-450 max-w-full truncate text-center" title={cat.name}>
                            {cat.name.replace(' Supply', '')}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Department Workloads */}
              <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4.5 h-4.5 text-indigo-600" /> Active Departments
                </h4>
                
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 text-xs font-bold">
                  {departments.map(d => {
                    const activeCount = complaints.filter(c => c.department_id === d.department_id && c.status !== 'Resolved' && c.status !== 'Closed').length;
                    const totalCount = complaints.filter(c => c.department_id === d.department_id).length;
                    
                    return (
                      <div key={d.department_id} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-800 truncate max-w-[70%]">{d.department_name}</span>
                          <span className="text-slate-400 text-[10px] font-mono">{activeCount} active / {totalCount} total</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{width: `${totalCount > 0 ? (totalCount - activeCount)/totalCount * 100 : 100}%`}}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Register new department */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs">
                <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs font-bold">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-indigo-600" /> Register Department
                  </h4>
                  
                  <input 
                    type="text" 
                    placeholder="Department Name (e.g. Drainage Control)"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                    required
                  />
                  <input 
                    type="text" 
                    placeholder="Head Officer (e.g. Sarah Jenkins)"
                    value={newDeptHead}
                    onChange={(e) => setNewDeptHead(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                    required
                  />
                  <input 
                    type="email" 
                    placeholder="Contact Email (e.g. drainage@smartcity.gov)"
                    value={newDeptContact}
                    onChange={(e) => setNewDeptContact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none"
                    required
                  />

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase transition-colors"
                  >
                    Commit Department
                  </button>
                </form>
              </div>

            </div>

            {/* Administrative complaints master manager */}
            <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-650" /> City Master Grievance Registry
                </h3>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Search master list..." 
                    value={mgmtSearch}
                    onChange={(e) => setMgmtSearch(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 w-44"
                  />

                  <select 
                    value={mgmtStatusFilter} 
                    onChange={(e) => setMgmtStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
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
                    value={mgmtCategoryFilter} 
                    onChange={(e) => setMgmtCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
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

                  <select 
                    value={mgmtPriorityFilter} 
                    onChange={(e) => setMgmtPriorityFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
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
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider">
                      <th className="p-4 font-mono w-28">Case ID</th>
                      <th className="p-4">Incident Details</th>
                      <th className="p-4">Reporter</th>
                      <th className="p-4 w-32">Category</th>
                      <th className="p-4 w-24">Priority</th>
                      <th className="p-4 w-36">Assigned Department</th>
                      <th className="p-4 w-28">Status</th>
                      <th className="p-4 w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold">
                    {(() => {
                      const filtered = complaints.filter(c => {
                        const matchesSearch = c.title.toLowerCase().includes(mgmtSearch.toLowerCase()) || c.complaint_id.toLowerCase().includes(mgmtSearch.toLowerCase()) || c.citizen_name.toLowerCase().includes(mgmtSearch.toLowerCase());
                        const matchesStatus = mgmtStatusFilter === 'All' || c.status === mgmtStatusFilter;
                        const matchesCategory = mgmtCategoryFilter === 'All' || c.category === mgmtCategoryFilter;
                        const matchesPriority = mgmtPriorityFilter === 'All' || c.priority === mgmtPriorityFilter;
                        return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 italic">No grievances matching filters in city database.</td>
                          </tr>
                        );
                      }

                      return filtered.map(c => {
                        const dept = departments.find(d => d.department_id === c.department_id);
                        return (
                          <tr key={c.complaint_id} className="hover:bg-slate-50/50">
                            <td className="p-4 font-mono font-bold text-slate-450">{c.complaint_id}</td>
                            <td className="p-4">
                              <div>
                                <p className="font-black text-slate-900">{c.title}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">{c.location_address}</p>
                              </div>
                            </td>
                            <td className="p-4 text-slate-700 font-bold">{c.citizen_name}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded bg-slate-100 text-slate-755 font-bold">{c.category}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                c.priority === 'Urgent' ? 'bg-rose-50 border-rose-200 text-rose-750' :
                                'bg-slate-50 border-slate-200 text-slate-700'
                              }`}>
                                {c.priority}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-650">
                              {dept ? dept.department_name : <span className="text-slate-400 italic font-medium">Unassigned</span>}
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
                              <button 
                                onClick={() => handleOpenMgmtModal(c)}
                                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-755 font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* ==========================================
            TAB: 9. PROFILE PAGE
           ========================================== */}
        {activeTab === 'profile' && currentUser && (
          <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-150 p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-br from-blue-600 to-indigo-700 z-0"></div>

              <div className="text-center relative z-10 space-y-4 pt-10 font-bold">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-24 h-24 rounded-2xl border-4 border-white mx-auto shadow-md object-cover"
                />
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{currentUser.name}</h2>
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border mt-1 border-blue-250 bg-blue-50 text-blue-700`}>
                    {currentUser.role.replace('_', ' ')} Account
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-4 text-xs font-bold">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</span>
                  <p className="font-bold text-slate-850 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">{currentUser.email}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</span>
                  <p className="font-bold text-slate-855 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">{currentUser.phone || '+1 (555) 000-0000'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System JWT Web Token</span>
                  <div className="font-mono text-[9px] text-slate-450 bg-slate-900 text-slate-200 px-4 py-3 rounded-xl border border-slate-800 overflow-x-auto select-all whitespace-pre-wrap">
                    Bearer {token || 'No Token'}
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-750 font-black uppercase tracking-wider border border-rose-200 rounded-xl transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>

            </div>
          </div>
        )}


        {/* ==========================================
            TAB: 10. DEVELOPER & FULL-STACK SANDBOX
           ========================================== */}
        {activeTab === 'developer-sandbox' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
            
            {/* ZIP Downloader Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-3xl text-white border border-slate-800 shadow-xl">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-455 text-[10px] font-black uppercase tracking-widest">
                  <Database className="w-4 h-4" /> Full-Stack Evaluation Sandbox
                </div>
                <h2 className="text-2xl font-black tracking-tight">Active Node.js / MySQL REST Simulator</h2>
                <p className="text-slate-400 text-xs max-w-2xl leading-relaxed font-semibold">
                  Observe the backend server and MySQL connection pool responses. Query simulated database tables, read routing code controllers, or compile the entire project workspace into a zip package.
                </p>
              </div>
              
              <button 
                onClick={handleDownloadZIP}
                className="px-6 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 group cursor-pointer text-xs uppercase tracking-wider"
              >
                <Download className="w-5 h-5 stroke-[2.5px] group-hover:translate-y-0.5 transition-transform" /> Download Complete ZIP
              </button>
            </div>

            {/* Sandbox subnavigation */}
            <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
              <button
                onClick={() => setSandboxTab('terminal')}
                className={`px-5 py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                  sandboxTab === 'terminal' 
                    ? 'border-amber-500 text-slate-900 bg-amber-500/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Terminal className="w-4.5 h-4.5" /> Node.js Server Terminal
              </button>
              <button
                onClick={() => setSandboxTab('database')}
                className={`px-5 py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                  sandboxTab === 'database' 
                    ? 'border-amber-500 text-slate-900 bg-amber-500/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Database className="w-4.5 h-4.5" /> MySQL Database Console
              </button>
              <button
                onClick={() => setSandboxTab('api-docs')}
                className={`px-5 py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                  sandboxTab === 'api-docs' 
                    ? 'border-amber-500 text-slate-900 bg-amber-500/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-4.5 h-4.5" /> REST API Documentation
              </button>
              <button
                onClick={() => setSandboxTab('code-explorer')}
                className={`px-5 py-3 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 ${
                  sandboxTab === 'code-explorer' 
                    ? 'border-amber-500 text-slate-900 bg-amber-500/5' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileCode className="w-4.5 h-4.5" /> IDE Code File Explorer
              </button>
            </div>

            {/* Sub-tab Content Workspace */}
            
            {/* Terminal Tab */}
            {sandboxTab === 'terminal' && (
              <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 border border-slate-900 shadow-2xl space-y-4 font-mono text-xs flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                    <span className="text-slate-450 ml-2">Node.js Express Server Stream</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={handleRestartServer}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold flex items-center gap-1 transition-colors text-[10px]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Restart Server
                    </button>
                    <span className="px-2 py-1 bg-emerald-900/50 border border-emerald-700 text-emerald-400 rounded text-[10px]">PORT 5000: ONLINE</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-2">
                  {logs.map((log) => {
                    let typeColor = 'text-slate-300';
                    if (log.type === 'success') typeColor = 'text-emerald-400 font-semibold';
                    if (log.type === 'error') typeColor = 'text-rose-400 font-semibold';
                    if (log.type === 'request') typeColor = 'text-blue-400 font-semibold';

                    return (
                      <div key={log.id} className="flex gap-3 leading-relaxed whitespace-pre-wrap font-mono">
                        <span className="text-slate-600 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={typeColor}>{log.message}</span>
                      </div>
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            )}

            {/* Database Tab */}
            {sandboxTab === 'database' && (
              <div className="grid lg:grid-cols-5 gap-8 animate-fade-in">
                
                {/* SQL Editor */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-xs space-y-4">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-4.5 h-4.5 text-amber-500" /> Raw SQL Command Editor
                    </h3>
                    
                    <textarea 
                      rows={4}
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs leading-relaxed border border-slate-850 focus:outline-none"
                    />

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRunSQL()}
                        className="px-4 py-2 bg-slate-900 text-emerald-400 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                      >
                        <RefreshCw className="w-4 h-4" /> Run Query
                      </button>
                      <button 
                        onClick={() => setSqlQuery('SELECT * FROM complaints;')}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Query Templates */}
                  <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-xs space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Query Templates (Click to paste):</p>
                    
                    <div className="flex flex-col gap-2 text-xs">
                      <button
                        onClick={() => {
                          setSqlQuery('SELECT * FROM complaints;');
                          handleRunSQL('SELECT * FROM complaints;');
                        }}
                        className="text-left p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg font-mono text-[10px] text-slate-700 font-bold"
                      >
                        SELECT * FROM complaints;
                      </button>

                      <button
                        onClick={() => {
                          setSqlQuery("SELECT id, name, email, role FROM users;");
                          handleRunSQL("SELECT id, name, email, role FROM users;");
                        }}
                        className="text-left p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg font-mono text-[10px] text-slate-700 font-bold"
                      >
                        SELECT id, name, email, role FROM users;
                      </button>

                      <button
                        onClick={() => {
                          setSqlQuery('SELECT c.complaint_id, c.title, d.department_name, c.status FROM complaints c JOIN departments d ON c.department_id = d.department_id;');
                          handleRunSQL('SELECT c.complaint_id, c.title, d.department_name, c.status FROM complaints c JOIN departments d ON c.department_id = d.department_id;');
                        }}
                        className="text-left p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg font-mono text-[10px] text-slate-700 font-bold"
                      >
                        SELECT c.id, c.title, d.name JOIN departments;
                      </button>
                    </div>
                  </div>
                </div>

                {/* SQL Result Set */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-4.5 h-4.5 text-amber-500" /> MySQL Result Set
                      </h3>
                      {sqlResult && !sqlResult.error && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded">
                          {sqlResult.count} records
                        </span>
                      )}
                    </div>

                    <div className="min-h-[260px] max-h-[460px] overflow-auto border border-slate-200 rounded-2xl bg-slate-50">
                      {sqlResult ? (
                        sqlResult.error ? (
                          <div className="p-8 text-rose-700 bg-rose-50/50 h-full flex items-center gap-3 font-bold text-xs">
                            <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                            <p>{sqlResult.error}</p>
                          </div>
                        ) : sqlResult.count === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs italic font-bold">
                            Query executed successfully. Empty set returned.
                          </div>
                        ) : (
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase font-mono">
                                {sqlResult.columns.map((col, idx) => (
                                  <th key={idx} className="p-3 whitespace-nowrap">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {sqlResult.rows.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-slate-50 font-mono text-[10px]">
                                  {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} className="p-3 max-w-xs truncate text-slate-700 font-semibold">
                                      {cell === null ? <span className="text-slate-400 italic">NULL</span> : String(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                          Execute an SQL statement to query tables.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* REST API Swagger Documentation */}
            {sandboxTab === 'api-docs' && (
              <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-fade-in">
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" /> Swagger OpenAPI 3.0 REST Specification
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold max-w-3xl">
                    All HTTP endpoints require standard header authentication: <code>Authorization: Bearer &lt;jwt_token&gt;</code>. Multi-role routing handles specific permissions.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* POST /api/auth/register */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs font-bold">
                    <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white font-black rounded text-[10px]">POST</span>
                        <span className="font-mono text-slate-700">/api/auth/register</span>
                      </div>
                      <span className="text-slate-450 text-[10px] uppercase">Register User Account</span>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4 font-mono text-[11px] bg-slate-950 text-slate-300">
                      <div>
                        <p className="text-slate-550 mb-2">// Request Payload</p>
                        <pre className="text-emerald-400">{`{
  "name": "Jane Doe",
  "email": "citizen@smartcity.gov",
  "password": "citizen123",
  "role": "citizen",
  "phone": "+1 (555) 019-2834"
}`}</pre>
                      </div>
                      <div>
                        <p className="text-slate-555 mb-2">// Response (201 Created)</p>
                        <pre className="text-blue-350">{`{
  "success": true,
  "message": "Registration successful!",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": { "id": 4, "name": "Jane Doe", "role": "citizen" }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  {/* POST /api/auth/login */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs font-bold">
                    <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-emerald-600 text-white font-black rounded text-[10px]">POST</span>
                        <span className="font-mono text-slate-700">/api/auth/login</span>
                      </div>
                      <span className="text-slate-450 text-[10px] uppercase">Login Session</span>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4 font-mono text-[11px] bg-slate-950 text-slate-300">
                      <div>
                        <p className="text-slate-550 mb-2">// Request Payload</p>
                        <pre className="text-emerald-400">{`{
  "email": "citizen@smartcity.gov",
  "password": "citizen123"
}`}</pre>
                      </div>
                      <div>
                        <p className="text-slate-555 mb-2">// Response (200 OK)</p>
                        <pre className="text-blue-350">{`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": { "id": 1, "name": "Jane Doe", "role": "citizen" }
}`}</pre>
                      </div>
                    </div>
                  </div>

                  {/* GET /api/complaints */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs font-bold">
                    <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-blue-600 text-white font-black rounded text-[10px]">GET</span>
                        <span className="font-mono text-slate-700">/api/complaints</span>
                      </div>
                      <span className="text-slate-450 text-[10px] uppercase">Retrieve Grievance List</span>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4 font-mono text-[11px] bg-slate-950 text-slate-300">
                      <div>
                        <p className="text-slate-550 mb-2">// Query Filters</p>
                        <pre className="text-emerald-400">{`status=In Progress
category=Road Damage
priority=High`}</pre>
                      </div>
                      <div>
                        <p className="text-slate-555 mb-2">// Response (200 OK)</p>
                        <pre className="text-blue-350">{`{
  "success": true,
  "count": 1,
  "complaints": [
    { "complaint_id": "CC-2026-001", "title": "Severe Pothole", "status": "In Progress" }
  ]
}`}</pre>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* IDE File Code Explorer */}
            {sandboxTab === 'code-explorer' && (
              <div className="grid lg:grid-cols-5 gap-8 animate-fade-in">
                
                {/* File system tree */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-350 text-xs font-mono space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-bold">
                    <span>MUNICIPAL FILE SYSTEM</span>
                    <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">EXPRESS & MYSQL</span>
                  </div>

                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <p className="font-black text-white flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-400" /> smart-city-portal/
                      </p>
                      
                      <div className="pl-4 space-y-1 border-l border-slate-800 ml-2">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200">📂 backend/</p>
                          <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-2 font-semibold">
                            <p onClick={() => setSelectedCodeFile('backend/server.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/server.js' ? 'text-amber-450 font-black' : 'text-slate-400'}`}>📄 server.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/package.json')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/package.json' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📄 package.json</p>
                            <p onClick={() => setSelectedCodeFile('backend/env.example')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/env.example' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📄 .env.example</p>
                            <p onClick={() => setSelectedCodeFile('backend/config/db.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/config/db.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 config/db.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/models/schema.sql')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/models/schema.sql' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 models/schema.sql</p>
                            <p onClick={() => setSelectedCodeFile('backend/middleware/auth.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/middleware/auth.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 middleware/auth.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/controllers/authController.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/controllers/authController.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 controllers/authController.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/controllers/complaintController.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/controllers/complaintController.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 controllers/complaintController.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/controllers/userController.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/controllers/userController.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 controllers/userController.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/controllers/departmentController.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/controllers/departmentController.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 controllers/departmentController.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/routes/api.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/routes/api.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 routes/api.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/services/emailService.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/services/emailService.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 services/emailService.js</p>
                            <p onClick={() => setSelectedCodeFile('backend/services/notificationService.js')} className={`cursor-pointer py-0.5 hover:text-white ${selectedCodeFile === 'backend/services/notificationService.js' ? 'text-amber-455 font-black' : 'text-slate-400'}`}>📂 services/notificationService.js</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code display screen */}
                <div className="lg:col-span-3">
                  <div className="bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-900 shadow-xl space-y-3 font-mono text-xs flex flex-col min-h-[460px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-[10px] font-bold text-slate-450 font-mono truncate">{selectedCodeFile}</span>
                      
                      <button 
                        onClick={() => {
                          let text = '';
                          if (selectedCodeFile === 'backend/server.js') text = FILE_CONTENTS.backendServerJs;
                          else if (selectedCodeFile === 'backend/package.json') text = FILE_CONTENTS.backendPackageJson;
                          else if (selectedCodeFile === 'backend/env.example') text = FILE_CONTENTS.backendEnvExample;
                          else if (selectedCodeFile === 'backend/config/db.js') text = FILE_CONTENTS.backendDbConfig;
                          else if (selectedCodeFile === 'backend/models/schema.sql') text = FILE_CONTENTS.backendSchemaSql;
                          else if (selectedCodeFile === 'backend/middleware/auth.js') text = FILE_CONTENTS.backendAuthMiddleware;
                          else if (selectedCodeFile === 'backend/controllers/authController.js') text = FILE_CONTENTS.backendAuthController;
                          else if (selectedCodeFile === 'backend/controllers/complaintController.js') text = FILE_CONTENTS.backendComplaintController;
                          else if (selectedCodeFile === 'backend/routes/api.js') text = FILE_CONTENTS.backendApiRoutes;
                          else if (selectedCodeFile === 'src/App.tsx') text = FILE_CONTENTS.frontendAppTsx;
                          else if (selectedCodeFile === 'src/main.tsx') text = FILE_CONTENTS.frontendMainTxs;
                          else if (selectedCodeFile === 'src/index.css') text = FILE_CONTENTS.frontendIndexCss;
                          else if (selectedCodeFile === 'package.json') text = FILE_CONTENTS.frontendPackageJson;
                          else if (selectedCodeFile === 'vite.config.ts') text = FILE_CONTENTS.frontendViteConfig;
                          else if (selectedCodeFile === 'tsconfig.json') text = FILE_CONTENTS.frontendTsConfig;
                          else if (selectedCodeFile === 'index.html') text = FILE_CONTENTS.frontendIndexHtml;
                          else text = FILE_CONTENTS.backendReadme;

                          navigator.clipboard.writeText(text);
                          addToast('success', 'Code copied to clipboard!');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 rounded text-[10px] font-bold text-slate-300 transition-colors"
                      >
                        Copy Code
                      </button>
                    </div>

                    <div className="flex-1 overflow-auto max-h-[380px] bg-slate-950 p-2 text-emerald-400 rounded-xl leading-relaxed whitespace-pre font-mono text-[11px]">
                      {(() => {
                        let text = '';
                        if (selectedCodeFile === 'backend/server.js') text = FILE_CONTENTS.backendServerJs;
                        else if (selectedCodeFile === 'backend/package.json') text = FILE_CONTENTS.backendPackageJson;
                        else if (selectedCodeFile === 'backend/env.example') text = FILE_CONTENTS.backendEnvExample;
                        else if (selectedCodeFile === 'backend/config/db.js') text = FILE_CONTENTS.backendDbConfig;
                        else if (selectedCodeFile === 'backend/models/schema.sql') text = FILE_CONTENTS.backendSchemaSql;
                        else if (selectedCodeFile === 'backend/middleware/auth.js') text = FILE_CONTENTS.backendAuthMiddleware;
                        else if (selectedCodeFile === 'backend/controllers/authController.js') text = FILE_CONTENTS.backendAuthController;
                        else if (selectedCodeFile === 'backend/controllers/complaintController.js') text = FILE_CONTENTS.backendComplaintController;
                        else if (selectedCodeFile === 'backend/routes/api.js') text = FILE_CONTENTS.backendApiRoutes;
                        else if (selectedCodeFile === 'src/App.tsx') text = FILE_CONTENTS.frontendAppTsx;
                        else if (selectedCodeFile === 'src/main.tsx') text = FILE_CONTENTS.frontendMainTxs;
                        else if (selectedCodeFile === 'src/index.css') text = FILE_CONTENTS.frontendIndexCss;
                        else if (selectedCodeFile === 'package.json') text = FILE_CONTENTS.frontendPackageJson;
                        else if (selectedCodeFile === 'vite.config.ts') text = FILE_CONTENTS.frontendViteConfig;
                        else if (selectedCodeFile === 'tsconfig.json') text = FILE_CONTENTS.frontendTsConfig;
                        else if (selectedCodeFile === 'index.html') text = FILE_CONTENTS.frontendIndexHtml;
                        else text = FILE_CONTENTS.backendReadme;

                        return text;
                      })()}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* --- MASTER FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Building2 className="w-5 h-5 text-blue-500" />
              <span>SmartCity Service Portal</span>
            </div>
            <p className="leading-relaxed font-light text-slate-400">
              A comprehensive citizens' service platform ensuring transparent civic issue tracking, department routing, and timely resolution.
            </p>
            <p className="text-[10px] text-slate-500">© 2026 SmartCity Municipal Administration. All Rights Reserved.</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Technology Stack</h4>
            <ul className="space-y-1 text-slate-400 font-medium">
              <li>React.js (V5.x / V19.x)</li>
              <li>Node.js / Express.js REST API</li>
              <li>MySQL 8.0 Community Edition</li>
              <li>JSON Web Token Security</li>
              <li>Nodemailer & Firebase Messaging</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Sandbox Operations</h4>
            <ul className="space-y-1 text-slate-400 font-medium">
              <li>Active SQL Database Console</li>
              <li>Live HTTP Request Terminal</li>
              <li>OpenStreetMap Geolocation</li>
              <li>One-Click Workspace Downloader</li>
            </ul>
          </div>

          <div className="space-y-3 font-bold">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Developer Access</h4>
            <p className="text-slate-400 leading-relaxed mb-2 font-medium">Test the portal using instant pre-registered credentials:</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-[9px] rounded font-mono text-slate-300">citizen@smartcity.gov</span>
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-[9px] rounded font-mono text-slate-300">officer@smartcity.gov</span>
              <span className="px-2 py-1 bg-slate-800 border border-slate-700 text-[9px] rounded font-mono text-slate-300">admin@smartcity.gov</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-semibold">Preset Password for all demo accounts: <code>citizen123</code> / <code>officer123</code> / <code>admin123</code></p>
          </div>
        </div>
      </footer>

      {/* --- MASTER WORKFLOW COMPLAINT DETAIL MODAL --- */}
      {selectedMgmtComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto flex flex-col animate-scale-up">
            
            <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl font-bold">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Grievance Action Control</span>
                <h3 className="text-base font-black mt-0.5">Reviewing Case: {selectedMgmtComplaint.complaint_id}</h3>
              </div>
              <button 
                onClick={() => setSelectedMgmtComplaint(null)}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 flex-1 overflow-y-auto grid md:grid-cols-2 gap-8 text-xs font-bold">
              
              {/* Case Details */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Reporter details</span>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 text-slate-700">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase">Citizen Name</span>
                      <p className="text-slate-900 mt-0.5">{selectedMgmtComplaint.citizen_name}</p>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase">Report Date</span>
                      <p className="text-slate-900 mt-0.5">{new Date(selectedMgmtComplaint.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2 border-t border-slate-200/60 pt-2 font-bold">
                      <span className="text-[8px] font-black text-slate-400 uppercase">GPS Map Pinpoint</span>
                      <p className="text-slate-800 mt-0.5 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" /> {selectedMgmtComplaint.location_address}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">Coordinates: Lat {selectedMgmtComplaint.location_lat}, Lng {selectedMgmtComplaint.location_lng}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Title & Description</span>
                  <div className="space-y-1.5">
                    <h4 className="font-black text-slate-900 text-sm leading-relaxed">{selectedMgmtComplaint.title}</h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60 font-semibold">{selectedMgmtComplaint.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Evidence Attachment</span>
                  <div className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                    <img src={selectedMgmtComplaint.image} alt="Evidence" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Action Panel */}
              <div className="space-y-6">
                <form onSubmit={handleUpdateComplaintStatus} className="space-y-5 bg-blue-50/20 p-6 rounded-3xl border border-blue-100/60">
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-600" /> Commit Database Changes
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Workflow Status</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="Submitted">Submitted (Queued)</option>
                      <option value="Under Review">Under Review (Verifying)</option>
                      <option value="Assigned">Assigned (Routing)</option>
                      <option value="In Progress">In Progress (Action Crew)</option>
                      <option value="Resolved">Resolved (Completed)</option>
                      <option value="Closed">Closed (Archived)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Assign Municipal Department</label>
                    <select
                      value={updateDept || ''}
                      onChange={(e) => setUpdateDept(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => (
                        <option key={d.department_id} value={d.department_id}>{d.department_name} ({d.head_officer})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Severity Priority</label>
                    <select
                      value={updatePriority}
                      onChange={(e) => setUpdatePriority(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                      <option value="Urgent">Urgent Priority</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Remarks (Stored in MySQL)</label>
                    <textarea
                      rows={3}
                      value={updateRemarks}
                      onChange={(e) => setUpdateRemarks(e.target.value)}
                      placeholder="Add remarks regarding crew dispatches, resources allocated, or inspection details..."
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-655 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Commit MySQL Changes & Notify Citizen
                  </button>
                </form>

                <div className="space-y-3">
                  <h5 className="font-black text-slate-900 uppercase tracking-wider text-[9px]">Grievance Chat Stream</h5>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 max-h-[160px] overflow-y-auto space-y-2">
                    {(!chatHistory[selectedMgmtComplaint.complaint_id] || chatHistory[selectedMgmtComplaint.complaint_id].length === 0) ? (
                      <p className="text-center text-slate-400 italic text-[10px]">No messages logged.</p>
                    ) : (
                      chatHistory[selectedMgmtComplaint.complaint_id].map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`flex flex-col max-w-[85%] text-[10px] p-2.5 rounded-xl ${
                            msg.sender === 'department_officer' 
                              ? 'bg-slate-900 text-white rounded-tr-none ml-auto' 
                              : 'bg-slate-200 text-slate-800 rounded-tl-none mr-auto'
                          }`}
                        >
                          <span className="font-black uppercase opacity-75 text-[7px] mb-0.5">
                            {msg.sender === 'department_officer' ? 'City Officer' : 'Jane Doe (Citizen)'}
                          </span>
                          <p className="leading-normal font-semibold">{msg.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Type response to citizen..."
                      value={authorityChatMsg}
                      onChange={(e) => setAuthorityChatMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat('department_officer', selectedMgmtComplaint.complaint_id)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                    <button
                      onClick={() => handleSendChat('department_officer', selectedMgmtComplaint.complaint_id)}
                      className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
