import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { globalStyles } from "../styles/globalStyles";
import { colors } from "../styles/colors";
import { ItemKind } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useProductApi } from "../lib/api/product";

export default function Sell() {
  const router = useRouter();
  const { user } = useAuth();
  const { addProduct } = useProductApi();

  const [kind, setKind] = useState<ItemKind>("book");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [isbn, setIsbn] = useState("");
  const [authors, setAuthors] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState<string>("1");
  const [pickedUri, setPickedUri] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const p = Number(price);
    const s = Number(stock || "1");
    return title.trim().length > 0 && !Number.isNaN(p) && p >= 0 && !Number.isNaN(s) && s >= 1 && !!pickedUri;
  }, [title, price, stock, pickedUri]);

  const buildDescription = () => {
    const extras: string[] = [];
    if (kind === "book") {
      if (isbn.trim()) extras.push(`ISBN:${isbn.trim()}`);
      if (authors.trim()) extras.push(`Authors:${authors.split(",").map((x) => x.trim()).filter(Boolean).join(", ")}`);
      if (courseCode.trim()) extras.push(`Course:${courseCode.trim()}`);
    } else {
      if (category.trim()) extras.push(`Category:${category.trim()}`);
    }
    if (imageUrl.trim()) extras.push(`ImageURL:${imageUrl.trim()}`);
    return extras.join("\n") || "";
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!res.canceled && res.assets && res.assets[0]?.uri) {
      setPickedUri(res.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;

    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", buildDescription());
      form.append("category", kind === "book" ? "book" : category.trim() || "other");
      form.append("seller_username", user?.username || "anonymous");
      form.append("price", String(Number(price)));
      form.append("quantity", String(Number(stock || "1")));

      if (pickedUri) {
        const name = pickedUri.split("/").pop() || "image.jpg";
        const type = name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
        form.append("picture", { uri: pickedUri, name, type } as any);
      }

      await addProduct(form);
      Alert.alert("Listed", "Your item has been created.");
      router.push("/");
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Unable to create item.");
    }
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

      <Pressable style={styles.pickBtn} onPress={pickImage}>
        <Text style={styles.pickText}>{pickedUri ? "Change Photo" : "Pick Photo"}</Text>
      </Pressable>

      {pickedUri ? (
        <View style={{ alignItems: "center", marginTop: 8, marginBottom: 4 }}>
          <Image source={{ uri: pickedUri }} style={{ width: 120, height: 120, borderRadius: 10 }} />
        </View>
      ) : null}

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
  pickBtn: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  pickText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
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