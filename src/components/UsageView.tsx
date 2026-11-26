import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Send,
  Plus,
  Search,
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
    const q = searchQuery.toLowerCase();
    return usages.filter((u) => {
      const matchesSearch =
        u.branchName.toLowerCase().includes(q) ||
        u.cartridgeModel.toLowerCase().includes(q) ||
        u.printerName.toLowerCase().includes(q) ||
        u.installedBy.toLowerCase().includes(q) ||
        u.usageCode.toLowerCase().includes(q);

      const matchesBranch = branchFilter === 'ALL' || u.branchId === branchFilter;
      const matchesReason = reasonFilter === 'ALL' || u.reason === reasonFilter;

      return matchesSearch && matchesBranch && matchesReason;
    });
  }, [usages, searchQuery, branchFilter, reasonFilter]);

  const pagesRecorded = usages.filter((u) => u.estimatedPagesPrinted && u.estimatedPagesPrinted > 0);
  const avgPages =
    pagesRecorded.length > 0
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
    <div className="space-y-7">
      {/* Clean Flat Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white">
            Printer Usage Log
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5">
            Record of toners installed into office and branch printers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-300 dark:border-white/15 rounded-xl hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenLogUsage}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Log Printer Swap</span>
          </button>
        </div>
      </header>

      {/* 3 Calm Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0D131F] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">
            Total Toners Used
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-[#0B0F17] dark:text-white">
              {totalUsedUnits}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              across {usages.length} swaps
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D131F] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">
            Highest Usage Office
          </span>
          <div className="text-xl font-display font-bold text-[#0B0F17] dark:text-white mt-2 truncate">
            {topBranch ? topBranch[0] : 'None yet'}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 block tabular-nums">
            {topBranch ? `${topBranch[1]} toners installed` : '0 swaps'}
          </span>
        </div>

        <div className="bg-white dark:bg-[#0D131F] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">
            Average Pages / Toner
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-[#0B0F17] dark:text-white">
              {avgPages > 0 ? avgPages.toLocaleString() : '—'}
            </span>
            {avgPages > 0 && <span className="text-sm text-slate-600 dark:text-slate-300">pages</span>}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-[#0D131F] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search office, printer, technician, or toner..."
            className="w-full min-h-[46px] pl-11 pr-4 py-2.5 text-base bg-slate-50 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Office:</span>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#070B12] text-[#0B0F17] dark:text-slate-100 border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none"
            >
              <option value="ALL">All Offices & Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Reason:</span>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#070B12] text-[#0B0F17] dark:text-slate-100 border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none"
            >
              <option value="ALL">All Reasons</option>
              <option value="Depleted">Depleted</option>
              <option value="Streaks or Print Defect">Streaks / Defect</option>
              <option value="Routine Scheduled Swap">Routine Swap</option>
              <option value="Printer Service">Printer Service</option>
            </select>
          </label>
        </div>
      </div>

      {/* Usage History */}
      <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {filteredUsages.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-600 dark:text-slate-300">
            <Send className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-base font-semibold text-[#0B0F17] dark:text-white">
              No usage records match your search.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile List */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-white/10">
              {filteredUsages.map((usg) => (
                <div key={usg.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        {usg.installedDate} · {usg.usageCode}
                      </div>
                      <div className="text-base font-bold text-[#0B0F17] dark:text-white mt-0.5">
                        {usg.branchName}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums text-sm font-bold text-blue-700 dark:text-sky-400">
                      {usg.quantity} used
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <Printer className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{usg.printerName}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] text-sm flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#0B0F17] dark:text-white block truncate">
                        {usg.cartridgeModel}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {usg.cartridgeColor} · {usg.reason}
                      </span>
                    </div>
                    {usg.estimatedPagesPrinted ? (
                      <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                        {usg.estimatedPagesPrinted.toLocaleString()} pgs
                      </span>
                    ) : null}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Installed by <span className="font-semibold">{usg.installedBy}</span>
                    {usg.notes && <span> · &ldquo;{usg.notes}&rdquo;</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-5">Date & Ref</th>
                    <th className="py-3.5 px-5">Office & Printer</th>
                    <th className="py-3.5 px-5">Toner</th>
                    <th className="py-3.5 px-5 text-center">Qty</th>
                    <th className="py-3.5 px-5">Reason</th>
                    <th className="py-3.5 px-5">Installed By</th>
                    <th className="py-3.5 px-5 text-right">Pages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                  {filteredUsages.map((usg) => (
                    <tr key={usg.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-semibold text-[#0B0F17] dark:text-white block tabular-nums">
                          {usg.installedDate}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">
                          {usg.usageCode}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-bold text-[#0B0F17] dark:text-white block">
                          {usg.branchName}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 block mt-0.5">
                          {usg.printerName}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {usg.cartridgeModel}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 text-xs">
                          {usg.cartridgeColor}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center font-mono tabular-nums font-bold text-base text-[#0B0F17] dark:text-white">
                        {usg.quantity}
                      </td>

                      <td className="py-4 px-5">
                        <span className="text-slate-800 dark:text-slate-200 font-medium block">
                          {usg.reason}
                        </span>
                        {usg.notes && (
                          <span className="block text-xs text-slate-500 dark:text-slate-400 italic mt-0.5 max-w-[200px] truncate" title={usg.notes}>
                            &ldquo;{usg.notes}&rdquo;
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-slate-700 dark:text-slate-200 font-medium">
                        {usg.installedBy}
                      </td>

                      <td className="py-4 px-5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {usg.estimatedPagesPrinted ? `${usg.estimatedPagesPrinted.toLocaleString()}` : '—'}
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
