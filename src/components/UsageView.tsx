import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Send,
  Plus,
  Search,
  Building2,
  Printer,
  FileSpreadsheet,
  Download,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface UsageViewProps {
  onOpenLogUsage: () => void;
}

export const UsageView: React.FC<UsageViewProps> = ({ onOpenLogUsage }) => {
  const { usages, branches, totalUsedUnits } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');

  const filteredUsages = useMemo(() => {
    return usages.filter((u) => {
      const matchesSearch =
        u.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.cartridgeModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.printerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.installedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.usageCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBranch = branchFilter === 'ALL' || u.branchId === branchFilter;
      const matchesReason = reasonFilter === 'ALL' || u.reason === reasonFilter;

      return matchesSearch && matchesBranch && matchesReason;
    });
  }, [usages, searchQuery, branchFilter, reasonFilter]);

  // Compute average pages printed when recorded
  const pagesRecorded = usages.filter((u) => u.estimatedPagesPrinted && u.estimatedPagesPrinted > 0);
  const avgPages = pagesRecorded.length > 0
    ? Math.round(
        pagesRecorded.reduce((sum, u) => sum + (u.estimatedPagesPrinted || 0), 0) /
          pagesRecorded.length
      )
    : 0;

  // Branch consumption breakdown
  const branchCounts = useMemo(() => {
    const map = new Map<string, number>();
    usages.forEach((u) => {
      map.set(u.branchName, (map.get(u.branchName) || 0) + u.quantity);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [usages]);

  const topBranch = branchCounts.length > 0 ? branchCounts[0] : null;

  const handleExportCSV = () => {
    const headers = [
      'Usage Code',
      'Branch Name',
      'Printer Device',
      'Cartridge Model',
      'Color',
      'Quantity Installed',
      'Install Date',
      'Installed By',
      'Reason',
      'Pages Printed',
      'Notes',
    ];

    const rows = usages.map((u) => [
      u.usageCode,
      `"${u.branchName}"`,
      `"${u.printerName}"`,
      `"${u.cartridgeModel}"`,
      u.cartridgeColor,
      u.quantity,
      u.installedDate,
      `"${u.installedBy}"`,
      `"${u.reason}"`,
      u.estimatedPagesPrinted || '',
      `"${u.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cartridge_usage_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Branch Cartridge Consumption & Usage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit logs of cartridges installed in branch printers, replacement intervals, and wear rates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenLogUsage}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Cartridge Usage</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Total Cartridges Used
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalUsedUnits} units
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Across {usages.length} installation events
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Highest Usage Branch
          </span>
          <div className="text-lg font-bold text-slate-900 mt-1 line-clamp-1">
            {topBranch ? topBranch[0] : 'None'}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block font-mono">
            {topBranch ? `${topBranch[1]} cartridges replaced` : '0'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Avg Pages Printed per Unit
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {avgPages > 0 ? `${avgPages.toLocaleString()} pgs` : 'N/A'}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Derived from recorded lifecycle page counters
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch, printer device, technician, or cartridge..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Branch:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 font-medium">Reason:</span>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
              >
                <option value="ALL">All Reasons</option>
                <option value="Depleted">Depleted</option>
                <option value="Streaks or Print Defect">Streaks / Defect</option>
                <option value="Routine Scheduled Swap">Routine Swap</option>
                <option value="Printer Service">Printer Service</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Event Code & Date</th>
                <th className="py-3 px-4">Branch Location</th>
                <th className="py-3 px-4">Installed Printer Device</th>
                <th className="py-3 px-4">Cartridge Model</th>
                <th className="py-3 px-4 text-center">Qty Used</th>
                <th className="py-3 px-4">Swap Reason</th>
                <th className="py-3 px-4">Technician / Staff</th>
                <th className="py-3 px-4 text-right">Printed Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No usage records match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredUsages.map((usg) => (
                  <tr key={usg.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Code & Date */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          {usg.usageCode}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {usg.installedDate}
                        </span>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {usg.branchName}
                    </td>

                    {/* Printer */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={usg.printerName}>
                          {usg.printerName}
                        </span>
                      </div>
                    </td>

                    {/* Cartridge */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-medium text-slate-800 block">
                          {usg.cartridgeModel}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {usg.cartridgeColor}
                        </span>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-sm text-slate-900">
                      {usg.quantity}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">
                        {usg.reason}
                      </span>
                      {usg.notes && (
                        <span className="block text-[11px] text-slate-400 italic mt-0.5 truncate max-w-[180px]" title={usg.notes}>
                          "{usg.notes}"
                        </span>
                      )}
                    </td>

                    {/* Technician */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {usg.installedBy}
                    </td>

                    {/* Printed Pages */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {usg.estimatedPagesPrinted ? (
                        <span>{usg.estimatedPagesPrinted.toLocaleString()} pgs</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
