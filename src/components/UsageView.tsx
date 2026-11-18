import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Send,
  Plus,
  Search,
  Building2,
  Printer,
  Download,
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

  const pagesRecorded = usages.filter((u) => u.estimatedPagesPrinted && u.estimatedPagesPrinted > 0);
  const avgPages = pagesRecorded.length > 0
    ? Math.round(
        pagesRecorded.reduce((sum, u) => sum + (u.estimatedPagesPrinted || 0), 0) /
          pagesRecorded.length
      )
    : 0;

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
    <div className="space-y-5 sm:space-y-6">
      {/* Modern Blue / Moving Dark Gradient Header */}
      <section className="bg-blue-hero rounded-3xl p-4 sm:p-8 border border-blue-200/70 dark:border-blue-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div>
          <div className="text-xs font-medium text-blue-950/75 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-[#0B0F17] dark:text-white">Consumption Audit</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{usages.length} Events</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-1.5">
            Branch Cartridge Consumption & Usage
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Audit logs of cartridges installed in branch printers, replacement intervals, and wear rates.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleExportCSV}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenLogUsage}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Log Usage</span>
          </button>
        </div>
      </section>

      {/* Bento Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Total Cartridges Used
          </span>
          <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-[#0B0F17] dark:text-white mt-1.5 sm:mt-2">
            {totalUsedUnits} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">units</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Across {usages.length} installation events
          </span>
        </div>

        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Highest Usage Branch
          </span>
          <div className="text-base sm:text-xl font-bold text-[#0B0F17] dark:text-white mt-1.5 sm:mt-2 line-clamp-1">
            {topBranch ? topBranch[0] : 'None'}
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 block font-mono">
            {topBranch ? `${topBranch[1]} swapped` : '0 events'}
          </span>
        </div>

        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Avg Pages / Unit
          </span>
          <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-[#0B0F17] dark:text-white mt-1.5 sm:mt-2">
            {avgPages > 0 ? avgPages.toLocaleString() : 'N/A'} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">{avgPages > 0 ? 'pgs' : ''}</span>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            From lifecycle counters
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch, printer, technician, or cartridge..."
              className="w-full min-h-[42px] pl-10 pr-3 py-2 text-base sm:text-sm bg-white dark:bg-[#0B111B] border border-slate-200 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Branch:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full min-w-0 min-h-[40px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-base sm:text-xs bg-white dark:bg-[#0B111B] text-[#0B0F17] dark:text-slate-100 border border-slate-200 dark:border-white/15 rounded-xl focus:outline-none truncate"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Reason:</span>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="w-full min-w-0 min-h-[40px] sm:min-h-0 px-2.5 py-2 sm:py-1.5 text-base sm:text-xs bg-white dark:bg-[#0B111B] text-[#0B0F17] dark:text-slate-100 border border-slate-200 dark:border-white/15 rounded-xl focus:outline-none truncate"
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

      {/* Usage History */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        {filteredUsages.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-500 dark:text-slate-400">
            <Send className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              No usage records match your search.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
              {filteredUsages.map((usg) => (
                <div key={usg.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {usg.usageCode} · {usg.installedDate}
                      </div>
                      <div className="text-sm font-bold text-[#0B0F17] dark:text-white mt-0.5 truncate">
                        {usg.branchName}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums text-xs font-bold text-blue-700 dark:text-sky-400">
                      {usg.quantity} unit{usg.quantity !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{usg.printerName}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F6F8FC] dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 text-xs flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#0B0F17] dark:text-white block truncate">
                        {usg.cartridgeModel}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {usg.cartridgeColor} · {usg.reason}
                      </span>
                    </div>
                    {usg.estimatedPagesPrinted ? (
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                        {usg.estimatedPagesPrinted.toLocaleString()} pgs
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">Tech: {usg.installedBy}</span>
                    {usg.notes && (
                      <span className="italic truncate max-w-[55%]">&ldquo;{usg.notes}&rdquo;</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
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
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredUsages.map((usg) => (
                    <tr key={usg.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-mono font-bold text-[#0B0F17] dark:text-white block text-xs">
                            {usg.usageCode}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {usg.installedDate}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#0B0F17] dark:text-white">
                        {usg.branchName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Printer className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate max-w-[200px]" title={usg.printerName}>
                            {usg.printerName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {usg.cartridgeModel}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {usg.cartridgeColor}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-sm text-[#0B0F17] dark:text-white">
                        {usg.quantity}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {usg.reason}
                        </span>
                        {usg.notes && (
                          <span className="block text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5 truncate max-w-[180px]" title={usg.notes}>
                            &ldquo;{usg.notes}&rdquo;
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {usg.installedBy}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                        {usg.estimatedPagesPrinted ? (
                          <span>{usg.estimatedPagesPrinted.toLocaleString()} pgs</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
