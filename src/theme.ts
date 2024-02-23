import { DEFAULT_THEME, createTheme } from "@mantine/core";
import { replaceColorStrings } from "./util";

export const theme = createTheme({
  shadows: {
    "sm-blue": replaceColorStrings(
      DEFAULT_THEME.shadows.sm,
      "var(--mantine-color-blue-filled)"
    ),
    "sm-green": replaceColorStrings(
      DEFAULT_THEME.shadows.sm,
      "var(--mantine-color-green-filled)"
    ),
  },
});
