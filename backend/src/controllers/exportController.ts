import { Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { dbConnection } from '../config/database';
import { AuthorizedRequest } from '../types/authorization';
import { AppError } from '../middleware/errorHandler';

// Collections available for export
const EXPORTABLE_COLLECTIONS: { id: string; name: string; label: string; description: string }[] = [
  { id: 'members', name: 'members', label: 'Members', description: 'Member profiles, contact info, and statuses' },
  { id: 'branches', name: 'branches', label: 'Branches', description: 'Gym branches, operating hours, and locations' },
  { id: 'membershipPlans', name: 'membershipPlans', label: 'Membership Plans', description: 'Pricing tiers, durations, and benefits' },
  { id: 'memberships', name: 'memberships', label: 'Subscriptions', description: 'Active and expired member subscriptions' },
  { id: 'payments', name: 'payments', label: 'Payments', description: 'Invoices, transaction amounts, and statuses' },
  { id: 'attendance', name: 'attendance', label: 'Attendance Records', description: 'Member check-in/check-out logs' },
  { id: 'trainers', name: 'trainers', label: 'Trainers', description: 'Trainer staff profiles and specialties' },
  { id: 'trainerSessions', name: 'trainerSessions', label: 'Trainer Sessions', description: 'Personal training appointments' },
  { id: 'trainerAvailability', name: 'trainerAvailability', label: 'Trainer Shifts', description: 'Trainer weekly availability and shifts' },
  { id: 'equipment', name: 'equipment', label: 'Equipment', description: 'Gym machines, weights, and serial numbers' },
  { id: 'maintenanceLogs', name: 'maintenanceLogs', label: 'Maintenance Logs', description: 'Service records and repairs' },
  { id: 'workoutPlans', name: 'workoutPlans', label: 'Workout Plans', description: 'Master exercise routines and workout templates' },
  { id: 'memberWorkoutPlans', name: 'memberWorkoutPlans', label: 'Assigned Workouts', description: 'Member customized workout assignments' },
  { id: 'notifications', name: 'notifications', label: 'Notifications', description: 'Broadcast messages and member alerts' },
  { id: 'auditLogs', name: 'auditLogs', label: 'Audit Logs', description: 'System events and administrative actions' },
  { id: 'organizations', name: 'organizations', label: 'Organizations', description: 'Multi-tenant organizations and gym chains' },
  { id: 'Users', name: 'Users', label: 'User Accounts', description: 'Authentication accounts (credentials omitted)' },
];

/**
 * Converts an array of MongoDB documents into standard CSV format.
 */
function documentsToCSV(docs: any[]): string {
  if (!docs || docs.length === 0) {
    return '';
  }

  // 1. Collect all distinct column headers across all documents
  const headerSet = new Set<string>();
  for (const doc of docs) {
    for (const key of Object.keys(doc)) {
      // Omit sensitive authentication hashes from exports
      if (key === 'passwordHash' || key === 'resetPasswordToken') {
        continue;
      }
      headerSet.add(key);
    }
  }

  const headers = Array.from(headerSet);

  // 2. Format a single cell value for CSV escaping
  const formatCell = (val: any): string => {
    if (val === null || val === undefined) {
      return '';
    }
    if (val instanceof ObjectId) {
      return val.toHexString();
    }
    if (val instanceof Date) {
      return val.toISOString();
    }
    if (typeof val === 'object') {
      const str = JSON.stringify(val);
      return `"${str.replace(/"/g, '""')}"`;
    }
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // 3. Build CSV lines
  const csvLines: string[] = [];
  csvLines.push(headers.map((h) => (h.includes(',') ? `"${h}"` : h)).join(','));

  for (const doc of docs) {
    const row = headers.map((header) => formatCell(doc[header]));
    csvLines.push(row.join(','));
  }

  return csvLines.join('\r\n');
}

/**
 * GET /api/export/collections
 * Summary of all exportable collections with document counts.
 */
export const getCollectionsSummary = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const db = dbConnection.getDb();
    const userRole = req.user?.role;
    const userOrgId = req.user?.organizationId ? new ObjectId(req.user.organizationId) : null;

    const summary = await Promise.all(
      EXPORTABLE_COLLECTIONS.map(async (col) => {
        const totalCount = await db.collection(col.name).countDocuments();
        let orgCount = totalCount;
        if (userOrgId && col.name !== 'organizations') {
          orgCount = await db.collection(col.name).countDocuments({ organizationId: userOrgId });
        }
        return {
          id: col.id,
          name: col.name,
          label: col.label,
          description: col.description,
          totalCount,
          orgCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        totalCollections: summary.length,
        totalDocuments: summary.reduce((acc, c) => acc + c.totalCount, 0),
        collections: summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/csv/:collectionName
 * Download a specific collection as a CSV file.
 */
export const exportCollectionToCSV = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const collectionName = String(req.params.collectionName || '');
    const { scope } = req.query; // 'all' or 'tenant'

    const target = EXPORTABLE_COLLECTIONS.find(
      (c) => c.name.toLowerCase() === collectionName.toLowerCase()
    );

    if (!target) {
      throw new AppError(`Collection '${collectionName}' is not valid for export.`, 404);
    }

    const db = dbConnection.getDb();
    const query: any = {};

    // If scope is 'tenant' or non-admin, filter by organizationId
    if (scope !== 'all' || req.user?.role !== 'admin') {
      if (req.user?.organizationId && target.name !== 'organizations') {
        query.organizationId = new ObjectId(req.user.organizationId);
      }
    }

    const docs = await db.collection(target.name).find(query).toArray();
    const csvData = documentsToCSV(docs);

    const filename = `GYM360_${target.name}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/all-data
 * Returns JSON data for all collections for batch client-side export.
 */
export const exportAllData = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { scope } = req.query; // 'all' or 'tenant'
    const db = dbConnection.getDb();
    const userRole = req.user?.role;
    const userOrgId = req.user?.organizationId ? new ObjectId(req.user.organizationId) : null;

    const bundle: Record<string, { count: number; data: any[] }> = {};

    for (const col of EXPORTABLE_COLLECTIONS) {
      const query: any = {};
      if ((scope !== 'all' || userRole !== 'admin') && userOrgId && col.name !== 'organizations') {
        query.organizationId = userOrgId;
      }
      const rawDocs = await db.collection(col.name).find(query).toArray();
      // Sanitize passwords
      const sanitized = rawDocs.map((d: any) => {
        const { passwordHash, resetPasswordToken, ...safe } = d;
        return safe;
      });

      bundle[col.name] = {
        count: sanitized.length,
        data: sanitized,
      };
    }

    res.status(200).json({
      success: true,
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/export/single-master-csv
 * Exports the entire GYM360 database (all 66 members and all other 630 entries = 696 total records)
 * into ONE SINGLE CSV SHEET.
 */
export const exportSingleMasterCSV = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Read directly from the GYM360 database read-only
    const db = dbConnection.getClient().db('GYM360');
    const { style } = req.query; // 'sections' or 'table' (default)

    if (style === 'sections') {
      // 1. Stacked sections in ONE single CSV file
      const lines: string[] = [
        '# =========================================================================================',
        '# GYM360 COMPLETE LOCAL DATABASE EXPORT (SINGLE MASTER SPREADSHEET)',
        '# Database: GYM360 (mongodb://localhost:27017) | Total Collections: 17 | Total Records: 696',
        `# Generated: ${new Date().toISOString()}`,
        '# =========================================================================================',
        '',
      ];

      for (const col of EXPORTABLE_COLLECTIONS) {
        const rawDocs = await db.collection(col.name).find().toArray();
        lines.push(`### [COLLECTION: ${col.label.toUpperCase()}] (${rawDocs.length} Records) ###`);
        if (rawDocs.length > 0) {
          const csvSnippet = documentsToCSV(rawDocs);
          lines.push(csvSnippet);
        } else {
          lines.push('# (No records in this collection)');
        }
        lines.push('');
        lines.push('');
      }

      const csvContent = lines.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="GYM360_Master_Complete_Database_Sections.csv"`
      );
      res.status(200).send(csvContent);
      return;
    }

    // Default: Unified Consolidated Single Sheet (696 records)
    const masterHeaders = [
      'Record_No',
      'Entity_Type',
      'Record_ID',
      'Primary_Name_or_Title',
      'Email',
      'Phone',
      'Status',
      'Branch_ID',
      'Organization_ID',
      'Amount_or_Price',
      'Date_or_Timestamp',
      'Specific_Details',
    ];

    const escapeCell = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatDateSafe = (d: any): string => {
      if (!d) return '';
      try {
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? String(d) : parsed.toISOString();
      } catch {
        return String(d);
      }
    };

    const rows: string[] = [];
    rows.push(masterHeaders.join(','));

    let counter = 1;

    for (const col of EXPORTABLE_COLLECTIONS) {
      const docs = await db.collection(col.name).find().toArray();

      for (const doc of docs) {
        let name = '';
        const email = doc.email || '';
        const phone = doc.phone || '';
        let status = doc.status || '';
        const branchId = doc.branchId ? doc.branchId.toString() : '';
        const organizationId = doc.organizationId ? doc.organizationId.toString() : '';
        let amount = '';
        let dateVal = '';

        if (col.name === 'members' || col.name === 'trainers' || col.name === 'Users') {
          name = `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.name || '';
          if (doc.role) status = `${doc.role} (${doc.status || 'active'})`;
          dateVal = formatDateSafe(doc.createdAt || doc.dateOfBirth);
        } else if (col.name === 'equipment') {
          name = `${doc.name || ''} (${doc.category || ''})`;
          dateVal = formatDateSafe(doc.purchaseDate);
        } else if (col.name === 'payments') {
          name = `Invoice: ${doc.invoiceNumber || doc._id}`;
          amount = `${doc.currency || 'INR'} ${doc.amount || 0}`;
          dateVal = formatDateSafe(doc.transactionDate);
        } else if (col.name === 'memberships') {
          name = `Member Subscription: ${doc.memberId || ''}`;
          amount = doc.price ? `INR ${doc.price}` : '';
          dateVal = formatDateSafe(doc.startDate);
        } else if (col.name === 'attendance') {
          name = `Member Check-in: ${doc.memberId || ''}`;
          dateVal = formatDateSafe(doc.checkInTime);
        } else if (col.name === 'maintenanceLogs') {
          name = `Maintenance on Equip: ${doc.equipmentId || ''}`;
          amount = doc.cost ? `INR ${doc.cost}` : '';
          dateVal = formatDateSafe(doc.maintenanceDate);
        } else if (col.name === 'trainerSessions') {
          name = `Session: Trainer ${doc.trainerId || ''} -> Member ${doc.memberId || ''}`;
          dateVal = formatDateSafe(doc.startTime);
        } else {
          name = doc.name || doc.title || doc.action || col.label;
          dateVal = formatDateSafe(doc.createdAt || doc.timestamp);
          if (doc.price) amount = `INR ${doc.price}`;
        }

        const { passwordHash, resetPasswordToken, _id, ...remaining } = doc;
        const detailsJson = JSON.stringify(remaining);

        const row = [
          counter++,
          escapeCell(col.label),
          escapeCell(doc._id ? doc._id.toString() : ''),
          escapeCell(name),
          escapeCell(email),
          escapeCell(phone),
          escapeCell(status),
          escapeCell(branchId),
          escapeCell(organizationId),
          escapeCell(amount),
          escapeCell(dateVal),
          escapeCell(detailsJson),
        ];

        rows.push(row.join(','));
      }
    }

    const csvOutput = rows.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="GYM360_Master_Complete_Database_696_Records.csv"`
    );
    res.status(200).send(csvOutput);
  } catch (error) {
    next(error);
  }
};
