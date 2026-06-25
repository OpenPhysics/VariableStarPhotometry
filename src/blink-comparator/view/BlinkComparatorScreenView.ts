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
import {
  DerivedProperty,
  Multilink,
  PatternStringProperty,
  type ReadOnlyProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { SceneryEvent } from "scenerystack/scenery";
import { Circle, HBox, KeyboardListener, Line, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { Checkbox, HSlider, Panel, RectangularPushButton, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { OBSERVATIONS } from "../../common/model/StarFieldData.js";
import { FieldGridNode } from "../../common/view/FieldGridNode.js";
import { StarFieldNode } from "../../common/view/StarFieldNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VSPPreferencesModel } from "../../preferences/VSPPreferencesModel.js";
import VSPColors from "../../VSPColors.js";
import VSPConstants from "../../VSPConstants.js";
import { BLINK_INTERVAL_RANGE, type BlinkComparatorModel } from "../model/BlinkComparatorModel.js";

const FIELD_W = VSPConstants.FIELD.WIDTH;
const FIELD_H = VSPConstants.FIELD.HEIGHT;
const FIELD_SCALE = 1.25;
const OBS_LIST_VISIBLE_ROWS = 13;
const QUEUE_LIST_VISIBLE_ROWS = 10;
const TABLE_ROW_HEIGHT = 22;
const TABLE_WIDTH = 118;

const LABEL_FONT = new PhetFont(VSPConstants.FONT_SIZE.LABEL);
const HEADER_FONT = new PhetFont({ size: VSPConstants.FONT_SIZE.HEADER, weight: "bold" });
const SMALL_FONT = new PhetFont(VSPConstants.FONT_SIZE.SMALL);

function makeTableHeader(width: number, epochLabelProperty: TReadOnlyProperty<string>): Node {
  return new Node({
    children: [
      new Rectangle(0, 0, width, TABLE_ROW_HEIGHT, {
        fill: VSPColors.tableHeaderFillProperty,
        stroke: VSPColors.controlPanelStrokeProperty,
        lineWidth: 1,
      }),
      new Text(epochLabelProperty, { font: LABEL_FONT, left: 8, centerY: TABLE_ROW_HEIGHT / 2 }),
    ],
  });
}

export class BlinkComparatorScreenView extends ScreenView {
  private readonly model: BlinkComparatorModel;

  public constructor(model: BlinkComparatorModel, preferences: VSPPreferencesModel, options?: ScreenViewOptions) {
    super(options);

    this.model = model;

    const tandem = options?.tandem instanceof Tandem ? options.tandem : Tandem.OPT_OUT;
    const strings = StringManager.getInstance().getBlinkViewStrings();
    const unitStrings = StringManager.getInstance().getUnitStrings();

    // Localized "{{value}} days" label for a given observation index.
    const makeEpochDaysProperty = (obsIndex: number): ReadOnlyProperty<string> => {
      const obs = OBSERVATIONS[obsIndex];
      return obs
        ? new PatternStringProperty(unitStrings.daysPatternStringProperty, { value: obs.epoch.toFixed(4) })
        : strings.noEpochStringProperty;
    };

    // -----------------------------------------------------------------------
    // Star field + crosshair overlay
    // -----------------------------------------------------------------------
    const starField = new StarFieldNode(model.displayedObsIndexProperty.value, preferences.invertImagesProperty.value);
    Multilink.multilink([model.displayedObsIndexProperty, preferences.invertImagesProperty], (index, invert) =>
      starField.setObservation(index, invert),
    );

    const fieldClip = new Node({
      clipArea: Shape.rectangle(0, 0, FIELD_W, FIELD_H),
      children: [starField],
    });

    const grid = new FieldGridNode(FIELD_W, FIELD_H, preferences.showGridProperty);

    const frame = new Rectangle(0, 0, FIELD_W, FIELD_H, {
      stroke: VSPColors.controlPanelStrokeProperty,
      lineWidth: 1,
    });

    const crosshairH = new Line(0, 0, FIELD_W, 0, { stroke: VSPColors.crosshairColorProperty, lineWidth: 1 });
    const crosshairV = new Line(0, 0, 0, FIELD_H, { stroke: VSPColors.crosshairColorProperty, lineWidth: 1 });
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

    const fieldContainer = new Node({ children: [fieldClip, grid, frame, crosshair, hitArea] });

    fieldContainer.scale(FIELD_SCALE);

    // Epoch readout below the field, matching the Flash reference. The displayed
    // epoch value (numeric, localized "days") is folded into the readout pattern.
    const displayedEpochDaysProperty = new PatternStringProperty(unitStrings.daysPatternStringProperty, {
      value: new DerivedProperty([model.displayedObsIndexProperty], (index) => {
        const obs = OBSERVATIONS[index];
        return obs ? obs.epoch.toFixed(4) : "";
      }),
    });
    const epochReadout = new Text(
      new PatternStringProperty(strings.epochOfFieldAboveStringProperty, { value: displayedEpochDaysProperty }),
      { font: LABEL_FONT },
    );

    const crosshairCheckbox = new Checkbox(
      model.showCrosshairProperty,
      new Text(strings.showCrosshairsStringProperty, { font: LABEL_FONT }),
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
      children: [new Text(strings.titleStringProperty, { font: HEADER_FONT }), fieldContainer, fieldFooter],
    });

    const leftPanel = new Panel(leftColumn, {
      fill: VSPColors.controlPanelFillProperty,
      stroke: VSPColors.controlPanelStrokeProperty,
      cornerRadius: VSPConstants.LAYOUT.PANEL_CORNER_RADIUS,
      xMargin: VSPConstants.LAYOUT.PANEL_X_MARGIN,
      yMargin: VSPConstants.LAYOUT.PANEL_Y_MARGIN,
    });
    leftPanel.left = VSPConstants.LAYOUT.SCREEN_MARGIN;
    leftPanel.centerY = this.layoutBounds.centerY;
    this.addChild(leftPanel);

    // -----------------------------------------------------------------------
    // Blinking queue controls
    // -----------------------------------------------------------------------
    const observationRows = new VBox({ spacing: 0, align: "left" });
    let observationFirstIndex = 0;

    // Per-row epoch labels are disposed and rebuilt with their rows.
    const observationRowProps: ReadOnlyProperty<string>[] = [];
    const queueRowProps: ReadOnlyProperty<string>[] = [];

    const addButton = new TextPushButton(strings.addToQueueStringProperty, {
      font: LABEL_FONT,
      baseColor: VSPColors.buttonAddColorProperty,
      listener: () => {
        const selected = model.selectedObsIndexProperty.value;
        model.addSelectedToQueue();
        const queueIndex = model.blinkQueue.indexOf(selected);
        if (queueIndex >= 0) {
          model.queuePositionProperty.value = queueIndex;
        }
      },
    });

    const removeButton = new TextPushButton(strings.removeFromQueueStringProperty, {
      font: LABEL_FONT,
      baseColor: VSPColors.buttonNeutralColorProperty,
      listener: () => {
        if (model.blinkQueue.length > 0) {
          const obsIndex =
            model.blinkQueue[Math.max(0, Math.min(model.queuePositionProperty.value, model.blinkQueue.length - 1))];
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
      for (const prop of observationRowProps) {
        prop.dispose();
      }
      observationRowProps.length = 0;
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
          fill: isSelected ? VSPColors.selectionFillProperty : VSPColors.tableRowFillProperty,
          stroke: VSPColors.tableStrokeProperty,
          lineWidth: 1,
        });
        const epochProp = makeEpochDaysProperty(obsIndex);
        observationRowProps.push(epochProp);
        const row = new Node({
          cursor: "pointer",
          children: [
            rowBackground,
            new Text(epochProp, {
              font: LABEL_FONT,
              fill: isSelected ? VSPColors.panelTextColorProperty : VSPColors.mutedTextColorProperty,
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
      baseColor: VSPColors.tableHeaderFillProperty,
      xMargin: 3,
      yMargin: 2,
      listener: () => scrollObservationList(-1),
    });
    const obsScrollDownButton = new RectangularPushButton({
      content: new Text("▼", { font: SMALL_FONT }),
      baseColor: VSPColors.tableHeaderFillProperty,
      xMargin: 3,
      yMargin: 2,
      listener: () => scrollObservationList(1),
    });

    const observationTable = new HBox({
      spacing: 2,
      align: "top",
      children: [
        new VBox({
          spacing: 0,
          align: "left",
          children: [makeTableHeader(TABLE_WIDTH, strings.epochStringProperty), observationRows],
        }),
        new VBox({ spacing: 4, align: "center", children: [obsScrollUpButton, obsScrollDownButton] }),
      ],
    });

    const queueRows = new VBox({ spacing: 0, align: "left" });

    const rebuildQueueList = () => {
      for (const child of queueRows.children.slice()) {
        child.dispose();
      }
      for (const prop of queueRowProps) {
        prop.dispose();
      }
      queueRowProps.length = 0;
      const rows: Node[] = [];
      for (let i = 0; i < QUEUE_LIST_VISIBLE_ROWS; i++) {
        const obsIndex = model.blinkQueue[i];
        const isSelected = i === model.queuePositionProperty.value && obsIndex !== undefined;
        const rowBackground = new Rectangle(0, 0, TABLE_WIDTH, TABLE_ROW_HEIGHT, {
          fill: isSelected ? VSPColors.selectionFillProperty : VSPColors.tableRowFillProperty,
          stroke: VSPColors.dividerColorProperty,
          lineWidth: 1,
        });
        const children: Node[] = [rowBackground];
        if (obsIndex !== undefined) {
          const epochProp = makeEpochDaysProperty(obsIndex);
          queueRowProps.push(epochProp);
          children.push(
            new Circle(4, {
              fill: isSelected ? VSPColors.queueMarkerColorProperty : null,
              left: 12,
              centerY: TABLE_ROW_HEIGHT / 2,
            }),
            new Text(epochProp, {
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
      children: [makeTableHeader(TABLE_WIDTH, strings.epochStringProperty), queueRows],
    });

    const previousButton = new TextPushButton("<", {
      font: LABEL_FONT,
      baseColor: VSPColors.buttonNeutralColorProperty,
      listener: () => {
        if (model.blinkQueue.length > 0) {
          model.queuePositionProperty.value =
            (model.queuePositionProperty.value + model.blinkQueue.length - 1) % model.blinkQueue.length;
        }
      },
    });
    const blinkButton = new TextPushButton(strings.blinkStringProperty, {
      font: LABEL_FONT,
      baseColor: VSPColors.buttonNeutralColorProperty,
      listener: () => {
        model.isBlinkingProperty.value = !model.isBlinkingProperty.value;
      },
    });
    model.isBlinkingProperty.link((isBlinking) => {
      blinkButton.baseColor = isBlinking ? VSPColors.buttonActiveColorProperty : VSPColors.buttonNeutralColorProperty;
    });
    const nextButton = new TextPushButton(">", {
      font: LABEL_FONT,
      baseColor: VSPColors.buttonNeutralColorProperty,
      listener: () => {
        if (model.blinkQueue.length > 0) {
          model.queuePositionProperty.value = (model.queuePositionProperty.value + 1) % model.blinkQueue.length;
        }
      },
    });

    const blinkSpeedSlider = new HSlider(model.blinkIntervalMsProperty, BLINK_INTERVAL_RANGE, {
      tandem: tandem.createTandem("blinkSpeedSlider"),
    });
    blinkSpeedSlider.addMajorTick(BLINK_INTERVAL_RANGE.min, new Text(strings.fastStringProperty, { font: SMALL_FONT }));
    blinkSpeedSlider.addMajorTick(BLINK_INTERVAL_RANGE.max, new Text(strings.slowStringProperty, { font: SMALL_FONT }));

    const transferControls = new VBox({
      spacing: 20,
      align: "center",
      children: [
        new Text("⟶", { font: new PhetFont(38), fill: VSPColors.transferArrowColorProperty }),
        addButton,
        removeButton,
        new Text("⟵", { font: new PhetFont(34), fill: VSPColors.transferArrowColorProperty }),
      ],
    });

    const listRow = new HBox({
      spacing: 22,
      align: "top",
      children: [
        new VBox({
          spacing: 6,
          align: "left",
          children: [new Text(strings.observationsListStringProperty, { font: LABEL_FONT }), observationTable],
        }),
        transferControls,
        new VBox({
          spacing: 6,
          align: "left",
          children: [new Text(strings.blinkingQueueStringProperty, { font: LABEL_FONT }), queueTable],
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
      children: [new Text(strings.rateStringProperty, { font: LABEL_FONT }), blinkSpeedSlider],
    });

    const controlContent = new VBox({
      spacing: 14,
      align: "left",
      children: [
        new Text(strings.queueControlsStringProperty, { font: HEADER_FONT }),
        listRow,
        new HBox({ spacing: 38, align: "center", children: [new Node({ maxWidth: 150 }), navigationRow] }),
        new HBox({ spacing: 42, align: "center", children: [new Node({ maxWidth: 150 }), rateRow] }),
      ],
    });

    const controlPanel = new Panel(controlContent, {
      fill: VSPColors.controlPanelFillProperty,
      stroke: VSPColors.controlPanelStrokeProperty,
      cornerRadius: VSPConstants.LAYOUT.PANEL_CORNER_RADIUS,
      xMargin: VSPConstants.LAYOUT.PANEL_X_MARGIN,
      yMargin: VSPConstants.LAYOUT.PANEL_Y_MARGIN,
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
      right: this.layoutBounds.maxX - VSPConstants.LAYOUT.RESET_BUTTON_MARGIN,
      bottom: this.layoutBounds.maxY - VSPConstants.LAYOUT.RESET_BUTTON_MARGIN,
      tandem: tandem.createTandem("resetAllButton"),
    });
    this.addChild(resetAllButton);
  }

  public override step(dt: number): void {
    super.step(dt);
    this.model.step(dt);
  }
}
