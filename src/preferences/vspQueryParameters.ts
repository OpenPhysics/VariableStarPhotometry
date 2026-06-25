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
  // ── General ─────────────────────────────────────────────────────────────────

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

  // ── Blink Comparator ────────────────────────────────────────────────────────

  /**
   * Initial frame-flip interval for the Blink Comparator, in milliseconds.
   * Must be within [200, 2000]. Example: `?blinkIntervalMs=300`
   */
  blinkIntervalMs: {
    type: "number",
    defaultValue: 600,
    isValidValue: (v: number) => v >= 200 && v <= 2000,
    public: true,
  },

  /**
   * Whether the mouse-tracking crosshair is shown in the Blink Comparator.
   * Example: `?showCrosshair=false`
   */
  showCrosshair: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },

  // ── Photometry ──────────────────────────────────────────────────────────────

  /**
   * Initial aperture diameter for the Photometry screen, in field pixels.
   * Must be within [6, 30]. Example: `?apertureDiameter=20`
   */
  apertureDiameter: {
    type: "number",
    defaultValue: 14,
    isValidValue: (v: number) => v >= 6 && v <= 30,
    public: true,
  },

  // ── Analyzer ────────────────────────────────────────────────────────────────

  /**
   * Initial trial period for the PDM Analyzer, in days.
   * Must be within [0.1, 100]. Example: `?trialPeriod=5.366`
   */
  trialPeriod: {
    type: "number",
    defaultValue: 1.0,
    isValidValue: (v: number) => v >= 0.1 && v <= 100,
    public: true,
  },

  /**
   * Initial light-curve display mode in the Analyzer.
   * "time" shows raw Julian dates; "phase" shows phase-folded data.
   * Example: `?lightCurveMode=phase`
   */
  lightCurveMode: {
    type: "string",
    defaultValue: "time",
    validValues: ["time", "phase"],
    public: true,
  },
});

VSPNamespace.register("vspQueryParameters", vspQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default vspQueryParameters;
