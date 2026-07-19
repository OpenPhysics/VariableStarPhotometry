/**
 * ApertureNode.ts
 *
 * A draggable photometry-aperture overlay drawn in the star field's coordinate
 * frame (field pixels). It shows the inner flux disc and the surrounding
 * sky-background annulus as concentric rings, plus an optional numeric label.
 *
 * The whole node is positioned at `centerProperty`; a {@link DragListener}
 * updates that property (clamped to the field bounds) while the student drags.
 * A {@link KeyboardDragListener} provides the equivalent arrow-key operation
 * (the node is focusable), per the OpenPhysics accessibility convention.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Property } from "scenerystack/axon";
import type { Bounds2, Vector2, Vector2Property } from "scenerystack/dot";
import { optionize } from "scenerystack/phet-core";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { NodeOptions, TColor } from "scenerystack/scenery";
import { Circle, DragListener, KeyboardDragListener, Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import VariableStarPhotometryConstants from "../../VariableStarPhotometryConstants.js";

type ApertureNodeSelfOptions = {
  /** Field-pixel bounds the centre is clamped to while dragging (model space). */
  dragBounds: Bounds2;
  /** Ring colour (disc + annulus + label). */
  color: TColor;
  /** Numeric/letter label shown beside the aperture. */
  label: string;
  /** Whether the label is currently visible. */
  labelVisibleProperty: TReadOnlyProperty<boolean>;
  /**
   * Transform from model (CCD pixel) coordinates to view (field-container local)
   * coordinates. Defaults to identity — VSP renders the field at 1:1 scale so
   * model px = view px in the field container.
   */
  modelViewTransform?: ModelViewTransform2;
};

export type ApertureNodeOptions = ApertureNodeSelfOptions & NodeOptions;

const LABEL_FONT = new PhetFont({ size: VariableStarPhotometryConstants.FONT_SIZE.LABEL, weight: "bold" });

export class ApertureNode extends Node {
  public constructor(
    centerProperty: Vector2Property,
    apertureRadiusProperty: TReadOnlyProperty<number>,
    skyInnerRadiusProperty: TReadOnlyProperty<number>,
    skyOuterRadiusProperty: TReadOnlyProperty<number>,
    providedOptions: ApertureNodeOptions,
  ) {
    const options = optionize<ApertureNodeOptions, ApertureNodeSelfOptions, NodeOptions>()(
      {
        cursor: "pointer",
        // Default to identity — VSP renders the field at 1:1 scale so model px = view px.
        modelViewTransform: ModelViewTransform2.createIdentity(),
        // Keyboard-operable: focusable in the PDOM so the KeyboardDragListener below
        // can move the aperture with the arrow keys. Callers pass `accessibleName`.
        tagName: "div",
        focusable: true,
      },
      providedOptions,
    );

    super(options);

    const mvt = options.modelViewTransform;

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

    // Position the node: model centre → view position via the transform.
    centerProperty.link((center: Vector2) => {
      this.translation = mvt.modelToViewPosition(center);
    });

    // DragListener: `transform` maps pointer positions from view space to model
    // space so positionProperty is kept in model (CCD pixel) coordinates.
    // dragBoundsProperty is also in model space.
    this.addInputListener(
      new DragListener({
        positionProperty: centerProperty,
        dragBoundsProperty: new Property(options.dragBounds),
        transform: mvt,
        useParentOffset: true,
      }),
    );

    // Arrow-key dragging (Shift for fine positioning), same model-space clamping.
    this.addInputListener(
      new KeyboardDragListener({
        positionProperty: centerProperty,
        dragBoundsProperty: new Property(options.dragBounds),
        transform: mvt,
        dragSpeed: 100,
        shiftDragSpeed: 20,
      }),
    );
  }
}
