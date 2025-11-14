import {StyleSheet} from "react-native";
import {colors} from "./colors";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: colors.background,
  },

  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },

  cardBase: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  cardPressed: {
    transform: [{scale: 0.99}],
  },
  mediaBase: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.background,
    marginRight: 12,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  imagePlaceholderText: {
    color: colors.placeholder,
    fontSize: 12,
  },
  tag: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  priceBadge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  statusPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f9f9f9",
  },
  formTitleBase: {
    textAlign: "center",
    fontWeight: "700",
    color: colors.textPrimary,
  },
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
  },
  tipSmall: {
    color: colors.placeholder,
    fontSize: 12,
  },
});