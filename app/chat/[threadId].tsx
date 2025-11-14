import React, {useEffect, useMemo, useRef, useState} from "react";
import {
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
  View,
  Alert
} from "react-native";
import {useLocalSearchParams} from "expo-router";
import {globalStyles} from "../../styles/globalStyles";
import {colors} from "../../styles/colors";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, {Marker, Region} from "react-native-maps";
import {Camera, Image as ImageIcon, MapPin, Plus, Send, CheckCircle2} from "lucide-react-native";

type Msg =
  | { id: string; from: "me" | "peer"; text: string; ts: number }
  | { id: string; from: "me" | "peer"; imageUri: string; ts: number }
  | { id: string; from: "me" | "peer"; location: { lat: number; lng: number; address?: string }; ts: number };

type ThreadStatus = "placed" | "completed" | "cancelled";

const syncStatusToServer = async (status: ThreadStatus) => {
  return;
};

export default function ChatThread() {
  const {threadId} = useLocalSearchParams<{ threadId: string }>();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerRegion, setPickerRegion] = useState<Region | undefined>(undefined);
  const [pickerCoord, setPickerCoord] = useState<{ lat: number; lng: number } | undefined>(undefined);

  const [status, setStatus] = useState<ThreadStatus>("placed");

  const listRef = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    (async () => {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        const {latitude, longitude} = pos.coords;
        setPickerRegion({latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01});
      } else {
        setPickerRegion({latitude: 43.6629, longitude: -79.3957, latitudeDelta: 0.02, longitudeDelta: 0.02});
      }
    })();
  }, []);

  const data = useMemo(() => msgs.slice().sort((a, b) => a.ts - b.ts), [msgs]);

  const statusLabel = useMemo(() => {
    if (status === "completed") return "Status: Completed";
    if (status === "cancelled") return "Status: Cancelled";
    return "Status: In progress";
  }, [status]);

  const sendText = () => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, {id: `${Date.now()}`, from: "me", text: t, ts: Date.now()}]);
    setText("");
    requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
  };

  const handleImageResult = (res: ImagePicker.ImagePickerResult) => {
    if (res.canceled || !res.assets?.length) return;
    const uri = res.assets[0].uri;
    setMsgs((m) => [...m, {id: `${Date.now()}`, from: "me", imageUri: uri, ts: Date.now()}]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
    setExpanded(false);
  };

  const sendImageFromLibrary = async () => {
    const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      mediaTypes: ["images"]
    });
    handleImageResult(res);
  };

  const sendImageFromCamera = async () => {
    const {status} = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({quality: 0.8});
    handleImageResult(res);
  };

  const openLocationPicker = () => {
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
      const res = await Location.reverseGeocodeAsync({latitude: pickerCoord.lat, longitude: pickerCoord.lng});
      if (res && res[0]) {
        const r = res[0];
        address = [r.name, r.street, r.city, r.region].filter(Boolean).join(", ");
      }
    } catch {
    }
    setMsgs((m) => [...m, {
      id: `${Date.now()}`,
      from: "me",
      location: {lat: pickerCoord.lat, lng: pickerCoord.lng, address},
      ts: Date.now()
    }]);
    setPickerVisible(false);
    setPickerCoord(undefined);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
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
            await syncStatusToServer(next);
          }
        },
        {
          text: "Cancelled",
          style: "destructive",
          onPress: async () => {
            const next: ThreadStatus = "cancelled";
            setStatus(next);
            await syncStatusToServer(next);
          }
        },
        {
          text: "Close",
          style: "cancel"
        }
      ]
    );
  };

  const renderItem = ({item}: { item: Msg }) => {
    const isMe = item.from === "me";
    return (
      <View style={[styles.row, isMe ? styles.rowEnd : styles.rowStart]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubblePeer]}>
          {"text" in item ?
            <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextPeer]}>{item.text}</Text> : null}
          {"imageUri" in item ? <Image source={{uri: item.imageUri}} style={styles.msgImage}/> : null}
          {"location" in item ? (
            <Pressable onPress={() => openMap(item.location.lat, item.location.lng)}
                       style={[styles.locCard, isMe ? styles.locCardMe : styles.locCardPeer]}>
              <View style={styles.mapThumb}>
                <MapView
                  style={{flex: 1}}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: item.location.lat,
                    longitude: item.location.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                  }}
                >
                  <Marker coordinate={{latitude: item.location.lat, longitude: item.location.lng}}/>
                </MapView>
              </View>
              {item.location.address ? (
                <Text style={[styles.locText, isMe ? styles.msgTextMe : styles.msgTextPeer]} numberOfLines={2}>
                  {item.location.address}
                </Text>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.sub}>Thread: {String(threadId)}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{paddingVertical: 12, paddingHorizontal: 12}}
        onContentSizeChange={() => listRef.current?.scrollToEnd({animated: false})}
      />

      {expanded ? (
        <View style={styles.plusMenuWrap} pointerEvents="box-none">
          <View style={styles.plusMenuCard}>
            <Pressable
              onPress={handleStatusPress}
              style={[styles.menuIconBtn, styles.statusMenuBtn]}
              disabled={status !== "placed"}
            >
              <CheckCircle2 size={20} color={colors.white}/>
            </Pressable>
            <Pressable onPress={openLocationPicker} style={styles.menuIconBtn}>
              <MapPin size={20} color={colors.textPrimary}/>
            </Pressable>
            <Pressable onPress={sendImageFromCamera} style={styles.menuIconBtn}>
              <Camera size={20} color={colors.textPrimary}/>
            </Pressable>
            <Pressable onPress={sendImageFromLibrary} style={styles.menuIconBtn}>
              <ImageIcon size={20} color={colors.textPrimary}/>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.inputBar}>
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.plusBtn}>
          <Plus size={20} color={colors.textPrimary}/>
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={colors.placeholder}
          value={text}
          onChangeText={setText}
          returnKeyType="send"
          onSubmitEditing={sendText}
        />
        <Pressable onPress={sendText} style={styles.sendBtn}>
          <Send size={18} color={colors.white}/>
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
                  {pickerCoord ? <Marker coordinate={{latitude: pickerCoord.lat, longitude: pickerCoord.lng}}/> : null}
                </MapView>
              ) : null}
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => {
                setPickerVisible(false);
                setPickerCoord(undefined);
              }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalConfirm]} onPress={confirmLocation}>
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
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
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
