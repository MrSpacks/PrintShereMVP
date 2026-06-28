import { UserProfileView } from "@/components/profile/user-profile-view";

interface UserProfilePageProps {
  params: { id: string };
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  return <UserProfileView userId={params.id} />;
}
