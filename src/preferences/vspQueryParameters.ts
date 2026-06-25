/**
 * vspQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * ── How to add a query parameter ──────────────────────────────────────────────
 * 1. Add an entry below with a `type`, `defaultValue`, and (if user-facing)
 *    `public: true`. Add `isValidValue` to bound numeric ranges.
 * 2. If it should also be user-editable at runtime, surface it as a preference
 *    in VSPPreferencesModel (initialize that Property from this query parameter).
 *
 * Usage: append e.g. `?showGrid=true` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import VSPNamespace from "../VSPNamespace.js";

const vspQueryParameters = QueryStringMachine.getAll({
  /** Display grid lines over the star field. */
  showGrid: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /** Display CCD images inverted (dark stars on light background). */
  invertImages: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },
});

VSPNamespace.register("vspQueryParameters", vspQueryParameters);

logGlobal("phet.chipper.queryParameters");

export default vspQueryParameters;
