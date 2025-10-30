import React from "react";
import {SectionList, StyleSheet, Text, View} from "react-native";
import {useRouter} from "expo-router";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import OrderCard from "../components/OrderCard";

type OrderStatus = "placed" | "completed" | "cancelled";
type Order = { id: string; items: { imageUrl?: string }[]; createdAt: string; status: OrderStatus };
type Section = { title: string; data: Order[] };

const activeOrders: Order[] = [
  {
    id: "A1001",
    items: [{imageUrl: "https://picsum.photos/seed/a1001-1/200/200"}, {imageUrl: "https://picsum.photos/seed/a1001-2/200/200"}],
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: "placed",
  },
  {
    id: "A1002",
    items: [{imageUrl: "https://picsum.photos/seed/a1002-1/200/200"}],
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: "placed",
  },
];

const pastOrders: Order[] = [
  {
    id: "P2001",
    items: [
      {imageUrl: "https://picsum.photos/seed/p2001-1/200/200"},
      {imageUrl: "https://picsum.photos/seed/p2001-2/200/200"},
      {imageUrl: "https://picsum.photos/seed/p2001-3/200/200"},
      {imageUrl: "https://picsum.photos/seed/p2001-4/200/200"},
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "P2002",
    items: [{imageUrl: "https://picsum.photos/seed/p2002-1/200/200"}],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "cancelled",
  },
];

export default function Orders() {
  const router = useRouter();

  const sections: Section[] = [
    {title: "Active orders", data: activeOrders},
    {title: "Past orders", data: pastOrders},
  ];

  return (
    <View style={globalStyles.container}>
      <SectionList<Order, Section>
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({section}) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({item}) => (
          <OrderCard
            id={item.id}
            items={item.items}
            createdAt={item.createdAt}
            status={item.status}
            onPress={() => router.push({pathname: "/order/[id]", params: {id: item.id}})}
          />
        )}
        contentContainerStyle={{paddingVertical: 8, paddingBottom: 8}}
        stickySectionHeadersEnabled={false}
      />
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
});