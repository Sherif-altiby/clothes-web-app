import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../shared/utils/ApiError";
import { Lang } from "../../shared/middlewares/lang.middleware";
import { localizeCart } from "../../shared/utils/localize";
import { resolveProductPrices } from "../offers/offer-pricing";

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
  const prices = await resolveProductPrices(
    prisma,
    cart.items.map((item) => item.product)
  );

  const items = cart.items.map((item) => {
    const price = prices.get(item.productId);
    if (!price) throw new ApiError(500, "Could not calculate cart item price");
    return { ...item, ...price };
  });

  await Promise.all(
    cart.items.flatMap((item) => {
      const price = prices.get(item.productId);
      return price && price.unitPrice !== item.unitPrice
        ? [prisma.cartItem.update({ where: { id: item.id }, data: { unitPrice: price.unitPrice } })]
        : [];
    })
  );

  return localizeCart({ ...cart, items }, lang);
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

  if (product.counts < 1) {
    throw new ApiError(409, "This product is out of stock");
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if ((existingItem?.quantity ?? 0) + quantity > product.counts) {
    throw new ApiError(409, "Requested quantity exceeds available stock");
  }

  const price = (await resolveProductPrices(prisma, [product])).get(product.id);
  if (!price) throw new ApiError(500, "Could not calculate product price");

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
        unitPrice: price.unitPrice,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, unitPrice: price.unitPrice },
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
    include: { product: true },
  });

  if (!existingItem) {
    throw new ApiError(404, "Item not found in cart");
  }

  if (quantity > existingItem.product.counts) {
    throw new ApiError(409, "Requested quantity exceeds available stock");
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