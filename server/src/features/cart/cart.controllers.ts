import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ApiError } from '../../shared/utils/ApiError';
import {
  getOrCreateCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
} from './cart.services';

export const getCartController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const cart = await getOrCreateCart(userId);

  res.status(200).json({ success: true, data: cart });
});

export const addItemController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { productId, quantity } = req.body || {};

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const parsedQuantity = quantity ? parseInt(quantity, 10) : 1;
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    throw new ApiError(400, 'Quantity must be a positive integer');
  }

  const cart = await addItemToCart(userId, productId, parsedQuantity);

  res.status(200).json({ success: true, data: cart });
});

export const updateItemQuantityController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { productId, quantity } = req.body || {};

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  if (quantity === undefined) {
    throw new ApiError(400, 'Quantity is required');
  }

  const parsedQuantity = parseInt(quantity, 10);
  if (isNaN(parsedQuantity)) {
    throw new ApiError(400, 'Quantity must be a valid integer');
  }

  const cart = await updateCartItemQuantity(userId, productId, parsedQuantity);

  res.status(200).json({ success: true, data: cart });
});

export const removeItemController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;
  const { productId } = req.params as { productId: string };

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const cart = await removeItemFromCart(userId, productId);

  res.status(200).json({ success: true, data: cart });
});

export const clearCartController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const cart = await clearCart(userId);

  res.status(200).json({ success: true, data: cart });
});
