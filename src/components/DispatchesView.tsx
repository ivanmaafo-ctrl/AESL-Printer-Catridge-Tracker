import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
} from 'lucide-react';
import { DispatchRecord } from '../types/inventory';

interface DispatchesViewProps {
  onOpenDispatch: () => void;
}

export const DispatchesView: React.FC<DispatchesViewProps> = ({ onOpenDispatch }) => {
  const { dispatches, markDispatchDelivered, branches } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_TRANSIT' | 'DELIVERED'>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [receivingModalDispatch, setReceivingModalDispatch] = useState<DispatchRecord | null>(null);
  const [receivedByName, setReceivedByName] = useState('Branch Staff Member');

  const filteredDispatches = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return dispatches.filter((d) => {
      const matchesSearch =
        d.branchName.toLowerCase().includes(q) ||
        d.cartridgeModel.toLowerCase().includes(q) ||
        d.trackingNumber.toLowerCase().includes(q) ||
        d.dispatchCode.toLowerCase().includes(q) ||
        d.carrier.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'IN_TRANSIT'
          ? d.status === 'In Transit' || d.status === 'Pending'
          : d.status === 'Delivered';

      const matchesBranch = branchFilter === 'ALL' || d.branchId === branchFilter;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [dispatches, searchQuery, statusFilter, branchFilter]);

  const totalDelivered = dispatches
    .filter((d) => d.status === 'Delivered')
    .reduce((sum, d) => sum + d.quantity, 0);

  const totalInTransit = dispatches
    .filter((d) => d.status === 'In Transit' || d.status === 'Pending')
    .reduce((sum, d) => sum + d.quantity, 0);

  const inTransitCount = dispatches.filter(
    (d) => d.status === 'In Transit' || d.status === 'Pending'
  ).length;

  const handleConfirmDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (receivingModalDispatch) {
      markDispatchDelivered(receivingModalDispatch.id, receivedByName.trim() || 'Branch Manager');
      setReceivingModalDispatch(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Dispatch Code',
      'Branch Name',
      'Cartridge Model',
      'Color',
      'Quantity',
      'Dispatch Date',
      'Carrier',
      'Tracking Number',
      'Dispatched By',
      'Received By',
      'Received Date',
      'Status',
    ];

    const rows = dispatches.map((d) => [
      d.dispatchCode,
      `"${d.branchName}"`,
      `"${d.cartridgeModel}"`,
      d.cartridgeColor,
      d.quantity,
      d.dispatchDate,
      `"${d.carrier}"`,
      `"${d.trackingNumber}"`,
      `"${d.dispatchedBy}"`,
      `"${d.receivedBy || ''}"`,
      d.receivedDate || '',
      d.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cartridge_dispatches_${new Date().toISOString().slice(0, 10)}.csv`);
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
            Deliveries to Branches
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1.5">
            Track toners sent from central store and confirm when offices receive them.
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
            onClick={onOpenDispatch}
            className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-xl hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Send Toner</span>
          </button>
        </div>
      </header>

      {/* 3 Calm Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0D131F] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">
            Total Deliveries
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-[#0B0F17] dark:text-white">
              {dispatches.length}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              shipments ({totalDelivered + totalInTransit} units)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D131F] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">
            On the Way
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {totalInTransit}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">units awaiting receipt</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D131F] p-5 rounded-2xl border border-slate-200 dark:border-white/10">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 block">
            Delivered
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold tabular-nums text-blue-700 dark:text-sky-400">
              {totalDelivered}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300">units confirmed</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-[#0D131F] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search office, toner model, or tracking number..."
              className="w-full min-h-[46px] pl-11 pr-4 py-2.5 text-base bg-slate-50 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-3 sm:inline-flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-sm font-semibold shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('IN_TRANSIT')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'IN_TRANSIT'
                  ? 'bg-white dark:bg-amber-400 text-amber-900 dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              In Transit ({inTransitCount})
            </button>
            <button
              onClick={() => setStatusFilter('DELIVERED')}
              className={`min-h-[40px] px-4 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'DELIVERED'
                  ? 'bg-white dark:bg-sky-400 text-blue-900 dark:text-[#06090F] shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Delivered
            </button>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium">Office:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="min-h-[40px] px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#070B12] text-[#0B0F17] dark:text-slate-100 border border-slate-300 dark:border-white/15 rounded-xl focus:outline-none max-w-full"
          >
            <option value="ALL">All Offices & Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Deliveries List */}
      <div className="bg-white dark:bg-[#0D131F] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-white/10">
          {filteredDispatches.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-600 dark:text-slate-300 text-sm">
              <Truck className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-[#0B0F17] dark:text-white">No deliveries match your search.</p>
            </div>
          ) : (
            filteredDispatches.map((dsp) => {
              const isInTransit = dsp.status === 'In Transit' || dsp.status === 'Pending';

              return (
                <div key={dsp.id} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                        {dsp.dispatchCode} · {dsp.dispatchDate}
                      </div>
                      <h3 className="text-base font-bold text-[#0B0F17] dark:text-white mt-0.5">
                        {dsp.branchName}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold shrink-0 ${
                        dsp.status === 'Delivered'
                          ? 'text-blue-700 dark:text-sky-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {dsp.status === 'Delivered' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>{dsp.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-white/[0.03] rounded-xl px-3.5 py-2.5">
                    <div className="min-w-0">
                      <span className="font-semibold text-[#0B0F17] dark:text-white block truncate">
                        {dsp.cartridgeModel}
                      </span>
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {dsp.cartridgeColor} · {dsp.carrier}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-lg text-[#0B0F17] dark:text-white shrink-0 ml-3">
                      {dsp.quantity}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono">Tracking: {dsp.trackingNumber}</span>
                    <span>Sent by {dsp.dispatchedBy}</span>
                  </div>

                  {dsp.receivedBy && (
                    <div className="text-xs font-semibold text-blue-700 dark:text-sky-400">
                      Received by {dsp.receivedBy} ({dsp.receivedDate})
                    </div>
                  )}

                  {isInTransit && (
                    <button
                      onClick={() => {
                        setReceivingModalDispatch(dsp);
                        setReceivedByName('Branch Staff');
                      }}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#0B0F17] dark:text-[#06090F] bg-blue-50 dark:bg-sky-400 hover:bg-blue-100 rounded-xl border border-blue-200 dark:border-transparent transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Received</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-5">Date & Ref</th>
                <th className="py-3.5 px-5">Destination</th>
                <th className="py-3.5 px-5">Toner</th>
                <th className="py-3.5 px-5 text-center">Qty</th>
                <th className="py-3.5 px-5">Delivery Info</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-600 dark:text-slate-300">
                    <Truck className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-[#0B0F17] dark:text-white">No deliveries match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((dsp) => {
                  const isInTransit = dsp.status === 'In Transit' || dsp.status === 'Pending';

                  return (
                    <tr key={dsp.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="font-semibold text-[#0B0F17] dark:text-white block tabular-nums">
                          {dsp.dispatchDate}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">
                          {dsp.dispatchCode}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-bold text-[#0B0F17] dark:text-white block">
                          {dsp.branchName}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          Sent by {dsp.dispatchedBy}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {dsp.cartridgeModel}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 text-xs">
                          {dsp.cartridgeColor}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-center font-mono tabular-nums font-bold text-base text-[#0B0F17] dark:text-white">
                        {dsp.quantity}
                      </td>

                      <td className="py-4 px-5">
                        <span className="font-medium text-slate-800 dark:text-slate-200 block">
                          {dsp.carrier}
                        </span>
                        <span className="font-mono text-slate-600 dark:text-slate-300 text-xs">
                          {dsp.trackingNumber}
                        </span>
                        {dsp.receivedBy && (
                          <div className="text-blue-700 dark:text-sky-400 text-xs font-medium mt-0.5">
                            Received by {dsp.receivedBy}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                            dsp.status === 'Delivered'
                              ? 'text-blue-700 dark:text-sky-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {dsp.status === 'Delivered' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          <span>{dsp.status}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        {isInTransit ? (
                          <button
                            onClick={() => {
                              setReceivingModalDispatch(dsp);
                              setReceivedByName('Branch Staff');
                            }}
                            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#0B0F17] dark:text-[#06090F] bg-blue-50 dark:bg-sky-400 hover:bg-blue-100 dark:hover:bg-sky-300 rounded-xl border border-blue-200 dark:border-transparent transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Receipt</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Confirm Branch Receipt */}
      {receivingModalDispatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-[#0D1420] rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-white/15 w-full max-w-md p-6 pb-safe">
            <h3 className="text-lg font-bold text-[#0B0F17] dark:text-white">
              Confirm Delivery at Office
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
              Mark {receivingModalDispatch.quantity} units of {receivingModalDispatch.cartridgeModel} as received by {receivingModalDispatch.branchName}.
            </p>

            <form onSubmit={handleConfirmDelivery} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Received By (Staff Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  required
                  placeholder="e.g. Samuel Mensah"
                  className="w-full min-h-[46px] px-3.5 py-2.5 text-base bg-slate-50 dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setReceivingModalDispatch(null)}
                  className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-xl cursor-pointer"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
