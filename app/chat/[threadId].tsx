import React, {useEffect, useMemo, useRef, useState} from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import {globalStyles} from "../../styles/globalStyles";
import {colors} from "../../styles/colors";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, {Marker, Region} from "react-native-maps";
import {Camera, CheckCircle2, Image as ImageIcon, MapPin, Plus, Send} from "lucide-react-native";
import {useAuth} from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {BASE_URL, IMAGE_URL_PREFIX} from "../../constant";
import {useFetch} from "../../lib/api/fetch-client";
import { mapToImageHost } from "../../lib/utils/imageHost";

type BaseMsg = {
  id: string;
  from: "me" | "peer";
  ts: number;
};

type TextMsg = BaseMsg & { text: string };
type ImageMsg = BaseMsg & { imageUrl: string };
type LocationMsg = BaseMsg & {
  location: { lat: number; lng: number; address?: string };
};

type Msg = TextMsg | ImageMsg | LocationMsg;

type ThreadStatus = "placed" | "completed" | "cancelled";

const syncStatusToServer = async (status: ThreadStatus) => {
  return;
};

export default function ChatThread() {
  const {threadId, peerUsername: peerFromRoute} =
    useLocalSearchParams<{ threadId: string; peerUsername?: string }>();
  const router = useRouter();
  const {user} = useAuth();
  const {getData} = useFetch();

  const meUsername = user.username;
  const peerUsername = peerFromRoute ? String(peerFromRoute) : "";

  const [token, setToken] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerRegion, setPickerRegion] = useState<Region | undefined>(undefined);
  const [pickerCoord, setPickerCoord] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [status, setStatus] = useState<ThreadStatus>("placed");

  const listRef = useRef<FlatList<Msg>>(null);
  const menuAnim = useRef(new Animated.Value(0)).current;

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("access")
      .then((value) => {
        setToken(value);
      })
      .catch((err) => {
        console.warn("Failed to load access token", err);
      });
  }, []);

  // Get history message
  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        const data = await getData(`/api/chat/thread/${threadId}/messages/`);
        const mapped: Msg[] = data.map((m: any) => {
          const base: BaseMsg = {
            id: String(m.id),
            from: m.sender === meUsername ? "me" : "peer",
            ts: new Date(m.created_at).getTime(),
          };
          if (m.image_url) {
            return {...base, imageUrl: mapToImageHost(m.image_url)} as ImageMsg;
          }
          return {...base, text: m.text} as TextMsg;
        });

        setMsgs(mapped);
        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({animated: false}),
        );
      } catch (e: any) {
        console.warn("load messages error", e?.message);
      }
    })();
  }, [threadId, meUsername, getData]);

  useEffect(() => {
    if (!token || !meUsername) {
      console.warn("Chat WS: token || meUsername is null");
      return;
    }

    const wsBase = BASE_URL.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/chat/?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Chat WS connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "chat_message") return;
        if (data.sender === meUsername) return;

        const now = Date.now();

        if (data.image_url) {
          setMsgs((prev) => [...prev,
            {
              id: String(now),
              from: "peer",
              imageUrl: mapToImageHost(data.image_url),
              ts: now,
            } as ImageMsg,
          ]);
        } else if (data.message) {
          setMsgs((prev) => [...prev,
            {
              id: String(now),
              from: "peer",
              text: data.message,
              ts: now,
            } as TextMsg,
          ]);
        }

        requestAnimationFrame(() =>
          listRef.current?.scrollToEnd({animated: true}),
        );
      } catch (e) {
        console.warn("WS onmessage parse error", e);
      }
    };

    ws.onerror = (e) => {
      console.warn("Chat WS error", e);
    };

    ws.onclose = () => {
      console.log("Chat WS closed");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, meUsername]);

  useEffect(() => {
    (async () => {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        const {latitude, longitude} = pos.coords;
        setPickerRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        setPickerRegion({
          latitude: 43.6629,
          longitude: -79.3957,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (expanded) {
      menuAnim.setValue(0);
      Animated.timing(menuAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [expanded, menuAnim]);

  const data = useMemo(
    () => msgs.slice().sort((a, b) => a.ts - b.ts),
    [msgs],
  );

  const statusLabel = useMemo(() => {
    if (status === "completed") return "Status: Completed";
    if (status === "cancelled") return "Status: Cancelled";
    return "Status: In progress";
  }, [status]);

  const canInteract = status === "placed";

  const sendText = () => {
    if (!canInteract) return;
    const t = text.trim();
    if (!t) return;

    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      token &&
      meUsername &&
      peerUsername
    ) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: "chat_message",
            me: meUsername,
            peer: peerUsername,
            message: t,
            threadId,
          }),
        );
      } catch (e) {
        console.warn("WS send error", e);
      }
    } else {
      console.warn("WS not connected");
    }

    const now = Date.now();
    setMsgs((m) => [
      ...m,
      {id: `${now}`, from: "me", text: t, ts: now} as TextMsg,
    ]);
    setText("");
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({animated: true}),
    );
  };

  const uploadChatImage = async (localUri: string): Promise<string> => {
    try {
      const jwt = token || (await AsyncStorage.getItem("access"));
      if (!jwt) {
        throw new Error("No auth token");
      }

      const formData = new FormData();
      const filename = localUri.split("/").pop() || "chat.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : "jpg";
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "heic"
          ? "image/heic"
          : "image/jpeg";

      formData.append("image", {
        uri: localUri,
        name: filename,
        type: mime,
      } as any);

      const res = await fetch(`${BASE_URL}/api/chat/upload-image/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        console.log("upload image error", data);
        throw new Error(data.detail || "Upload failed");
      }

      const rawUrl: string = data.url;

      const imageUrl = mapToImageHost(rawUrl)!;
      return imageUrl;
    } catch (e: any) {
      console.warn("uploadChatImage error", e?.message);
      throw e;
    }
  };

  const handleImageResult = async (res: ImagePicker.ImagePickerResult) => {
    if (!canInteract) return;
    if (res.canceled || !res.assets?.length) return;

    const localUri = res.assets[0].uri;

    try {
      const imageUrl = await uploadChatImage(localUri);

      const now = Date.now();

      setMsgs((m) => [
        ...m,
        {id: `${now}`, from: "me", imageUrl, ts: now} as ImageMsg,
      ]);
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({animated: true}),
      );

      if (
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN &&
        meUsername &&
        peerUsername
      ) {
        wsRef.current.send(
          JSON.stringify({
            type: "chat_image",
            me: meUsername,
            peer: peerUsername,
            threadId,
            image_url: imageUrl,
          }),
        );

        console.log("WS send image", {
          type: "chat_image",
          me: meUsername,
          peer: peerUsername,
          threadId,
          image_url: imageUrl,
        });
      } else {
        console.warn("WS not connected, cannot send image message");
      }
    } catch {
    } finally {
      setExpanded(false);
    }
  };

  const sendImageFromLibrary = async () => {
    if (!canInteract) return;
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      mediaTypes: ["images"],
    });
    await handleImageResult(res);
  };

  const sendImageFromCamera = async () => {
    if (!canInteract) return;
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({quality: 0.8});
    await handleImageResult(res);
  };

  const openLocationPicker = () => {
    if (!canInteract) return;
    setPickerVisible(true);
    setExpanded(false);
  };

  const confirmLocation = async () => {
    if (!pickerCoord) {
      setPickerVisible(false);
      return;
    }
    let address: string | undefined = undefined;
    try {
      const res = await Location.reverseGeocodeAsync({
        latitude: pickerCoord.lat,
        longitude: pickerCoord.lng,
      });
      if (res && res[0]) {
        const r = res[0];
        address = [r.name, r.street, r.city, r.region]
          .filter(Boolean)
          .join(", ");
      }
    } catch {}
    setMsgs((m) => [
      ...m,
      {
        id: `${Date.now()}`,
        from: "me",
        location: {
          lat: pickerCoord.lat,
          lng: pickerCoord.lng,
          address,
        },
        ts: Date.now(),
      } as LocationMsg,
    ]);
    setPickerVisible(false);
    setPickerCoord(undefined);
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({animated: true}),
    );
  };

  const openMap = (lat: number, lng: number) => {
    const url =
      Platform.select({
        ios: `http://maps.apple.com/?ll=${lat},${lng}`,
        android: `geo:${lat},${lng}?q=${lat},${lng}`,
        default: `https://maps.google.com/?q=${lat},${lng}`,
      }) || `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  const handleStatusPress = () => {
    if (status !== "placed") return;
    Alert.alert(
      "Update status",
      "Mark this item as completed or cancelled?\n This action cannot be undone.",
      [
        {
          text: "Completed",
          onPress: async () => {
            const next: ThreadStatus = "completed";
            setStatus(next);
            setExpanded(false);
            await syncStatusToServer(next);
            router.replace("/order");
          },
        },
        {
          text: "Cancelled",
          style: "destructive",
          onPress: async () => {
            const next: ThreadStatus = "cancelled";
            setStatus(next);
            setExpanded(false);
            await syncStatusToServer(next);
            router.replace("/order");
          },
        },
        {
          text: "Close",
          style: "cancel",
        },
      ],
    );
  };

  const renderItem = ({item}: { item: Msg }) => {
    const isMe = item.from === "me";
    const bubbleStyle = [
      styles.bubble,
      isMe ? styles.bubbleMe : styles.bubblePeer,
    ];

    return (
      <View style={[styles.row, isMe ? styles.rowEnd : styles.rowStart]}>
        <View style={bubbleStyle}>
          {"text" in item && item.text ? (
            <Text
              style={[
                styles.msgText,
                isMe ? styles.msgTextMe : styles.msgTextPeer,
              ]}
            >
              {item.text}
            </Text>
          ) : null}

          {"imageUrl" in item ? (
            <Image source={{uri: item.imageUrl}} style={styles.msgImage} />
          ) : null}

          {"location" in item ? (
            <Pressable
              onPress={() =>
                openMap(item.location.lat, item.location.lng)
              }
              style={[
                styles.locCard,
                isMe ? styles.locCardMe : styles.locCardPeer,
              ]}
            >
              <View style={styles.mapThumb}>
                <MapView
                  style={{flex: 1}}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: item.location.lat,
                    longitude: item.location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: item.location.lat,
                      longitude: item.location.lng,
                    }}
                  />
                </MapView>
              </View>
              {item.location.address ? (
                <Text
                  style={[
                    styles.locText,
                    isMe ? styles.msgTextMe : styles.msgTextPeer,
                  ]}
                  numberOfLines={2}
                >
                  {item.location.address}
                </Text>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.sub}>Thread: {String(threadId)}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>

      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(m, index) => `${m.id}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={{paddingVertical: 12, paddingHorizontal: 12}}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({animated: false})
        }
      />

      {expanded ? (
        <View style={styles.plusMenuWrap} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.plusMenuCard,
              {opacity: menuAnim, transform: [{translateY: menuTranslateY}]},
            ]}
          >
            {status === "placed" ? (
              <Pressable
                onPress={handleStatusPress}
                style={[styles.menuIconBtn, styles.statusMenuBtn]}
              >
                <CheckCircle2 size={20} color={colors.white} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={openLocationPicker}
              style={styles.menuIconBtn}
              disabled={!canInteract}
            >
              <MapPin size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={sendImageFromCamera}
              style={styles.menuIconBtn}
              disabled={!canInteract}
            >
              <Camera size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={sendImageFromLibrary}
              style={styles.menuIconBtn}
              disabled={!canInteract}
            >
              <ImageIcon size={20} color={colors.textPrimary} />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.inputBar}>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={[styles.plusBtn, !canInteract && {opacity: 0.4}]}
          disabled={!canInteract}
        >
          <Plus size={20} color={colors.textPrimary} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={colors.placeholder}
          value={text}
          onChangeText={setText}
          returnKeyType="send"
          onSubmitEditing={sendText}
          editable={canInteract}
        />
        <Pressable
          onPress={sendText}
          style={[styles.sendBtn, !canInteract && {opacity: 0.4}]}
          disabled={!canInteract}
        >
          <Send size={18} color={colors.white} />
        </Pressable>
      </View>

      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pick a location</Text>
            <View style={styles.modalMapBox}>
              {pickerRegion ? (
                <MapView
                  style={{flex: 1}}
                  initialRegion={pickerRegion}
                  onPress={(e) => {
                    const {latitude, longitude} = e.nativeEvent.coordinate;
                    setPickerCoord({lat: latitude, lng: longitude});
                  }}
                >
                  {pickerCoord ? (
                    <Marker
                      coordinate={{
                        latitude: pickerCoord.lat,
                        longitude: pickerCoord.lng,
                      }}
                    />
                  ) : null}
                </MapView>
              ) : null}
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => {
                  setPickerVisible(false);
                  setPickerCoord(undefined);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmLocation}
              >
                <Text style={styles.modalConfirmText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  sub: {
    color: colors.placeholder,
    fontSize: 12,
    marginTop: 4,
  },
  status: {
    color: colors.textPrimary,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    width: "100%",
    marginVertical: 6,
    flexDirection: "row",
  },
  rowStart: {
    justifyContent: "flex-start",
  },
  rowEnd: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bubblePeer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextPeer: {
    color: colors.textPrimary,
  },
  msgTextMe: {
    color: colors.white,
  },
  msgImage: {
    width: 160,
    height: 120,
    borderRadius: 8,
    marginTop: 4,
  },
  locCard: {
    borderRadius: 10,
    overflow: "hidden",
    padding: 6,
    marginTop: 4,
  },
  locCardPeer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locCardMe: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  locText: {
    fontSize: 14,
    marginTop: 6,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    margin: 8,
    borderRadius: 16,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    marginRight: 6,
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 6,
  },
  sendBtn: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  mapThumb: {
    width: Dimensions.get("window").width * 0.6,
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
  },
  plusMenuWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 72,
    alignItems: "center",
  },
  plusMenuCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  menuIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
  },
  statusMenuBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMapBox: {
    height: 320,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  modalCancel: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  modalConfirm: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modalCancelText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});