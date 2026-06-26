import { Complaint, User, Department, Notification } from '../data/mockData';

export interface SQLResult {
  columns: string[];
  rows: any[][];
  count: number;
  message?: string;
  error?: string;
}

export function executeSQL(
  query: string,
  tables: {
    users: User[];
    complaints: Complaint[];
    departments: Department[];
    notifications: Notification[];
  }
): SQLResult {
  const q = query.trim().replace(/;$/, '').toLowerCase();
  
  if (!q.startsWith('select')) {
    return {
      columns: [],
      rows: [],
      count: 0,
      error: 'Query Error: Only SELECT queries are supported in this read-only MySQL console simulator. (e.g., SELECT * FROM complaints)'
    };
  }

  try {
    // Basic table matching
    if (q.includes('from complaints') && q.includes('join departments')) {
      // JOIN query: SELECT c.complaint_id, c.title, d.department_name, c.status FROM complaints c JOIN departments d
      const columns = ['complaint_id', 'title', 'category', 'status', 'department_name', 'head_officer'];
      const rows = tables.complaints
        .filter(c => c.department_id !== null)
        .map(c => {
          const dept = tables.departments.find(d => d.department_id === c.department_id);
          return [
            c.complaint_id,
            c.title,
            c.category,
            c.status,
            dept ? dept.department_name : 'N/A',
            dept ? dept.head_officer : 'N/A'
          ];
        });
      return { columns, rows, count: rows.length, message: 'Query OK. JOIN completed successfully.' };
    }

    if (q.includes('group by category')) {
      // GROUP BY query
      const columns = ['category', 'complaint_count'];
      const counts: Record<string, number> = {};
      tables.complaints.forEach(c => {
        counts[c.category] = (counts[c.category] || 0) + 1;
      });
      const rows = Object.entries(counts).map(([cat, val]) => [cat, val]);
      return { columns, rows, count: rows.length, message: 'Query OK. GROUP BY category aggregated.' };
    }

    if (q.includes('group by status')) {
      const columns = ['status', 'complaint_count'];
      const counts: Record<string, number> = {};
      tables.complaints.forEach(c => {
        counts[c.status] = (counts[c.status] || 0) + 1;
      });
      const rows = Object.entries(counts).map(([stat, val]) => [stat, val]);
      return { columns, rows, count: rows.length, message: 'Query OK. GROUP BY status aggregated.' };
    }

    if (q.includes('from complaints')) {
      const isSelectAll = q.includes('select *');
      const columns = isSelectAll 
        ? ['complaint_id', 'title', 'category', 'status', 'location_address', 'priority', 'created_at']
        : ['complaint_id', 'title', 'status'];

      let filteredComplaints = [...tables.complaints];
      if (q.includes("where status = 'resolved'")) {
        filteredComplaints = filteredComplaints.filter(c => c.status === 'Resolved');
      } else if (q.includes("where status = 'in progress'")) {
        filteredComplaints = filteredComplaints.filter(c => c.status === 'In Progress');
      } else if (q.includes("where priority = 'high'")) {
        filteredComplaints = filteredComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent');
      }

      const rows = filteredComplaints.map(c => 
        isSelectAll 
          ? [c.complaint_id, c.title, c.category, c.status, c.location_address, c.priority, c.created_at.substring(0, 10)]
          : [c.complaint_id, c.title, c.status]
      );
      return { columns, rows, count: rows.length, message: `Query OK. ${rows.length} rows in set.` };
    }

    if (q.includes('from users')) {
      const isSelectAll = q.includes('select *');
      const columns = isSelectAll 
        ? ['id', 'name', 'email', 'role', 'phone']
        : ['id', 'name', 'email', 'role'];

      let filteredUsers = [...tables.users];
      if (q.includes("where role = 'citizen'")) {
        filteredUsers = filteredUsers.filter(u => u.role === 'citizen');
      } else if (q.includes("where role = 'department_officer'")) {
        filteredUsers = filteredUsers.filter(u => u.role === 'department_officer');
      } else if (q.includes("where role = 'administrator'")) {
        filteredUsers = filteredUsers.filter(u => u.role === 'administrator');
      }

      const rows = filteredUsers.map(u => 
        isSelectAll 
          ? [u.id, u.name, u.email, u.role, u.phone || 'NULL']
          : [u.id, u.name, u.email, u.role]
      );
      return { columns, rows, count: rows.length, message: `Query OK. ${rows.length} rows in set.` };
    }

    if (q.includes('from departments')) {
      const columns = ['department_id', 'department_name', 'head_officer', 'contact'];
      const rows = tables.departments.map(d => [d.department_id, d.department_name, d.head_officer, d.contact]);
      return { columns, rows, count: rows.length, message: `Query OK. ${rows.length} rows in set.` };
    }

    if (q.includes('from notifications')) {
      const columns = ['notification_id', 'user_id', 'message', 'type', 'created_at'];
      const rows = tables.notifications.map(n => [n.notification_id, n.user_id, n.message, n.type, n.created_at.substring(0, 19).replace('T', ' ')]);
      return { columns, rows, count: rows.length, message: `Query OK. ${rows.length} rows in set.` };
    }

    return {
      columns: [],
      rows: [],
      count: 0,
      error: `Table not found or SQL syntax error near: "${query.substring(0, 30)}". Try executing "SELECT * FROM complaints" or use one of our Quick Templates.`
    };
  } catch (err: any) {
    return {
      columns: [],
      rows: [],
      count: 0,
      error: `SQL Parse Error: ${err.message}`
    };
  }
}
