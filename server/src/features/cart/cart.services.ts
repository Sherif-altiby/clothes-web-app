import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { Lang } from "../../shared/middlewares/lang.middleware";
import { localizeCart } from "../../shared/utils/localize";

const cartInclude = {
  items: { include: { product: true } },
} satisfies Prisma.CartInclude;

// Raw cart (both languages), used internally
const findOrCreateCart = (userId: string) =>
  prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: cartInclude,
  });

// Localized cart, returned to the client
export const getOrCreateCart = async (userId: string, lang: Lang) => {
  const cart = await findOrCreateCart(userId);
  return localizeCart(cart, lang);
};

export const addItemToCart = async (
  userId: string,
  lang: Lang,
  productId: string,
  quantity: number = 1
) => {
  const cart = await findOrCreateCart(userId);

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const unitPrice = product.baseSalary + product.profit - (product.discount || 0);

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
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
      data: { cartId: cart.id, productId, quantity, unitPrice },
    });
  }

  return getOrCreateCart(userId, lang);
};

export const updateCartItemQuantity = async (
  userId: string,
  lang: Lang,
  productId: string,
  quantity: number
) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (!existingItem) {
    throw new ApiError(404, "Item not found in cart");
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: existingItem.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });
  }

  return getOrCreateCart(userId, lang);
};

export const removeItemFromCart = async (userId: string, lang: Lang, productId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (!existingItem) {
    throw new ApiError(404, "Item not found in cart");
  }

  await prisma.cartItem.delete({ where: { id: existingItem.id } });

  return getOrCreateCart(userId, lang);
};

export const clearCart = async (userId: string, lang: Lang) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return getOrCreateCart(userId, lang);
};