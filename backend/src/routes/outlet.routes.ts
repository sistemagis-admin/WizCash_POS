import { Router } from 'express';
import {
  getOutlets,
  getOutletById,
  createOutlet,
  updateOutlet,
  deleteOutlet,
} from '../controllers/outlet.controller.js';

const router = Router();

router.get('/', getOutlets);
router.get('/:id', getOutletById);
router.post('/', createOutlet);
router.put('/:id', updateOutlet);
router.delete('/:id', deleteOutlet);

export default router;
