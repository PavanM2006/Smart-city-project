export interface User {
  id: number;
  name: string;
  email: string;
  role: 'citizen' | 'department_officer' | 'administrator';
  avatar: string;
  phone?: string;
}

export interface Department {
  department_id: number;
  department_name: string;
  head_officer: string;
  contact: string;
}

export interface Complaint {
  complaint_id: string;
  user_id: number;
  citizen_name: string;
  title: string;
  description: string;
  category: 'Water Supply' | 'Electricity' | 'Road Damage' | 'Garbage' | 'Drainage' | 'Street Light' | 'Other';
  image: string; // Base64 or Unsplash image url
  location_lat: number;
  location_lng: number;
  location_address: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  status: 'Submitted' | 'Under Review' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  department_id: number | null;
  created_at: string;
  updated_at: string;
  remarks: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

export interface Notification {
  notification_id: number;
  user_id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface TerminalLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'request';
  message: string;
}

// Initial Seed Departments
export const INITIAL_DEPARTMENTS: Department[] = [
  { department_id: 1, department_name: 'Water Resources & Sewage', head_officer: 'Michael Flores', contact: 'waterdept@smartcity.gov' },
  { department_id: 2, department_name: 'Electrical Grid & Lighting', head_officer: 'Elena Rostova', contact: 'electrical@smartcity.gov' },
  { department_id: 3, department_name: 'Public Works & Roads', head_officer: 'Robert Chen', contact: 'publicworks@smartcity.gov' },
  { department_id: 4, department_name: 'Sanitation & Waste Management', head_officer: 'Sarah Jenkins', contact: 'sanitation@smartcity.gov' },
  { department_id: 5, department_name: 'Parks & Urban Forestry', head_officer: 'Marcus Vance', contact: 'parks@smartcity.gov' }
];

// Initial Seed Users (Three Roles: citizen, department_officer, administrator)
export const INITIAL_USERS: User[] = [
  { id: 1, name: 'Jane Doe', email: 'citizen@smartcity.gov', role: 'citizen', phone: '+1 (555) 019-2834', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { id: 2, name: 'Chief Officer Robert Chen', email: 'officer@smartcity.gov', role: 'department_officer', phone: '+1 (555) 011-9988', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 3, name: 'Director Arthur Pendelton', email: 'admin@smartcity.gov', role: 'administrator', phone: '+1 (555) 043-9876', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' }
];

// Mock Image URLs for civic issues
export const MOCK_IMAGES = {
  pothole: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
  garbage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
  waterleak: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  streetlight: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80',
  drainage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80' // road works
};

// Initial Seed Complaints
export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    complaint_id: 'CC-2026-001',
    user_id: 1,
    citizen_name: 'Jane Doe',
    title: 'Severe Pothole on Oak Avenue',
    description: 'There is a massive pothole in the middle of the road near the Oak Avenue intersection. Multiple cars have had to swerve dangerously to avoid it. It is about 6 inches deep.',
    category: 'Road Damage',
    image: MOCK_IMAGES.pothole,
    location_lat: 40.7128,
    location_lng: -74.0060,
    location_address: '425 Oak Avenue, Central District, SmartCity',
    status: 'In Progress',
    department_id: 3,
    created_at: '2026-03-01T09:15:00Z',
    updated_at: '2026-03-02T14:30:00Z',
    remarks: 'Road repair team has been dispatched. Asphalt filling is scheduled for tomorrow morning.',
    priority: 'High'
  },
  {
    complaint_id: 'CC-2026-002',
    user_id: 1,
    citizen_name: 'Jane Doe',
    title: 'Overflowing Trash Bins in Riverside Park',
    description: 'The public garbage bins at the main entrance of Riverside Park have not been emptied for three days. Waste is spilling onto the walkways, attracting rodents.',
    category: 'Garbage',
    image: MOCK_IMAGES.garbage,
    location_lat: 40.7250,
    location_lng: -74.0150,
    location_address: 'Riverside Park Promenade, West Ward, SmartCity',
    status: 'Assigned',
    department_id: 4,
    created_at: '2026-03-03T11:40:00Z',
    updated_at: '2026-03-03T16:00:00Z',
    remarks: 'Assigned to Sanitation Crew Area B. Expected pickup within 24 hours.',
    priority: 'Medium'
  },
  {
    complaint_id: 'CC-2026-003',
    user_id: 1,
    citizen_name: 'Jane Doe',
    title: 'Water Hydrant Leaking under Maple Street Bridge',
    description: 'Clean water is spraying out of the ground at a high rate under the Maple Street Bridge. It is creating a large pool of water and eroding the dirt embankment.',
    category: 'Water Supply',
    image: MOCK_IMAGES.waterleak,
    location_lat: 40.7050,
    location_lng: -73.9980,
    location_address: 'Maple Street Bridge (South Anchor), River District',
    status: 'Under Review',
    department_id: null,
    created_at: '2026-03-04T07:20:00Z',
    updated_at: '2026-03-04T07:20:00Z',
    remarks: 'Complaint received and queued for emergency review.',
    priority: 'Urgent'
  }
];

// Initial Seed Notifications
export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    notification_id: 1,
    user_id: 1,
    message: 'Your complaint "Severe Pothole on Oak Avenue" has been updated to IN PROGRESS.',
    type: 'info',
    is_read: false,
    created_at: '2026-03-02T14:30:00Z'
  },
  {
    notification_id: 2,
    user_id: 1,
    message: 'Your complaint "Overflowing Trash Bins" has been assigned to Sanitation & Waste Management.',
    type: 'success',
    is_read: true,
    created_at: '2026-03-03T16:00:00Z'
  }
];

// Initial Seed Terminal Logs
export const INITIAL_LOGS: TerminalLog[] = [
  { id: 'l1', timestamp: '2026-03-04T12:00:00.000Z', type: 'info', message: 'Starting Smart City Backend Server...' },
  { id: 'l2', timestamp: '2026-03-04T12:00:00.200Z', type: 'info', message: 'Loading environment variables from .env...' },
  { id: 'l3', timestamp: '2026-03-04T12:00:00.350Z', type: 'success', message: 'JWT Secret loaded successfully. Token expiry: 24h.' },
  { id: 'l4', timestamp: '2026-03-04T12:00:00.500Z', type: 'info', message: 'Connecting to MySQL database smartcity_db at localhost:3306...' },
  { id: 'l5', timestamp: '2026-03-04T12:00:01.100Z', type: 'success', message: 'MySQL Database connected successfully! Connection Thread ID: 25' },
  { id: 'l6', timestamp: '2026-03-04T12:00:01.120Z', type: 'info', message: 'Verifying tables: users, departments, complaints, notifications, device_tokens...' },
  { id: 'l7', timestamp: '2026-03-04T12:00:01.150Z', type: 'success', message: 'Tables verified. Database schema is up-to-date. Indexes optimized.' },
  { id: 'l8', timestamp: '2026-03-04T12:00:01.200Z', type: 'info', message: 'Initializing Nodemailer SMTP client...' },
  { id: 'l9', timestamp: '2026-03-04T12:00:01.400Z', type: 'success', message: 'Gmail SMTP mailer service ready to relay notifications.' },
  { id: 'l10', timestamp: '2026-03-04T12:00:01.410Z', type: 'info', message: 'Firebase Cloud Messaging (FCM) SDK initialized.' },
  { id: 'l11', timestamp: '2026-03-04T12:00:01.500Z', type: 'success', message: 'Smart City Backend REST Server online on port 5000!' }
];
