import type { Metadata } from "next";
import { Suspense } from "react";

import { ProfileView } from "@/components/profile/profile-view";
import { privatePageMetadata } from "@/lib/seo/private-page-metadata";

export const metadata: Metadata = privatePageMetadata;

function ProfileFallback() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileView />
    </Suspense>
  );
}
