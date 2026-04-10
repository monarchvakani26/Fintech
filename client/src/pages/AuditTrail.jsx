// ============================================================
// Rakshak AI - Audit Trail Page
// Complete transaction history with filters - matches Image 6
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Eye, CheckCircle, XCircle, Clock,
  Database, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatusBadge from '../components/common/StatusBadge';
import RiskScoreBar from '../components/common/RiskScoreBar';
import { formatCurrency, formatDate, shortHash } from '../utils/formatters';
import api from '../services/api';

// Debounce hook
function useDebounce(val, delay) {
  const [debVal, setDebVal] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDebVal(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return debVal;
}

export default function AuditTrail() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState({ totalMonitored: 0, riskFlagged: 0, systemHealth: 'Sovereign Active' });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(riskFilter !== 'ALL' && { riskLevel: riskFilter }),
        ...(debouncedSearch && { search: debouncedSearch }),
        sortBy,
        sortOrder,
      });

      // Date filter
      if (dateFilter === 'TODAY') {
        params.set('dateFrom', new Date().toISOString().split('T')[0]);
      } else if (dateFilter === '7D') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.set('dateFrom', d.toISOString().split('T')[0]);
      } else if (dateFilter === '30D') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.set('dateFrom', d.toISOString().split('T')[0]);
      }

      const res = await api.get(`/audit?${params}`);
      if (res.data.success) {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
        setMetrics(res.data.metrics);
      }
    } catch (err) {
      console.error('Audit fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, riskFilter, debouncedSearch, sortBy, sortOrder, dateFilter]);

  useEffect(() => {
    fetchAudit();
    const interval = setInterval(fetchAudit, 30000);
    return () => clearInterval(interval);
  }, [fetchAudit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, riskFilter, debouncedSearch, dateFilter]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/audit/export?format=csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rakshak-audit-trail.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit trail exported as CSV');
    } catch {
      toast.error('Export failed');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ChevronUp className="w-3 h-3 text-dark/20" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-dark/50 mb-1">Immutable Record</p>
            <h1 className="text-4xl font-black text-dark">Audit Trail</h1>
          </div>
          <button
            onClick={handleExport}
            className="btn-ghost text-sm px-5 py-2.5 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black text-dark tabular-nums">
                {metrics.totalMonitored?.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-dark/50 font-semibold uppercase tracking-wider">Total Monitored</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-orange-500 tabular-nums">{metrics.riskFlagged}</p>
              <p className="text-xs text-dark/50 font-semibold uppercase tracking-wider">Risk Flagged</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">{metrics.systemHealth}</p>
              <p className="text-xs text-dark/50 font-semibold uppercase tracking-wider">System Health</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search reference, recipient..."
                className="input-field pl-10 py-2.5 text-sm"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field py-2.5 text-sm w-36"
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="REVIEW">Review</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            {/* Risk filter */}
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="input-field py-2.5 text-sm w-40"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low (0-30)</option>
              <option value="MEDIUM">Medium (31-69)</option>
              <option value="HIGH">High (70-100)</option>
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="input-field py-2.5 text-sm w-36"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </select>

            <button
              onClick={() => { setSearch(''); setStatusFilter('ALL'); setRiskFilter('ALL'); setDateFilter('ALL'); }}
              className="text-xs text-primary font-semibold hover:text-primary-dark px-3 py-2.5"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-7 px-6 py-3 bg-cream-light border-b border-cream-dark/20 text-xs font-bold uppercase tracking-wider text-dark/40">
            {[
              { label: 'Reference', col: 'reference' },
              { label: 'Recipient', col: null },
              { label: 'Type', col: 'type' },
              { label: 'Amount', col: 'amount' },
              { label: 'Risk Score', col: 'riskScore' },
              { label: 'Status', col: 'status' },
              { label: 'Actions', col: null },
            ].map(({ label, col }) => (
              <div
                key={label}
                className={`flex items-center gap-1 ${col ? 'cursor-pointer hover:text-dark' : ''}`}
                onClick={() => col && handleSort(col)}
              >
                {label}
                {col && <SortIcon col={col} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="grid grid-cols-7 px-6 py-4 border-b border-cream/50 gap-4 items-center">
                {Array(7).fill(0).map((_, j) => (
                  <div key={j} className="h-4 shimmer rounded" />
                ))}
              </div>
            ))
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-12 h-12 text-dark/20 mx-auto mb-3" />
              <p className="text-dark/40 font-medium">No transactions found</p>
              <p className="text-dark/30 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            transactions.map((txn, i) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-7 items-center px-6 py-4 border-b border-cream/40 hover:bg-cream-light/50 transition-colors"
              >
                {/* Reference */}
                <div className="text-xs font-mono font-bold text-dark/70">{txn.reference}</div>

                {/* Recipient */}
                <div className="flex items-center gap-2">
                  <span className="text-base">{txn.recipient?.icon || '👤'}</span>
                  <div>
                    <p className="text-xs font-semibold text-dark leading-tight">{txn.recipient?.name}</p>
                    <p className="text-xs text-dark/40">{txn.recipient?.vpa}</p>
                  </div>
                </div>

                {/* Type */}
                <div className="text-xs text-dark/50">{txn.type}</div>

                {/* Amount */}
                <div className={`text-sm font-bold tabular-nums ${txn.status === 'BLOCKED' ? 'text-red-600' : 'text-dark'}`}>
                  {formatCurrency(txn.amount, { compact: true })}
                </div>

                {/* Risk Score */}
                <div className="pr-4">
                  <RiskScoreBar score={txn.riskAnalysis?.riskScore || 0} />
                </div>

                {/* Status */}
                <div>
                  <StatusBadge status={txn.status} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/payments/result/${txn.id}`)}
                    className="p-1.5 hover:bg-cream rounded-lg transition-colors"
                    title="View details"
                  >
                    <Eye className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-dark/50">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost text-sm px-3 py-2 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                      p === page ? 'bg-primary text-white' : 'hover:bg-cream text-dark/60'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="btn-ghost text-sm px-3 py-2 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
