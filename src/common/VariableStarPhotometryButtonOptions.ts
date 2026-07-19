/**
 * VariableStarPhotometryButtonOptions.ts
 *
 * Shared flat button appearance for the sim. Rectangular push buttons and
 * ResetAllButton default to SceneryStack's 3-D/beveled appearance; spread these
 * options into a button's constructor options for a flat look everywhere. This
 * does not set `baseColor` — call sites keep their existing semantic colors
 * from VariableStarPhotometryColors (buttonColorProperty, buttonAddColorProperty, etc.) and just
 * layer the flat appearance strategy on top.
 */

import { ButtonNode } from "scenerystack/sun";

export const FLAT_BUTTON_APPEARANCE_OPTIONS = {
  buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
} as const;

/** Options for RectangularPushButton / TextPushButton. */
export const FLAT_RECTANGULAR_BUTTON_OPTIONS = FLAT_BUTTON_APPEARANCE_OPTIONS;

/** Options for ResetAllButton (extends RoundPushButton). */
export const FLAT_RESET_ALL_BUTTON_OPTIONS = FLAT_BUTTON_APPEARANCE_OPTIONS;
