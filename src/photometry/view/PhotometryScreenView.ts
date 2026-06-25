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
import { DerivedProperty, Multilink, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Dimension2, type Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { CanvasNode, Circle, HBox, Node, Rectangle, RichText, type TColor, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Checkbox, NumberPicker, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { CCDField } from "../../common/model/CCDField.js";
import { OBSERVATIONS } from "../../common/model/StarFieldData.js";
import VSPConstants from "../../VSPConstants.js";
import { ApertureNode } from "../../common/view/ApertureNode.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import VSPColors from "../../VSPColors.js";
import {
  ANNULUS_INNER_RANGE,
  ANNULUS_OUTER_RANGE,
  APERTURE_DIAMETER_RANGE,
  type PhotometryModel,
} from "../model/PhotometryModel.js";

const FIELD_W = VSPConstants.FIELD.WIDTH;
const FIELD_H = VSPConstants.FIELD.HEIGHT;
const APERTURE_PREVIEW_SIZE = 170;
const APERTURE_PREVIEW_FIELD_SIZE = 90;
const APERTURE_PREVIEW_SCALE = APERTURE_PREVIEW_SIZE / APERTURE_PREVIEW_FIELD_SIZE;

const LABEL_FONT = new PhetFont(VSPConstants.FONT_SIZE.LABEL);
const HEADER_FONT = new PhetFont({ size: VSPConstants.FONT_SIZE.HEADER, weight: "bold" });
const MONO_FONT = new PhetFont(VSPConstants.FONT_SIZE.LABEL);

const FIELD = CCDField.getInstance();

/**
 * Zoomed view around an aperture centre. The image comes from the display render,
 * while the numbers continue to use raw CCD counts from the model.
 */
class AperturePreviewNode extends CanvasNode {
  private readonly buffer: HTMLCanvasElement;
  private readonly bufferContext: CanvasRenderingContext2D;

  private obsIndex: number;
  private apertureCenter: Vector2;

  public constructor(epochIndexProperty: TReadOnlyProperty<number>, centerProperty: TReadOnlyProperty<Vector2>) {
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

    // Repaint when the projector/default profile changes the preview background.
    VSPColors.aperturePreviewBackgroundColorProperty.lazyLink(() => this.invalidatePaint());
  }

  private updateBuffer(): void {
    this.bufferContext.putImageData(FIELD.render(this.obsIndex), 0, 0);
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    context.fillStyle = VSPColors.aperturePreviewBackgroundColorProperty.value.toCSS();
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
    const strings = StringManager.getInstance().getPhotometryViewStrings();
    const unitStrings = StringManager.getInstance().getUnitStrings();

    // -----------------------------------------------------------------------
    // Star field + aperture overlays
    // -----------------------------------------------------------------------
    const starField = new StarFieldNode(model.epochIndexProperty.value);
    model.epochIndexProperty.link((index) => starField.setObservation(index));

    const fieldClip = new Node({
      clipArea: Shape.rectangle(0, 0, FIELD_W, FIELD_H),
      children: [starField],
    });
    const frame = new Rectangle(0, 0, FIELD_W, FIELD_H, {
      stroke: VSPColors.controlPanelStrokeProperty,
      lineWidth: 1,
    });

    // Transform from model (CCD pixel) space to field-container view space.
    // VSP renders the star field at 1:1 pixel scale, so this is an identity
    // transform. It makes the model–view coordinate relationship explicit and
    // allows future scale changes without hunting through event handlers.
    const fieldMVT = ModelViewTransform2.createIdentity();

    // Aperture radius = half the diameter; annulus properties are already radii.
    const apertureRadiusProperty = new DerivedProperty([model.apertureDiameterProperty], (d) => d / 2);
    const dragBounds = new Bounds2(0, 0, FIELD_W, FIELD_H);

    const aperture1 = new ApertureNode(
      model.aperture1CenterProperty,
      apertureRadiusProperty,
      model.annulusInnerRadiusProperty,
      model.annulusOuterRadiusProperty,
      {
        dragBounds,
        color: VSPColors.aperturePrimaryColorProperty,
        label: "1",
        labelVisibleProperty: model.labelAperturesProperty,
        modelViewTransform: fieldMVT,
      },
    );
    const aperture2 = new ApertureNode(
      model.aperture2CenterProperty,
      apertureRadiusProperty,
      model.annulusInnerRadiusProperty,
      model.annulusOuterRadiusProperty,
      {
        dragBounds,
        color: VSPColors.apertureSecondaryColorProperty,
        label: "2",
        labelVisibleProperty: model.labelAperturesProperty,
        modelViewTransform: fieldMVT,
      },
    );

    const fieldContainer = new Node({ children: [fieldClip, frame, aperture1, aperture2] });

    // -----------------------------------------------------------------------
    // Field controls: epoch picker, aperture/annulus sizes, label toggle
    // -----------------------------------------------------------------------
    const epochPicker = new NumberPicker(model.epochIndexProperty, model.epochIndexProperty.rangeProperty, {
      font: LABEL_FONT,
      color: VSPColors.panelTextColorProperty,
      incrementFunction: (v) => v + 1,
      decrementFunction: (v) => v - 1,
    });

    const epochDaysProperty = new PatternStringProperty(unitStrings.daysPatternStringProperty, {
      value: new DerivedProperty([model.epochIndexProperty], (index) => {
        const obs = OBSERVATIONS[index];
        return obs ? obs.epoch.toFixed(4) : "";
      }),
    });
    const epochReadout = new Text(
      new PatternStringProperty(strings.epochValueStringProperty, { value: epochDaysProperty }),
      { font: LABEL_FONT },
    );

    const epochRow = new HBox({
      spacing: 8,
      align: "center",
      children: [new Text(strings.observationStringProperty, { font: LABEL_FONT }), epochPicker, epochReadout],
    });

    const numberControlOptions = {
      titleNodeOptions: { font: LABEL_FONT },
      numberDisplayOptions: { textOptions: { font: LABEL_FONT } },
      sliderOptions: { trackSize: new Dimension2(120, 3) },
      layoutFunction: NumberControl.createLayoutFunction1(),
    };

    const apertureControl = new NumberControl(
      strings.apertureDiameterStringProperty,
      model.apertureDiameterProperty,
      APERTURE_DIAMETER_RANGE,
      numberControlOptions,
    );
    const skyInnerControl = new NumberControl(
      strings.skyInnerRadiusStringProperty,
      model.annulusInnerRadiusProperty,
      ANNULUS_INNER_RANGE,
      numberControlOptions,
    );
    const skyOuterControl = new NumberControl(
      strings.skyOuterRadiusStringProperty,
      model.annulusOuterRadiusProperty,
      ANNULUS_OUTER_RANGE,
      numberControlOptions,
    );

    const labelCheckbox = new Checkbox(
      model.labelAperturesProperty,
      new Text(strings.labelAperturesStringProperty, { font: LABEL_FONT }),
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
    leftColumn.left = VSPConstants.LAYOUT.SCREEN_MARGIN;
    leftColumn.top = VSPConstants.LAYOUT.SCREEN_MARGIN;
    this.addChild(leftColumn);

    // -----------------------------------------------------------------------
    // Right column: per-aperture info + magnitude-difference formula
    // -----------------------------------------------------------------------
    const makeApertureInfoPanel = (
      title: TReadOnlyProperty<string>,
      color: TColor,
      centerProperty: typeof model.aperture1CenterProperty,
      photometryProperty: typeof model.aperture1PhotometryProperty,
    ): Node => {
      const previewImage = new AperturePreviewNode(model.epochIndexProperty, centerProperty);
      const previewFrame = new Rectangle(0, 0, APERTURE_PREVIEW_SIZE, APERTURE_PREVIEW_SIZE, {
        stroke: VSPColors.controlPanelStrokeProperty,
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

      const pattern = (
        patternProperty: TReadOnlyProperty<string>,
        valueProperty: TReadOnlyProperty<string>,
      ): TReadOnlyProperty<string> => new PatternStringProperty(patternProperty, { value: valueProperty });

      const centerXText = new Text(
        pattern(
          strings.centerXStringProperty,
          new DerivedProperty([centerProperty], (center) => String(Math.round(center.x))),
        ),
        { font: LABEL_FONT },
      );
      const centerYText = new Text(
        pattern(
          strings.centerYStringProperty,
          new DerivedProperty([centerProperty], (center) => String(Math.round(center.y))),
        ),
        { font: LABEL_FONT },
      );

      const previewColumn = new VBox({
        spacing: 4,
        align: "center",
        children: [preview, centerXText, centerYText],
      });

      const discPixels = new Text(
        pattern(
          strings.numPixelsStringProperty,
          new DerivedProperty([photometryProperty], (r) => String(r.disc.totalPixels)),
        ),
        { font: LABEL_FONT },
      );
      const discCounts = new Text(
        pattern(
          strings.countsValueStringProperty,
          new DerivedProperty([photometryProperty], (r) => r.disc.totalCounts.toFixed(0)),
        ),
        { font: LABEL_FONT },
      );
      const discAverage = new Text(
        pattern(
          strings.averageValueStringProperty,
          new DerivedProperty([photometryProperty], (r) => r.disc.average.toFixed(2)),
        ),
        { font: LABEL_FONT },
      );
      const skyPixels = new Text(
        pattern(
          strings.numPixelsStringProperty,
          new DerivedProperty([photometryProperty], (r) => String(r.sky.totalPixels)),
        ),
        { font: LABEL_FONT },
      );
      const skyCounts = new Text(
        pattern(
          strings.countsValueStringProperty,
          new DerivedProperty([photometryProperty], (r) => r.sky.totalCounts.toFixed(0)),
        ),
        { font: LABEL_FONT },
      );
      const skyAverage = new Text(
        pattern(
          strings.averageValueStringProperty,
          new DerivedProperty([photometryProperty], (r) => r.sky.average.toFixed(2)),
        ),
        { font: LABEL_FONT },
      );

      const statsColumn = new VBox({
        spacing: 8,
        align: "left",
        children: [
          new Text(strings.innerDiscStringProperty, { font: HEADER_FONT }),
          new VBox({ spacing: 3, align: "right", children: [discPixels, discCounts, discAverage] }),
          new Rectangle(0, 0, 1, 16),
          new Text(strings.outerRingStringProperty, { font: HEADER_FONT }),
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
        fill: VSPColors.controlPanelFillProperty,
        stroke: VSPColors.controlPanelStrokeProperty,
        cornerRadius: VSPConstants.LAYOUT.PANEL_CORNER_RADIUS,
        xMargin: VSPConstants.LAYOUT.PANEL_X_MARGIN,
        yMargin: VSPConstants.LAYOUT.PANEL_Y_MARGIN,
      });
    };

    const aperture1Info = makeApertureInfoPanel(
      new PatternStringProperty(strings.apertureInfoStringProperty, { number: 1 }),
      VSPColors.aperturePrimaryColorProperty,
      model.aperture1CenterProperty,
      model.aperture1PhotometryProperty,
    );
    const aperture2Info = makeApertureInfoPanel(
      new PatternStringProperty(strings.apertureInfoStringProperty, { number: 2 }),
      VSPColors.apertureSecondaryColorProperty,
      model.aperture2CenterProperty,
      model.aperture2PhotometryProperty,
    );

    const magnitudeText = new RichText("", { font: MONO_FONT, lineWrap: 240 });
    Multilink.multilink(
      [
        model.aperture1PhotometryProperty,
        model.aperture2PhotometryProperty,
        model.magnitudeDifferenceProperty,
        unitStrings.countsStringProperty,
        unitStrings.magnitudesStringProperty,
        strings.netFluxNonPositiveStringProperty,
      ],
      (p1, p2, deltaMag, countsWord, magWord, netFluxNonPositive) => {
        const lines = [
          `f<sub>1</sub> = ${p1.netFlux.toFixed(0)} ${countsWord}`,
          `f<sub>2</sub> = ${p2.netFlux.toFixed(0)} ${countsWord}`,
          `m<sub>1</sub> − m<sub>2</sub> = −2.5 log<sub>10</sub>(f<sub>1</sub>/f<sub>2</sub>)`,
          deltaMag === null
            ? `         = — (${netFluxNonPositive})`
            : `         = ${deltaMag >= 0 ? "+" : ""}${deltaMag.toFixed(3)} ${magWord}`,
        ];
        magnitudeText.string = lines.join("<br>");
      },
    );

    const magnitudeSection = new VBox({
      spacing: 6,
      align: "left",
      children: [new Text(strings.magnitudeDifferenceStringProperty, { font: HEADER_FONT }), magnitudeText],
    });

    const magnitudePanel = new Panel(magnitudeSection, {
      fill: VSPColors.controlPanelFillProperty,
      stroke: VSPColors.controlPanelStrokeProperty,
      cornerRadius: VSPConstants.LAYOUT.PANEL_CORNER_RADIUS,
      xMargin: VSPConstants.LAYOUT.PANEL_X_MARGIN,
      yMargin: VSPConstants.LAYOUT.PANEL_Y_MARGIN,
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
      right: this.layoutBounds.maxX - VSPConstants.LAYOUT.RESET_BUTTON_MARGIN,
      bottom: this.layoutBounds.maxY - VSPConstants.LAYOUT.RESET_BUTTON_MARGIN,
      tandem: tandem.createTandem("resetAllButton"),
    });
    this.addChild(resetAllButton);
  }
}
