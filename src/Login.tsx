import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, providers } from "./firebase/auth";

export const LoginPage = () => {
  return (
    <div>
      <Button
        onClick={() => {
          signInWithPopup(auth, providers.google)
            .then(() => {
              notifications.show({
                message: "Successfully logged in",
                color: "green",
              });
            })
            .catch((error) => {
              notifications.show({
                title: "Login failed",
                message: error.message,
                color: "red",
              });
            });
        }}
      >
        Login with Google
      </Button>
      <Button
        onClick={() => {
          signOut(auth).then(() => {
            notifications.show({ message: "Signed out", color: "green" });
          });
        }}
      >
        Log out
      </Button>
    </div>
  );
};
