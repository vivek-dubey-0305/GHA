/**
 * pages/Wallet/Transactions.jsx
 */
import { useState } from "react";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar } from "../../components/DashboardPages/DashboardUI";
import WalletTransactionTable from "../../components/WalletPages/WalletTransactionTable";
import { mockTransactions } from "../../mock/dashboard";
import { TRANSACTION_TABS } from "../../constants/dashboard.constants";

export default function Transactions() {
  const [tab, setTab] = useState("All");

  const filtered = tab === "All" ? mockTransactions
    : tab === "Credits" ? mockTransactions.filter((t) => t.type === "credit")
    : mockTransactions.filter((t) => t.type === "debit");

  return (
    <UserLayout>
      <PageShell title="Transactions" subtitle="Full history of your wallet activity.">
        <TabBar tabs={TRANSACTION_TABS} active={tab} onChange={setTab} />
        <WalletTransactionTable transactions={filtered} />
      </PageShell>
    </UserLayout>
  );
}
