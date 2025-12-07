import React, {useEffect, useMemo, useRef, useState} from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import {useRouter} from "expo-router";
import {globalStyles} from "../styles/globalStyles";
import {colors} from "../styles/colors";
import {ItemKind} from "../types";
import {useAuth} from "../contexts/AuthContext";
import {useProductApi} from "../lib/api/product";
import {ensureNotificationSetup} from "../lib/api/notifications";
import {Camera, Image as ImageIcon, Plus, X} from "lucide-react-native";

export default function Sell() {
  const router = useRouter();
  const {user} = useAuth();
  const {addProduct} = useProductApi();

  const [kind, setKind] = useState<ItemKind>("book");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [courseCode, setCourseCode] = useState("");
  const [isbn, setIsbn] = useState("");
  const [authors, setAuthors] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState<string>("1");
  const [images, setImages] = useState<string[]>([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(300)).current;

  const canSubmit = useMemo(() => {
    const p = Number(price);
    const s = Number(stock || "1");
    return title.trim().length > 0 && !Number.isNaN(p) && p >= 0 && !Number.isNaN(s) && s >= 1 && images.length > 0;
  }, [title, price, stock, images]);

  const buildDescription = () => {
    const extras: string[] = [];
    if (kind === "book") {
      if (isbn.trim()) extras.push(`ISBN:${isbn.trim()}`);
      if (authors.trim()) extras.push(`Authors:${authors.split(",").map((x) => x.trim()).filter(Boolean).join(", ")}`);
      if (courseCode.trim()) extras.push(`Course:${courseCode.trim()}`);
    } else {
      if (category.trim()) extras.push(`Category:${category.trim()}`);
    }
    return extras.join("\n") || "No Description";
  };

  const pickFromLibrary = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please enable photo library access to select photos.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (!res.canceled && res.assets?.length) {
      const uris = res.assets.map(a => a.uri).filter(Boolean) as string[];
      setImages(prev => {
        const s = new Set(prev);
        uris.forEach(u => s.add(u));
        return Array.from(s);
      });
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please enable camera access to take photos.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const uri = res.assets[0].uri;
      setImages(prev => Array.from(new Set([...prev, uri])));
    }
  };

  const openPickerSheet = () => {
    setPickerOpen(true);
    fade.setValue(0);
    sheetY.setValue(300);
    Animated.parallel([
      Animated.timing(fade, {toValue: 1, duration: 180, useNativeDriver: true}),
      Animated.timing(sheetY, {toValue: 0, duration: 220, useNativeDriver: true}),
    ]).start();
  };

  const closePickerSheet = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(fade, {toValue: 0, duration: 160, useNativeDriver: true}),
      Animated.timing(sheetY, {toValue: 300, duration: 200, useNativeDriver: true}),
    ]).start(() => {
      setPickerOpen(false);
      if (cb) cb();
    });
  };

  const drag = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          sheetY.setValue(g.dy);
        } else {
          sheetY.setValue(0);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) {
          closePickerSheet();
        } else {
          Animated.timing(sheetY, {toValue: 0, duration: 180, useNativeDriver: true}).start();
        }
      },
    })
  ).current;

  const removeImage = (uri: string) => {
    setImages(prev => prev.filter(u => u !== uri));
  };

  const submit = async () => {
    if (!canSubmit) return;

    try {
      const payload = {
        title: title.trim(),
        description: buildDescription(),
        price: Number(price),
        picture_url: images[0],
        category: kind === "book" ? "book" : category.trim() || "other",
        quantity: Number(stock || "1"),
      };

      await addProduct(payload);
      await ensureNotificationSetup();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Listing created",
          body: `"${title.trim()}" is now live`,
          data: {
            action: "sell_success",
            title: title.trim(),
            price: Number(price),
          },
        },
        trigger: null,
      });
      router.push("/");
    } catch (e: any) {
      await ensureNotificationSetup();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Failed to create listing",
          body: e?.message ? String(e.message) : "Unable to create item.",
          data: {
            action: "sell_failed",
          },
        },
        trigger: null,
      });
    }
  };

  useEffect(() => {
    return () => {
      fade.stopAnimation();
      sheetY.stopAnimation();
    };
  }, []);

  return (
    <View style={[globalStyles.container, {paddingHorizontal: 16, paddingTop: 12}]}>
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
        <View style={[styles.field, {flex: 1, marginRight: 6}]}>
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
        <View style={[styles.field, {flex: 1, marginLeft: 6}]}>
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
        <Text style={styles.label}>Image</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gallery}
        >
          <Pressable style={styles.addBox} onPress={openPickerSheet} accessibilityRole="button"
                     accessibilityLabel="Add photos">
            <Plus size={28} color={colors.placeholder}/>
          </Pressable>

          {images.map((uri) => (
            <View key={uri} style={styles.photoWrap}>
              <Image source={{uri}} style={styles.photo}/>
              <Pressable
                onPress={() => removeImage(uri)}
                hitSlop={10}
                style={styles.removeBtn}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <X size={12} color={colors.textPrimary}/>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      <Pressable
        style={[styles.primaryBtn, !canSubmit && styles.disabled]}
        disabled={!canSubmit}
        onPress={submit}
      >
        <Text style={styles.primaryText}>List Item</Text>
      </Pressable>

      <Modal visible={pickerOpen} transparent animationType="none" onRequestClose={() => closePickerSheet()}>
        <Animated.View style={[styles.backdrop, {opacity: fade}]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closePickerSheet()}/>
        </Animated.View>
        <Animated.View style={[styles.sheet, {transform: [{translateY: sheetY}]}]}>
          <View style={styles.sheetGrab} {...drag.panHandlers}>
            <View style={styles.sheetHandle}/>
          </View>
          <Text style={styles.sheetTitle}>Add Photo</Text>
          <Pressable style={styles.sheetAction} onPress={() => closePickerSheet(pickFromCamera)}
                     accessibilityRole="button" accessibilityLabel="Open camera">
            <Camera size={18} color={colors.textPrimary}/>
            <Text style={styles.sheetActionLabel}>Camera</Text>
          </Pressable>
          <Pressable style={styles.sheetAction} onPress={() => closePickerSheet(pickFromLibrary)}
                     accessibilityRole="button" accessibilityLabel="Open photo library">
            <ImageIcon size={18} color={colors.textPrimary}/>
            <Text style={styles.sheetActionLabel}>Photo Library</Text>
          </Pressable>
        </Animated.View>
      </Modal>
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
  gallery: {
    paddingVertical: 6,
    gap: 10,
  },
  addBox: {
    width: 96,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  photoWrap: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetGrab: {
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: "center",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  sheetAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  sheetActionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
