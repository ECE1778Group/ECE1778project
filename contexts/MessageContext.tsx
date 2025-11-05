import React, { createContext, useContext, useState, ReactNode } from "react";
import { Snackbar, Portal } from "react-native-paper";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageType = "success" | "error" | "info";

interface MessageState {
  visible: boolean;
  message: string;
  type: MessageType;
}

interface MessageContextType {
  showMessage: (message: string, type?: MessageType) => void;
  hideMessage: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<MessageState>({
    visible: false,
    message: "",
    type: "info",
  });

  const showMessage = (message: string, type: MessageType = "info") => {
    setState({ visible: true, message, type });
  };

  const hideMessage = () => setState((prev) => ({ ...prev, visible: false }));

  const backgroundColor =
    state.type === "success"
      ? "#4CAF50"
      : state.type === "error"
      ? "#F44336"
      : "#2196F3";

  return (
    <MessageContext.Provider value={{ showMessage, hideMessage }}>
      <View style={{ flex: 1 }}>{children}</View>

      <Portal>
        <Snackbar
          visible={state.visible}
          onDismiss={hideMessage}
          duration={3000}
          style={[
            styles.snackbar,
            { backgroundColor, bottom: insets.bottom + 20 }, 
          ]}
          action={{
            label: "OK",
            onPress: hideMessage,
            labelStyle: { color: "white" },
          }}
        >
          {state.message}
        </Snackbar>
      </Portal>
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessage must be used within a <MessageProvider>");
  return ctx;
};

const styles = StyleSheet.create({
  snackbar: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 8,
    zIndex: 9999,
    elevation: 10,
  },
});
