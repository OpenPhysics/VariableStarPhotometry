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
import { BooleanProperty, Multilink } from "scenerystack/axon";
import {
  ChartRectangle,
  ChartTransform,
  GridLineSet,
  LinePlot,
  ScatterPlot,
  TickLabelSet,
  TickMarkSet,
} from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import type { SceneryEvent } from "scenerystack/scenery";
import { Circle, DragListener, HBox, Line, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { bestPeriod } from "../../common/model/PDMCalculator.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import type { AnalyzerModel, LightCurveMode } from "../model/AnalyzerModel.js";

const FIELD_W = 380;
const FIELD_H = 290;

const LABEL_FONT = new PhetFont(13);
const HEADER_FONT = new PhetFont({ size: 14, weight: "bold" });
const TICK_FONT = new PhetFont(10);
const SMALL_FONT = new PhetFont(11);

const VARIABLE_COLOR = "#7CFC7C"; // green circle
const COMPARISON_COLOR = "#5AB4FF"; // blue square
const CROSSHAIR_COLOR = "#ff5050";
const MARKER_COLOR = "#d62728";
const PERIOD_MULTIPLE_COLOR = "rgba(214, 39, 40, 0.35)";

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
  public constructor(model: AnalyzerModel, options?: ScreenViewOptions) {
    super(options);

    const tandem = options?.tandem instanceof Tandem ? options.tandem : Tandem.OPT_OUT;
    const showCrosshairProperty = new BooleanProperty(true);

    // =======================================================================
    // Star field with click-to-select + crosshair + selection markers
    // =======================================================================
    const starField = new StarFieldNode(0);
    const fieldClip = new Node({
      clipArea: Shape.rectangle(0, 0, FIELD_W, FIELD_H),
      children: [starField],
    });
    const frame = new Rectangle(0, 0, FIELD_W, FIELD_H, { stroke: "#888", lineWidth: 1 });

    // Selection markers.
    const variableMarker = new Circle(8, { stroke: VARIABLE_COLOR, lineWidth: 2, visible: false });
    const comparisonMarker = new Rectangle(-7, -7, 14, 14, { stroke: COMPARISON_COLOR, lineWidth: 2, visible: false });
    model.variableStarPositionProperty.link((p) => {
      variableMarker.visible = p !== null;
      if (p) {
        variableMarker.translation = p;
      }
    });
    model.comparisonStarPositionProperty.link((p) => {
      comparisonMarker.visible = p !== null;
      if (p) {
        comparisonMarker.translation = p;
      }
    });

    // Crosshair following the pointer.
    const crosshairH = new Line(0, 0, FIELD_W, 0, { stroke: CROSSHAIR_COLOR, lineWidth: 1 });
    const crosshairV = new Line(0, 0, 0, FIELD_H, { stroke: CROSSHAIR_COLOR, lineWidth: 1 });
    const crosshair = new Node({ children: [crosshairH, crosshairV], pickable: false, visible: false });

    const hitArea = new Rectangle(0, 0, FIELD_W, FIELD_H, { fill: "transparent", cursor: "crosshair" });
    let pointerInside = false;
    const updateCrosshairVisible = () => {
      crosshair.visible = showCrosshairProperty.value && pointerInside;
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
        const point = hitArea.globalToLocalPoint(event.pointer.point);
        crosshairH.y = point.y;
        crosshairV.x = point.x;
      },
      down: (event: SceneryEvent) => {
        const point = hitArea.globalToLocalPoint(event.pointer.point);
        model.selectStarAt(new Vector2(Math.round(point.x), Math.round(point.y)));
      },
    });

    const fieldContainer = new Node({
      children: [fieldClip, frame, variableMarker, comparisonMarker, crosshair, hitArea],
    });

    // Legend + controls beneath the field.
    const legend = new HBox({
      spacing: 16,
      children: [
        new HBox({
          spacing: 5,
          children: [
            new Circle(6, { stroke: VARIABLE_COLOR, lineWidth: 2 }),
            new Text("variable", { font: SMALL_FONT }),
          ],
        }),
        new HBox({
          spacing: 5,
          children: [
            new Rectangle(-5, -5, 10, 10, { stroke: COMPARISON_COLOR, lineWidth: 2 }),
            new Text("comparison", { font: SMALL_FONT }),
          ],
        }),
      ],
    });

    const instructions = new Text("Click a variable star, then a comparison star.", { font: SMALL_FONT, fill: "#555" });
    const clearButton = new TextPushButton("Clear selection", {
      font: SMALL_FONT,
      baseColor: "#d4d4d4",
      listener: () => model.clearSelections(),
    });
    const crosshairCheckbox = new Checkbox(showCrosshairProperty, new Text("show crosshairs", { font: SMALL_FONT }), {
      boxWidth: 14,
    });

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
    leftColumn.left = 20;
    leftColumn.top = 15;
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

    const obsBackground = new ChartRectangle(obsTransform, { fill: "white", stroke: "#333" });
    const obsGridX = new GridLineSet(obsTransform, Orientation.HORIZONTAL, 5, { stroke: "#e0e0e0" });
    const obsGridY = new GridLineSet(obsTransform, Orientation.VERTICAL, 0.2, { stroke: "#e0e0e0" });
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

    const scatter = new ScatterPlot(obsTransform, [], { radius: 2.5, fill: "#1f77b4" });
    const periodMultipleLayer = new Node({ pickable: false });
    const obsPlotLayer = new Node({
      clipArea: Shape.rectangle(0, 0, OBS_W, OBS_H),
      children: [periodMultipleLayer, scatter],
    });

    // Flash DeltaMagOverlay equivalent: two draggable horizontal bars whose
    // separation reports a magnitude difference in the current plot scale.
    let deltaBar1Y = OBS_H * 0.35;
    let deltaBar2Y = OBS_H * 0.65;
    const deltaBar1 = new Line(0, deltaBar1Y, OBS_W, deltaBar1Y, { stroke: "#909090", lineWidth: 1 });
    const deltaBar2 = new Line(0, deltaBar2Y, OBS_W, deltaBar2Y, { stroke: "#909090", lineWidth: 1 });
    const deltaFill = new Rectangle(0, 0, OBS_W, 0, { fill: "rgba(160, 160, 160, 0.18)", pickable: false });
    const deltaText = new Text("", {
      font: SMALL_FONT,
      fill: "#333",
      pickable: false,
    });

    const updateDeltaOverlay = () => {
      const hasMeasurements = model.measurementsProperty.value.length > 0;
      deltaBar1.visible = hasMeasurements;
      deltaBar2.visible = hasMeasurements;
      deltaFill.visible = hasMeasurements;
      deltaText.visible = hasMeasurements;
      deltaBar1Hit.visible = hasMeasurements;
      deltaBar2Hit.visible = hasMeasurements;
      if (!hasMeasurements) {
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
      deltaText.string = `${Math.abs(mag2 - mag1).toFixed(2)} mag`;
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

    const obsEmptyMsg = new Text("(select a variable and a comparison star)", {
      font: SMALL_FONT,
      fill: "#888",
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
        lines.push(new Line(x, 0, x, OBS_H, { stroke: PERIOD_MULTIPLE_COLOR, lineWidth: 1 }));
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
      [model.measurementsProperty, model.lightCurveModeProperty, model.trialPeriodProperty, model.phaseOffsetProperty],
      () => updateObservations(),
    );

    const obsTitle = new Text("Observations", { font: HEADER_FONT });
    const obsYLabel = new Text("differential magnitude", { font: SMALL_FONT, rotation: -Math.PI / 2 });
    const obsXLabel = new Text("Julian date (days)", { font: SMALL_FONT });
    model.lightCurveModeProperty.link((mode) => {
      obsXLabel.string = mode === "time" ? "Julian date (days)" : "phase";
    });

    const modeRadioGroup = new AquaRadioButtonGroup<LightCurveMode>(
      model.lightCurveModeProperty,
      [
        { value: "time", createNode: () => new Text("time", { font: LABEL_FONT }) },
        { value: "phase", createNode: () => new Text("phase", { font: LABEL_FONT }) },
      ],
      { orientation: "horizontal", spacing: 16, radioButtonOptions: { radius: 7 } },
    );

    // Assemble observations panel (title, [y-label | chart], x-label, radios).
    const obsChartRow = new HBox({ spacing: 4, align: "center", children: [obsYLabel, obsChart] });
    const obsModeRow = new HBox({
      spacing: 8,
      align: "center",
      children: [new Text("light curve:", { font: LABEL_FONT }), modeRadioGroup],
    });
    const obsColumn = new VBox({
      spacing: 6,
      align: "center",
      children: [obsTitle, obsChartRow, obsXLabel, obsModeRow],
    });
    obsColumn.left = leftColumn.right + 30;
    obsColumn.top = 15;
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

    const pdmBackground = new ChartRectangle(pdmTransform, { fill: "white", stroke: "#333" });
    const pdmGridX = new GridLineSet(pdmTransform, Orientation.HORIZONTAL, 1, { stroke: "#e0e0e0" });
    const pdmGridY = new GridLineSet(pdmTransform, Orientation.VERTICAL, 0.2, { stroke: "#e0e0e0" });
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

    const pdmLine = new LinePlot(pdmTransform, [], { stroke: "#0077b6", lineWidth: 1.5 });
    const periodMarker = new Line(0, 0, 0, PDM_H, { stroke: MARKER_COLOR, lineWidth: 2 });
    const pdmPlotLayer = new Node({
      clipArea: Shape.rectangle(0, 0, PDM_W, PDM_H),
      children: [pdmLine, periodMarker],
    });

    const pdmEmptyMsg = new Text("(no light curve yet)", {
      font: SMALL_FONT,
      fill: "#888",
      center: new Vector2(PDM_W / 2, PDM_H / 2),
    });

    // Drag/click on the plot sets the trial period.
    const pdmHit = new Rectangle(0, 0, PDM_W, PDM_H, { fill: "transparent", cursor: "ew-resize" });
    const setPeriodFromEvent = (event: SceneryEvent) => {
      const local = pdmHit.globalToLocalPoint(event.pointer.point);
      const zoom = model.pdmZoomRangeProperty.value;
      const period = pdmTransform.viewToModelX(local.x);
      model.trialPeriodProperty.value = Math.max(zoom.min, Math.min(zoom.max, period));
    };
    pdmHit.addInputListener(
      new DragListener({
        start: (event) => setPeriodFromEvent(event),
        drag: (event) => setPeriodFromEvent(event),
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

    // PDM controls: readout + zoom buttons.
    const periodReadout = new Text("", { font: LABEL_FONT });
    const updateReadout = () => {
      const best = bestPeriod(model.pdmScanResultsProperty.value);
      const bestText = best === null ? "—" : `${best.toFixed(4)} d`;
      periodReadout.string = `trial period: ${model.trialPeriodProperty.value.toFixed(4)} days     (min θ at ${bestText})`;
    };
    Multilink.multilink([model.trialPeriodProperty, model.pdmScanResultsProperty], () => updateReadout());

    const zoomInButton = new TextPushButton("zoom in around period", {
      font: SMALL_FONT,
      baseColor: "#cfe8ff",
      listener: () => model.zoomInAroundPeriod(),
    });
    const zoomOutButton = new TextPushButton("zoom out around period", {
      font: SMALL_FONT,
      baseColor: "#cfe8ff",
      listener: () => model.zoomOutAroundPeriod(),
    });
    const fullButton = new TextPushButton("zoom to full range", {
      font: SMALL_FONT,
      baseColor: "#d4d4d4",
      listener: () => model.zoomToFull(),
    });
    const undoButton = new TextPushButton("undo last zoom", {
      font: SMALL_FONT,
      baseColor: "#d4d4d4",
      listener: () => model.undoLastZoom(),
    });
    const snapButton = new TextPushButton("snap to min θ", {
      font: SMALL_FONT,
      baseColor: "#b6e3b6",
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
    const pdmYLabel = new Text("θ (dispersion)", { font: SMALL_FONT, rotation: -Math.PI / 2 });
    const pdmXLabel = new Text("trial period (days)", { font: SMALL_FONT });

    const pdmColumn = new VBox({
      spacing: 6,
      align: "left",
      children: [
        new HBox({
          spacing: 20,
          align: "center",
          children: [new Text("PDM Period Search", { font: HEADER_FONT }), periodReadout],
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
    updateReadout();
    updateObservations();

    // =======================================================================
    // Reset All
    // =======================================================================
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        showCrosshairProperty.reset();
      },
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
