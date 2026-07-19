/**
 * VariableStarPhotometryScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for the four Variable Star
 * Photometry screens. Drawn on the standard PhET 548 × 373 canvas using VSPColors.
 *
 *   Registration    — star field with a registration crosshair.
 *   Blink Comparator — two overlapping frames with blink markers.
 *   Photometry      — star with dual photometry apertures.
 *   Analyzer        — light-curve chart with a period marker.
 */
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import VSPColors from "../VSPColors.js";

const W = 548;
const H = 373;
const CX = W / 2;
const CY = H / 2;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: VSPColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: VSPColors.backgroundColorProperty,
  });
}

function fieldStar(x: number, y: number, r: number): Circle {
  return new Circle(r, {
    fill: VSPColors.comparisonStarColorProperty,
    opacity: 0.75,
    centerX: x,
    centerY: y,
  });
}

function starField(seedStars: Array<[number, number, number]>): Node[] {
  return seedStars.map(([x, y, r]) => fieldStar(x, y, r));
}

export function createRegistrationIcon(): ScreenIcon {
  const frame = new Rectangle(70, 40, W - 140, H - 80, 8, 8, {
    fill: VSPColors.fieldBackgroundColorProperty,
    stroke: VSPColors.fieldBorderHighlightColorProperty,
    lineWidth: 4,
  });
  const stars = starField([
    [140, 100, 5],
    [220, 160, 7],
    [300, 90, 4],
    [380, 200, 6],
    [180, 250, 5],
    [420, 120, 4],
    [340, 280, 8],
    [260, 220, 3],
  ]);
  const target = new Circle(10, {
    fill: VSPColors.variableStarColorProperty,
    centerX: CX,
    centerY: CY,
  });
  const crossV = new Line(CX, CY - 50, CX, CY + 50, {
    stroke: VSPColors.crosshairColorProperty,
    lineWidth: 3,
  });
  const crossH = new Line(CX - 50, CY, CX + 50, CY, {
    stroke: VSPColors.crosshairColorProperty,
    lineWidth: 3,
  });

  return iconFrom(new Node({ children: [background(), frame, ...stars, target, crossV, crossH] }));
}

export function createBlinkComparatorIcon(): ScreenIcon {
  const left = new Rectangle(50, 50, 210, 270, 8, 8, {
    fill: VSPColors.fieldBackgroundColorProperty,
    stroke: VSPColors.fieldBorderColorProperty,
    lineWidth: 3,
  });
  const right = new Rectangle(288, 50, 210, 270, 8, 8, {
    fill: VSPColors.fieldBackgroundColorProperty,
    stroke: VSPColors.fieldBorderHighlightColorProperty,
    lineWidth: 4,
  });
  const leftStars = starField([
    [110, 120, 5],
    [170, 180, 7],
    [140, 250, 4],
    [200, 140, 5],
  ]);
  const rightStars = starField([
    [348, 120, 5],
    [408, 180, 7],
    [378, 250, 4],
    [438, 140, 5],
  ]);
  // Variable star brighter in the right frame.
  const leftVar = new Circle(8, {
    fill: VSPColors.variableStarColorProperty,
    opacity: 0.45,
    centerX: 160,
    centerY: 200,
  });
  const rightVar = new Circle(11, {
    fill: VSPColors.variableStarColorProperty,
    centerX: 398,
    centerY: 200,
  });
  const marker = new Circle(8, {
    fill: VSPColors.queueMarkerColorProperty,
    centerX: 393,
    centerY: 70,
  });

  return iconFrom(
    new Node({ children: [background(), left, right, ...leftStars, ...rightStars, leftVar, rightVar, marker] }),
  );
}

export function createPhotometryIcon(): ScreenIcon {
  const frame = new Rectangle(70, 40, W - 140, H - 80, 8, 8, {
    fill: VSPColors.fieldBackgroundColorProperty,
    stroke: VSPColors.fieldBorderColorProperty,
    lineWidth: 3,
  });
  const stars = starField([
    [150, 110, 4],
    [420, 90, 5],
    [200, 280, 4],
    [400, 260, 6],
    [300, 100, 3],
  ]);
  const primary = new Circle(14, {
    fill: VSPColors.variableStarColorProperty,
    centerX: CX - 40,
    centerY: CY,
  });
  const secondary = new Circle(10, {
    fill: VSPColors.comparisonStarColorProperty,
    centerX: CX + 90,
    centerY: CY + 30,
  });
  const aperture1 = new Path(Shape.ellipse(CX - 40, CY, 48, 48, 0), {
    stroke: VSPColors.aperturePrimaryColorProperty,
    lineWidth: 5,
  });
  const aperture2 = new Path(Shape.ellipse(CX + 90, CY + 30, 36, 36, 0), {
    stroke: VSPColors.apertureSecondaryColorProperty,
    lineWidth: 5,
  });

  return iconFrom(new Node({ children: [background(), frame, ...stars, primary, secondary, aperture1, aperture2] }));
}

export function createAnalyzerIcon(): ScreenIcon {
  const chart = new Rectangle(50, 50, W - 100, H - 100, 10, 10, {
    fill: VSPColors.chartBackgroundColorProperty,
    stroke: VSPColors.chartStrokeColorProperty,
    lineWidth: 3,
  });
  const gridH = new Line(70, H / 2, W - 70, H / 2, {
    stroke: VSPColors.chartGridColorProperty,
    lineWidth: 2,
  });
  const samples = 40;
  const shape = new Shape();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = 80 + t * (W - 160);
    const y = H / 2 + 55 * Math.sin(t * Math.PI * 4) * Math.exp(-0.15 * Math.sin(t * Math.PI * 2));
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  const curve = new Path(shape, {
    stroke: VSPColors.lightCurveColorProperty,
    lineWidth: 5,
    lineCap: "round",
    lineJoin: "round",
  });
  const marker = new Line(CX + 40, 70, CX + 40, H - 70, {
    stroke: VSPColors.pdmMarkerColorProperty,
    lineWidth: 4,
  });

  return iconFrom(new Node({ children: [background(), chart, gridH, curve, marker] }));
}
