/**
 * ApertureNode.ts
 *
 * A draggable photometry-aperture overlay drawn in the star field's coordinate
 * frame (field pixels). It shows the inner flux disc and the surrounding
 * sky-background annulus as concentric rings, plus an optional numeric label.
 *
 * The whole node is positioned at `centerProperty`; a {@link DragListener}
 * updates that property (clamped to the field bounds) while the student drags.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Property } from "scenerystack/axon";
import type { Bounds2, Vector2, Vector2Property } from "scenerystack/dot";
import { optionize } from "scenerystack/phet-core";
import type { NodeOptions, TColor } from "scenerystack/scenery";
import { Circle, DragListener, Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import VSPConstants from "../VSPConstants.js";

type ApertureNodeSelfOptions = {
  /** Field-pixel bounds the centre is clamped to while dragging. */
  dragBounds: Bounds2;
  /** Ring colour (disc + annulus + label). */
  color: TColor;
  /** Numeric/letter label shown beside the aperture. */
  label: string;
  /** Whether the label is currently visible. */
  labelVisibleProperty: TReadOnlyProperty<boolean>;
};

export type ApertureNodeOptions = ApertureNodeSelfOptions & NodeOptions;

const LABEL_FONT = new PhetFont({ size: VSPConstants.FONT_SIZE.LABEL, weight: "bold" });

export class ApertureNode extends Node {
  public constructor(
    centerProperty: Vector2Property,
    apertureRadiusProperty: TReadOnlyProperty<number>,
    skyInnerRadiusProperty: TReadOnlyProperty<number>,
    skyOuterRadiusProperty: TReadOnlyProperty<number>,
    providedOptions: ApertureNodeOptions,
  ) {
    const options = optionize<ApertureNodeOptions, ApertureNodeSelfOptions, NodeOptions>()(
      { cursor: "pointer" },
      providedOptions,
    );

    super(options);

    // Inner flux disc.
    const discRing = new Circle(apertureRadiusProperty.value, {
      stroke: options.color,
      lineWidth: 1.5,
      fill: null,
    });

    // Sky-background annulus (two faint rings).
    const skyInnerRing = new Circle(skyInnerRadiusProperty.value, {
      stroke: options.color,
      lineWidth: 1,
      lineDash: [3, 3],
      fill: null,
    });
    const skyOuterRing = new Circle(skyOuterRadiusProperty.value, {
      stroke: options.color,
      lineWidth: 1,
      lineDash: [3, 3],
      fill: null,
    });

    // Small centre crosshair to mark the exact star position.
    const centerDot = new Circle(1, { fill: options.color });

    const label = new Text(options.label, { font: LABEL_FONT, fill: options.color });
    options.labelVisibleProperty.link((visible) => {
      label.visible = visible;
    });

    apertureRadiusProperty.link((r) => {
      discRing.radius = r;
    });
    skyInnerRadiusProperty.link((r) => {
      skyInnerRing.radius = r;
    });
    skyOuterRadiusProperty.link((r) => {
      skyOuterRing.radius = r;
      // Park the label just outside the outermost ring.
      label.centerX = 0;
      label.bottom = -r - 2;
    });

    this.children = [skyOuterRing, skyInnerRing, discRing, centerDot, label];

    // Position the node at the aperture centre (field-pixel coordinates).
    centerProperty.link((center: Vector2) => {
      this.translation = center;
    });

    // Drag updates the centre, clamped to the field bounds.
    this.addInputListener(
      new DragListener({
        positionProperty: centerProperty,
        dragBoundsProperty: new Property(options.dragBounds),
        useParentOffset: true,
      }),
    );
  }
}
