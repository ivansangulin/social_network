import { useNavigation } from "@remix-run/react";

export const ProgressBar = () => {
  const navigation = useNavigation();
  return (
    <div
      className={`fixed top-0 left-0 w-full h-0.5 animate-progress-bar bg-sky-500 z-40 ${
        navigation.state === "idle" && "hidden"
      }`}
    />
  );
};
