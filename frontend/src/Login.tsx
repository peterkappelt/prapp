import { Button, Center } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { signInWithPopup } from "firebase/auth";
import { auth, providers } from "./firebase/auth";

export const LoginPage = () => {
  return (
    <Center>
      <Button
        leftSection={<IconBrandGoogleFilled />}
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
    </Center>
  );
};
