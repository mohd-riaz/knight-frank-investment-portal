import { documentResponse } from "@/lib/object-storage";
import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { apiError, HttpError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in again.");
    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id, publication: "published" },
      select: {
        confidential: true,
        memorandumKey: true,
        memorandumSample: true,
      },
    });
    if (!property) throw new HttpError(404, "Opportunity not found.");
    if (
      property.confidential &&
      !(await db.investmentRequest.findFirst({
        where: {
          propertyId: id,
          userId: user.id,
          kind: "access",
          status: "approved",
        },
      }))
    )
      throw new HttpError(
        403,
        "Request access to this confidential memorandum first.",
      );

    if (!property.memorandumKey)
      throw new HttpError(
        404,
        "No memorandum is attached to this opportunity.",
      );
    return await documentResponse(
      property.memorandumKey,
      property.memorandumSample,
    );
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
