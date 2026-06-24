/**
 * BlinkComparatorScreenView.ts
 *
 * View for the Blink Comparator screen.
 *
 * Layout
 * ┌────────────────────────────────┬────────────────────────────┐
 * │  Blink Comparator              │  Blinking Queue Controls   │
 * │  ┌──────────────────────────┐  │  observations list: queue  │
 * │  │ star field + crosshairs  │  │  [epoch table] → [queue]   │
 * │  └──────────────────────────┘  │        add/remove          │
 * │  epoch of field above: N.NNNN  │      <  blink  >   rate    │
 * └────────────────────────────────┴────────────────────────────┘
 *                                                    [Reset All]
 */
import { Shape } from "scenerystack/kite";
import type { SceneryEvent } from "scenerystack/scenery";
import { Circle, HBox, KeyboardListener, Line, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Checkbox, HSlider, Panel, RectangularPushButton, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { OBSERVATIONS } from "../../common/model/StarFieldData.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import { BLINK_INTERVAL_RANGE, type BlinkComparatorModel } from "../model/BlinkComparatorModel.js";

const FIELD_W = 380;
const FIELD_H = 290;
const FIELD_SCALE = 1.25;
const OBS_LIST_VISIBLE_ROWS = 13;
const QUEUE_LIST_VISIBLE_ROWS = 10;
const TABLE_ROW_HEIGHT = 22;
const TABLE_WIDTH = 118;

const LABEL_FONT = new PhetFont(13);
const HEADER_FONT = new PhetFont({ size: 14, weight: "bold" });
const SMALL_FONT = new PhetFont(11);

const CROSSHAIR_COLOR = "#ff5050";
const SELECTION_FILL = "#8fd3f4";
const QUEUE_DOT_COLOR = "#ff3030";

/** Format an observation index as its epoch label, e.g. "8.7525 days". */
function epochLabel(obsIndex: number): string {
  const obs = OBSERVATIONS[obsIndex];
  return obs ? `${obs.epoch.toFixed(4)} days` : "—";
}

function makeTableHeader(width: number): Node {
  return new Node({
    children: [
      new Rectangle(0, 0, width, TABLE_ROW_HEIGHT, {
        fill: "#eeeeee",
        stroke: "#777",
        lineWidth: 1,
      }),
      new Text("epoch", { font: LABEL_FONT, left: 8, centerY: TABLE_ROW_HEIGHT / 2 }),
    ],
  });
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

    fieldContainer.scale(FIELD_SCALE);

    // Epoch readout below the field, matching the Flash reference.
    const epochReadout = new Text(`epoch of field above:  ${epochLabel(model.displayedObsIndexProperty.value)}`, {
      font: LABEL_FONT,
    });
    model.displayedObsIndexProperty.link((index) => {
      epochReadout.string = `epoch of field above:  ${epochLabel(index)}`;
    });

    const crosshairCheckbox = new Checkbox(
      model.showCrosshairProperty,
      new Text("show crosshairs", { font: LABEL_FONT }),
      { boxWidth: 16 },
    );

    const fieldFooter = new HBox({
      spacing: 120,
      align: "center",
      children: [epochReadout, crosshairCheckbox],
    });

    const leftColumn = new VBox({
      spacing: 8,
      align: "left",
      children: [new Text("Blink Comparator", { font: HEADER_FONT }), fieldContainer, fieldFooter],
    });

    const leftPanel = new Panel(leftColumn, {
      fill: "#f0f0f0",
      stroke: "#888",
      cornerRadius: 2,
      xMargin: 8,
      yMargin: 8,
    });
    leftPanel.left = 20;
    leftPanel.centerY = this.layoutBounds.centerY;
    this.addChild(leftPanel);

    // -----------------------------------------------------------------------
    // Blinking queue controls
    // -----------------------------------------------------------------------
    const observationRows = new VBox({ spacing: 0, align: "left" });
    let observationFirstIndex = 0;

    const addButton = new TextPushButton("Add to blink queue", {
      font: LABEL_FONT,
      baseColor: "#d7edf8",
      listener: () => {
        const selected = model.selectedObsIndexProperty.value;
        model.addSelectedToQueue();
        const queueIndex = model.blinkQueue.indexOf(selected);
        if (queueIndex >= 0) {
          model.queuePositionProperty.value = queueIndex;
        }
      },
    });

    const removeButton = new TextPushButton("Remove from queue", {
      font: LABEL_FONT,
      baseColor: "#e6e6e6",
      listener: () => {
        if (model.blinkQueue.length > 0) {
          const obsIndex = model.blinkQueue[Math.max(0, Math.min(model.queuePositionProperty.value, model.blinkQueue.length - 1))];
          if (obsIndex !== undefined) {
            model.removeFromQueue(obsIndex);
          }
        }
      },
    });

    const rebuildObservationList = () => {
      for (const child of observationRows.children.slice()) {
        child.dispose();
      }
      const selected = model.selectedObsIndexProperty.value;
      const maxFirst = Math.max(0, OBSERVATIONS.length - OBS_LIST_VISIBLE_ROWS);
      observationFirstIndex = Math.max(0, Math.min(maxFirst, observationFirstIndex));
      if (selected < observationFirstIndex) {
        observationFirstIndex = selected;
      } else if (selected >= observationFirstIndex + OBS_LIST_VISIBLE_ROWS) {
        observationFirstIndex = selected - OBS_LIST_VISIBLE_ROWS + 1;
      }

      const rows: Node[] = [];
      for (let i = 0; i < OBS_LIST_VISIBLE_ROWS; i++) {
        const obsIndex = observationFirstIndex + i;
        if (obsIndex >= OBSERVATIONS.length) {
          break;
        }
        const isSelected = obsIndex === selected;
        const rowBackground = new Rectangle(0, 0, TABLE_WIDTH, TABLE_ROW_HEIGHT, {
          fill: isSelected ? SELECTION_FILL : "white",
          stroke: "#999",
          lineWidth: 1,
        });
        const row = new Node({
          cursor: "pointer",
          children: [
            rowBackground,
            new Text(epochLabel(obsIndex), {
              font: LABEL_FONT,
              fill: isSelected ? "black" : "#444",
              left: 8,
              centerY: TABLE_ROW_HEIGHT / 2,
            }),
          ],
        });
        row.addInputListener({
          down: () => {
            model.selectedObsIndexProperty.value = obsIndex;
          },
        });
        rows.push(row);
      }
      observationRows.children = rows;
    };

    const scrollObservationList = (delta: number) => {
      const maxFirst = Math.max(0, OBSERVATIONS.length - OBS_LIST_VISIBLE_ROWS);
      observationFirstIndex = Math.max(0, Math.min(maxFirst, observationFirstIndex + delta));
      rebuildObservationList();
    };

    const obsScrollUpButton = new RectangularPushButton({
      content: new Text("▲", { font: SMALL_FONT }),
      baseColor: "#eeeeee",
      xMargin: 3,
      yMargin: 2,
      listener: () => scrollObservationList(-1),
    });
    const obsScrollDownButton = new RectangularPushButton({
      content: new Text("▼", { font: SMALL_FONT }),
      baseColor: "#eeeeee",
      xMargin: 3,
      yMargin: 2,
      listener: () => scrollObservationList(1),
    });

    const observationTable = new HBox({
      spacing: 2,
      align: "top",
      children: [
        new VBox({ spacing: 0, align: "left", children: [makeTableHeader(TABLE_WIDTH), observationRows] }),
        new VBox({ spacing: 4, align: "center", children: [obsScrollUpButton, obsScrollDownButton] }),
      ],
    });

    const queueRows = new VBox({ spacing: 0, align: "left" });

    const rebuildQueueList = () => {
      for (const child of queueRows.children.slice()) {
        child.dispose();
      }
      const rows: Node[] = [];
      for (let i = 0; i < QUEUE_LIST_VISIBLE_ROWS; i++) {
        const obsIndex = model.blinkQueue[i];
        const isSelected = i === model.queuePositionProperty.value && obsIndex !== undefined;
        const rowBackground = new Rectangle(0, 0, TABLE_WIDTH, TABLE_ROW_HEIGHT, {
          fill: isSelected ? SELECTION_FILL : "white",
          stroke: "#dddddd",
          lineWidth: 1,
        });
        const children: Node[] = [rowBackground];
        if (obsIndex !== undefined) {
          children.push(
            new Circle(4, {
              fill: isSelected ? QUEUE_DOT_COLOR : null,
              left: 12,
              centerY: TABLE_ROW_HEIGHT / 2,
            }),
            new Text(epochLabel(obsIndex), {
              font: LABEL_FONT,
              left: 28,
              centerY: TABLE_ROW_HEIGHT / 2,
            }),
          );
        }

        const row = new Node({ cursor: obsIndex === undefined ? "default" : "pointer", children });
        if (obsIndex !== undefined) {
          row.addInputListener({
            down: () => {
              model.queuePositionProperty.value = i;
            },
          });
        }
        rows.push(row);
      }
      queueRows.children = rows;
    };

    const queueTable = new VBox({
      spacing: 0,
      align: "left",
      children: [makeTableHeader(TABLE_WIDTH), queueRows],
    });

    const previousButton = new TextPushButton("<", {
      font: LABEL_FONT,
      baseColor: "#e6e6e6",
      listener: () => {
        if (model.blinkQueue.length > 0) {
          model.queuePositionProperty.value =
            (model.queuePositionProperty.value + model.blinkQueue.length - 1) % model.blinkQueue.length;
        }
      },
    });
    const blinkButton = new TextPushButton("blink", {
      font: LABEL_FONT,
      baseColor: "#e6e6e6",
      listener: () => {
        model.isBlinkingProperty.value = !model.isBlinkingProperty.value;
      },
    });
    model.isBlinkingProperty.link((isBlinking) => {
      blinkButton.baseColor = isBlinking ? "#cfe8ff" : "#e6e6e6";
    });
    const nextButton = new TextPushButton(">", {
      font: LABEL_FONT,
      baseColor: "#e6e6e6",
      listener: () => {
        if (model.blinkQueue.length > 0) {
          model.queuePositionProperty.value = (model.queuePositionProperty.value + 1) % model.blinkQueue.length;
        }
      },
    });

    const blinkSpeedSlider = new HSlider(model.blinkIntervalMsProperty, BLINK_INTERVAL_RANGE, {
      tandem: tandem.createTandem("blinkSpeedSlider"),
    });
    blinkSpeedSlider.addMajorTick(BLINK_INTERVAL_RANGE.min, new Text("fast", { font: SMALL_FONT }));
    blinkSpeedSlider.addMajorTick(BLINK_INTERVAL_RANGE.max, new Text("slow", { font: SMALL_FONT }));

    const transferControls = new VBox({
      spacing: 20,
      align: "center",
      children: [new Text("⟶", { font: new PhetFont(38), fill: "#666" }), addButton, removeButton, new Text("⟵", { font: new PhetFont(34), fill: "#666" })],
    });

    const listRow = new HBox({
      spacing: 22,
      align: "top",
      children: [
        new VBox({
          spacing: 6,
          align: "left",
          children: [new Text("observations list:", { font: LABEL_FONT }), observationTable],
        }),
        transferControls,
        new VBox({
          spacing: 6,
          align: "left",
          children: [new Text("blinking queue:", { font: LABEL_FONT }), queueTable],
        }),
      ],
    });

    const navigationRow = new HBox({
      spacing: 12,
      align: "center",
      children: [previousButton, blinkButton, nextButton],
    });

    const rateRow = new HBox({
      spacing: 8,
      align: "center",
      children: [new Text("rate:", { font: LABEL_FONT }), blinkSpeedSlider],
    });

    const controlContent = new VBox({
      spacing: 14,
      align: "left",
      children: [
        new Text("Blinking Queue Controls", { font: HEADER_FONT }),
        listRow,
        new HBox({ spacing: 38, align: "center", children: [new Node({ maxWidth: 150 }), navigationRow] }),
        new HBox({ spacing: 42, align: "center", children: [new Node({ maxWidth: 150 }), rateRow] }),
      ],
    });

    const controlPanel = new Panel(controlContent, {
      fill: "#f0f0f0",
      stroke: "#888",
      cornerRadius: 2,
      xMargin: 8,
      yMargin: 8,
    });
    controlPanel.left = leftPanel.right + 8;
    controlPanel.top = leftPanel.top;
    this.addChild(controlPanel);

    model.selectedObsIndexProperty.link(() => rebuildObservationList());
    model.blinkQueue.lengthProperty.link(rebuildQueueList);
    model.queuePositionProperty.link(rebuildQueueList);

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
