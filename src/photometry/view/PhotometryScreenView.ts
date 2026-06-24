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
import { DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Dimension2, type Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { CanvasNode, Circle, HBox, Node, Rectangle, RichText, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Checkbox, NumberPicker, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { CCDField } from "../../common/model/CCDField.js";
import { OBSERVATIONS } from "../../common/model/StarFieldData.js";
import { ApertureNode } from "../../common/view/ApertureNode.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import {
  ANNULUS_INNER_RANGE,
  ANNULUS_OUTER_RANGE,
  APERTURE_DIAMETER_RANGE,
  type PhotometryModel,
} from "../model/PhotometryModel.js";

const FIELD_W = 380;
const FIELD_H = 290;
const APERTURE_PREVIEW_SIZE = 170;
const APERTURE_PREVIEW_FIELD_SIZE = 90;
const APERTURE_PREVIEW_SCALE = APERTURE_PREVIEW_SIZE / APERTURE_PREVIEW_FIELD_SIZE;

const LABEL_FONT = new PhetFont(13);
const HEADER_FONT = new PhetFont({ size: 14, weight: "bold" });
const MONO_FONT = new PhetFont(13);

const APERTURE_1_COLOR = "#ffe066"; // variable
const APERTURE_2_COLOR = "#4fc3f7"; // comparison
const FIELD = CCDField.getInstance();

/** Format an observation index as its epoch label, e.g. "8.7525 days". */
function epochLabel(obsIndex: number): string {
  const obs = OBSERVATIONS[obsIndex];
  return obs ? `${obs.epoch.toFixed(4)} days` : "—";
}

/**
 * Zoomed view around an aperture centre. The image comes from the display render,
 * while the numbers continue to use raw CCD counts from the model.
 */
class AperturePreviewNode extends CanvasNode {
  private readonly buffer: HTMLCanvasElement;
  private readonly bufferContext: CanvasRenderingContext2D;

  private obsIndex: number;
  private apertureCenter: Vector2;

  public constructor(
    epochIndexProperty: TReadOnlyProperty<number>,
    centerProperty: TReadOnlyProperty<Vector2>,
  ) {
    super({
      canvasBounds: new Bounds2(0, 0, APERTURE_PREVIEW_SIZE, APERTURE_PREVIEW_SIZE),
    });

    this.obsIndex = epochIndexProperty.value;
    this.apertureCenter = centerProperty.value;

    this.buffer = document.createElement("canvas");
    this.buffer.width = FIELD_W;
    this.buffer.height = FIELD_H;
    const context = this.buffer.getContext("2d");
    if (!context) {
      throw new Error("AperturePreviewNode: unable to obtain a 2D canvas context");
    }
    this.bufferContext = context;
    this.updateBuffer();

    epochIndexProperty.link((index) => {
      this.obsIndex = index;
      this.updateBuffer();
      this.invalidatePaint();
    });
    centerProperty.link((center) => {
      this.apertureCenter = center;
      this.invalidatePaint();
    });
  }

  private updateBuffer(): void {
    this.bufferContext.putImageData(FIELD.render(this.obsIndex), 0, 0);
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#202020";
    context.fillRect(0, 0, APERTURE_PREVIEW_SIZE, APERTURE_PREVIEW_SIZE);

    const half = APERTURE_PREVIEW_FIELD_SIZE / 2;
    const cropLeft = Math.round(this.apertureCenter.x - half);
    const cropTop = Math.round(this.apertureCenter.y - half);
    const sx = Math.max(0, cropLeft);
    const sy = Math.max(0, cropTop);
    const sx2 = Math.min(FIELD_W, cropLeft + APERTURE_PREVIEW_FIELD_SIZE);
    const sy2 = Math.min(FIELD_H, cropTop + APERTURE_PREVIEW_FIELD_SIZE);
    const sourceWidth = sx2 - sx;
    const sourceHeight = sy2 - sy;

    if (sourceWidth <= 0 || sourceHeight <= 0) {
      return;
    }

    context.imageSmoothingEnabled = false;
    context.drawImage(
      this.buffer,
      sx,
      sy,
      sourceWidth,
      sourceHeight,
      (sx - cropLeft) * APERTURE_PREVIEW_SCALE,
      (sy - cropTop) * APERTURE_PREVIEW_SCALE,
      sourceWidth * APERTURE_PREVIEW_SCALE,
      sourceHeight * APERTURE_PREVIEW_SCALE,
    );
  }
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
    const makeApertureInfoPanel = (
      title: string,
      color: string,
      centerProperty: typeof model.aperture1CenterProperty,
      photometryProperty: typeof model.aperture1PhotometryProperty,
    ): Node => {
      const previewImage = new AperturePreviewNode(model.epochIndexProperty, centerProperty);
      const previewFrame = new Rectangle(0, 0, APERTURE_PREVIEW_SIZE, APERTURE_PREVIEW_SIZE, {
        stroke: "#888",
        lineWidth: 1,
      });
      const previewClip = new Node({
        clipArea: Shape.rectangle(0, 0, APERTURE_PREVIEW_SIZE, APERTURE_PREVIEW_SIZE),
        children: [previewImage],
      });

      const previewApertureRadiusProperty = new DerivedProperty(
        [apertureRadiusProperty],
        (radius) => radius * APERTURE_PREVIEW_SCALE,
      );
      const previewAnnulusInnerRadiusProperty = new DerivedProperty(
        [model.annulusInnerRadiusProperty],
        (radius) => radius * APERTURE_PREVIEW_SCALE,
      );
      const previewAnnulusOuterRadiusProperty = new DerivedProperty(
        [model.annulusOuterRadiusProperty],
        (radius) => radius * APERTURE_PREVIEW_SCALE,
      );

      const apertureRing = new Circle(previewApertureRadiusProperty.value, {
        centerX: APERTURE_PREVIEW_SIZE / 2,
        centerY: APERTURE_PREVIEW_SIZE / 2,
        stroke: color,
        lineWidth: 1.5,
        fill: null,
      });
      const annulusInnerRing = new Circle(previewAnnulusInnerRadiusProperty.value, {
        centerX: APERTURE_PREVIEW_SIZE / 2,
        centerY: APERTURE_PREVIEW_SIZE / 2,
        stroke: color,
        lineWidth: 1,
        fill: null,
      });
      const annulusOuterRing = new Circle(previewAnnulusOuterRadiusProperty.value, {
        centerX: APERTURE_PREVIEW_SIZE / 2,
        centerY: APERTURE_PREVIEW_SIZE / 2,
        stroke: color,
        lineWidth: 1,
        fill: null,
      });
      previewApertureRadiusProperty.link((radius) => {
        apertureRing.radius = radius;
      });
      previewAnnulusInnerRadiusProperty.link((radius) => {
        annulusInnerRing.radius = radius;
      });
      previewAnnulusOuterRadiusProperty.link((radius) => {
        annulusOuterRing.radius = radius;
      });

      const preview = new Node({
        children: [previewClip, previewFrame, annulusOuterRing, annulusInnerRing, apertureRing],
      });

      const centerXText = new Text("", { font: LABEL_FONT });
      const centerYText = new Text("", { font: LABEL_FONT });
      centerProperty.link((center) => {
        centerXText.string = `center x: ${Math.round(center.x)}`;
        centerYText.string = `center y: ${Math.round(center.y)}`;
      });

      const previewColumn = new VBox({
        spacing: 4,
        align: "center",
        children: [preview, centerXText, centerYText],
      });

      const discPixels = new Text("", { font: LABEL_FONT });
      const discCounts = new Text("", { font: LABEL_FONT });
      const discAverage = new Text("", { font: LABEL_FONT });
      const skyPixels = new Text("", { font: LABEL_FONT });
      const skyCounts = new Text("", { font: LABEL_FONT });
      const skyAverage = new Text("", { font: LABEL_FONT });
      photometryProperty.link((result) => {
        discPixels.string = `numPixels: ${result.disc.totalPixels}`;
        discCounts.string = `counts: ${result.disc.totalCounts.toFixed(0)}`;
        discAverage.string = `average: ${result.disc.average.toFixed(2)}`;
        skyPixels.string = `numPixels: ${result.sky.totalPixels}`;
        skyCounts.string = `counts: ${result.sky.totalCounts.toFixed(0)}`;
        skyAverage.string = `average: ${result.sky.average.toFixed(2)}`;
      });

      const statsColumn = new VBox({
        spacing: 8,
        align: "left",
        children: [
          new Text("Inner Disc", { font: HEADER_FONT }),
          new VBox({ spacing: 3, align: "right", children: [discPixels, discCounts, discAverage] }),
          new Rectangle(0, 0, 1, 16),
          new Text("Outer Ring", { font: HEADER_FONT }),
          new VBox({ spacing: 3, align: "right", children: [skyPixels, skyCounts, skyAverage] }),
        ],
      });

      const panelContent = new VBox({
        spacing: 8,
        align: "left",
        children: [
          new Text(title, { font: HEADER_FONT }),
          new HBox({ spacing: 24, align: "top", children: [previewColumn, statsColumn] }),
        ],
      });

      return new Panel(panelContent, {
        fill: "#f0f0f0",
        stroke: "#888",
        cornerRadius: 2,
        xMargin: 10,
        yMargin: 8,
      });
    };

    const aperture1Info = makeApertureInfoPanel(
      "Aperture 1 Info",
      APERTURE_1_COLOR,
      model.aperture1CenterProperty,
      model.aperture1PhotometryProperty,
    );
    const aperture2Info = makeApertureInfoPanel(
      "Aperture 2 Info",
      APERTURE_2_COLOR,
      model.aperture2CenterProperty,
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

    const magnitudePanel = new Panel(magnitudeSection, {
      fill: "#f0f0f0",
      stroke: "#888",
      cornerRadius: 2,
      xMargin: 10,
      yMargin: 8,
    });

    const rightColumn = new VBox({
      spacing: 8,
      align: "left",
      children: [aperture1Info, aperture2Info, magnitudePanel],
    });
    rightColumn.left = leftColumn.right + 12;
    rightColumn.top = leftColumn.top;
    this.addChild(rightColumn);

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
