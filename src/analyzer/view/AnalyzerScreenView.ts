/**
 * AnalyzerScreenView.ts
 *
 * View for the Analyzer screen.
 *
 * Layout
 * ┌─────────────────────────────┬────────────────────────────────┐
 * │  Star field (380 × 290)     │  Observations plot (Δmag vs     │
 * │  click: variable, then comp │  Julian date / phase)           │
 * │  ○ variable  □ comparison   │  light-curve type: ○ time ○phase │
 * ├─────────────────────────────┴────────────────────────────────┤
 * │  PDM Plot — θ vs trial period          [zoom in] [zoom out]   │
 * │  trial period: N.NNNN days             [full] [undo]          │
 * │  ┌──────────────────────────────────────────────────────────┐ │
 * │  │  θ vs period (draggable period marker)                    │ │
 * │  └──────────────────────────────────────────────────────────┘ │
 * └────────────────────────────────────────────────────[Reset All]┘
 */
import { BooleanProperty, DerivedProperty, Multilink, NumberProperty, PatternStringProperty } from "scenerystack/axon";
import {
  ChartRectangle,
  ChartTransform,
  GridLineSet,
  LinePlot,
  ScatterPlot,
  TickLabelSet,
  TickMarkSet,
} from "scenerystack/bamboo";
import { Dimension2, Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { SceneryEvent } from "scenerystack/scenery";
import { Circle, DragListener, HBox, Line, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { bestPeriod } from "../../common/model/PDMCalculator.js";
import { FieldGridNode } from "../../common/view/FieldGridNode.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../../preferences/VSPPreferencesModel.js";
import VSPColors from "../../VSPColors.js";
import VSPConstants from "../../VSPConstants.js";
import { type AnalyzerModel, type LightCurveMode, PERIOD_RANGE, PHASE_OFFSET_RANGE } from "../model/AnalyzerModel.js";

const FIELD_W = VSPConstants.FIELD.WIDTH;
const FIELD_H = VSPConstants.FIELD.HEIGHT;

const LABEL_FONT = new PhetFont(VSPConstants.FONT_SIZE.LABEL);
const HEADER_FONT = new PhetFont({ size: VSPConstants.FONT_SIZE.HEADER, weight: "bold" });
const TICK_FONT = new PhetFont(VSPConstants.FONT_SIZE.TICK);
const SMALL_FONT = new PhetFont(VSPConstants.FONT_SIZE.SMALL);

/** Pick a round axis spacing that yields roughly `target` ticks across `span`. */
function niceSpacing(span: number, target = 5): number {
  if (span <= 0) {
    return 1;
  }
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const nice = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return nice * mag;
}

/** Number of decimals to show for a tick spacing. */
function decimalsFor(spacing: number): number {
  return spacing >= 1 ? 0 : Math.ceil(-Math.log10(spacing));
}

export class AnalyzerScreenView extends ScreenView {
  public constructor(model: AnalyzerModel, preferences: VSPPreferencesModel, options?: ScreenViewOptions) {
    super(options);

    const tandem = options?.tandem instanceof Tandem ? options.tandem : Tandem.OPT_OUT;
    const strings = StringManager.getInstance().getAnalyzerViewStrings();
    const unitStrings = StringManager.getInstance().getUnitStrings();
    const a11yControls = StringManager.getInstance().getAnalyzerA11yStrings().controls;
    const showCrosshairProperty = new BooleanProperty(true);
    const showDifferenceToolProperty = new BooleanProperty(false);

    // =======================================================================
    // Star field with click-to-select + crosshair + selection markers
    // =======================================================================

    // Transform from model (CCD pixel) space to field-container view space.
    // The field is rendered at 1:1 scale so the transform is identity.
    // Used to convert pointer clicks from view coordinates back to model
    // coordinates when the student selects variable/comparison stars.
    const fieldMVT = ModelViewTransform2.createIdentity();

    const starField = new StarFieldNode(0, preferences.invertImagesProperty.value);
    preferences.invertImagesProperty.link((invert) => starField.setObservation(0, invert));
    const fieldClip = new Node({
      clipArea: Shape.rectangle(0, 0, FIELD_W, FIELD_H),
      children: [starField],
    });
    const grid = new FieldGridNode(FIELD_W, FIELD_H, preferences.showGridProperty);
    const frame = new Rectangle(0, 0, FIELD_W, FIELD_H, {
      stroke: VSPColors.controlPanelStrokeProperty,
      lineWidth: 1,
    });

    // Selection markers.
    const variableMarker = new Circle(8, { stroke: VSPColors.variableStarColorProperty, lineWidth: 2, visible: false });
    const comparisonMarker = new Rectangle(-7, -7, 14, 14, {
      stroke: VSPColors.comparisonStarColorProperty,
      lineWidth: 2,
      visible: false,
    });
    model.variableStarPositionProperty.link((p) => {
      variableMarker.visible = p !== null;
      if (p) {
        variableMarker.translation = fieldMVT.modelToViewPosition(p);
      }
    });
    model.comparisonStarPositionProperty.link((p) => {
      comparisonMarker.visible = p !== null;
      if (p) {
        comparisonMarker.translation = fieldMVT.modelToViewPosition(p);
      }
    });

    // Crosshair following the pointer.
    const crosshairH = new Line(0, 0, FIELD_W, 0, { stroke: VSPColors.crosshairColorProperty, lineWidth: 1 });
    const crosshairV = new Line(0, 0, 0, FIELD_H, { stroke: VSPColors.crosshairColorProperty, lineWidth: 1 });
    const crosshair = new Node({ children: [crosshairH, crosshairV], pickable: false, visible: false });

    // Coordinate readout near the crosshair (matching Flash's xField/yField).
    const crosshairCoordText = new Text("", {
      font: new PhetFont({ size: 10, family: "monospace" }),
      fill: VSPColors.crosshairColorProperty,
      pickable: false,
    });
    const crosshairCoordBg = new Rectangle(0, 0, 1, 1, {
      fill: VSPColors.controlPanelFillProperty,
      stroke: VSPColors.crosshairColorProperty,
      lineWidth: 0.5,
      cornerRadius: 2,
      pickable: false,
    });
    const crosshairCoords = new Node({
      children: [crosshairCoordBg, crosshairCoordText],
      pickable: false,
      visible: false,
    });

    const hitArea = new Rectangle(0, 0, FIELD_W, FIELD_H, { fill: "transparent", cursor: "crosshair" });
    let pointerInside = false;
    const updateCrosshairVisible = () => {
      const visible = showCrosshairProperty.value && pointerInside;
      crosshair.visible = visible;
      crosshairCoords.visible = visible;
    };
    showCrosshairProperty.link(updateCrosshairVisible);
    hitArea.addInputListener({
      enter: () => {
        pointerInside = true;
        updateCrosshairVisible();
      },
      exit: () => {
        pointerInside = false;
        updateCrosshairVisible();
      },
      move: (event: SceneryEvent) => {
        const viewPoint = hitArea.globalToLocalPoint(event.pointer.point);
        crosshairH.y = viewPoint.y;
        crosshairV.x = viewPoint.x;

        // Update coordinate readout (clamped to field bounds like Flash).
        const px = Math.max(0, Math.min(FIELD_W - 1, Math.round(viewPoint.x)));
        const py = Math.max(0, Math.min(FIELD_H - 1, Math.round(viewPoint.y)));
        crosshairCoordText.string = `${px}, ${py}`;
        crosshairCoordBg.setRect(0, 0, crosshairCoordText.width + 6, crosshairCoordText.height + 4);
        crosshairCoordText.x = 3;
        crosshairCoordText.y = 2;
        // Position to the right of the cursor, or left if too close to the edge.
        if (viewPoint.x + 15 + crosshairCoordBg.width < FIELD_W) {
          crosshairCoords.x = viewPoint.x + 15;
        } else {
          crosshairCoords.x = viewPoint.x - 15 - crosshairCoordBg.width;
        }
        crosshairCoords.y = Math.max(
          0,
          Math.min(FIELD_H - crosshairCoordBg.height, viewPoint.y - crosshairCoordBg.height / 2),
        );
      },
      down: (event: SceneryEvent) => {
        // Convert the pointer position from field-container view space to model
        // (CCD pixel) space before passing to the model.
        const viewPoint = hitArea.globalToLocalPoint(event.pointer.point);
        const modelPoint = fieldMVT.viewToModelPosition(viewPoint);
        model.selectStarAt(new Vector2(Math.round(modelPoint.x), Math.round(modelPoint.y)));
      },
    });

    const fieldContainer = new Node({
      children: [fieldClip, grid, frame, variableMarker, comparisonMarker, crosshair, crosshairCoords, hitArea],
    });

    // Legend + controls beneath the field.
    const legend = new HBox({
      spacing: 16,
      children: [
        new HBox({
          spacing: 5,
          children: [
            new Circle(6, { stroke: VSPColors.variableStarColorProperty, lineWidth: 2 }),
            new Text(strings.variableStringProperty, { font: SMALL_FONT }),
          ],
        }),
        new HBox({
          spacing: 5,
          children: [
            new Rectangle(-5, -5, 10, 10, { stroke: VSPColors.comparisonStarColorProperty, lineWidth: 2 }),
            new Text(strings.comparisonStringProperty, { font: SMALL_FONT }),
          ],
        }),
      ],
    });

    const instructions = new Text(strings.selectHintStringProperty, {
      font: SMALL_FONT,
      fill: VSPColors.mutedTextColorProperty,
    });
    const clearButton = new TextPushButton(strings.clearSelectionStringProperty, {
      font: SMALL_FONT,
      baseColor: VSPColors.buttonColorProperty,
      listener: () => model.clearSelections(),
      accessibleName: strings.clearSelectionStringProperty,
    });
    const crosshairCheckbox = new Checkbox(
      showCrosshairProperty,
      new Text(strings.showCrosshairsStringProperty, { font: SMALL_FONT }),
      { boxWidth: 14, accessibleName: strings.showCrosshairsStringProperty },
    );

    const leftColumn = new VBox({
      spacing: 8,
      align: "left",
      children: [
        fieldContainer,
        legend,
        instructions,
        new HBox({ spacing: 12, children: [clearButton, crosshairCheckbox] }),
      ],
    });
    leftColumn.left = VSPConstants.LAYOUT.SCREEN_MARGIN;
    leftColumn.top = VSPConstants.LAYOUT.SCREEN_MARGIN;
    this.addChild(leftColumn);

    // =======================================================================
    // Observations plot (Δmag vs Julian date / phase)
    // =======================================================================
    const OBS_W = 470;
    const OBS_H = 250;
    const OBS_TIME_RANGE = new Range(1, 22);
    const obsTransform = new ChartTransform({
      viewWidth: OBS_W,
      viewHeight: OBS_H,
      modelXRange: OBS_TIME_RANGE.copy(),
      modelYRange: new Range(0, 1),
      modelYRangeInverted: true, // brighter (smaller magnitude) at the top
    });

    const obsBackground = new ChartRectangle(obsTransform, {
      fill: VSPColors.chartBackgroundColorProperty,
      stroke: VSPColors.chartStrokeColorProperty,
    });
    const obsGridX = new GridLineSet(obsTransform, Orientation.HORIZONTAL, 5, {
      stroke: VSPColors.chartGridColorProperty,
    });
    const obsGridY = new GridLineSet(obsTransform, Orientation.VERTICAL, 0.2, {
      stroke: VSPColors.chartGridColorProperty,
    });
    const obsTickX = new TickMarkSet(obsTransform, Orientation.HORIZONTAL, 5, { edge: "min" });
    const obsTickY = new TickMarkSet(obsTransform, Orientation.VERTICAL, 0.2, { edge: "min" });
    const obsLabelX = new TickLabelSet(obsTransform, Orientation.HORIZONTAL, 5, {
      edge: "min",
      createLabel: (v: number) => new Text(v.toFixed(0), { font: TICK_FONT }),
    });
    const obsLabelY = new TickLabelSet(obsTransform, Orientation.VERTICAL, 0.2, {
      edge: "min",
      createLabel: (v: number) => new Text(v.toFixed(2), { font: TICK_FONT }),
    });

    const scatter = new ScatterPlot(obsTransform, [], { radius: 2.5, fill: VSPColors.scatterPointColorProperty });
    const periodMultipleLayer = new Node({ pickable: false });
    const obsPlotLayer = new Node({
      clipArea: Shape.rectangle(0, 0, OBS_W, OBS_H),
      children: [periodMultipleLayer, scatter],
    });

    // Flash DeltaMagOverlay equivalent: two draggable horizontal bars whose
    // separation reports a magnitude difference in the current plot scale.
    let deltaBar1Y = OBS_H * 0.35;
    let deltaBar2Y = OBS_H * 0.65;
    const deltaBar1 = new Line(0, deltaBar1Y, OBS_W, deltaBar1Y, {
      stroke: VSPColors.deltaBarColorProperty,
      lineWidth: 1,
    });
    const deltaBar2 = new Line(0, deltaBar2Y, OBS_W, deltaBar2Y, {
      stroke: VSPColors.deltaBarColorProperty,
      lineWidth: 1,
    });
    const deltaFill = new Rectangle(0, 0, OBS_W, 0, { fill: VSPColors.deltaFillColorProperty, pickable: false });

    // Magnitude separation reported by the difference tool (bound to its label).
    const deltaMagProperty = new NumberProperty(0);
    const deltaText = new Text(
      new PatternStringProperty(unitStrings.magPatternStringProperty, {
        value: new DerivedProperty([deltaMagProperty], (v) => v.toFixed(2)),
      }),
      {
        font: SMALL_FONT,
        fill: VSPColors.panelTextColorProperty,
        pickable: false,
      },
    );

    const updateDeltaOverlay = () => {
      const hasMeasurements = model.measurementsProperty.value.length > 0;
      const showOverlay = hasMeasurements && showDifferenceToolProperty.value;
      deltaBar1.visible = showOverlay;
      deltaBar2.visible = showOverlay;
      deltaFill.visible = showOverlay;
      deltaText.visible = showOverlay;
      deltaBar1Hit.visible = showOverlay;
      deltaBar2Hit.visible = showOverlay;
      if (!showOverlay) {
        return;
      }

      const y1 = Math.max(0, Math.min(OBS_H, deltaBar1Y));
      const y2 = Math.max(0, Math.min(OBS_H, deltaBar2Y));
      deltaBar1.setLine(0, y1, OBS_W, y1);
      deltaBar2.setLine(0, y2, OBS_W, y2);

      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      deltaFill.setRect(0, top, OBS_W, bottom - top);

      const mag1 = obsTransform.viewToModelY(y1);
      const mag2 = obsTransform.viewToModelY(y2);
      deltaMagProperty.value = Math.abs(mag2 - mag1);
      deltaText.centerX = OBS_W / 2;
      deltaText.bottom = Math.max(14, top - 4);
    };

    const makeDeltaBarHitTarget = (which: 1 | 2): Rectangle => {
      const hit = new Rectangle(0, 0, OBS_W, 12, { fill: "transparent", cursor: "ns-resize" });
      const setBarFromEvent = (event: SceneryEvent) => {
        const local = hit.globalToLocalPoint(event.pointer.point);
        const y = Math.max(0, Math.min(OBS_H, hit.y + local.y));
        if (which === 1) {
          deltaBar1Y = y;
        } else {
          deltaBar2Y = y;
        }
        updateDeltaOverlayAndHits();
      };
      hit.addInputListener(
        new DragListener({
          start: (event) => setBarFromEvent(event),
          drag: (event) => setBarFromEvent(event),
        }),
      );
      return hit;
    };

    const deltaBar1Hit = makeDeltaBarHitTarget(1);
    const deltaBar2Hit = makeDeltaBarHitTarget(2);
    const updateDeltaHitTargets = () => {
      deltaBar1Hit.top = deltaBar1Y - 6;
      deltaBar2Hit.top = deltaBar2Y - 6;
    };
    const deltaOverlay = new Node({
      clipArea: Shape.rectangle(0, 0, OBS_W, OBS_H),
      children: [deltaFill, deltaBar1, deltaBar2, deltaText, deltaBar1Hit, deltaBar2Hit],
    });
    const updateDeltaOverlayAndHits = () => {
      updateDeltaOverlay();
      updateDeltaHitTargets();
    };

    const obsEmptyMsg = new Text(strings.selectBothStarsStringProperty, {
      font: SMALL_FONT,
      fill: VSPColors.mutedTextColorProperty,
      center: new Vector2(OBS_W / 2, OBS_H / 2),
    });

    const updatePeriodMultipleMarkers = () => {
      const measurements = model.measurementsProperty.value;
      const period = model.trialPeriodProperty.value;
      const offset = model.phaseOffsetProperty.value;
      const mode = model.lightCurveModeProperty.value;

      if (measurements.length === 0 || mode !== "time" || !Number.isFinite(period) || period <= 0) {
        periodMultipleLayer.children = [];
        return;
      }

      const lines: Line[] = [];
      const firstMultiple = Math.ceil((OBS_TIME_RANGE.min - offset) / period);
      const lastMultiple = Math.floor((OBS_TIME_RANGE.max - offset) / period);
      for (let multiple = firstMultiple; multiple <= lastMultiple; multiple++) {
        const epoch = offset + multiple * period;
        const x = obsTransform.modelToViewX(epoch);
        lines.push(new Line(x, 0, x, OBS_H, { stroke: VSPColors.periodMultipleColorProperty, lineWidth: 1 }));
      }
      periodMultipleLayer.children = lines;
    };

    const obsChart = new Node({
      children: [
        obsBackground,
        obsGridX,
        obsGridY,
        obsPlotLayer,
        deltaOverlay,
        obsTickX,
        obsTickY,
        obsLabelX,
        obsLabelY,
        obsEmptyMsg,
      ],
    });

    const updateObservations = () => {
      const measurements = model.measurementsProperty.value;
      obsEmptyMsg.visible = measurements.length === 0;
      if (measurements.length === 0) {
        scatter.setDataSet([]);
        updatePeriodMultipleMarkers();
        updateDeltaOverlayAndHits();
        return;
      }
      const mode = model.lightCurveModeProperty.value;
      const data = measurements.map(
        (m) => new Vector2(mode === "time" ? m.epoch : model.getPhase(m.epoch), m.magnitude),
      );

      // Magnitude (y) range from the data, with padding.
      let yMin = Infinity;
      let yMax = -Infinity;
      for (const m of measurements) {
        yMin = Math.min(yMin, m.magnitude);
        yMax = Math.max(yMax, m.magnitude);
      }
      const pad = Math.max(0.05, (yMax - yMin) * 0.1);
      obsTransform.setModelYRange(new Range(yMin - pad, yMax + pad));
      const ySpacing = niceSpacing(yMax - yMin + 2 * pad);
      const yd = decimalsFor(ySpacing);
      obsGridY.setSpacing(ySpacing);
      obsTickY.setSpacing(ySpacing);
      obsLabelY.setSpacing(ySpacing);
      obsLabelY.setCreateLabel((v: number) => new Text(v.toFixed(yd), { font: TICK_FONT }));

      if (mode === "time") {
        obsTransform.setModelXRange(OBS_TIME_RANGE.copy());
        obsGridX.setSpacing(5);
        obsTickX.setSpacing(5);
        obsLabelX.setSpacing(5);
        obsLabelX.setCreateLabel((v: number) => new Text(v.toFixed(0), { font: TICK_FONT }));
      } else {
        obsTransform.setModelXRange(new Range(0, 1));
        obsGridX.setSpacing(0.25);
        obsTickX.setSpacing(0.25);
        obsLabelX.setSpacing(0.25);
        obsLabelX.setCreateLabel((v: number) => new Text(v.toFixed(2), { font: TICK_FONT }));
      }

      updatePeriodMultipleMarkers();
      scatter.setDataSet(data);
      updateDeltaOverlayAndHits();
    };
    Multilink.multilink(
      [
        model.measurementsProperty,
        model.lightCurveModeProperty,
        model.trialPeriodProperty,
        model.phaseOffsetProperty,
        showDifferenceToolProperty,
      ],
      () => updateObservations(),
    );

    const obsTitle = new Text(strings.observationsStringProperty, { font: HEADER_FONT });
    const obsYLabel = new Text(strings.differentialMagnitudeStringProperty, {
      font: SMALL_FONT,
      rotation: -Math.PI / 2,
    });
    const obsXLabel = new Text(
      new DerivedProperty(
        [model.lightCurveModeProperty, strings.julianDateStringProperty, strings.phaseStringProperty],
        (mode, julianDate, phase) => (mode === "time" ? julianDate : phase),
      ),
      { font: SMALL_FONT },
    );

    const modeRadioGroup = new AquaRadioButtonGroup<LightCurveMode>(
      model.lightCurveModeProperty,
      [
        {
          value: "time",
          createNode: () => new Text(strings.timeStringProperty, { font: LABEL_FONT }),
          options: { accessibleName: strings.timeStringProperty },
        },
        {
          value: "phase",
          createNode: () => new Text(strings.phaseStringProperty, { font: LABEL_FONT }),
          options: { accessibleName: strings.phaseStringProperty },
        },
      ],
      {
        orientation: "horizontal",
        spacing: 16,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11yControls.lightCurveModeStringProperty,
      },
    );

    const phaseOffsetControl = new NumberControl(
      strings.phaseOffsetStringProperty,
      model.phaseOffsetProperty,
      PHASE_OFFSET_RANGE,
      {
        titleNodeOptions: { font: SMALL_FONT },
        numberDisplayOptions: { textOptions: { font: SMALL_FONT } },
        sliderOptions: { trackSize: new Dimension2(120, 3) },
        layoutFunction: NumberControl.createLayoutFunction1(),
        accessibleName: strings.phaseOffsetStringProperty,
      },
    );
    const differenceToolCheckbox = new Checkbox(
      showDifferenceToolProperty,
      new Text(strings.showDifferenceToolStringProperty, { font: LABEL_FONT }),
      { boxWidth: 16, accessibleName: strings.showDifferenceToolStringProperty },
    );

    // Assemble observations panel (title, [y-label | chart], x-label, radios).
    const obsChartRow = new HBox({ spacing: 4, align: "center", children: [obsYLabel, obsChart] });
    const obsModeRow = new HBox({
      spacing: 8,
      align: "center",
      children: [new Text(strings.lightCurveStringProperty, { font: LABEL_FONT }), modeRadioGroup],
    });
    const obsToolRow = new HBox({
      spacing: 16,
      align: "center",
      children: [phaseOffsetControl, differenceToolCheckbox],
    });
    const obsColumn = new VBox({
      spacing: 6,
      align: "center",
      children: [obsTitle, obsChartRow, obsXLabel, obsModeRow, obsToolRow],
    });
    obsColumn.left = leftColumn.right + 30;
    obsColumn.top = VSPConstants.LAYOUT.SCREEN_MARGIN;
    this.addChild(obsColumn);

    // =======================================================================
    // PDM plot (θ vs trial period) with draggable period marker + zoom
    // =======================================================================
    const PDM_W = 880;
    const PDM_H = 150;
    const pdmTransform = new ChartTransform({
      viewWidth: PDM_W,
      viewHeight: PDM_H,
      modelXRange: model.pdmZoomRangeProperty.value.copy(),
      modelYRange: new Range(0, 1.2),
    });

    const pdmBackground = new ChartRectangle(pdmTransform, {
      fill: VSPColors.chartBackgroundColorProperty,
      stroke: VSPColors.chartStrokeColorProperty,
    });
    const pdmGridX = new GridLineSet(pdmTransform, Orientation.HORIZONTAL, 1, {
      stroke: VSPColors.chartGridColorProperty,
    });
    const pdmGridY = new GridLineSet(pdmTransform, Orientation.VERTICAL, 0.2, {
      stroke: VSPColors.chartGridColorProperty,
    });
    const pdmTickX = new TickMarkSet(pdmTransform, Orientation.HORIZONTAL, 1, { edge: "min" });
    const pdmTickY = new TickMarkSet(pdmTransform, Orientation.VERTICAL, 0.2, { edge: "min" });
    const pdmLabelX = new TickLabelSet(pdmTransform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      createLabel: (v: number) => new Text(v.toFixed(1), { font: TICK_FONT }),
    });
    const pdmLabelY = new TickLabelSet(pdmTransform, Orientation.VERTICAL, 0.2, {
      edge: "min",
      createLabel: (v: number) => new Text(v.toFixed(1), { font: TICK_FONT }),
    });

    const pdmLine = new LinePlot(pdmTransform, [], { stroke: VSPColors.lightCurveColorProperty, lineWidth: 1.5 });
    const periodMarker = new Line(0, 0, 0, PDM_H, { stroke: VSPColors.pdmMarkerColorProperty, lineWidth: 2 });
    const pdmZoomSelection = new Rectangle(0, 0, 0, PDM_H, {
      fill: VSPColors.pdmZoomSelectionFillProperty,
      stroke: VSPColors.pdmMarkerColorProperty,
      lineWidth: 1,
      visible: false,
      pickable: false,
    });
    const pdmPlotLayer = new Node({
      clipArea: Shape.rectangle(0, 0, PDM_W, PDM_H),
      children: [pdmLine, pdmZoomSelection, periodMarker],
    });

    const pdmEmptyMsg = new Text(strings.noLightCurveStringProperty, {
      font: SMALL_FONT,
      fill: VSPColors.mutedTextColorProperty,
      center: new Vector2(PDM_W / 2, PDM_H / 2),
    });

    // Click selects a trial period; drag creates the Flash-style rubber-band zoom window.
    const pdmHit = new Rectangle(0, 0, PDM_W, PDM_H, { fill: "transparent", cursor: "ew-resize" });
    const PDM_DRAG_ZOOM_THRESHOLD = 6;
    let pdmDragStartX = 0;
    let pdmDragCurrentX = 0;
    const clampPdmViewX = (x: number) => Math.max(0, Math.min(PDM_W, x));
    const setPeriodFromViewX = (viewX: number) => {
      const zoom = model.pdmZoomRangeProperty.value;
      const period = pdmTransform.viewToModelX(viewX);
      model.trialPeriodProperty.value = Math.max(zoom.min, Math.min(zoom.max, period));
    };
    const updatePdmZoomSelection = () => {
      const left = Math.min(pdmDragStartX, pdmDragCurrentX);
      const width = Math.abs(pdmDragCurrentX - pdmDragStartX);
      pdmZoomSelection.setRect(left, 0, width, PDM_H);
      pdmZoomSelection.visible = width >= PDM_DRAG_ZOOM_THRESHOLD;
    };
    const pdmViewXFromEvent = (event: SceneryEvent) => {
      const local = pdmHit.globalToLocalPoint(event.pointer.point);
      return clampPdmViewX(local.x);
    };
    pdmHit.addInputListener(
      new DragListener({
        start: (event) => {
          pdmDragStartX = pdmViewXFromEvent(event);
          pdmDragCurrentX = pdmDragStartX;
          pdmZoomSelection.visible = false;
        },
        drag: (event) => {
          pdmDragCurrentX = pdmViewXFromEvent(event);
          updatePdmZoomSelection();
        },
        end: () => {
          const width = Math.abs(pdmDragCurrentX - pdmDragStartX);
          pdmZoomSelection.visible = false;
          if (width >= PDM_DRAG_ZOOM_THRESHOLD) {
            model.zoomToPeriodRange(
              pdmTransform.viewToModelX(pdmDragStartX),
              pdmTransform.viewToModelX(pdmDragCurrentX),
            );
          } else {
            setPeriodFromViewX(pdmDragStartX);
          }
        },
      }),
    );

    const pdmChart = new Node({
      children: [
        pdmBackground,
        pdmGridX,
        pdmGridY,
        pdmPlotLayer,
        pdmTickX,
        pdmTickY,
        pdmLabelX,
        pdmLabelY,
        pdmHit,
        pdmEmptyMsg,
      ],
    });

    const updatePdmAxes = () => {
      const zoom = model.pdmZoomRangeProperty.value;
      pdmTransform.setModelXRange(zoom.copy());
      const spacing = niceSpacing(zoom.max - zoom.min);
      const xd = decimalsFor(spacing);
      pdmGridX.setSpacing(spacing);
      pdmTickX.setSpacing(spacing);
      pdmLabelX.setSpacing(spacing);
      pdmLabelX.setCreateLabel((v: number) => new Text(v.toFixed(xd), { font: TICK_FONT }));
    };

    const updatePdmData = () => {
      const scan = model.pdmScanResultsProperty.value;
      pdmEmptyMsg.visible = scan.length === 0;
      pdmLine.setDataSet(scan.map((p) => new Vector2(p.period, Math.min(1.2, p.theta))));
    };

    const updateMarker = () => {
      const x = pdmTransform.modelToViewX(model.trialPeriodProperty.value);
      periodMarker.setLine(x, 0, x, PDM_H);
      periodMarker.visible = x >= 0 && x <= PDM_W;
    };

    model.pdmZoomRangeProperty.link(() => {
      updatePdmAxes();
      updatePdmData();
      updateMarker();
    });
    model.pdmScanResultsProperty.link(() => updatePdmData());
    model.trialPeriodProperty.link(() => updateMarker());

    // PDM controls: period input + zoom buttons.
    const periodControl = new NumberControl(
      strings.trialPeriodStringProperty,
      model.trialPeriodProperty,
      PERIOD_RANGE,
      {
        titleNodeOptions: { font: LABEL_FONT },
        numberDisplayOptions: {
          textOptions: { font: LABEL_FONT },
          decimalPlaces: 4,
        },
        sliderOptions: { trackSize: new Dimension2(120, 3) },
        layoutFunction: NumberControl.createLayoutFunction1(),
        accessibleName: strings.trialPeriodAxisStringProperty,
      },
    );

    const bestPeriodReadout = new Text(
      new DerivedProperty([model.pdmScanResultsProperty, strings.bestPeriodPatternStringProperty], (scan, pattern) => {
        const best = bestPeriod(scan);
        return best === null ? "" : pattern.replace("{{value}}", best.toFixed(4));
      }),
      { font: SMALL_FONT, fill: VSPColors.mutedTextColorProperty },
    );

    const zoomInButton = new TextPushButton(strings.zoomInAroundPeriodStringProperty, {
      font: SMALL_FONT,
      baseColor: VSPColors.buttonActiveColorProperty,
      listener: () => model.zoomInAroundPeriod(),
      accessibleName: strings.zoomInAroundPeriodStringProperty,
    });
    const zoomOutButton = new TextPushButton(strings.zoomOutAroundPeriodStringProperty, {
      font: SMALL_FONT,
      baseColor: VSPColors.buttonActiveColorProperty,
      listener: () => model.zoomOutAroundPeriod(),
      accessibleName: strings.zoomOutAroundPeriodStringProperty,
    });
    const fullButton = new TextPushButton(strings.zoomToFullStringProperty, {
      font: SMALL_FONT,
      baseColor: VSPColors.buttonColorProperty,
      listener: () => model.zoomToFull(),
      accessibleName: strings.zoomToFullStringProperty,
    });
    const undoButton = new TextPushButton(strings.undoLastZoomStringProperty, {
      font: SMALL_FONT,
      baseColor: VSPColors.buttonColorProperty,
      listener: () => model.undoLastZoom(),
      accessibleName: strings.undoLastZoomStringProperty,
    });
    const snapButton = new TextPushButton(strings.snapToMinStringProperty, {
      font: SMALL_FONT,
      baseColor: VSPColors.buttonSnapColorProperty,
      accessibleName: strings.snapToMinStringProperty,
      listener: () => {
        const best = bestPeriod(model.pdmScanResultsProperty.value);
        if (best !== null) {
          model.trialPeriodProperty.value = best;
        }
      },
    });

    const pdmButtonRow = new HBox({
      spacing: 8,
      children: [zoomInButton, zoomOutButton, fullButton, undoButton, snapButton],
    });
    const pdmYLabel = new Text(strings.thetaAxisStringProperty, { font: SMALL_FONT, rotation: -Math.PI / 2 });
    const pdmXLabel = new Text(strings.trialPeriodAxisStringProperty, { font: SMALL_FONT });

    const pdmColumn = new VBox({
      spacing: 6,
      align: "left",
      children: [
        new HBox({
          spacing: 20,
          align: "center",
          children: [new Text(strings.pdmTitleStringProperty, { font: HEADER_FONT }), periodControl, bestPeriodReadout],
        }),
        pdmButtonRow,
        new HBox({ spacing: 4, align: "center", children: [pdmYLabel, pdmChart] }),
        pdmXLabel,
      ],
    });
    pdmColumn.left = 60;
    pdmColumn.top = leftColumn.bottom + 10;
    this.addChild(pdmColumn);

    // Initialise dynamic chart state.
    updatePdmAxes();
    updatePdmData();
    updateMarker();
    updateObservations();

    // =======================================================================
    // Reset All
    // =======================================================================
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        showCrosshairProperty.reset();
        showDifferenceToolProperty.reset();
      },
      right: this.layoutBounds.maxX - VSPConstants.LAYOUT.RESET_BUTTON_MARGIN,
      bottom: this.layoutBounds.maxY - VSPConstants.LAYOUT.RESET_BUTTON_MARGIN,
      tandem: tandem.createTandem("resetAllButton"),
    });
    this.addChild(resetAllButton);

    // -----------------------------------------------------------------------
    // Accessibility: keyboard / reading traversal order. ScreenView throws if
    // pdomOrder is set on itself, so a wrapper Node "borrows" the interactive
    // nodes — star-field controls, then plot controls, then PDM, Reset All last.
    // -----------------------------------------------------------------------
    this.addChild(
      new Node({
        pdomOrder: [
          clearButton,
          crosshairCheckbox,
          modeRadioGroup,
          phaseOffsetControl,
          differenceToolCheckbox,
          periodControl,
          zoomInButton,
          zoomOutButton,
          fullButton,
          undoButton,
          snapButton,
          resetAllButton,
        ],
      }),
    );
  }
}
