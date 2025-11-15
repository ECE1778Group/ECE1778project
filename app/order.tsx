import React, {useCallback, useEffect, useMemo, useState} from "react";
import {ActivityIndicator, SectionList, StyleSheet, Text, View,} from "react-native";
import {useFocusEffect, useRouter} from "expo-router";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import OrderCard from "../components/OrderCard";
import {OrderStatus} from "../types";
import {deriveOrderStatusFromItems, useOrderApi} from "../lib/api/order";
import {useProductApi} from "../lib/api/product";
import {IMAGE_URL_PREFIX} from "../constant";

type Order = {
  id: string;
  items: { imageUrl?: string }[];
  createdAt: string;
  status: OrderStatus;
};

type Section = { title: string; data: Order[] };

export default function Orders() {
  const router = useRouter();
  const {listOrders, getOrder} = useOrderApi();
  const {getProduct} = useProductApi();

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(
    async (isRefresh: boolean = false) => {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const summaries = await listOrders();
        const orders: Order[] = [];

        for (const summary of summaries) {
          const detail = await getOrder(summary.order_number);
          const rawItems = detail?.items ?? [];
          const status = deriveOrderStatusFromItems(rawItems);

          let viewItems: { imageUrl?: string }[] = [];

          if (rawItems.length > 0) {
            const productIds = Array.from(
              new Set(rawItems.map((it) => it.product_id))
            );
            const productResults = await Promise.all(
              productIds.map(async (pid) => {
                try {
                  const p = await getProduct(pid);
                  return {pid, product: p};
                } catch {
                  return {pid, product: null as any};
                }
              })
            );
            const productMap = new Map<string, any>();
            productResults.forEach(({pid, product}) => {
              if (product) productMap.set(pid, product);
            });

            viewItems = rawItems.map((it) => {
              const product = productMap.get(it.product_id);
              let picture: string | undefined = product?.picture_url;
              if (picture && !/^https?:\/\//i.test(picture)) {
                picture = IMAGE_URL_PREFIX + picture.replace(/^\/+/, "");
              }
              return {imageUrl: picture};
            });
          }

          orders.push({
            id: summary.order_number,
            createdAt: summary.created_at,
            status,
            items: viewItems,
          });
        }

        const active = orders.filter((o) => o.status === "placed");
        const past = orders.filter((o) => o.status !== "placed");

        const nextSections: Section[] = [];
        if (active.length > 0) nextSections.push({title: "Active orders", data: active});
        if (past.length > 0) nextSections.push({title: "Past orders", data: past});

        setSections(nextSections);
      } catch (e: any) {
        setError(e?.message || "Failed to load orders");
        setSections([]);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [listOrders, getOrder, getProduct]
  );

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const timer = setTimeout(() => {
        if (!cancelled) {
          loadOrders(true);
        }
      }, 800);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [loadOrders])
  );

  const hasSections = useMemo(
    () => sections.some((s) => s.data.length > 0),
    [sections]
  );

  const onRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  return (
    <View style={globalStyles.container}>
      <SectionList<Order, Section>
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({section}) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({item}) => (
          <OrderCard
            id={item.id}
            items={item.items}
            createdAt={item.createdAt}
            status={item.status}
            onPress={() =>
              router.push({pathname: "/order/[id]", params: {id: item.id}})
            }
          />
        )}
        contentContainerStyle={{paddingVertical: 8, paddingBottom: 8, flexGrow: 1}}
        stickySectionHeadersEnabled={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.center}>
            {loading ? (
              <>
                <ActivityIndicator/>
                <Text style={styles.centerText}>Loading orders…</Text>
              </>
            ) : error ? (
              <>
                <Text style={styles.centerText}>{error}</Text>
                <Text style={styles.tip}>Pull down to refresh</Text>
              </>
            ) : (
              <>
                <Text style={styles.centerText}>No orders yet</Text>
                <Text style={styles.tip}>Pull down to refresh</Text>
              </>
            )}
          </View>
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
    ...globalStyles.center,
  },
  centerText: {
    color: colors.placeholder,
    fontSize: 16,
  },
  tip: {
    ...globalStyles.tipSmall,
    marginTop: 4,
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