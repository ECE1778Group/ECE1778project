// app/order/[id].tsx
import React, {useMemo} from "react";
import {FlatList, StyleSheet, Text, View} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {globalStyles} from "../../styles/globalStyles";
import {colors} from "../../styles/colors";
import ItemCard from "../../components/ItemCard";
import {MarketplaceItem} from "../../types";

type OrderItem = { threadId: string; listing: MarketplaceItem };

function mockOrderItems(orderId: string): OrderItem[] {
  const now = Date.now();
  return [
    {
      threadId: `${orderId}-1`,
      listing: {
        id: "l1",
        kind: "book",
        title: "ECE472 Textbook (9th ed.)",
        price: 45,
        imageUrl: "https://picsum.photos/seed/od1/200/200",
        distanceKm: 0.9,
        courseCode: "ECE472",
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      threadId: `${orderId}-2`,
      listing: {
        id: "l2",
        kind: "book",
        title: "Discrete Math Workbook",
        price: 18,
        imageUrl: "https://picsum.photos/seed/od2/200/200",
        distanceKm: 1.2,
        courseCode: "CSC165",
        createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      threadId: `${orderId}-3`,
      listing: {
        id: "l3",
        kind: "other",
        title: "Desk LED Lamp",
        price: 12,
        imageUrl: "https://picsum.photos/seed/od3/200/200",
        distanceKm: 0.5,
        createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        category: "home",
      },
    },
  ];
}

export default function OrderDetail() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const data = useMemo(() => mockOrderItems(String(id)), [id]);

  return (
    <View style={globalStyles.container}>
      <Text style={styles.title}>Order {String(id)}</Text>
      <FlatList
        data={data}
        keyExtractor={(x) => x.listing.id}
        renderItem={({item}) => (
          <ItemCard
            id={item.listing.id}
            title={item.listing.title}
            price={item.listing.price}
            imageUrl={item.listing.imageUrl}
            distanceKm={item.listing.distanceKm}
            courseCode={item.listing.courseCode}
            createdAt={item.listing.createdAt}
            onPress={() => router.push({pathname: "/chat/[threadId]", params: {threadId: item.threadId}})}
          />
        )}
        contentContainerStyle={{paddingVertical: 8}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
});