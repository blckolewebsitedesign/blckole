// Three.js publishes the jsm addons (examples/jsm/*) as untyped .js modules.
// These ambient declarations cover the addons this app actually imports so the
// TypeScript build (and Vercel's strict CI check) doesn't fall over with
// "implicitly has an 'any' type" errors.

declare module "three/examples/jsm/utils/SkeletonUtils.js" {
  import type { Object3D } from "three";
  export function clone<T extends Object3D>(source: T): T;
}

declare module "three/examples/jsm/environments/RoomEnvironment.js" {
  import { Scene } from "three";
  export class RoomEnvironment extends Scene {
    constructor();
  }
}
