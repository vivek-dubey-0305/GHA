/**
 * pages/Wallet/Withdraw.jsx
 */
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell } from "../../components/DashboardPages/DashboardUI";
import WalletWithdrawForm from "../../components/WalletPages/WalletWithdrawForm";
import { mockWallet } from "../../mock/dashboard";

export default function Withdraw() {
  return (
    <UserLayout>
      <PageShell
        title="Withdraw Funds"
        subtitle="Transfer your wallet balance to your bank account or UPI."
      >
        <WalletWithdrawForm
          availableBalance={mockWallet.balance - mockWallet.holdAmount}
          currency={mockWallet.currency}
        />
      </PageShell>
    </UserLayout>
  );
}
