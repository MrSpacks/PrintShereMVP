import { UserProfileView } from "@/components/profile/user-profile-view";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage(props: UserProfilePageProps) {
  const params = await props.params;
  return <UserProfileView userId={params.id} />;
}
