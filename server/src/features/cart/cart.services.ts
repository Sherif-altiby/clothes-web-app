import { prisma } from '../../prisma';
import { ApiError } from '../../shared/utils/ApiError';

export const getOrCreateCart = async (userId: string) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  return cart;
};

export const addItemToCart = async (userId: string, productId: string, quantity: number = 1) => {
  const cart = await getOrCreateCart(userId);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const unitPrice = product.baseSalary + product.profit - (product.discount || 0);

  // Check if product is already in the cart
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
        unitPrice, // update price in case it changed
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        unitPrice,
      },
    });
  }

  return getOrCreateCart(userId);
};

export const updateCartItemQuantity = async (userId: string, productId: string, quantity: number) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (!existingItem) {
    throw new ApiError(404, "Item not found in cart");
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({
      where: { id: existingItem.id },
    });
  } else {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });
  }

  return getOrCreateCart(userId);
};

export const removeItemFromCart = async (userId: string, productId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  if (!existingItem) {
    throw new ApiError(404, "Item not found in cart");
  }

  await prisma.cartItem.delete({
    where: { id: existingItem.id },
  });

  return getOrCreateCart(userId);
};

export const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return getOrCreateCart(userId);
};
