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

router.use(authMiddleware);
 
router.get('/', getCartController);
router.post('/', addItemController);
router.patch('/', updateItemQuantityController);
router.delete('/:productId', removeItemController);
router.delete('/', clearCartController);

export default router;
