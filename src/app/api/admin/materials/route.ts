import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/prisma";
import { apiError, assertSameOrigin, HttpError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await requireAdmin();
    if (Number(request.headers.get("content-length") || 0) > 12 * 1024 * 1024)
      throw new HttpError(413, "Upload a file smaller than 10 MB.");
    const form = await request.formData();
    const file = form.get("file");
    const propertyId = String(form.get("propertyId"));
    const kind = String(form.get("kind"));
    if (
      !(file instanceof File) ||
      file.size > 10 * 1024 * 1024 ||
      !file.size ||
      !["photo", "im"].includes(kind)
    )
      throw new HttpError(400, "Choose a photo or PDF smaller than 10 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime =
      bytes.subarray(0, 5).toString() === "%PDF-"
        ? "application/pdf"
        : bytes[0] === 255 && bytes[1] === 216
          ? "image/jpeg"
          : bytes
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            ? "image/png"
            : bytes.subarray(0, 4).toString() === "RIFF" &&
                bytes.subarray(8, 12).toString() === "WEBP"
              ? "image/webp"
              : "";
    if (kind === "im" ? mime !== "application/pdf" : !mime.startsWith("image/"))
      throw new HttpError(
        400,
        "Use a PDF memorandum or a JPG, PNG or WebP photo.",
      );
    const material = await db.$transaction(async (tx) => {
      if (kind === "im")
        await tx.material.deleteMany({ where: { propertyId, kind } });
      const result = await tx.material.create({
        data: { propertyId, kind, name: file.name.slice(0, 200), mime, bytes },
      });
      if (kind === "photo")
        await tx.property.update({
          where: { id: propertyId },
          data: { image: `/api/materials/${result.id}` },
        });
      return result;
    });
    return NextResponse.json({ id: material.id });
  } catch (error) {
    return apiError(error);
  }
}
