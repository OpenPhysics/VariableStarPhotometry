/**
 * BlinkComparatorScreenView.ts
 *
 * View for the Blink Comparator screen.
 *
 * Layout
 * ┌──────────────────────────────┬─────────────────────────────┐
 * │  epoch of field: N.NNNN d    │  Add Observation            │
 * │  ┌────────────────────────┐  │    observation: [ picker ]  │
 * │  │  star field 380 × 290  │  │    epoch: N.NNNN days       │
 * │  │  (+ mouse crosshair)   │  │    [ Add to blink queue ]   │
 * │  └────────────────────────┘  │  ─────────────────────────  │
 * │  [▶/⏸]   Blink Speed         │  Blink Queue                │
 * │          Fast ──●── Slow      │    N.NNNN d           [✕]   │
 * │  [x] show crosshairs          │    N.NNNN d           [✕]   │
 * │                               │    [ Clear queue ]          │
 * └──────────────────────────────┴─────────────────────────────┘
 *                                                    [Reset All]
 */
import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { SceneryEvent } from "scenerystack/scenery";
import { HBox, KeyboardListener, Line, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont, PlayPauseButton, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Checkbox, HSlider, NumberPicker, Panel, RectangularPushButton, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { OBSERVATIONS } from "../../common/model/StarFieldData.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import { BLINK_INTERVAL_RANGE, type BlinkComparatorModel } from "../model/BlinkComparatorModel.js";

const FIELD_W = 380;
const FIELD_H = 290;

const LABEL_FONT = new PhetFont(13);
const HEADER_FONT = new PhetFont({ size: 14, weight: "bold" });
const SMALL_FONT = new PhetFont(11);

const CROSSHAIR_COLOR = "#ff5050";
const ON_TOP_COLOR = "#ff9090";

/** Format an observation index as its epoch label, e.g. "8.7525 days". */
function epochLabel(obsIndex: number): string {
  const obs = OBSERVATIONS[obsIndex];
  return obs ? `${obs.epoch.toFixed(4)} days` : "—";
}

export class BlinkComparatorScreenView extends ScreenView {
  private readonly model: BlinkComparatorModel;

  public constructor(model: BlinkComparatorModel, options?: ScreenViewOptions) {
    super(options);

    this.model = model;

    const tandem = options?.tandem instanceof Tandem ? options.tandem : Tandem.OPT_OUT;

    // -----------------------------------------------------------------------
    // Star field + crosshair overlay
    // -----------------------------------------------------------------------
    const starField = new StarFieldNode(model.displayedObsIndexProperty.value);
    model.displayedObsIndexProperty.link((index) => starField.setObservation(index));

    const fieldClip = new Node({
      clipArea: Shape.rectangle(0, 0, FIELD_W, FIELD_H),
      children: [starField],
    });

    const frame = new Rectangle(0, 0, FIELD_W, FIELD_H, { stroke: "#888", lineWidth: 1 });

    const crosshairH = new Line(0, 0, FIELD_W, 0, { stroke: CROSSHAIR_COLOR, lineWidth: 1 });
    const crosshairV = new Line(0, 0, 0, FIELD_H, { stroke: CROSSHAIR_COLOR, lineWidth: 1 });
    const crosshair = new Node({ children: [crosshairH, crosshairV], pickable: false, visible: false });

    // Transparent hit target on top of the field that reports mouse position.
    const hitArea = new Rectangle(0, 0, FIELD_W, FIELD_H, { fill: "transparent" });

    let pointerInside = false;
    const updateCrosshairVisible = () => {
      crosshair.visible = model.showCrosshairProperty.value && pointerInside;
    };
    model.showCrosshairProperty.link(updateCrosshairVisible);

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
    });

    const fieldContainer = new Node({ children: [fieldClip, frame, crosshair, hitArea] });

    // Epoch readout above the field.
    const epochReadout = new Text(`Epoch of field: ${epochLabel(model.displayedObsIndexProperty.value)}`, {
      font: LABEL_FONT,
    });
    model.displayedObsIndexProperty.link((index) => {
      epochReadout.string = `Epoch of field: ${epochLabel(index)}`;
    });

    // -----------------------------------------------------------------------
    // Blink controls: play/pause + speed slider + crosshair toggle
    // -----------------------------------------------------------------------
    const playPauseButton = new PlayPauseButton(model.isBlinkingProperty, {
      radius: 22,
      tandem: tandem.createTandem("playPauseButton"),
    });

    const blinkSpeedSlider = new HSlider(model.blinkIntervalMsProperty, BLINK_INTERVAL_RANGE, {
      tandem: tandem.createTandem("blinkSpeedSlider"),
    });
    blinkSpeedSlider.addMajorTick(BLINK_INTERVAL_RANGE.min, new Text("Fast", { font: SMALL_FONT }));
    blinkSpeedSlider.addMajorTick(BLINK_INTERVAL_RANGE.max, new Text("Slow", { font: SMALL_FONT }));

    const blinkSpeedControl = new VBox({
      spacing: 2,
      align: "center",
      children: [new Text("Blink Speed", { font: LABEL_FONT }), blinkSpeedSlider],
    });

    const crosshairCheckbox = new Checkbox(
      model.showCrosshairProperty,
      new Text("show crosshairs", { font: LABEL_FONT }),
      { boxWidth: 16 },
    );

    const blinkControls = new HBox({
      spacing: 24,
      align: "center",
      children: [playPauseButton, blinkSpeedControl],
    });

    const leftColumn = new VBox({
      spacing: 12,
      align: "center",
      children: [epochReadout, fieldContainer, blinkControls, crosshairCheckbox],
    });
    leftColumn.left = 20;
    leftColumn.centerY = this.layoutBounds.centerY;
    this.addChild(leftColumn);

    // -----------------------------------------------------------------------
    // Add Observation controls
    // -----------------------------------------------------------------------
    const obsPicker = new NumberPicker(model.selectedObsIndexProperty, model.selectedObsIndexProperty.rangeProperty, {
      font: LABEL_FONT,
      color: "black",
      incrementFunction: (v) => v + 1,
      decrementFunction: (v) => v - 1,
    });

    const selectedEpochText = new Text(`epoch: ${epochLabel(model.selectedObsIndexProperty.value)}`, {
      font: LABEL_FONT,
    });
    model.selectedObsIndexProperty.link((index) => {
      selectedEpochText.string = `epoch: ${epochLabel(index)}`;
    });

    const addButton = new TextPushButton("Add to blink queue", {
      font: LABEL_FONT,
      baseColor: "#b6e3b6",
      listener: () => model.addSelectedToQueue(),
    });

    const addSection = new VBox({
      spacing: 8,
      align: "left",
      children: [
        new Text("Add Observation", { font: HEADER_FONT }),
        new HBox({
          spacing: 8,
          align: "center",
          children: [new Text("observation:", { font: LABEL_FONT }), obsPicker],
        }),
        selectedEpochText,
        addButton,
      ],
    });

    // -----------------------------------------------------------------------
    // Blink Queue list (rebuilt whenever the queue changes)
    // -----------------------------------------------------------------------
    const queueList = new VBox({ spacing: 4, align: "left" });

    const emptyText = new Text("(queue is empty — add observations)", { font: SMALL_FONT, fill: "#666" });

    // Track each row so the currently-shown frame can be highlighted.
    let rowNodes: { obsIndex: number; epochText: Text }[] = [];

    const rebuildQueueList = () => {
      for (const child of queueList.children.slice()) {
        child.dispose();
      }
      rowNodes = [];

      if (model.blinkQueue.length === 0) {
        queueList.children = [emptyText];
        return;
      }

      const rows: Node[] = [];
      for (const obsIndex of model.blinkQueue) {
        const epochText = new Text(epochLabel(obsIndex), { font: LABEL_FONT, maxWidth: 110 });
        const removeButton = new RectangularPushButton({
          content: new Text("✕", { font: SMALL_FONT }),
          baseColor: "#e89090",
          xMargin: 5,
          yMargin: 2,
          listener: () => model.removeFromQueue(obsIndex),
        });
        rowNodes.push({ obsIndex, epochText });
        rows.push(new HBox({ spacing: 8, align: "center", children: [epochText, removeButton] }));
      }
      queueList.children = rows;
      updateQueueHighlight();
    };

    const updateQueueHighlight = () => {
      if (model.blinkQueue.length === 0) {
        return;
      }
      const shownIndex = model.displayedObsIndexProperty.value;
      for (const row of rowNodes) {
        const isShown = model.isBlinkingProperty.value ? row.obsIndex === shownIndex : false;
        row.epochText.fill = isShown ? ON_TOP_COLOR : "black";
      }
    };

    model.blinkQueue.lengthProperty.link(rebuildQueueList);
    Multilink.multilink([model.displayedObsIndexProperty, model.isBlinkingProperty], () => updateQueueHighlight());

    const clearButton = new TextPushButton("Clear queue", {
      font: LABEL_FONT,
      baseColor: "#d4d4d4",
      listener: () => model.clearQueue(),
    });

    const queueSection = new VBox({
      spacing: 8,
      align: "left",
      children: [new Text("Blink Queue", { font: HEADER_FONT }), queueList, clearButton],
    });

    const controlContent = new VBox({
      spacing: 14,
      align: "left",
      children: [addSection, new Rectangle(0, 0, 1, 1), queueSection],
    });

    const controlPanel = new Panel(controlContent, {
      fill: "#f0f0f0",
      stroke: "#888",
      cornerRadius: 6,
      xMargin: 12,
      yMargin: 12,
    });
    controlPanel.left = leftColumn.right + 25;
    controlPanel.top = leftColumn.top;
    this.addChild(controlPanel);

    // -----------------------------------------------------------------------
    // Keyboard: space toggles blinking
    // -----------------------------------------------------------------------
    KeyboardListener.createGlobal(this, {
      keys: ["space"] as const,
      fire: () => {
        model.isBlinkingProperty.value = !model.isBlinkingProperty.value;
      },
    });

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
    this.model.step(dt);
  }
}
