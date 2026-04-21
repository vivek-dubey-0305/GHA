/**
 * pages/Wallet/Transactions.jsx
 */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell, TabBar } from "../../components/DashboardPages/DashboardUI";
import SearchPulseLoader from "../../components/common/SearchPulseLoader";
import WalletTransactionTable from "../../components/WalletPages/WalletTransactionTable";
import { TRANSACTION_TABS } from "../../constants/dashboard.constants";
import { getWalletTransactions } from "../../redux/slices/wallet.slice";

export default function Transactions() {
  const dispatch = useDispatch();
  const { transactions, transactionsLoading, error } = useSelector((state) => state.wallet);
  const [tab, setTab] = useState("All");

  useEffect(() => {
    dispatch(getWalletTransactions({ page: 1, limit: 200 }));
  }, [dispatch]);

  const filtered = useMemo(() => {
    const list = transactions || [];
    if (tab === "All") return list;
    if (tab === "Credits") return list.filter((t) => t.type === "credit");
    return list.filter((t) => t.type === "debit");
  }, [tab, transactions]);

  return (
    <UserLayout>
      <PageShell title="Transactions" subtitle="Full history of your wallet activity.">
        <TabBar tabs={TRANSACTION_TABS} active={tab} onChange={setTab} />
        {transactionsLoading && (
          <SearchPulseLoader
            label="Loading transactions"
            sublabel="Preparing your wallet activity timeline"
            compact
          />
        )}
        {error && <p className="text-red-400 text-sm py-2">{error}</p>}
        <WalletTransactionTable transactions={filtered} />
      </PageShell>
    </UserLayout>
  );
}
