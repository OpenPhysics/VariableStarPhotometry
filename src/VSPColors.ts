/**
 * VSPColors.ts
 *
 * All dynamic colors for the Variable Star Photometry simulation.
 * Each color has "default" (dark, night-sky) and "projector" (light) profiles.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import VSPNamespace from "./VSPNamespace.js";

const VSPColors = {
  /** Deep night-sky background. */
  backgroundColorProperty: new ProfileColorProperty(VSPNamespace, "background", {
    default: "#0a0a1a",
    projector: "#ffffff",
  }),

  /** Sky/field-of-view background for the CCD image panel. */
  fieldBackgroundColorProperty: new ProfileColorProperty(VSPNamespace, "fieldBackground", {
    default: "#000005",
    projector: "#f0f0f0",
  }),

  /** Accent — aperture rings, interactive highlights, chart lines. */
  accentColorProperty: new ProfileColorProperty(VSPNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#0077b6",
  }),

  /** Secondary accent for comparison-star apertures. */
  comparisonApertureColorProperty: new ProfileColorProperty(VSPNamespace, "comparisonAperture", {
    default: "#a8e6cf",
    projector: "#1b6b3a",
  }),

  /** Variable-star aperture ring color. */
  variableApertureColorProperty: new ProfileColorProperty(VSPNamespace, "variableAperture", {
    default: "#ffe066",
    projector: "#b87800",
  }),

  /** Background fill for control panels and dialogs. */
  panelBackgroundColorProperty: new ProfileColorProperty(VSPNamespace, "panelBackground", {
    default: "#0f0f2a",
    projector: "#f5f5f5",
  }),

  /** Border/stroke color for panels. */
  panelBorderColorProperty: new ProfileColorProperty(VSPNamespace, "panelBorder", {
    default: "#1a3a6b",
    projector: "#999999",
  }),

  /** General UI text color. */
  textColorProperty: new ProfileColorProperty(VSPNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  /** Light-curve plot line color. */
  lightCurveColorProperty: new ProfileColorProperty(VSPNamespace, "lightCurve", {
    default: "#4fc3f7",
    projector: "#0077b6",
  }),

  /** Chart / plot background. */
  chartBackgroundColorProperty: new ProfileColorProperty(VSPNamespace, "chartBackground", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Chart grid line color. */
  chartGridColorProperty: new ProfileColorProperty(VSPNamespace, "chartGrid", {
    default: "#cccccc",
    projector: "#aaaaaa",
  }),
};

export default VSPColors;
