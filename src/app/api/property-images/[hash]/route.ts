import { db } from "@/lib/prisma";
import { apiError, HttpError } from "@/lib/http";
import { publicImageResponse } from "@/lib/object-storage";
import { contentKey, mediaBucket } from "@/lib/storage-references";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const { hash } = await params;
    if (!/^[a-f0-9]{64}$/.test(hash) || new URL(request.url).search)
      throw new HttpError(400, "Invalid image URL.");
    const key = contentKey(hash);
    // Never expose arbitrary bucket objects, PDFs, or unpublished-only photos.
    // Matching the suffix also supports rows inherited from a parent branch.
    const property = await db.property.findFirst({
      where: {
        publication: "published",
        image: { endsWith: `/${mediaBucket}/${key}` },
      },
      select: { id: true },
    });
    if (!property) throw new HttpError(404, "Photo not found.");
    return await publicImageResponse(key);
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
