export interface AdminCategory {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
}

export interface AdminProduct {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  baseSalary: number;
  profit: number;
  discount: number | null;
  images: string[];
  counts: number;
  categoryId: string;
  category: {
    id: string;
    titleEn: string;
    titleAr: string;
  };
  reviewSummary: {
    averageRating: number;
    totalReviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  totalItems: number;
  currentPage: number;
  limit: number;
  totalPages: number;
}

export interface ProductFormData {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  baseSalary: number;
  profit: number;
  discount: number;
  counts: number;
  categoryId: string;
  images: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const getCloudinaryPublicId = (imageUrl: string): string | undefined => {
  try {
    const url = new URL(imageUrl);
    const uploadIndex = url.pathname.indexOf("/image/upload/");
    if (
      uploadIndex < 0 ||
      (url.hostname !== "cloudinary.com" && !url.hostname.endsWith(".cloudinary.com"))
    ) {
      return undefined;
    }

    const uploadedPath = url.pathname.slice(uploadIndex + "/image/upload/".length);
    const segments = uploadedPath.split("/");
    const uploadsIndex = segments.indexOf("uploads");
    if (uploadsIndex < 0) return undefined;

    const publicId = segments.slice(uploadsIndex).join("/").replace(/\.[^/.]+$/, "");
    return /^uploads\/[\w/-]+$/.test(publicId) ? publicId : undefined;
  } catch {
    return undefined;
  }
};
