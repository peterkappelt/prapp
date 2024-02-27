import { AppShell, Burger, Group, NavLink } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconList } from "@tabler/icons-react";
import { Route, Switch, useLocation } from "wouter";
import { LoginPage } from "./Login";
import { ProcessExecutionView } from "./ProcessExecutionView";
import { TemplateList } from "./TemplateList";
import TemplateProcessEditor from "./TemplateProcessEditor";

function App() {
  const [, setLocation] = useLocation();
  const [opened, { toggle }] = useDisclosure();

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
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <h1>PrApp</h1>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <NavLink
          onClick={() => setLocation("/template")}
          label="Processes"
          leftSection={<IconList size="1rem" stroke={1.5} />}
        />
      </AppShell.Navbar>
      <AppShell.Main>
        <Switch>
          <Route path="/login">
            <LoginPage />
          </Route>
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
      {/* <AppShell.Aside p="md">Aside</AppShell.Aside> */}
      <AppShell.Footer p="md">Footer</AppShell.Footer>
    </AppShell>
  );
}

export default App;
