import {Tabs} from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{title: "market", tabBarLabel: "Market"}}/>
      <Tabs.Screen name="item/[id]" options={{title: "Item Information", href: null, tabBarLabel: () => null}}/>
    </Tabs>
  );
}