import { getCurrentUserProfileAction } from "@/actions/users";
import { ProfileView } from "./profile-view";

export default async function ProfilePage() {
  const user = await getCurrentUserProfileAction();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <ProfileView initialUser={user} />
    </div>
  );
}
