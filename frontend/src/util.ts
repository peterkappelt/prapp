import { alpha } from "@mantine/core";

/**
 * Replaces all occurences of rgba(_, _, _, transparency_float)
 * with color-mix(in srgb, new_color, transparent round(100 - transparency_float * 100))
 *
 * Can be used to modify a given color
 */
export const replaceColorStrings = (
  original: string,
  new_color: `var(--mantine-color${string})`
) =>
  original.replace(/rgba\(0, 0, 0, ([\d]\.[\d]+)\)/g, (_, transparency) =>
    alpha(new_color, transparency)
  );
