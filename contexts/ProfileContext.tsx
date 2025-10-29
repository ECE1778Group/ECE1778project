import React, { createContext, useContext, useMemo, useState } from "react";

export type Profile = {
  name: string;
  email: string;
  campus?: string;
  phone?: string;
};

type Ctx = {
  profile: Profile;
  setProfile: (p: Profile) => void;
  update: (p: Partial<Profile>) => void;
  reset: () => void;
};

const defaultProfile: Profile = {
  name: "",
  email: "",
  campus: "",
  phone: "",
};

const ProfileCtx = createContext<Ctx>({
  profile: defaultProfile,
  setProfile: () => {},
  update: () => {},
  reset: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<Profile>(defaultProfile);

  const setProfile = (p: Profile) => setProfileState(p);
  const update = (p: Partial<Profile>) => setProfileState((prev) => ({ ...prev, ...p }));
  const reset = () => setProfileState(defaultProfile);

  const value = useMemo(() => ({ profile, setProfile, update, reset }), [profile]);

  return <ProfileCtx.Provider value={value}>{children}</ProfileCtx.Provider>;
}

export function useProfile() {
  return useContext(ProfileCtx);
}