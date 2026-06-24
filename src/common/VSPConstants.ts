/**
 * VSPConstants.ts
 *
 * Shared numeric constants for the Variable Star Photometry simulation.
 *
 * Star field dimensions mirror the NAAP reference sim (settings.xml pixel grid).
 */
import VSPNamespace from "../VSPNamespace.js";

const VSPConstants = {
  /** Width of the synthetic CCD star field, in model pixels. */
  FIELD_WIDTH: 380,

  /** Height of the synthetic CCD star field, in model pixels. */
  FIELD_HEIGHT: 290,

  /** PSF (point-spread function) radius used when rendering simulated stars. */
  PSF_RADIUS: 5,

  /** Default aperture diameter for photometry, in field pixels. */
  DEFAULT_APERTURE_DIAMETER: 14,

  /** Default sky-annulus inner radius (from star centre), in field pixels. */
  DEFAULT_ANNULUS_INNER: 10,

  /** Default sky-annulus outer radius (from star centre), in field pixels. */
  DEFAULT_ANNULUS_OUTER: 16,

  /** CCD noise standard deviation (ADU). Matches NAAP noiseSigma. */
  NOISE_SIGMA: 330,

  /** CCD noise mean (ADU). Matches NAAP noiseMean. */
  NOISE_MEAN: 2300,

  /** Magnitude at which a star saturates the CCD detector. */
  SATURATION_MAGNITUDE: 3,

  /** Reference Julian epoch (year) for the first observation. */
  REFERENCE_EPOCH: 1.7215,

  /** Default blink interval between frames, in milliseconds. */
  DEFAULT_BLINK_INTERVAL_MS: 600,
} as const;

VSPNamespace.register("VSPConstants", VSPConstants);

export default VSPConstants;
