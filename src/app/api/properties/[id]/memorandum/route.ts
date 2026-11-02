import { readFile } from "node:fs/promises";
import path from "node:path";
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
      where: { id, publication:'published' },
      select: { confidential: true },
    });
    if (!property) throw new HttpError(404, "Opportunity not found.");
    if (property.confidential && !await db.investmentRequest.findFirst({where:{propertyId:id,userId:user.id,kind:'access',status:'approved'}}))
      throw new HttpError(
        403,
        "Request access to this confidential memorandum first.",
      );

    // A shared, clearly labelled sample stands in for uploaded IMs in the prototype.
    const material = await db.material.findFirst({where:{propertyId:id,kind:'im'},orderBy:{createdAt:'desc'}});
    const pdf = material?.bytes ?? await readFile(
      path.join(process.cwd(), "documents", "sample-investment-memorandum.pdf"),
    );
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="sample-investment-memorandum.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
