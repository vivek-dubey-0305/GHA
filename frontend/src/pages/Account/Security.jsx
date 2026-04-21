/**
 * pages/Account/Security.jsx
 */
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell } from "../../components/DashboardPages/DashboardUI";
import SecuritySettings from "../../components/AccountPages/SecuritySettings";

export default function Security() {
  return (
    <UserLayout>
      <PageShell
        title="Security"
        subtitle="Manage your password, two-factor authentication, and active sessions."
      >
        <SecuritySettings />
      </PageShell>
    </UserLayout>
  );
}
