/**
 * PhotometryScreenView.ts
 *
 * View for the Photometry screen.
 *
 * Layout
 * ┌────────────────────────────────┬──────────────────────────────┐
 * │  Star field (380 × 290)        │  Aperture 1 Info             │
 * │  [aperture 1 + 2 overlays]     │  Aperture 2 Info             │
 * │  observation: [picker] epoch   │  ──────────────────────────  │
 * │  aperture / annulus sliders    │  Magnitude Difference        │
 * │  [x] label the apertures       │  m₁ − m₂ = −2.5 log₁₀(f₁/f₂) │
 * └────────────────────────────────┴──────────────────────────────┘
 *                                                       [Reset All]
 */
import { DerivedProperty, Multilink } from "scenerystack/axon";
import { Bounds2, Dimension2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { HBox, Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Checkbox, NumberPicker, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import type { PhotometryResult } from "../../common/model/AperturePhotometry.js";
import { OBSERVATIONS } from "../../common/model/StarFieldData.js";
import { ApertureNode } from "../../common/view/ApertureNode.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import {
  ANNULUS_INNER_RANGE,
  ANNULUS_OUTER_RANGE,
  APERTURE_DIAMETER_RANGE,
  EPOCH_INDEX_RANGE,
  type PhotometryModel,
} from "../model/PhotometryModel.js";

const FIELD_W = 380;
const FIELD_H = 290;

const LABEL_FONT = new PhetFont(13);
const HEADER_FONT = new PhetFont({ size: 14, weight: "bold" });
const MONO_FONT = new PhetFont(13);

const APERTURE_1_COLOR = "#ffe066"; // variable
const APERTURE_2_COLOR = "#4fc3f7"; // comparison

/** Format an observation index as its epoch label, e.g. "8.7525 days". */
function epochLabel(obsIndex: number): string {
  const obs = OBSERVATIONS[obsIndex];
  return obs ? `${obs.epoch.toFixed(4)} days` : "—";
}

/** Multi-line read-out of one aperture's disc + sky + net-flux statistics. */
function describeAperture(result: PhotometryResult): string {
  const { disc, sky, netFlux } = result;
  return [
    `Inner disc: ${disc.totalPixels} px,  ${disc.totalCounts.toFixed(0)} counts`,
    `Sky annulus: ${sky.totalPixels} px,  ${sky.average.toFixed(1)} /px`,
    `Net flux: ${netFlux.toFixed(0)} counts`,
  ].join("\n");
}

export class PhotometryScreenView extends ScreenView {
  public constructor(model: PhotometryModel, options?: ScreenViewOptions) {
    super(options);

    const tandem = options?.tandem instanceof Tandem ? options.tandem : Tandem.OPT_OUT;

    // -----------------------------------------------------------------------
    // Star field + aperture overlays
    // -----------------------------------------------------------------------
    const starField = new StarFieldNode(model.epochIndexProperty.value);
    model.epochIndexProperty.link((index) => starField.setObservation(index));

    const fieldClip = new Node({
      clipArea: Shape.rectangle(0, 0, FIELD_W, FIELD_H),
      children: [starField],
    });
    const frame = new Rectangle(0, 0, FIELD_W, FIELD_H, { stroke: "#888", lineWidth: 1 });

    // Aperture radius = half the diameter; annulus properties are already radii.
    const apertureRadiusProperty = new DerivedProperty([model.apertureDiameterProperty], (d) => d / 2);
    const dragBounds = new Bounds2(0, 0, FIELD_W, FIELD_H);

    const aperture1 = new ApertureNode(
      model.aperture1CenterProperty,
      apertureRadiusProperty,
      model.annulusInnerRadiusProperty,
      model.annulusOuterRadiusProperty,
      { dragBounds, color: APERTURE_1_COLOR, label: "1", labelVisibleProperty: model.labelAperturesProperty },
    );
    const aperture2 = new ApertureNode(
      model.aperture2CenterProperty,
      apertureRadiusProperty,
      model.annulusInnerRadiusProperty,
      model.annulusOuterRadiusProperty,
      { dragBounds, color: APERTURE_2_COLOR, label: "2", labelVisibleProperty: model.labelAperturesProperty },
    );

    const fieldContainer = new Node({ children: [fieldClip, frame, aperture1, aperture2] });

    // -----------------------------------------------------------------------
    // Field controls: epoch picker, aperture/annulus sizes, label toggle
    // -----------------------------------------------------------------------
    const epochPicker = new NumberPicker(model.epochIndexProperty, model.epochIndexProperty.rangeProperty, {
      font: LABEL_FONT,
      color: "black",
      incrementFunction: (v) => v + 1,
      decrementFunction: (v) => v - 1,
    });

    const epochReadout = new Text(`epoch: ${epochLabel(model.epochIndexProperty.value)}`, { font: LABEL_FONT });
    model.epochIndexProperty.link((index) => {
      epochReadout.string = `epoch: ${epochLabel(index)}`;
    });

    const epochRow = new HBox({
      spacing: 8,
      align: "center",
      children: [new Text("observation:", { font: LABEL_FONT }), epochPicker, epochReadout],
    });

    const numberControlOptions = {
      titleNodeOptions: { font: LABEL_FONT },
      numberDisplayOptions: { textOptions: { font: LABEL_FONT } },
      sliderOptions: { trackSize: new Dimension2(120, 3) },
      layoutFunction: NumberControl.createLayoutFunction1(),
    };

    const apertureControl = new NumberControl(
      "aperture diameter",
      model.apertureDiameterProperty,
      APERTURE_DIAMETER_RANGE,
      numberControlOptions,
    );
    const skyInnerControl = new NumberControl(
      "sky inner radius",
      model.annulusInnerRadiusProperty,
      ANNULUS_INNER_RANGE,
      numberControlOptions,
    );
    const skyOuterControl = new NumberControl(
      "sky outer radius",
      model.annulusOuterRadiusProperty,
      ANNULUS_OUTER_RANGE,
      numberControlOptions,
    );

    const labelCheckbox = new Checkbox(
      model.labelAperturesProperty,
      new Text("label the apertures", { font: LABEL_FONT }),
      { boxWidth: 16 },
    );

    const fieldControls = new VBox({
      spacing: 8,
      align: "left",
      children: [epochRow, apertureControl, skyInnerControl, skyOuterControl, labelCheckbox],
    });

    const leftColumn = new VBox({
      spacing: 12,
      align: "left",
      children: [fieldContainer, fieldControls],
    });
    leftColumn.left = 20;
    leftColumn.top = 20;
    this.addChild(leftColumn);

    // -----------------------------------------------------------------------
    // Right column: per-aperture info + magnitude-difference formula
    // -----------------------------------------------------------------------
    const makeApertureInfo = (
      title: string,
      color: string,
      photometryProperty: typeof model.aperture1PhotometryProperty,
    ): Node => {
      const body = new Text("", { font: MONO_FONT });
      photometryProperty.link((result) => {
        body.string = describeAperture(result);
      });
      return new VBox({
        spacing: 4,
        align: "left",
        children: [new Text(title, { font: HEADER_FONT, fill: color }), body],
      });
    };

    const aperture1Info = makeApertureInfo(
      "Aperture 1 (variable)",
      APERTURE_1_COLOR,
      model.aperture1PhotometryProperty,
    );
    const aperture2Info = makeApertureInfo(
      "Aperture 2 (comparison)",
      APERTURE_2_COLOR,
      model.aperture2PhotometryProperty,
    );

    const magnitudeText = new RichText("", { font: MONO_FONT, lineWrap: 240 });
    Multilink.multilink(
      [model.aperture1PhotometryProperty, model.aperture2PhotometryProperty, model.magnitudeDifferenceProperty],
      (p1, p2, deltaMag) => {
        const lines = [
          `f<sub>1</sub> = ${p1.netFlux.toFixed(0)} counts`,
          `f<sub>2</sub> = ${p2.netFlux.toFixed(0)} counts`,
          `m<sub>1</sub> − m<sub>2</sub> = −2.5 log<sub>10</sub>(f<sub>1</sub>/f<sub>2</sub>)`,
          deltaMag === null
            ? "         = — (net flux ≤ 0)"
            : `         = ${deltaMag >= 0 ? "+" : ""}${deltaMag.toFixed(3)} mag`,
        ];
        magnitudeText.string = lines.join("<br>");
      },
    );

    const magnitudeSection = new VBox({
      spacing: 6,
      align: "left",
      children: [new Text("Magnitude Difference", { font: HEADER_FONT }), magnitudeText],
    });

    const infoContent = new VBox({
      spacing: 16,
      align: "left",
      children: [
        aperture1Info,
        aperture2Info,
        new Rectangle(0, 0, 1, 1), // spacer
        magnitudeSection,
      ],
    });

    const infoPanel = new Panel(infoContent, {
      fill: "#f0f0f0",
      stroke: "#888",
      cornerRadius: 6,
      xMargin: 12,
      yMargin: 12,
    });
    infoPanel.left = leftColumn.right + 25;
    infoPanel.top = leftColumn.top;
    this.addChild(infoPanel);

    // -----------------------------------------------------------------------
    // Reset All
    // -----------------------------------------------------------------------
    const resetAllButton = new ResetAllButton({
      listener: () => model.reset(),
      right: this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10,
      tandem: tandem.createTandem("resetAllButton"),
    });
    this.addChild(resetAllButton);
  }

  public override step(dt: number): void {
    super.step(dt);
  }
}
