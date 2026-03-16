/**
 * pages/Wallet/Wallet.jsx
 */
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, SectionTitle } from "../../components/DashboardPages/DashboardUI";
import { WalletBalance } from "../../components/WalletPages/WalletBalance";
import WalletTransactionTable from "../../components/WalletPages/WalletTransactionTable";
import { mockWallet, mockTransactions } from "../../mock/dashboard";
import { Receipt } from "lucide-react";

export default function Wallet() {
  return (
    <UserLayout>
      <PageShell title="Wallet" subtitle="Manage your prize money, referral earnings, and withdrawals.">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WalletBalance wallet={mockWallet} />
          </div>
          <div className="lg:col-span-2">
            <SectionTitle icon={Receipt}>Recent Transactions</SectionTitle>
            <WalletTransactionTable transactions={mockTransactions.slice(0, 5)} />
          </div>
        </div>
      </PageShell>
    </UserLayout>
  );
}
