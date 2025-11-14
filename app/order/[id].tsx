import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../styles/colors";
import ItemCard from "../../components/ItemCard";
import { deriveOrderStatusFromItems, useOrderApi } from "../../lib/api/order";
import { useProductApi } from "../../lib/api/product";
import { OrderStatus } from "../../types";
import { IMAGE_URL_PREFIX } from "../../constant";

type OrderItemView = {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  status: OrderStatus;
};

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOrder } = useOrderApi();
  const { getProduct } = useProductApi();

  const [items, setItems] = useState<OrderItemView[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("placed");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(
    async (isRefresh: boolean = false) => {
      if (!id) {
        setNotFound(true);
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setError(null);
      setNotFound(false);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const detail = await getOrder(String(id));
        if (!detail) {
          setNotFound(true);
          setItems([]);
          return;
        }

        const itemDtos = detail.items ?? [];

        const productIds = Array.from(new Set(itemDtos.map((it) => it.product_id)));
        const productResults = await Promise.all(
          productIds.map(async (pid) => {
            try {
              const p = await getProduct(pid);
              return { pid, product: p };
            } catch {
              return { pid, product: null as any };
            }
          })
        );
        const productMap = new Map<string, any>();
        productResults.forEach(({ pid, product }) => {
          if (product) productMap.set(pid, product);
        });

        const mapped: OrderItemView[] = itemDtos.map((it) => {
          const product = productMap.get(it.product_id);
          let picture: string | undefined = product?.picture_url;
          if (picture && !/^https?:\/\//i.test(picture)) {
            picture = IMAGE_URL_PREFIX + picture.replace(/^\/+/, "");
          }
          const status = (it.status as OrderStatus) || "placed";
          return {
            id: String(it.product_id),
            title: product?.title || `Item ${it.product_id}`,
            price:
              typeof product?.price === "number"
                ? product.price
                : Number(it.unit_price) || 0,
            imageUrl: picture,
            status,
          };
        });

        const derived = deriveOrderStatusFromItems(
          itemDtos.map((x) => ({ status: x.status }))
        );

        setItems(mapped);
        setOrderStatus(derived);
      } catch (e: any) {
        setError(e?.message || "Failed to load order");
        setItems([]);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [id, getOrder, getProduct]
  );

  useEffect(() => {
    loadOrder(false);
  }, [loadOrder]);

  const onRefresh = useCallback(() => {
    loadOrder(true);
  }, [loadOrder]);

  if (loading && !refreshing && !notFound && !error) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <Text style={styles.centerText}>Loading order…</Text>
      </View>
    );
  }

  if (notFound) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <Text style={styles.centerText}>Order not found</Text>
      </View>
    );
  }

  if (error && !loading && items.length === 0) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <Text style={styles.centerText}>{error}</Text>
        <Text style={styles.tip}>Pull down to retry.</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order {String(id)}</Text>
        <Text style={styles.headerStatus}>
          {orderStatus === "placed"
            ? "Placed"
            : orderStatus === "completed"
            ? "Completed"
            : "Cancelled"}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            id={item.id}
            title={item.title}
            price={item.price}
            imageUrl={item.imageUrl}
            orderStatus={item.status}
            onPress={() =>
              router.push({ pathname: "/item/[id]", params: { id: item.id } })
            }
          />
        )}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerStatus: {
    color: colors.placeholder,
    fontSize: 14,
  },
});