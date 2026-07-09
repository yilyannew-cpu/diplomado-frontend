import type { ApiUploadResult } from "@/lib/api/types/admin";
import { apiUpload } from "@/lib/api/client";

export const uploadsApi = {
  uploadImage(file: File): Promise<ApiUploadResult> {
    return apiUpload("/uploads/images", file, { auth: true });
  },
};
