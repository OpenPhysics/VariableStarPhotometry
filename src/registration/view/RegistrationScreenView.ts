/**
 * RegistrationScreenView.ts
 *
 * View for the Registration screen.
 *
 * Students overlay three CCD star-field images taken at different epochs
 * and use the X/Y offset controls (or arrow keys) to align them.
 *
 * Layout
 * ┌─────────────────────┬──────────────────────────────┐
 * │  Work Area          │  Starfield Controls          │
 * │  (380 × 290)        │  sf1: shown    –    –    –   │
 * │  [overlaid fields]  │  sf2: shown  on-top  x    y  │
 * │                     │  sf3: shown  on-top  x    y  │
 * │                     │  ─────────────────────────── │
 * │                     │  Appearance Options          │
 * │                     │  [x] make top transparent    │
 * │                     │  [ ] invert colors           │
 * │                     │  [Switch on top field / J]   │
 * └─────────────────────┴──────────────────────────────┘
 *                                            [Reset All]
 */
import { Multilink } from 'scenerystack/axon';
import { Shape } from 'scenerystack/kite';
import {
  HBox,
  KeyboardListener,
  Node,
  Rectangle,
  Text,
  VBox,
} from 'scenerystack/scenery';
import {
  PhetFont,
  ResetAllButton,
} from 'scenerystack/scenery-phet';
import type { ScreenViewOptions } from 'scenerystack/sim';
import { ScreenView } from 'scenerystack/sim';
import {
  AquaRadioButton,
  Checkbox,
  Panel,
  TextPushButton,
  NumberPicker,
} from 'scenerystack/sun';
import { Tandem } from 'scenerystack/tandem';
import { StarFieldNode } from '../../common/view/StarFieldNode.js';
import type { RegistrationModel } from '../model/RegistrationModel.js';

const FIELD_W = 380;
const FIELD_H = 290;

const LABEL_FONT  = new PhetFont( 13 );
const HEADER_FONT = new PhetFont( { size: 14, weight: 'bold' } );

// Colours matching the Flash reference
const COLOR_ON_TOP = '#ff9090';
const COLOR_NORMAL = '#909090';

export class RegistrationScreenView extends ScreenView {

  public constructor( model: RegistrationModel, options?: ScreenViewOptions ) {
    super( options );

    const tandem = ( options?.tandem instanceof Tandem ) ? options.tandem : Tandem.OPT_OUT;

    // -----------------------------------------------------------------------
    // Work Area — three overlaid star fields
    // -----------------------------------------------------------------------
    const field1Node = new StarFieldNode( model.obsIndex1 );
    const field2Node = new StarFieldNode( model.obsIndex2 );
    const field3Node = new StarFieldNode( model.obsIndex3 );

    // Each field group: star image + coloured border
    function makeBorderRect(): Rectangle {
      return new Rectangle( 0, 0, FIELD_W, FIELD_H, {
        stroke: COLOR_NORMAL, lineWidth: 2, fill: null, pickable: false,
      } );
    }

    const border1 = makeBorderRect();
    const border2 = makeBorderRect();
    const border3 = makeBorderRect();

    const group1 = new Node( { children: [ field1Node, border1 ] } );
    const group2 = new Node( { children: [ field2Node, border2 ] } );
    const group3 = new Node( { children: [ field3Node, border3 ] } );

    // workLayer holds the three groups; clipped to field bounds
    const workLayer = new Node( {
      clipArea: Shape.rectangle( 0, 0, FIELD_W, FIELD_H ),
      children: [ group1, group2, group3 ],
    } );

    // Outer frame for the work area
    const workFrame = new Rectangle( 0, 0, FIELD_W, FIELD_H, {
      stroke: '#555', lineWidth: 1, fill: null,
    } );

    const workArea = new Node( {
      children: [ workLayer, workFrame ],
      left: 20,
      top: this.layoutBounds.centerY - FIELD_H / 2,
    } );
    this.addChild( workArea );

    // -----------------------------------------------------------------------
    // Link work-area properties
    // -----------------------------------------------------------------------

    // Positions
    model.xOffset2Property.link( dx => { group2.x = dx; } );
    model.yOffset2Property.link( dy => { group2.y = dy; } );
    model.xOffset3Property.link( dx => { group3.x = dx; } );
    model.yOffset3Property.link( dy => { group3.y = dy; } );

    // Visibility
    model.shown2Property.link( v => { group2.visible = v; } );
    model.shown3Property.link( v => { group3.visible = v; } );

    // "On top" → border colour + z-order
    model.onTopIndexProperty.link( idx => {
      border2.stroke = idx === 2 ? COLOR_ON_TOP : COLOR_NORMAL;
      border2.lineWidth = idx === 2 ? 3 : 2;
      border3.stroke = idx === 3 ? COLOR_ON_TOP : COLOR_NORMAL;
      border3.lineWidth = idx === 3 ? 3 : 2;

      // Bring the on-top group to the front
      if ( idx === 2 ) {
        workLayer.removeChild( group2 );
        workLayer.addChild( group2 );
      } else {
        workLayer.removeChild( group3 );
        workLayer.addChild( group3 );
      }
    } );

    // Transparency
    Multilink.multilink(
      [ model.onTopIndexProperty, model.topFieldTransparentProperty ],
      ( idx, transparent ) => {
        field2Node.opacity = ( idx === 2 && transparent ) ? 0.4 : 1;
        field3Node.opacity = ( idx === 3 && transparent ) ? 0.4 : 1;
      }
    );

    // Inverted colours — re-render all three fields
    model.invertColorsProperty.link( invert => {
      field1Node.setObservation( model.obsIndex1, invert );
      field2Node.setObservation( model.obsIndex2, invert );
      field3Node.setObservation( model.obsIndex3, invert );
    } );

    // -----------------------------------------------------------------------
    // Arrow-key / J nudge — global (fires anywhere in scene)
    // -----------------------------------------------------------------------
    KeyboardListener.createGlobal( this, {
      keys: [ 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'j' ] as const,
      fire: ( _event, keysPressed ) => {
        if ( keysPressed === 'arrowLeft' )  model.nudgeOnTopField( -1,  0 );
        if ( keysPressed === 'arrowRight' ) model.nudgeOnTopField(  1,  0 );
        if ( keysPressed === 'arrowUp' )    model.nudgeOnTopField(  0, -1 );
        if ( keysPressed === 'arrowDown' )  model.nudgeOnTopField(  0,  1 );
        if ( keysPressed === 'j' )          model.switchOnTopField();
      },
    } );

    // -----------------------------------------------------------------------
    // Control Panel
    // -----------------------------------------------------------------------

    // Helper: one row of the starfield table
    function makeStarfieldRow(
      label: string,
      shownProp: import('scenerystack/axon').BooleanProperty | null,
      onTopValue: number | null,
      xProp: import('scenerystack/axon').NumberProperty | null,
      yProp: import('scenerystack/axon').NumberProperty | null
    ): Node {
      const labelNode = new Text( label, { font: LABEL_FONT, maxWidth: 80 } );

      const shownBox = shownProp
        ? new Checkbox( shownProp, new Text( '', { font: LABEL_FONT } ), { boxWidth: 16 } )
        : new Text( '●', { font: LABEL_FONT } ); // reference always shown

      const onTopButton = ( onTopValue !== null )
        ? new AquaRadioButton<number>(
            model.onTopIndexProperty,
            onTopValue,
            new Text( '', { font: LABEL_FONT } ),
            { radius: 7 }
          )
        : new Node();  // no radio for reference

      const xPicker = ( xProp !== null )
        ? new NumberPicker( xProp, xProp.rangeProperty, {
            font: LABEL_FONT, color: 'black',
            incrementFunction: v => v + 1,
            decrementFunction: v => v - 1,
          } )
        : new Node();

      const yPicker = ( yProp !== null )
        ? new NumberPicker( yProp, yProp.rangeProperty, {
            font: LABEL_FONT, color: 'black',
            incrementFunction: v => v + 1,
            decrementFunction: v => v - 1,
          } )
        : new Node();

      return new HBox( {
        spacing: 8,
        align: 'center',
        children: [ labelNode, shownBox, onTopButton,
          new Text( 'x:', { font: LABEL_FONT } ), xPicker,
          new Text( 'y:', { font: LABEL_FONT } ), yPicker,
        ],
      } );
    }

    const row1 = makeStarfieldRow( 'Starfield 1', null, null, null, null );
    const row2 = makeStarfieldRow( 'Starfield 2',
      model.shown2Property, 2,
      model.xOffset2Property, model.yOffset2Property );
    const row3 = makeStarfieldRow( 'Starfield 3',
      model.shown3Property, 3,
      model.xOffset3Property, model.yOffset3Property );

    // Appearance Options
    const transparentCheckbox = new Checkbox(
      model.topFieldTransparentProperty,
      new Text( 'make top field transparent', { font: LABEL_FONT } ),
      { boxWidth: 16 }
    );

    const invertCheckbox = new Checkbox(
      model.invertColorsProperty,
      new Text( 'invert colors', { font: LABEL_FONT } ),
      { boxWidth: 16 }
    );

    const switchButton = new TextPushButton( 'Switch on top field  (J)', {
      font: LABEL_FONT,
      listener: () => model.switchOnTopField(),
      baseColor: '#d4d4d4',
    } );

    // Hint text
    const hintText = new Text( 'Use arrow keys to adjust position', {
      font: new PhetFont( 11 ),
      fill: '#555',
    } );

    const controlContent = new VBox( {
      spacing: 10,
      align: 'left',
      children: [
        new Text( 'Starfield Controls', { font: HEADER_FONT } ),
        row1, row2, row3,
        new Rectangle( 0, 0, 1, 1 ), // spacer
        new Text( 'Appearance Options', { font: HEADER_FONT } ),
        transparentCheckbox,
        invertCheckbox,
        new Rectangle( 0, 0, 1, 1 ), // spacer
        switchButton,
        hintText,
      ],
    } );

    const controlPanel = new Panel( controlContent, {
      fill: '#f0f0f0',
      stroke: '#888',
      cornerRadius: 6,
      xMargin: 12,
      yMargin: 12,
    } );

    controlPanel.left = workArea.right + 20;
    controlPanel.top  = workArea.top;
    this.addChild( controlPanel );

    // -----------------------------------------------------------------------
    // Reset All button
    // -----------------------------------------------------------------------
    const resetAllButton = new ResetAllButton( {
      listener: () => model.reset(),
      right:  this.layoutBounds.maxX - 10,
      bottom: this.layoutBounds.maxY - 10,
      tandem: tandem.createTandem( 'resetAllButton' ),
    } );
    this.addChild( resetAllButton );
  }

  public override step( dt: number ): void {
    super.step( dt );
  }
}
