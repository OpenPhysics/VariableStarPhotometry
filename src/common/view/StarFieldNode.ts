/**
 * StarFieldNode.ts
 *
 * SceneryStack CanvasNode that displays one rendered CCD star-field image.
 * Call setObservation( index, invert ) to switch to a different epoch.
 * Call invalidatePaint() to trigger a repaint after changing the image.
 */

import { Bounds2 } from 'scenerystack/dot';
import { CanvasNode } from 'scenerystack/scenery';
import type { CanvasNodeOptions } from 'scenerystack/scenery';
import { CCDField } from '../model/CCDField.js';

const FIELD = CCDField.getInstance();

export type StarFieldNodeOptions = CanvasNodeOptions;

export class StarFieldNode extends CanvasNode {
  private obsIndex: number;
  private invert:   boolean;
  private imageData: ImageData | null = null;

  public constructor( obsIndex = 0, invert = false, options?: StarFieldNodeOptions ) {
    super( {
      canvasBounds: new Bounds2( 0, 0, FIELD.width, FIELD.height ),
      ...options,
    } );

    this.obsIndex = obsIndex;
    this.invert   = invert;
    this.refresh();
  }

  /** Switch to a new observation; triggers a repaint. */
  public setObservation( obsIndex: number, invert = false ): void {
    if ( this.obsIndex === obsIndex && this.invert === invert ) return;
    this.obsIndex = obsIndex;
    this.invert   = invert;
    this.refresh();
  }

  private refresh(): void {
    this.imageData = FIELD.render( this.obsIndex, this.invert );
    this.invalidatePaint();
  }

  public override paintCanvas( context: CanvasRenderingContext2D ): void {
    if ( this.imageData ) {
      context.putImageData( this.imageData, 0, 0 );
    }
  }
}
