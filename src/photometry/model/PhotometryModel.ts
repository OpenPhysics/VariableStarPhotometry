/**
 * PhotometryModel.ts
 *
 * Model for the Photometry screen.
 *
 * Students place circular apertures over stars in a CCD image and measure
 * their instrumental magnitudes. A sky-annulus surrounding each aperture
 * estimates the local background level, which is subtracted before the
 * brightness is converted to an instrumental magnitude via:
 *
 *   m_inst = -2.5 × log10(net_counts)
 *
 * TODO: wire up star-field data from VSPConstants/settings; implement
 *       aperture photometry arithmetic; track per-star measurements.
 */
import { NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import VSPConstants from "../../common/VSPConstants.js";
import VSPNamespace from "../../VSPNamespace.js";

export const APERTURE_DIAMETER_RANGE = new Range(6, 30);
export const ANNULUS_INNER_RANGE = new Range(8, 25);
export const ANNULUS_OUTER_RANGE = new Range(12, 40);

/** Index of the epoch (observation) being measured. */
export const EPOCH_INDEX_RANGE = new Range(0, 99);

export class PhotometryModel {
  /** Aperture diameter for stellar flux integration, in field pixels. */
  public readonly apertureDiameterProperty: NumberProperty;

  /** Inner radius of the sky-background annulus, in field pixels. */
  public readonly annulusInnerRadiusProperty: NumberProperty;

  /** Outer radius of the sky-background annulus, in field pixels. */
  public readonly annulusOuterRadiusProperty: NumberProperty;

  /** Currently selected epoch (observation) index. */
  public readonly epochIndexProperty: NumberProperty;

  public constructor(_tandem?: Tandem) {
    this.apertureDiameterProperty = new NumberProperty(VSPConstants.DEFAULT_APERTURE_DIAMETER, {
      range: APERTURE_DIAMETER_RANGE,
    });

    this.annulusInnerRadiusProperty = new NumberProperty(VSPConstants.DEFAULT_ANNULUS_INNER, {
      range: ANNULUS_INNER_RANGE,
    });

    this.annulusOuterRadiusProperty = new NumberProperty(VSPConstants.DEFAULT_ANNULUS_OUTER, {
      range: ANNULUS_OUTER_RANGE,
    });

    this.epochIndexProperty = new NumberProperty(0, {
      numberType: "Integer",
      range: EPOCH_INDEX_RANGE,
    });
  }

  public step(_dt: number): void {
    // No continuous animation — photometry state changes only on user interaction.
  }

  public reset(): void {
    this.apertureDiameterProperty.reset();
    this.annulusInnerRadiusProperty.reset();
    this.annulusOuterRadiusProperty.reset();
    this.epochIndexProperty.reset();
  }
}

VSPNamespace.register("PhotometryModel", PhotometryModel);
