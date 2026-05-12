import type { Product } from "@/types";

export function getPrimaryImage(product: Product) {
  if (product.colors?.length && product.imagesByColor) {
    const firstColor = product.colors[0];
    const colorImages = product.imagesByColor[firstColor];
    if (colorImages?.length) {
      return colorImages[0];
    }
  }

  return product.images?.[0] ?? "/products/default.jpg";
}

export function getImagesForColor(product: Product, color?: string) {
  if (color && product.imagesByColor?.[color]?.length) {
    return product.imagesByColor[color];
  }

  if (product.images?.length) {
    return product.images;
  }

  const firstVariant = Object.values(product.imagesByColor ?? {})[0];
  return firstVariant ?? [];
}
