/**
 * FieldGridNode.ts
 *
 * A faint reference grid drawn over a star field, toggled by the global
 * "Show Grid" preference. The grid is laid out in field-pixel coordinates and is
 * non-interactive, so it can be overlaid directly on top of a {@link StarFieldNode}
 * without intercepting pointer events.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Line, Node } from "scenerystack/scenery";
import VSPColors from "../../VSPColors.js";
import VSPConstants from "../../VSPConstants.js";

export class FieldGridNode extends Node {
  public constructor(width: number, height: number, visibleProperty: TReadOnlyProperty<boolean>) {
    super({ pickable: false });

    const spacing = VSPConstants.LAYOUT.GRID_SPACING;
    const stroke = VSPColors.fieldGridColorProperty;
    const lineWidth = VSPConstants.LAYOUT.FRAME_LINE_WIDTH;
    const lines: Line[] = [];

    for (let x = spacing; x < width; x += spacing) {
      lines.push(new Line(x, 0, x, height, { stroke, lineWidth }));
    }
    for (let y = spacing; y < height; y += spacing) {
      lines.push(new Line(0, y, width, y, { stroke, lineWidth }));
    }
    this.children = lines;

    visibleProperty.link((visible) => {
      this.visible = visible;
    });
  }
}
