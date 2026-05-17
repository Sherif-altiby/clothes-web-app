import { Router } from 'express';
import { authMiddleware } from '../../shared/middlewares/auth.middleware';
import {
  getCartController,
  addItemController,
  updateItemQuantityController,
  removeItemController,
  clearCartController,
} from './cart.controllers';

const router = Router();

// All cart routes require user to be authenticated
router.use(authMiddleware);

router.get('/', getCartController);
router.post('/', addItemController);
router.patch('/', updateItemQuantityController);
router.delete('/:productId', removeItemController);
router.delete('/', clearCartController);

export default router;
