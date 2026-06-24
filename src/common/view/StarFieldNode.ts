/**
 * StarFieldNode.ts
 *
 * SceneryStack CanvasNode that displays one rendered CCD star-field image.
 * Call setObservation( index, invert ) to switch to a different epoch.
 *
 * Implementation note: the rendered `ImageData` is blitted onto an offscreen
 * canvas which is then drawn with `context.drawImage()`.  `putImageData()`
 * cannot be used directly here because it ignores the canvas transformation
 * matrix — and Scenery hands `paintCanvas()` a context already transformed into
 * this node's local frame (which includes the ScreenView layout scale plus any
 * translation/opacity applied by the scene graph).  `drawImage()` honours that
 * transform; `putImageData()` would paint at raw device pixels in the wrong
 * place and at the wrong scale.
 */

import { Bounds2 } from "scenerystack/dot";
import type { CanvasNodeOptions } from "scenerystack/scenery";
import { CanvasNode } from "scenerystack/scenery";
import { CCDField } from "../model/CCDField.js";

const FIELD = CCDField.getInstance();

export type StarFieldNodeOptions = CanvasNodeOptions;

export class StarFieldNode extends CanvasNode {
  private obsIndex: number;
  private invert: boolean;

  // Offscreen canvas holding the current frame; drawn via drawImage() so the
  // node transform (layout scale, translation) is respected.
  private readonly buffer: HTMLCanvasElement;
  private readonly bufferContext: CanvasRenderingContext2D;

  public constructor(obsIndex = 0, invert = false, options?: StarFieldNodeOptions) {
    super({
      canvasBounds: new Bounds2(0, 0, FIELD.width, FIELD.height),
      ...options,
    });

    this.obsIndex = obsIndex;
    this.invert = invert;

    this.buffer = document.createElement("canvas");
    this.buffer.width = FIELD.width;
    this.buffer.height = FIELD.height;
    const context = this.buffer.getContext("2d");
    if (!context) {
      throw new Error("StarFieldNode: unable to obtain a 2D canvas context");
    }
    this.bufferContext = context;

    this.refresh();
  }

  /** Switch to a new observation; triggers a repaint only when something changed. */
  public setObservation(obsIndex: number, invert = false): void {
    if (this.obsIndex === obsIndex && this.invert === invert) {
      return;
    }
    this.obsIndex = obsIndex;
    this.invert = invert;
    this.refresh();
  }

  /** The observation index currently displayed. */
  public get observationIndex(): number {
    return this.obsIndex;
  }

  private refresh(): void {
    const imageData = FIELD.render(this.obsIndex, this.invert);
    this.bufferContext.putImageData(imageData, 0, 0);
    this.invalidatePaint();
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    context.drawImage(this.buffer, 0, 0);
  }
}
