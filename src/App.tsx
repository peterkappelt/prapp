import {
  AppShell,
  Burger,
  Grid,
  Menu,
  NavLink,
  Title,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconList, IconLogout } from "@tabler/icons-react";
import { Route, Switch, useLocation } from "wouter";
import { LoginPage } from "./Login";
import { ProcessExecutionView } from "./ProcessExecutionView";
import { TemplateList } from "./TemplateList";
import TemplateProcessEditor from "./TemplateProcessEditor";
import { UserButton } from "./components/UserButton";
import { useAuth } from "./firebase/auth";

function App() {
  const [, setLocation] = useLocation();
  const [opened, { toggle }] = useDisclosure();
  const { user, signOut } = useAuth();

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      // aside={{
      //   width: 300,
      //   breakpoint: "md",
      //   collapsed: { desktop: false, mobile: true },
      // }}
      padding="md"
    >
      <AppShell.Header>
        <Grid h="100%" px="md">
          <Grid.Col span="content">
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
          </Grid.Col>
          <Grid.Col span="auto">
            <Title order={1}>PrApp</Title>
          </Grid.Col>
          {user && (
            <Grid.Col span="content">
              <Menu withArrow>
                <Menu.Target>
                  <UserButton
                    image={user.photoURL}
                    name={user.displayName || "Hi"}
                    email={user.email || ""}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={
                      <IconLogout style={{ width: rem(14), height: rem(14) }} />
                    }
                    onClick={signOut}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Grid.Col>
          )}
        </Grid>
      </AppShell.Header>
      {!user && (
        <AppShell.Main>
          <LoginPage />
        </AppShell.Main>
      )}
      {user && (
        <>
          <AppShell.Navbar p="md">
            <NavLink
              onClick={() => setLocation("/template")}
              label="Processes"
              leftSection={<IconList size="1rem" stroke={1.5} />}
            />
          </AppShell.Navbar>
          <AppShell.Main>
            <Switch>
              <Route path="/template">
                <TemplateList />
              </Route>
              <Route path="/template/:id">
                {(params) => <TemplateProcessEditor templateId={params.id} />}
              </Route>
              <Route path="/execution/:id">
                {(params) => <ProcessExecutionView executionId={params.id} />}
              </Route>
            </Switch>
          </AppShell.Main>
        </>
      )}
      {/* <AppShell.Aside p="md">Aside</AppShell.Aside> */}
      <AppShell.Footer p="md">Footer</AppShell.Footer>
    </AppShell>
  );
}

export default App;
