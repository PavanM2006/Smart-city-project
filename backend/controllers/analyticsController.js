const db = require('../config/db');

// GET /api/analytics/dashboard
exports.getDashboardSummary = async (req, res) => {
  try {
    const [totalRes] = await db.query('SELECT COUNT(*) AS count FROM complaints');
    const [statusRes] = await db.query(
      'SELECT status, COUNT(*) AS count FROM complaints GROUP BY status'
    );
    const [priorityRes] = await db.query(
      'SELECT priority, COUNT(*) AS count FROM complaints WHERE status NOT IN ("Resolved", "Closed") GROUP BY priority'
    );
    const [usersRes] = await db.query('SELECT COUNT(*) AS count FROM users');
    const [deptRes] = await db.query('SELECT COUNT(*) AS count FROM departments');

    const total = totalRes[0].count;
    const resolved = statusRes.find(s => s.status === 'Resolved')?.count || 0;
    const closed = statusRes.find(s => s.status === 'Closed')?.count || 0;
    const active = total - (resolved + closed);

    const resolutionRate = total > 0 ? Math.round(((resolved + closed) / total) * 100) : 100;

    return res.status(200).json({
      success: true,
      summary: {
        totalComplaints: total,
        activeComplaints: active,
        resolvedComplaints: resolved + closed,
        resolutionRate,
        totalUsers: usersRes[0].count,
        totalDepartments: deptRes[0].count,
        priorityBreakdown: priorityRes,
        statusBreakdown: statusRes
      }
    });
  } catch (err) {
    console.error('[Analytics Error] Dashboard fetch failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while calculating dashboard summaries.' });
  }
};

// GET /api/analytics/monthly
exports.getMonthlyTrends = async (req, res) => {
  try {
    const [trends] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') AS month, 
        COUNT(*) AS logged,
        SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) AS resolved
      FROM complaints 
      GROUP BY month 
      ORDER BY month ASC
      LIMIT 12
    `);

    return res.status(200).json({
      success: true,
      trends
    });
  } catch (err) {
    console.error('[Analytics Error] Monthly trend fetch failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while calculating monthly trends.' });
  }
};

// GET /api/analytics/categories
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT category, COUNT(*) AS count FROM complaints GROUP BY category'
    );

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (err) {
    console.error('[Analytics Error] Category breakdown failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while calculating category breakdown.' });
  }
};

// GET /api/analytics/status
exports.getStatusBreakdown = async (req, res) => {
  try {
    const [statusCounts] = await db.query(
      'SELECT status, COUNT(*) AS count FROM complaints GROUP BY status'
    );

    return res.status(200).json({
      success: true,
      statusCounts
    });
  } catch (err) {
    console.error('[Analytics Error] Status breakdown failed:', err);
    return res.status(500).json({ success: false, message: 'Server error while calculating status breakdown.' });
  }
};
