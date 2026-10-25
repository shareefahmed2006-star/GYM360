import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  getCollectionsSummary,
  exportCollectionToCSV,
  exportAllData,
  exportSingleMasterCSV,
} from '../controllers/exportController';

const router = Router();

// Protect all export routes
router.use(authenticate);

router.get('/collections', getCollectionsSummary);
router.get('/single-master-csv', exportSingleMasterCSV);
router.get('/csv/:collectionName', exportCollectionToCSV);
router.get('/all-data', exportAllData);

export default router;
