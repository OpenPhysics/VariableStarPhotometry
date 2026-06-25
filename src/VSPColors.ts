/**
 * VSPColors.ts
 *
 * All dynamic colors for the Variable Star Photometry simulation, each defined
 * once as a ProfileColorProperty keyed off the sim namespace. Keys are named by
 * *role* (not appearance) so views never hardcode a hex/rgb literal.
 *
 * Every color provides a "default" profile (the standard look: a dark night-sky
 * screen background with light control panels, matching the NAAP reference) and
 * a "projector" profile (higher-contrast, light background for classroom
 * projectors). Color literals are permitted here and nowhere else.
 */
import { Color, ProfileColorProperty } from "scenerystack/scenery";
import VSPNamespace from "./VSPNamespace.js";

// Shared local literals — reused below so a given shade is written once.
const BLACK = new Color("#000000");
const WHITE = new Color("#ffffff");
const NIGHT_SKY = new Color("#0a0a1a");
const PANEL_TEXT = new Color("#222222");

const VSPColors = {
  // ---------------------------------------------------------------------------
  // Screen + CCD field backgrounds
  // ---------------------------------------------------------------------------

  /** Deep night-sky screen background. */
  backgroundColorProperty: new ProfileColorProperty(VSPNamespace, "background", {
    default: NIGHT_SKY,
    projector: WHITE,
  }),

  /** Sky/field-of-view background behind the CCD image panel. */
  fieldBackgroundColorProperty: new ProfileColorProperty(VSPNamespace, "fieldBackground", {
    default: new Color("#000005"),
    projector: new Color("#f0f0f0"),
  }),

  /** Background fill behind a zoomed aperture preview. */
  aperturePreviewBackgroundColorProperty: new ProfileColorProperty(VSPNamespace, "aperturePreviewBackground", {
    default: new Color("#202020"),
    projector: new Color("#202020"),
  }),

  // ---------------------------------------------------------------------------
  // Control panels and tables (light surfaces over the dark screen background)
  // ---------------------------------------------------------------------------

  /** Fill for control panels and info boxes. */
  controlPanelFillProperty: new ProfileColorProperty(VSPNamespace, "controlPanelFill", {
    default: new Color("#f0f0f0"),
    projector: WHITE,
  }),

  /** Stroke/border for panels and star-field frames. */
  controlPanelStrokeProperty: new ProfileColorProperty(VSPNamespace, "controlPanelStroke", {
    default: new Color("#888888"),
    projector: new Color("#333333"),
  }),

  /** Background fill for preferences and dialogs. */
  panelBackgroundColorProperty: new ProfileColorProperty(VSPNamespace, "panelBackground", {
    default: new Color("#0f0f2a"),
    projector: new Color("#f5f5f5"),
  }),

  /** Fill for a table header row. */
  tableHeaderFillProperty: new ProfileColorProperty(VSPNamespace, "tableHeaderFill", {
    default: new Color("#eeeeee"),
    projector: new Color("#e0e0e0"),
  }),

  /** Fill for a normal (unselected) table row. */
  tableRowFillProperty: new ProfileColorProperty(VSPNamespace, "tableRowFill", {
    default: WHITE,
    projector: WHITE,
  }),

  /** Alternate table-row fill for zebra striping. */
  tableRowAltFillProperty: new ProfileColorProperty(VSPNamespace, "tableRowAltFill", {
    default: new Color("#fafafa"),
    projector: new Color("#f4f4f4"),
  }),

  /** Fill highlighting the currently selected table row. */
  selectionFillProperty: new ProfileColorProperty(VSPNamespace, "selectionFill", {
    default: new Color("#8fd3f4"),
    projector: new Color("#7ec8ef"),
  }),

  /** Stroke for table frames and grid lines within tables. */
  tableStrokeProperty: new ProfileColorProperty(VSPNamespace, "tableStroke", {
    default: new Color("#cccccc"),
    projector: new Color("#999999"),
  }),

  /** Thin divider lines inside control tables. */
  dividerColorProperty: new ProfileColorProperty(VSPNamespace, "divider", {
    default: new Color("#dddddd"),
    projector: new Color("#bbbbbb"),
  }),

  // ---------------------------------------------------------------------------
  // Text
  // ---------------------------------------------------------------------------

  /** Primary UI text on the dark screen background (e.g. preferences). */
  textColorProperty: new ProfileColorProperty(VSPNamespace, "text", {
    default: new Color("#e0e0e0"),
    projector: new Color("#1a1a1a"),
  }),

  /** Primary text drawn on light control panels. */
  panelTextColorProperty: new ProfileColorProperty(VSPNamespace, "panelText", {
    default: PANEL_TEXT,
    projector: BLACK,
  }),

  /** Secondary/muted text (hints, column headers, captions). */
  mutedTextColorProperty: new ProfileColorProperty(VSPNamespace, "mutedText", {
    default: new Color("#555555"),
    projector: new Color("#444444"),
  }),

  // ---------------------------------------------------------------------------
  // Buttons
  // ---------------------------------------------------------------------------

  /** Neutral push-button base color. */
  buttonColorProperty: new ProfileColorProperty(VSPNamespace, "button", {
    default: new Color("#d4d4d4"),
    projector: new Color("#cccccc"),
  }),

  /** Base color for secondary/neutral list buttons. */
  buttonNeutralColorProperty: new ProfileColorProperty(VSPNamespace, "buttonNeutral", {
    default: new Color("#e6e6e6"),
    projector: new Color("#dddddd"),
  }),

  /** Base color for the "add to queue" action button. */
  buttonAddColorProperty: new ProfileColorProperty(VSPNamespace, "buttonAdd", {
    default: new Color("#d7edf8"),
    projector: new Color("#c4e4f5"),
  }),

  /** Base color for an active/engaged button (blinking, zoom). */
  buttonActiveColorProperty: new ProfileColorProperty(VSPNamespace, "buttonActive", {
    default: new Color("#cfe8ff"),
    projector: new Color("#aed6f7"),
  }),

  /** Base color for the "snap to best fit" button. */
  buttonSnapColorProperty: new ProfileColorProperty(VSPNamespace, "buttonSnap", {
    default: new Color("#b6e3b6"),
    projector: new Color("#9cd69c"),
  }),

  // ---------------------------------------------------------------------------
  // Star-field overlays, markers, and apertures
  // ---------------------------------------------------------------------------

  /** Border around a non-highlighted star-field image. */
  fieldBorderColorProperty: new ProfileColorProperty(VSPNamespace, "fieldBorder", {
    default: new Color("#909090"),
    projector: new Color("#707070"),
  }),

  /** Border around the star-field image currently "on top". */
  fieldBorderHighlightColorProperty: new ProfileColorProperty(VSPNamespace, "fieldBorderHighlight", {
    default: new Color("#ff9090"),
    projector: new Color("#d23b3b"),
  }),

  /** Pointer-following crosshair drawn over a star field. */
  crosshairColorProperty: new ProfileColorProperty(VSPNamespace, "crosshair", {
    default: new Color("#ff5050"),
    projector: new Color("#d62728"),
  }),

  /** Aperture 1 (variable target) ring color. */
  aperturePrimaryColorProperty: new ProfileColorProperty(VSPNamespace, "aperturePrimary", {
    default: new Color("#ffe066"),
    projector: new Color("#b87800"),
  }),

  /** Aperture 2 (comparison target) ring color. */
  apertureSecondaryColorProperty: new ProfileColorProperty(VSPNamespace, "apertureSecondary", {
    default: new Color("#4fc3f7"),
    projector: new Color("#0077b6"),
  }),

  /** Marker for a selected variable star (green circle). */
  variableStarColorProperty: new ProfileColorProperty(VSPNamespace, "variableStar", {
    default: new Color("#7cfc7c"),
    projector: new Color("#1b7a1b"),
  }),

  /** Marker for a selected comparison star (blue square). */
  comparisonStarColorProperty: new ProfileColorProperty(VSPNamespace, "comparisonStar", {
    default: new Color("#5ab4ff"),
    projector: new Color("#0066cc"),
  }),

  /** Dot marking the active frame in the blink queue. */
  queueMarkerColorProperty: new ProfileColorProperty(VSPNamespace, "queueMarker", {
    default: new Color("#ff3030"),
    projector: new Color("#cc0000"),
  }),

  /** Arrow glyphs in the blink-queue transfer controls. */
  transferArrowColorProperty: new ProfileColorProperty(VSPNamespace, "transferArrow", {
    default: new Color("#666666"),
    projector: new Color("#444444"),
  }),

  // ---------------------------------------------------------------------------
  // Charts (bamboo plots)
  // ---------------------------------------------------------------------------

  /** Plot/chart background. */
  chartBackgroundColorProperty: new ProfileColorProperty(VSPNamespace, "chartBackground", {
    default: WHITE,
    projector: WHITE,
  }),

  /** Chart border/axis stroke. */
  chartStrokeColorProperty: new ProfileColorProperty(VSPNamespace, "chartStroke", {
    default: new Color("#333333"),
    projector: BLACK,
  }),

  /** Chart grid-line color. */
  chartGridColorProperty: new ProfileColorProperty(VSPNamespace, "chartGrid", {
    default: new Color("#e0e0e0"),
    projector: new Color("#cccccc"),
  }),

  /** Scatter-plot point color (observations plot). */
  scatterPointColorProperty: new ProfileColorProperty(VSPNamespace, "scatterPoint", {
    default: new Color("#1f77b4"),
    projector: new Color("#185a8a"),
  }),

  /** Light-curve / PDM line color. */
  lightCurveColorProperty: new ProfileColorProperty(VSPNamespace, "lightCurve", {
    default: new Color("#0077b6"),
    projector: new Color("#005a8c"),
  }),

  /** Vertical trial-period marker on the PDM plot. */
  pdmMarkerColorProperty: new ProfileColorProperty(VSPNamespace, "pdmMarker", {
    default: new Color("#d62728"),
    projector: new Color("#a31f20"),
  }),

  /** Faint vertical lines marking integer multiples of the trial period. */
  periodMultipleColorProperty: new ProfileColorProperty(VSPNamespace, "periodMultiple", {
    default: new Color(214, 39, 40, 0.35),
    projector: new Color(163, 31, 32, 0.35),
  }),

  /** Draggable difference-tool bars on the observations plot. */
  deltaBarColorProperty: new ProfileColorProperty(VSPNamespace, "deltaBar", {
    default: new Color("#909090"),
    projector: new Color("#666666"),
  }),

  /** Shaded band between the difference-tool bars. */
  deltaFillColorProperty: new ProfileColorProperty(VSPNamespace, "deltaFill", {
    default: new Color(160, 160, 160, 0.18),
    projector: new Color(120, 120, 120, 0.18),
  }),
} as const;

export default VSPColors;
