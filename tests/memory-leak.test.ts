/**
 * Fleet-standard memory-leak regression suite (SceneryStackTemplate / QubitSketch pattern).
 *
 * Creates a disposable model object inside a function boundary, disposes it, forces
 * garbage collection via global.gc (--expose-gc in vitest.config.ts), then asserts via
 * WeakRef that the object was collected. V8 requires a function boundary (not merely
 * a block scope) so local strong references die when the helper returns.
 *
 * PhotometryModel has no dispose() yet; this test disposes its owned Properties
 * explicitly (DerivedProperties first, then leaf Properties) to match the pattern.
 */

import { describe, expect, it } from "vitest";
import { PhotometryModel } from "../src/photometry/model/PhotometryModel.js";

/**
 * Force garbage collection with multiple passes. When `earlyExitRefs` is supplied
 * the loop bails as soon as every referenced object is confirmed collected. The
 * setTimeout(0) yield after a live deref() avoids the WeakRef macrotask-liveness pin.
 * Without early-exit refs the loop always runs all passes, which on a slow `gc()`
 * can exceed the Vitest testTimeout — always pass refs when you have them.
 */
async function forceGC(earlyExitRefs?: WeakRef<object> | readonly WeakRef<object>[]): Promise<void> {
  const refs = earlyExitRefs === undefined ? [] : Array.isArray(earlyExitRefs) ? earlyExitRefs : [earlyExitRefs];
  for (let i = 0; i < 15; i++) {
    globalThis.gc?.();
    await new Promise<void>((r) => setTimeout(r, 50));
    if (refs.length > 0 && refs.every((ref) => ref.deref() === undefined)) {
      return;
    }
    if (refs.length > 0) {
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }
}

/** Dispose all reactive state owned by a PhotometryModel instance. Idempotent. */
function disposePhotometryModel(model: PhotometryModel): void {
  const disposeIfNeeded = (property: { isDisposed?: boolean; dispose(): void }): void => {
    if (!property.isDisposed) {
      property.dispose();
    }
  };

  disposeIfNeeded(model.magnitudeDifferenceProperty);
  disposeIfNeeded(model.aperture1PhotometryProperty);
  disposeIfNeeded(model.aperture2PhotometryProperty);
  disposeIfNeeded(model.labelAperturesProperty);
  disposeIfNeeded(model.aperture2CenterProperty);
  disposeIfNeeded(model.aperture1CenterProperty);
  disposeIfNeeded(model.epochIndexProperty);
  disposeIfNeeded(model.annulusOuterRadiusProperty);
  disposeIfNeeded(model.annulusInnerRadiusProperty);
  disposeIfNeeded(model.apertureDiameterProperty);
}

function createAndDisposePhotometryModel(): WeakRef<object> {
  const model = new PhotometryModel();
  const ref = new WeakRef<object>(model);
  disposePhotometryModel(model);
  return ref;
}

describe("Memory leak regression", () => {
  it("global.gc is available (--expose-gc)", () => {
    expect(globalThis.gc).toBeDefined();
  });

  it("sanity: plain object is collected", async () => {
    const ref = (() => new WeakRef({ hello: "world" }))();
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("PhotometryModel is collected after its Properties are disposed", async () => {
    const ref = createAndDisposePhotometryModel();
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("double dispose of Properties does not throw", () => {
    const model = new PhotometryModel();
    disposePhotometryModel(model);
    expect(() => disposePhotometryModel(model)).not.toThrow();
  });

  it("repeated create/dispose cycles leave no survivors", async () => {
    const refs: WeakRef<object>[] = [];
    for (let i = 0; i < 10; i++) {
      refs.push(createAndDisposePhotometryModel());
    }
    await forceGC(refs);
    const survivors = refs.filter((r) => r.deref() !== undefined).length;
    expect(survivors).toBe(0);
  });
});
