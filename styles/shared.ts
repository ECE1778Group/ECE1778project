import {StyleSheet} from "react-native";
import {colors} from "./colors";

export const sharedStyles = StyleSheet.create({
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
});