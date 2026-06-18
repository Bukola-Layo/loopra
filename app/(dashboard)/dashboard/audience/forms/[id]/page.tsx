import { redirect } from "next/navigation";

export default async function FormDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/forms/${id}`);
}
