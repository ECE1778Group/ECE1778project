import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { globalStyles } from "../styles/globalStyles";
import { colors } from "../styles/colors";
import OrderCard from "../components/OrderCard";
import { OrderStatus } from "../types";
import { deriveOrderStatusFromItems, useOrderApi } from "../lib/api/order";

type Order = {
  id: string;
  items: { imageUrl?: string }[];
  createdAt: string;
  status: OrderStatus;
};

type Section = { title: string; data: Order[] };

export default function Orders() {
  const router = useRouter();
  const { listOrders, getOrder } = useOrderApi();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    if (!refreshing) setLoading(true);
    try {
      const summaries = await listOrders();
      const orders: Order[] = [];

      for (const summary of summaries) {
        const detail = await getOrder(summary.order_number);
        const items = detail?.items ?? [];
        const status = deriveOrderStatusFromItems(items);
        orders.push({
          id: summary.order_number,
          createdAt: summary.created_at,
          status,
          items: items.map(() => ({})),
        });
      }

      const active = orders.filter((o) => o.status === "placed");
      const past = orders.filter((o) => o.status !== "placed");

      const nextSections: Section[] = [];
      if (active.length > 0) nextSections.push({ title: "Active orders", data: active });
      if (past.length > 0) nextSections.push({ title: "Past orders", data: past });

      setSections(nextSections);
    } catch (e: any) {
      setError(e?.message || "Failed to load orders");
      setSections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [listOrders, getOrder, refreshing]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const hasSections = useMemo(
    () => sections.some((s) => s.data.length > 0),
    [sections]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  if (loading && !refreshing && !hasSections) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Loading orders…</Text>
      </View>
    );
  }

  if (error && !hasSections && !loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <Text style={styles.centerText}>{error}</Text>
        <Text style={styles.tip}>Pull down to retry.</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <SectionList<Order, Section>
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <OrderCard
            id={item.id}
            items={item.items}
            createdAt={item.createdAt}
            status={item.status}
            onPress={() =>
              router.push({ pathname: "/order/[id]", params: { id: item.id } })
            }
          />
        )}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 8 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {error && hasSections ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerText: {
    color: colors.placeholder,
    fontSize: 14,
  },
  tip: {
    marginTop: 4,
    color: colors.placeholder,
    fontSize: 12,
  },
  errorBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#FDECEA",
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    textAlign: "center",
  },
});