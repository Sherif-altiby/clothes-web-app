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
  const cart = await getOrCreateCart(req.user.userId, req.lang);

  res.status(200).json({ success: true, data: cart });
});

export const addItemController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { productId, quantity } = req.body || {};

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const parsedQuantity = quantity ? parseInt(quantity, 10) : 1;
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    throw new ApiError(400, 'Quantity must be a positive integer');
  }

  const cart = await addItemToCart(req.user.userId, req.lang, productId, parsedQuantity);

  res.status(200).json({ success: true, data: cart });
});

export const updateItemQuantityController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { productId, quantity } = req.body || {};

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

  const cart = await updateCartItemQuantity(req.user.userId, req.lang, productId, parsedQuantity);

  res.status(200).json({ success: true, data: cart });
});

export const removeItemController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { productId } = req.params as { productId: string };

  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }

  const cart = await removeItemFromCart(req.user.userId, req.lang, productId);

  res.status(200).json({ success: true, data: cart });
});

export const clearCartController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const cart = await clearCart(req.user.userId, req.lang);

  res.status(200).json({ success: true, data: cart });
});