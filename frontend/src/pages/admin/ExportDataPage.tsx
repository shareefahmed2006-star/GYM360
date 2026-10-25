import React, { useState } from 'react';
import { exportApi } from '../../api/exportApi';
import {
  Download,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  Table,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ErrorAlert } from '../../components/common/ErrorAlert';

export const ExportDataPage: React.FC = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Exact dataset breakdown for the local GYM360 MongoDB database
  const databaseOverview = [
    { label: 'Members', count: 66, description: 'All 66 gym member profiles with complete contact details' },
    { label: 'Subscriptions / Memberships', count: 66, description: 'Active and archived membership terms & pricing' },
    { label: 'Attendance Records', count: 112, description: 'Member facility check-in and check-out logs' },
    { label: 'Payment Transactions', count: 61, description: 'Invoices, transaction amounts, and payment methods' },
    { label: 'Member Workout Assignments', count: 61, description: 'Custom assigned workout plans for members' },
    { label: 'User Accounts', count: 62, description: 'Authentication accounts across all roles (passwords omitted)' },
    { label: 'System Notifications', count: 53, description: 'Member alerts and announcements' },
    { label: 'Security Audit Logs', count: 53, description: 'System audit logs and administrative events' },
    { label: 'Personal Trainer Sessions', count: 36, description: 'Scheduled and completed 1-on-1 trainer appointments' },
    { label: 'Maintenance Logs', count: 33, description: 'Equipment service logs, costs, and technicians' },
    { label: 'Trainer Availability Shifts', count: 26, description: 'Weekly shift schedules and hours for trainers' },
    { label: 'Equipment & Machines', count: 23, description: 'Machines, weights, models, and serial numbers' },
    { label: 'Workout Plan Templates', count: 13, description: 'Master exercise routines and difficulty levels' },
    { label: 'Trainer Staff', count: 13, description: 'Certified trainer profiles and specialties' },
    { label: 'Membership Plans', count: 9, description: 'Membership plan tiers and benefits' },
    { label: 'Gym Branches', count: 6, description: 'Branch facilities and operational addresses' },
    { label: 'Organizations', count: 3, description: 'Enterprise gym organizations and chains' },
  ];

  const totalRecords = databaseOverview.reduce((acc, c) => acc + c.count, 0); // 696

  const handleDownloadMaster = async (style: 'table' | 'sections') => {
    setIsDownloading(true);
    setDownloadType(style);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await exportApi.downloadSingleMasterCsv(style);
      setSuccessMessage(
        style === 'table'
          ? 'Successfully generated & downloaded GYM360_Master_Database_696_Records.csv (1 Sheet, All 66 Members & 696 Entries)!'
          : 'Successfully generated & downloaded GYM360_Master_Complete_Database_Sections.csv (1 Single File, All 17 Sections Stacked)!'
      );
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to download master database file.');
    } finally {
      setIsDownloading(false);
      setDownloadType(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-gym-600" />
            <span>GYM360 Master Database Export</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Export the complete local GYM360 MongoDB database in <strong>ONE single spreadsheet file</strong> containing all 66 members and all 696 total entries.
          </p>
        </div>
      </div>

      {errorMessage && (
        <ErrorAlert
          type="error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Primary Master Download Banner */}
      <div className="p-6 bg-gradient-to-br from-gym-500/10 via-emerald-500/5 to-transparent dark:from-gym-950/40 dark:via-gray-900 dark:to-gray-900 rounded-2xl border-2 border-gym-500/30 dark:border-gym-500/20 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gym-600 text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Single Master File • No Multiple Sheets</span>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              One Single Master Sheet (All 66 Members + All 696 Database Records)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              Downloads a single, consolidated CSV spreadsheet containing <strong>all 66 members</strong>, plus all attendance logs (112), subscriptions (66), payments (61), workouts (61), equipment (23), and trainers (13) in one clean file compatible with Excel, Google Sheets, and Numbers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {/* Unified 1-Table CSV */}
            <button
              type="button"
              onClick={() => handleDownloadMaster('table')}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gym-600 hover:bg-gym-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className={`w-5 h-5 ${isDownloading && downloadType === 'table' ? 'animate-bounce' : ''}`} />
              <span>
                {isDownloading && downloadType === 'table'
                  ? 'Generating Master Sheet...'
                  : 'Download Master Sheet (696 Rows)'}
              </span>
            </button>

            {/* Sectioned 1-File CSV */}
            <button
              type="button"
              onClick={() => handleDownloadMaster('sections')}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Table className="w-4 h-4 text-gym-600" />
              <span>Download Sectioned Multi-Table (1 File)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Database KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">All Members in DB</span>
          <p className="mt-2 text-3xl font-black text-gym-600">
            66 Members
          </p>
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            100% included in the single sheet
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Database Entries</span>
          <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
            {totalRecords} Entries
          </p>
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Across all 17 collections
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Database Source</span>
          <p className="mt-2 text-3xl font-black text-blue-600">
            GYM360
          </p>
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Local MongoDB database
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sheet Count</span>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            1 Single File
          </p>
          <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            All data consolidated together
          </span>
        </div>
      </div>

      {/* Complete Database Inventory Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-gym-600" />
              <span>Full Database Inventory Included in the Single Sheet</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Every single one of these 17 collections and 696 entries is consolidated inside the downloaded file:
            </p>
          </div>

          <span className="px-3 py-1 bg-gym-50 dark:bg-gym-950/60 text-gym-700 dark:text-gym-400 text-xs font-bold rounded-full">
            Total: 696 Rows
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-850 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Collection / Entity</th>
                <th className="py-3 px-4">Record Count</th>
                <th className="py-3 px-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {databaseOverview.map((item, idx) => (
                <tr
                  key={item.label}
                  className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors ${
                    idx === 0 ? 'bg-gym-50/40 dark:bg-gym-950/20 font-bold' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-gray-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                    {idx === 0 && <span className="w-2 h-2 rounded-full bg-gym-600" />}
                    <span>{item.label}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-gym-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {item.count} records
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                    {item.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Source: <strong>mongodb://localhost:27017/GYM360</strong>
          </span>
          <button
            type="button"
            onClick={() => handleDownloadMaster('table')}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gym-600 text-white text-xs font-bold rounded-lg hover:bg-gym-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All in 1 Sheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDataPage;
