/**
 * pages/Account/Profile.jsx
 */
import { useSelector } from "react-redux";
import { User } from "lucide-react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell } from "../../components/DashboardPages/DashboardUI";
import ProfileForm from "../../components/AccountPages/ProfileForm";
import { selectUser } from "../../redux/slices/auth.slice";

export default function Profile() {
  const user = useSelector(selectUser);

  return (
    <UserLayout>
      <PageShell
        title="Profile"
        subtitle="Manage your personal information and public profile."
      >
        <ProfileForm user={user} />
      </PageShell>
    </UserLayout>
  );
}
