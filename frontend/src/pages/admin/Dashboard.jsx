import { useEffect, useState } from "react";
import api from "../../api/client.js";
import { useI18n } from "../../context/I18nContext.jsx";
import {
  PageTitle,
  StatCard,
  Spinner,
  Alert,
  inr,
} from "../../components/ui.jsx";

export default function Dashboard() {
  const { t } = useI18n();
  const [cards, setCards] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/analytics/overview");
        setCards(res.data.data.cards);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <PageTitle
        title={t("dashboard")}
        subtitle="Gram Panchayat Ghirni - Tax Overview"
      />
      <Alert type="error">{error}</Alert>
      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label={t("totalTaxpayers")}
            value={cards?.totalTaxpayers ?? 0}
            accent="bg-gov"
          />
          <StatCard
            label={t("activeTaxpayers")}
            value={cards?.activeTaxpayers ?? 0}
            accent="bg-india"
          />
          <StatCard
            label={t("totalCollection")}
            value={inr(cards?.totalCollection)}
            accent="bg-green-500"
          />
          <StatCard
            label={t("pendingCollection")}
            value={inr(cards?.pendingCollection)}
            accent="bg-red-500"
          />
          <StatCard
            label={t("onlineCollection")}
            value={inr(cards?.onlineCollection)}
            accent="bg-blue-500"
          />
          <StatCard
            label={t("offlineCollectionCard")}
            value={inr(cards?.offlineCollection)}
            accent="bg-saffron"
          />
          <StatCard
            label={t("defaulters")}
            value={cards?.defaulterCount ?? 0}
            accent="bg-orange-500"
          />
        </div>
      )}
    </div>
  );
}
