import { currentUser } from "@/lib/session";
import { db } from "@/lib/prisma";
import { apiError, HttpError } from "@/lib/http";
import { imageResponse } from "@/lib/object-storage";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const property = await db.property.findUnique({
      where: { id: (await params).id },
      select: { image: true, publication: true },
    });
    if (!property) throw new HttpError(404, "Opportunity not found.");
    if (
      property.publication !== "published" &&
      !["owner", "admin"].includes(user.role || "")
    )
      throw new HttpError(403, "Access is restricted.");
    return await imageResponse(property.image);
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
