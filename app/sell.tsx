import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { globalStyles } from "../styles/globalStyles";
import { colors } from "../styles/colors";
import { ItemKind, MarketplaceItem } from "../types";

export default function Sell() {
  const router = useRouter();

  const [kind, setKind] = useState<ItemKind>("book");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [isbn, setIsbn] = useState("");
  const [authors, setAuthors] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState<string>("1");

  const canSubmit = useMemo(() => {
    const p = Number(price);
    const s = Number(stock || "1");
    return title.trim().length > 0 && !Number.isNaN(p) && p >= 0 && !Number.isNaN(s) && s >= 1;
  }, [title, price, stock]);

  const submit = () => {
    if (!canSubmit) return;

    const id = Date.now().toString();
    const base = {
      id,
      title: title.trim(),
      price: Number(price),
      imageUrl: imageUrl.trim() || undefined,
      courseCode: courseCode.trim() || undefined,
      stock: Number(stock || "1"),
      createdAt: new Date().toISOString(),
    };

    let draft: MarketplaceItem;
    if (kind === "book") {
      draft = {
        ...base,
        kind: "book",
        isbn: isbn.trim() || undefined,
        authors: authors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    } else {
      draft = {
        ...base,
        kind: "other",
        category: category.trim() || undefined,
      };
    }

    Alert.alert("Listed (mock)", "Your item would appear in Market after backend integration.");
    router.push("/");
  };

  return (
    <View style={[globalStyles.container, { paddingHorizontal: 16, paddingTop: 12 }]}>
      <Text style={styles.title}>Create a Listing</Text>

      <View style={styles.segment}>
        <Pressable
          onPress={() => setKind("book")}
          style={[styles.segmentBtn, kind === "book" && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, kind === "book" && styles.segmentTextActive]}>Book</Text>
        </Pressable>
        <Pressable
          onPress={() => setKind("other")}
          style={[styles.segmentBtn, kind === "other" && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, kind === "other" && styles.segmentTextActive]}>Other</Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., ECE472 Textbook (9th ed.)"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: 6 }]}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="e.g., 45"
            placeholderTextColor={colors.placeholder}
          />
        </View>
        <View style={[styles.field, { flex: 1, marginLeft: 6 }]}>
          <Text style={styles.label}>Stock</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Course Code (optional)</Text>
        <TextInput
          style={styles.input}
          value={courseCode}
          onChangeText={setCourseCode}
          autoCapitalize="characters"
          placeholder="e.g., ECE472"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {kind === "book" ? (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>ISBN (optional)</Text>
            <TextInput
              style={styles.input}
              value={isbn}
              onChangeText={setIsbn}
              placeholder="e.g., 978-1-23456-789-7"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Authors (comma separated, optional)</Text>
            <TextInput
              style={styles.input}
              value={authors}
              onChangeText={setAuthors}
              placeholder="e.g., Alice, Bob"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        </>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>Category (optional)</Text>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder="e.g., electronics"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Image URL (optional)</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          placeholder="https://…"
          placeholderTextColor={colors.placeholder}
        />
      </View>

      <Pressable
        style={[styles.primaryBtn, !canSubmit && styles.disabled]}
        disabled={!canSubmit}
        onPress={submit}
      >
        <Text style={styles.primaryText}>List Item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  segment: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.white,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});