/**
 * pages/Wallet/Withdraw.jsx
 */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { UserLayout } from "../../components/layout/UserLayout";
import { PageShell } from "../../components/DashboardPages/DashboardUI";
import WalletWithdrawForm from "../../components/WalletPages/WalletWithdrawForm";
import { getMyWallet, getWalletTransactions } from "../../redux/slices/wallet.slice";
import { getMyPayouts, requestPayout } from "../../redux/slices/payout.slice";

export default function Withdraw() {
  const dispatch = useDispatch();
  const { wallet } = useSelector((state) => state.wallet);
  const { requestLoading, error } = useSelector((state) => state.payout);

  useEffect(() => {
    dispatch(getMyWallet());
  }, [dispatch]);

  const handleWithdraw = async (payload) => {
    await dispatch(requestPayout(payload)).unwrap();
    dispatch(getMyWallet());
    dispatch(getWalletTransactions({ page: 1, limit: 20 }));
    dispatch(getMyPayouts({ page: 1, limit: 20 }));
  };

  return (
    <UserLayout>
      <PageShell
        title="Withdraw Funds"
        subtitle="Transfer your wallet balance to your bank account or UPI."
      >
        <WalletWithdrawForm
          availableBalance={wallet?.availableBalance ?? Math.max(0, (wallet?.balance || 0) - (wallet?.holdAmount || 0))}
          currency={wallet?.currency || "INR"}
          onSubmit={handleWithdraw}
          submitting={requestLoading}
          serverError={error || ""}
        />
      </PageShell>
    </UserLayout>
  );
}
