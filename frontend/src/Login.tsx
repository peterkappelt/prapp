import {
  Button,
  Center,
  Fieldset,
  Group,
  PasswordInput,
  Stack,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useApi } from "./Api";

export const LoginPage = () => {
  const api = useApi();
  const [username, setUsername] = useState("peter");
  const [password, setPassword] = useState("passw0rd=");

  return (
    <Center>
      <Fieldset legend="Login">
        <Stack>
          <TextInput
            required
            label="Username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
          />
          <PasswordInput
            required
            label="Password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button
              type="submit"
              variant="filled"
              onClick={async () => {
                try {
                  await api.token.tokenCreate({
                    tokenObtainPairRequest: {
                      username,
                      password,
                    },
                  });
                  notifications.show({
                    message: "Successfully logged in!",
                    color: "green",
                  });
                } catch (err) {
                  notifications.show({
                    title: "Login failed",
                    message: String(err),
                    color: "red",
                  });
                }
              }}
            >
              Login
            </Button>
          </Group>
        </Stack>
      </Fieldset>
    </Center>
  );
};
