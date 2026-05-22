import { getRegisteredUsers, getStoredUser } from './auth.js';

const SCANS_KEY = 'glutisafe_scan_logs';

export function logCompletedScan(analysis = {}) {
  const user = getStoredUser();
  if (!user?.email) return null;

  const nextScan = {
    id: crypto.randomUUID(),
    userEmail: user.email,
    scanDate: new Date().toISOString(),
    verdict: analysis.status || analysis.label || 'unknown',
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(SCANS_KEY, JSON.stringify([nextScan, ...getScanLogs()].slice(0, 500)));
  return nextScan;
}

export function getScanLogs() {
  try {
    const logs = JSON.parse(localStorage.getItem(SCANS_KEY) || '[]');
    return Array.isArray(logs) ? logs : [];
  } catch {
    localStorage.removeItem(SCANS_KEY);
    return [];
  }
}

export function getAdminStats() {
  const scans = getScanLogs();
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    usersCount: getRegisteredUsers().length,
    scansCount: scans.length,
    recentScansCount: scans.filter((scan) => new Date(scan.createdAt || scan.scanDate).getTime() >= oneWeekAgo).length,
    status: 'Active',
  };
}
