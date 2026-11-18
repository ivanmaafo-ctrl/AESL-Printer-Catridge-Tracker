import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Building2,
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
    return dispatches.filter((d) => {
      const matchesSearch =
        d.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.cartridgeModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.dispatchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.carrier.toLowerCase().includes(searchQuery.toLowerCase());

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
    <div className="space-y-6">
      {/* Modern Blue / Moving Dark Gradient Header */}
      <section className="bg-blue-hero rounded-3xl p-6 sm:p-8 border border-blue-200/70 dark:border-blue-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-medium text-blue-950/75 dark:text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-[#0B0F17] dark:text-white">Logistics Ledger</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{dispatches.length} Shipments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0F17] dark:text-white mt-1.5">
            Branch Deliveries & Dispatch Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Documented chain of custody: where each cartridge was sent, carrier tracking, and branch receipt confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#0B0F17] dark:text-white bg-white dark:bg-white/10 border border-slate-200/90 dark:border-white/15 rounded-full hover:bg-slate-50 dark:hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenDispatch}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 rounded-full hover:bg-slate-800 dark:hover:bg-sky-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>New Dispatch</span>
          </button>
        </div>
      </section>

      {/* Bento Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-5 rounded-2xl border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Total Dispatches Recorded
          </span>
          <div className="text-3xl font-semibold font-mono tabular-nums text-[#0B0F17] dark:text-white mt-2">
            {dispatches.length} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">shipments</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {totalDelivered + totalInTransit} total units handled
          </span>
        </div>

        <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-5 rounded-2xl border border-slate-200/70 dark:border-white/10">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            En Route / In Transit
          </span>
          <div className="text-3xl font-semibold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-2">
            {totalInTransit} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">units</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            Awaiting branch receiving confirmation
          </span>
        </div>

        <div className="bg-[#F3F8FF] dark:bg-blue-500/10 p-5 rounded-2xl border border-blue-200/70 dark:border-blue-500/20">
          <span className="text-xs font-semibold text-slate-600 dark:text-sky-300 block">
            Confirmed Delivered
          </span>
          <div className="text-3xl font-semibold font-mono tabular-nums text-blue-700 dark:text-sky-400 mt-2">
            {totalDelivered} <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400">units</span>
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-300 mt-1 block">
            Available as on-hand reserve in branch closets
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#F6F8FC] dark:bg-white/[0.04] dark:backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch name, cartridge, tracking number, or dispatch code..."
              className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-white dark:bg-[#0B111B] border border-slate-200 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Branch:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-[#0B111B] text-[#0B0F17] dark:text-slate-100 border border-slate-200 dark:border-white/15 rounded-xl focus:outline-none"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-slate-200/70 dark:bg-white/5 p-0.5 rounded-full text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-sky-400 text-[#0B0F17] dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('IN_TRANSIT')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'IN_TRANSIT'
                    ? 'bg-white dark:bg-amber-400 text-amber-900 dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                In Transit ({dispatches.filter((d) => d.status === 'In Transit').length})
              </button>
              <button
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-white dark:bg-sky-400 text-blue-900 dark:text-[#06090F] shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Delivered
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatches Ledger Table */}
      <div className="bg-white dark:bg-[#0B111B]/85 dark:backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F6F8FC] dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Code & Date</th>
                <th className="py-3 px-4">Destination Branch</th>
                <th className="py-3 px-4">Cartridge Model</th>
                <th className="py-3 px-4 text-center">Qty Sent</th>
                <th className="py-3 px-4">Carrier & Tracking</th>
                <th className="py-3 px-4">Personnel</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No dispatches match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((dsp) => {
                  const isInTransit = dsp.status === 'In Transit' || dsp.status === 'Pending';

                  return (
                    <tr key={dsp.id} className="hover:bg-[#F8FAFD] dark:hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-mono font-bold text-[#0B0F17] dark:text-white block text-xs">
                            {dsp.dispatchCode}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {dsp.dispatchDate}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#0B0F17] dark:text-white block">
                          {dsp.branchName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 block">
                            {dsp.cartridgeModel}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                            {dsp.cartridgeColor}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-sm text-[#0B0F17] dark:text-white">
                        {dsp.quantity}
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-slate-700 dark:text-slate-200 block">
                            {dsp.carrier}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                            {dsp.trackingNumber}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="text-[11px]">
                          <div>From: {dsp.dispatchedBy}</div>
                          {dsp.receivedBy && (
                            <div className="text-blue-700 dark:text-sky-400 font-medium">
                              Recv: {dsp.receivedBy} ({dsp.receivedDate})
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            dsp.status === 'Delivered'
                              ? 'text-blue-700 dark:text-sky-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {dsp.status === 'Delivered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{dsp.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isInTransit ? (
                          <button
                            onClick={() => {
                              setReceivingModalDispatch(dsp);
                              setReceivedByName('Branch Staff');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#0B0F17] dark:text-[#06090F] bg-[#E8F1FF] dark:bg-sky-400 hover:bg-blue-200 dark:hover:bg-sky-300 rounded-full border border-blue-200 dark:border-transparent transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Confirm Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D1420] rounded-2xl shadow-xl border border-slate-200 dark:border-white/15 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#0B0F17] dark:text-white">
              Confirm Delivery at Branch
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mark {receivingModalDispatch.quantity} units of {receivingModalDispatch.cartridgeModel} as received by {receivingModalDispatch.branchName}.
            </p>

            <form onSubmit={handleConfirmDelivery} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Received By (Branch Staff / Manager Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  required
                  placeholder="e.g. Samuel Mensah (Workshop Lead)"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#070B12] border border-slate-300 dark:border-white/15 rounded-xl text-[#0B0F17] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setReceivingModalDispatch(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white dark:text-[#06090F] bg-[#0B0F17] dark:bg-sky-400 hover:bg-slate-800 dark:hover:bg-sky-300 rounded-full cursor-pointer"
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
