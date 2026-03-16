/**
 * pages/Account/Security.jsx
 */
import { useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell } from "../../components/DashboardPages/DashboardUI";
import SecuritySettings from "../../components/AccountPages/SecuritySettings";
import { selectUser } from "../../redux/slices/auth.slice";

export default function Security() {
  const user = useSelector(selectUser);

  return (
    <UserLayout>
      <PageShell
        title="Security"
        subtitle="Manage your password, two-factor authentication, and active sessions."
      >
        <SecuritySettings user={user} />
      </PageShell>
    </UserLayout>
  );
}
