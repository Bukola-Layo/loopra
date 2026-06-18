import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicPageView } from "./public-page-view";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = await db.subscriberPage.findFirst({
    where: { slug, status: "published" },
    include: {
      workspace: { select: { name: true, logo: true } },
    },
  });

  if (!page) notFound();

  const settings = page.settings as Record<string, unknown> | null;

  return (
    <PublicPageView
      name={page.name}
      description={page.description}
      logo={page.logo}
      coverImage={page.coverImage}
      slug={page.slug}
      subscriberCount={page.subscriberCount}
      showSubscriberCount={page.showSubscriberCount}
      settings={settings}
      workspaceName={page.workspace.name}
      workspaceLogo={page.workspace.logo}
    />
  );
}
