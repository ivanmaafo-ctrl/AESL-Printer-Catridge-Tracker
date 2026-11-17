import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  Building2,
  Package,
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Branch Deliveries & Dispatch Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Documented chain of custody: where each cartridge was sent, carrier tracking, and branch receipt
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
            onClick={onOpenDispatch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Dispatch</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Total Dispatches Recorded
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {dispatches.length} shipments
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {totalDelivered + totalInTransit} total units handled
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            En Route / In Transit
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {totalInTransit} units
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Awaiting branch receiving confirmation
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
            Confirmed Delivered
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {totalDelivered} units
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Available as on-hand reserve in branch supply closets
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
              placeholder="Search branch name, cartridge, tracking number, or dispatch code..."
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
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('IN_TRANSIT')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === 'IN_TRANSIT' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                In Transit ({dispatches.filter((d) => d.status === 'In Transit').length})
              </button>
              <button
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  statusFilter === 'DELIVERED' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Delivered
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatches Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
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
            <tbody className="divide-y divide-slate-100">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No dispatches match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredDispatches.map((dsp) => {
                  const isInTransit = dsp.status === 'In Transit' || dsp.status === 'Pending';

                  return (
                    <tr key={dsp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code & Date */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-mono font-bold text-slate-900 block text-xs">
                            {dsp.dispatchCode}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {dsp.dispatchDate}
                          </span>
                        </div>
                      </td>

                      {/* Destination Branch */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {dsp.branchName}
                        </span>
                      </td>

                      {/* Cartridge */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-slate-800 block">
                            {dsp.cartridgeModel}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {dsp.cartridgeColor}
                          </span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums font-bold text-sm text-slate-900">
                        {dsp.quantity}
                      </td>

                      {/* Carrier & Tracking */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-slate-700 block">
                            {dsp.carrier}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {dsp.trackingNumber}
                          </span>
                        </div>
                      </td>

                      {/* Personnel */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="text-[11px]">
                          <div>From: {dsp.dispatchedBy}</div>
                          {dsp.receivedBy && (
                            <div className="text-emerald-700 font-medium">
                              Recv: {dsp.receivedBy} ({dsp.receivedDate})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                            dsp.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {dsp.status === 'Delivered' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{dsp.status}</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {isInTransit ? (
                          <button
                            onClick={() => {
                              setReceivingModalDispatch(dsp);
                              setReceivedByName('Branch Staff');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Confirm Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">
              Confirm Delivery at Branch
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mark {receivingModalDispatch.quantity} units of {receivingModalDispatch.cartridgeModel} as received by {receivingModalDispatch.branchName}.
            </p>

            <form onSubmit={handleConfirmDelivery} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Received By (Branch Staff / Manager Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={receivedByName}
                  onChange={(e) => setReceivedByName(e.target.value)}
                  required
                  placeholder="e.g. Elena Rostova (Branch Mgr)"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReceivingModalDispatch(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
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
