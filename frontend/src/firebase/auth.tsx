import { notifications } from "@mantine/notifications";
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import React, { useContext, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { app } from "./conf";

const auth = getAuth(app);

const providers = {
  google: new GoogleAuthProvider(),
};

interface AuthContext {
  user: User | undefined;
  signOut: () => void;
}

const AuthCtx = React.createContext<AuthContext | undefined>(undefined);

const AuthContext = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | undefined>(auth.currentUser || undefined);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!active) return;
      if (user) setUser(user);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        user: user,
        signOut: () =>
          signOut(auth).then(() => {
            notifications.show({
              message: "Successfully signed out",
              color: "green",
            });
          }),
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
};

const RedirectToLogin = () => {
  return <Redirect to="/login" replace />;
};

const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw Error("useAuth hook needs to be inside Auth Context");
  return ctx;
};

export { AuthContext, RedirectToLogin, auth, providers, useAuth };
