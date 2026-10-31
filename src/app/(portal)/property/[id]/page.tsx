import { DetailScreen } from "@/components/portal/screens";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  if (!(await db.property.findUnique({ where: { id }, select: { id: true } })))
    notFound();
  return <DetailScreen />;
}
