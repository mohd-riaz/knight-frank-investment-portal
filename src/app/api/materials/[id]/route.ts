import { currentUser } from "@/lib/session";
import { db } from "@/lib/prisma";
import { apiError, HttpError } from "@/lib/http";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await currentUser();
    if (!user) throw new HttpError(401, "Please sign in.");
    const file = await db.material.findUnique({
      where: { id: (await params).id },
      include: { property: true },
    });
    if (!file) throw new HttpError(404, "File not found.");
    const staff = ["owner", "admin"].includes(user.role || "");
    if (
      !staff &&
      (file.property.publication !== "published" ||
        (file.kind === "im" &&
          file.property.confidential &&
          !(await db.investmentRequest.findFirst({
            where: {
              userId: user.id,
              propertyId: file.propertyId,
              kind: "access",
              status: "approved",
            },
          }))))
    )
      throw new HttpError(403, "Access is restricted.");
    return new Response(new Uint8Array(file.bytes), {
      headers: {
        "Content-Type": file.mime,
        "Cache-Control": "private, no-store",
        "Content-Disposition":
          file.kind === "im"
            ? `attachment; filename="investment-memorandum.pdf"`
            : "inline",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
