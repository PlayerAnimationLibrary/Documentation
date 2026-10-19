import React, {useEffect, useState} from 'react';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import Link from '@docusaurus/Link';
import FileDrop from '@site/src/components/FileDrop';
import styles from './cbm-editor.module.css';

// Minecraft refuses a model with a cube past these on any axis, and the mod then shows nothing
const MIN_COORDINATE = -16;
const MAX_COORDINATE = 32;
// An emote travels in a single packet, and a server passes along nothing bigger
const MAX_BYTES = 1048576;
// Past this share of the packet there is little room left for the animation and its sound
const CLOSE_TO_LIMIT = 85;
// The atlas lays textures out in rows, and starts a new one past this width
const ATLAS_WIDTH = 1024;
// The atlas preview is scaled up by whole pixels until it is about this big
const PREVIEW_SIZE = 256;
// The result is shown from its start, as a whole emote can run to thousands of lines
const PREVIEW_LINES = 50;
// Turning cubes by their groups multiplies matrices, which leaves dust like 29.999999999999996 behind
const PRECISION = 1e4;

const DIRECTIONS = ['down', 'up', 'north', 'south', 'west', 'east'] as const;
const AXES = ['x', 'y', 'z'] as const;
// Blockbench elements that have a shape, unlike locators and null objects
const SHAPES = ['mesh', 'texture_mesh', 'billboard', 'spline_mesh'];

type Direction = (typeof DIRECTIONS)[number];
type Vec3 = [number, number, number];
type Matrix = [Vec3, Vec3, Vec3];
type Uv = [number, number, number, number];
type Size = {width: number; height: number};
type Frame = Size & {x: number; y: number};

type Face = {uv?: Uv; texture: string; rotation?: number; tintindex?: number; cullface?: string};
type Rotation = {origin: Vec3; angle?: number; axis?: string; x?: number; y?: number; z?: number; rescale?: boolean};
type Element = {
  from: Vec3;
  to: Vec3;
  rotation?: Rotation;
  shade_direction_override?: string;
  light_emission?: number;
  faces: Partial<Record<Direction, Face>>;
};

/** The animation section of a .png.mcmeta */
type Animation = {width?: number; height?: number; frames?: (number | {index: number})[]};

type ModelTexture = {
  /** How faces refer to it: the variables of a block model, the id of a Blockbench texture */
  keys: string[];
  name: string;
  /** The image as a data URL, when the model file carries it */
  image: string | null;
  /** Whether the image can come with a .mcmeta, as a resource pack texture can */
  mcmeta: boolean;
  /** The part of the image the UVs span, which for an animated texture is its first frame */
  frame: (image: Size, animation?: Animation) => Frame;
};

/** A model as the elements a bone takes, each face naming its texture by its index in `textures` */
type Model = {
  name: string;
  /** What kind of file it was read from */
  format: string;
  elements: Element[];
  textures: ModelTexture[];
  /** Meshes and the like, which a Minecraft model cannot have */
  skipped: number;
  /** Faces left out because they have no texture */
  untextured: number;
};

type Chosen = {image?: string; animation?: Animation};
type BoneData = {pivot?: number[]; texture?: string; texture_size?: unknown; elements?: Element[]};
type Bone = {name: string; animation: string | null; data: BoneData};
type Emote = {name: string; json: any; bones: Bone[]};

type Result = {
  url: string;
  name: string;
  bone: string;
  cubes: number;
  atlas: string;
  size: Size;
  bytes: number;
  preview: string;
};

type Format = {
  /** The grid is centred on the origin instead of starting at the corner of a block */
  centered: boolean;
  /** Groups are bones, so a rotated group turns the cubes inside it */
  boneRig: boolean;
  /** An image taller than its UV area is a strip of animation frames */
  animatedTextures: boolean;
  /** Each texture has a UV size of its own instead of the project's */
  perTextureUv: (project: any) => boolean;
  /** Every face shows the default texture */
  singleTexture: boolean;
  /** A face without a texture of its own shows the default one */
  singleTextureDefault: boolean;
  /** A group can carry the texture of the cubes directly in it */
  perGroupTexture: boolean;
};

// The formats this page knows how to read, with the flags Blockbench and the GeckoLib plugin give them
const FORMATS: Record<string, Format> = {
  java_block: {
    centered: false,
    boneRig: false,
    animatedTextures: true,
    perTextureUv: () => false,
    singleTexture: false,
    singleTextureDefault: false,
    perGroupTexture: false,
  },
  free: {
    centered: true,
    boneRig: true,
    animatedTextures: true,
    perTextureUv: () => true,
    singleTexture: false,
    singleTextureDefault: false,
    perGroupTexture: false,
  },
  bedrock: {
    centered: true,
    boneRig: true,
    animatedTextures: true,
    perTextureUv: (project) => !!project.multi_file_ruleset,
    singleTexture: true,
    singleTextureDefault: false,
    perGroupTexture: false,
  },
  bedrock_block: {
    centered: true,
    boneRig: true,
    animatedTextures: true,
    perTextureUv: () => false,
    singleTexture: false,
    singleTextureDefault: true,
    perGroupTexture: false,
  },
  bedrock_old: {
    centered: true,
    boneRig: true,
    animatedTextures: true,
    perTextureUv: () => false,
    singleTexture: true,
    singleTextureDefault: false,
    perGroupTexture: false,
  },
  modded_entity: {
    centered: true,
    boneRig: true,
    animatedTextures: false,
    perTextureUv: () => false,
    singleTexture: true,
    singleTextureDefault: false,
    perGroupTexture: false,
  },
  optifine_entity: {
    centered: true,
    boneRig: true,
    animatedTextures: false,
    perTextureUv: () => true,
    singleTexture: false,
    singleTextureDefault: true,
    perGroupTexture: true,
  },
  optifine_part: {
    centered: true,
    boneRig: true,
    animatedTextures: false,
    perTextureUv: () => true,
    singleTexture: false,
    singleTextureDefault: true,
    perGroupTexture: true,
  },
  skin: {
    centered: true,
    boneRig: true,
    animatedTextures: false,
    perTextureUv: () => false,
    singleTexture: true,
    singleTextureDefault: false,
    perGroupTexture: false,
  },
  geckolib_model: {
    centered: true,
    boneRig: true,
    animatedTextures: true,
    perTextureUv: () => false,
    singleTexture: true,
    singleTextureDefault: false,
    perGroupTexture: false,
  },
};

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function showSize(bytes: number): string {
  return bytes < MAX_BYTES ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / MAX_BYTES).toFixed(2)} MB`;
}

async function readJson(file: File): Promise<any> {
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error(`${file.name} is not a JSON file.`);
  }
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function loadImage(source: string): Promise<ImageBitmap> {
  const blob = await (await fetch(source)).blob();
  // Minecraft takes the pixels as they are stored, so a colour profile in the file must not change them here
  return createImageBitmap(blob, {colorSpaceConversion: 'none'});
}

/** Every custom bone of the emote: the ones at the top, then the ones a single animation has. */
function bonesOf(json: any): Bone[] {
  const bones: Bone[] = [];
  const add = (model: unknown, animation: string | null) => {
    if (typeof model !== 'object' || model === null) return;
    for (const [name, data] of Object.entries(model as Record<string, BoneData>)) bones.push({name, animation, data});
  };

  add(json.model, null);
  for (const [animation, value] of Object.entries(json.animations ?? {})) add((value as any)?.model, animation);
  return bones;
}

/**
 * Lists the textures the faces use, in the order the model file lists them, and points every face at its
 * entry. Faces come in naming their texture by `key`.
 */
function listTextures(elements: Element[], order: string[], describe: (key: string) => ModelTexture): ModelTexture[] {
  const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length);
  const faces = elements.flatMap((element) => Object.values(element.faces));
  const keys = [...new Set(faces.map((face) => face.texture))].sort((a, b) => rank(a) - rank(b));
  for (const face of faces) face.texture = String(keys.indexOf(face.texture));
  return keys.map(describe);
}

function wholeImage(image: Size): Frame {
  return {x: 0, y: 0, width: image.width, height: image.height};
}

/** The first frame of an animated texture, cut the way Minecraft cuts it by its .mcmeta. */
function mcmetaFrame(image: Size, animation: Animation): Frame {
  // A side the .mcmeta leaves out is the image's own, and with neither given a frame is a square
  const side = Math.min(image.width, image.height);
  const width = animation.width ?? (animation.height === undefined ? side : image.width);
  const height = animation.height ?? (animation.width === undefined ? side : image.height);
  const first = animation.frames?.[0] ?? 0;
  const index = typeof first === 'number' ? first : first.index;
  const columns = Math.floor(image.width / width);
  return {x: (index % columns) * width, y: Math.floor(index / columns) * height, width, height};
}

function spriteOf(value: unknown): string | null {
  // Newer versions also take {"sprite": ..., "force_translucent": true}
  const sprite = typeof value === 'object' && value !== null ? (value as {sprite?: unknown}).sprite : value;
  return typeof sprite === 'string' ? sprite : null;
}

/**
 * Follows a face's `#name` through the model's texture variables, to the image they end at or to the
 * variable left undefined, which a parent model would set.
 */
function resolveTexture(variables: Record<string, unknown>, reference: unknown): {key: string; defined: boolean} | null {
  if (typeof reference !== 'string') return null;

  const seen = new Set<string>();
  let variable = reference.replace(/^#/, '');
  while (!seen.has(variable)) {
    seen.add(variable);
    const sprite = spriteOf(variables[variable]);
    if (sprite === null) {
      // What Blockbench writes for a face that has no texture
      return variable === 'missing' ? null : {key: `#${variable}`, defined: false};
    }
    if (!sprite.startsWith('#')) return {key: sprite, defined: true};
    variable = sprite.slice(1);
  }
  return null; // variables pointing at each other in a circle
}

/** Reads a Java block model, the kind a resource pack keeps under models/. */
function readJavaModel(json: any, name: string): Model {
  if (!Array.isArray(json.elements)) {
    throw new Error(
      typeof json.parent === 'string'
        ? `This model has no cubes of its own: it takes them from ${json.parent}, which this page cannot open. ` +
            'Open the model in Blockbench, save it as a .bbmodel and use that instead.'
        : 'This model has no cubes.',
    );
  }

  const variables = json.textures ?? {};
  const undefinedVariables = new Set<string>();
  let untextured = 0;

  const elements: Element[] = json.elements.map((element: any) => {
    const faces: Element['faces'] = {};
    for (const direction of DIRECTIONS) {
      const face = element.faces?.[direction];
      if (!face) continue;

      const resolved = resolveTexture(variables, face.texture);
      if (resolved === null) {
        untextured++;
        continue;
      }
      if (!resolved.defined) undefinedVariables.add(resolved.key);
      faces[direction] = {
        uv: face.uv,
        // The image the variables end at, so that one image is one texture however many variables name it
        texture: resolved.key,
        rotation: face.rotation,
        tintindex: face.tintindex,
        cullface: face.cullface,
      };
    }
    return {
      from: element.from,
      to: element.to,
      rotation: element.rotation,
      // Minecraft 26.3 dropped `shade`; Blockbench turns `"shade": false` into this
      shade_direction_override: element.shade_direction_override ?? (element.shade === false ? 'up' : undefined),
      light_emission: element.light_emission,
      faces,
    };
  });

  const kept = elements.filter(hasFaces);
  const order = Object.keys(variables).flatMap((variable) => resolveTexture(variables, variable)?.key ?? []);
  const textures = listTextures(kept, order, (key) => ({
    keys: undefinedVariables.has(key)
      ? [key]
      : Object.keys(variables)
          .filter((variable) => resolveTexture(variables, variable)?.key === key)
          .map((variable) => `#${variable}`),
    name: undefinedVariables.has(key) ? 'not defined in this file' : key,
    image: null,
    mcmeta: true,
    frame: (image, animation) => (animation ? mcmetaFrame(image, animation) : wholeImage(image)),
  }));
  return {name, format: 'block model', elements: kept, textures, skipped: 0, untextured};
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const apply = (m: Matrix, v: Vec3): Vec3 => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]) as Vec3;
const multiply = (a: Matrix, b: Matrix): Matrix =>
  a.map((row) => [0, 1, 2].map((column) => row[0] * b[0][column] + row[1] * b[1][column] + row[2] * b[2][column])) as Matrix;
const tidy = (value: number) => Math.round(value * PRECISION) / PRECISION;

const IDENTITY: Matrix = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** Angles in degrees applied about X, then Y, then Z: how Blockbench shows a rotation and how Minecraft reads one. */
function eulerMatrix([x, y, z]: Vec3): Matrix {
  const [cx, sx, cy, sy, cz, sz] = [x, y, z].flatMap((angle) => {
    const radians = (angle * Math.PI) / 180;
    return [Math.cos(radians), Math.sin(radians)];
  });
  const rx: Matrix = [
    [1, 0, 0],
    [0, cx, -sx],
    [0, sx, cx],
  ];
  const ry: Matrix = [
    [cy, 0, sy],
    [0, 1, 0],
    [-sy, 0, cy],
  ];
  const rz: Matrix = [
    [cz, -sz, 0],
    [sz, cz, 0],
    [0, 0, 1],
  ];
  return multiply(rz, multiply(ry, rx));
}

/** The angles `eulerMatrix` would take to build `m`, found the way three.js finds them for Blockbench. */
function eulerAngles(m: Matrix): Vec3 {
  const y = Math.asin(-Math.max(-1, Math.min(1, m[2][0])));
  // Straight up or down, X and Z turn about the same axis, so Z takes all of it
  const [x, z] =
    Math.abs(m[2][0]) < 0.9999999
      ? [Math.atan2(m[2][1], m[2][2]), Math.atan2(m[1][0], m[0][0])]
      : [0, Math.atan2(-m[0][1], m[1][1])];
  return [x, y, z].map((radians) => (radians * 180) / Math.PI) as Vec3;
}

/** A rigid motion: `v` goes to `rotation · v + offset`. */
type Motion = {rotation: Matrix; offset: Vec3};

/** `outer` after turning by `angles` about `origin`. */
function turnedAbout(outer: Motion, angles: Vec3, origin: Vec3): Motion {
  const rotation = eulerMatrix(angles);
  const shift = subtract(origin, apply(rotation, origin));
  return {rotation: multiply(outer.rotation, rotation), offset: add(apply(outer.rotation, shift), outer.offset)};
}

/** The rotation Minecraft reads, written the way Blockbench's Java export writes it for 1.21.11 and later. */
function rotationOf(angles: Vec3, origin: Vec3, rescale: boolean | undefined): Rotation | undefined {
  const turned = angles.filter((angle) => angle !== 0);
  if (turned.length === 0) return undefined;

  // A turn about one axis by up to 45 degrees has its own short form; anything else needs all three angles
  const rotation: Rotation =
    turned.length > 1 || turned.some((angle) => Math.abs(angle) > 45)
      ? {x: angles[0], y: angles[1], z: angles[2], origin}
      : {angle: turned[0], axis: AXES[angles.findIndex((angle) => angle !== 0)], origin};
  return rescale ? {...rotation, rescale} : rotation;
}

/** The groups around each element of the outliner, outermost first. */
function groupsAround(project: any): Map<string, any[]> {
  // Since format 5.0 the outliner holds only uuids, and the groups themselves are listed apart
  const groups = new Map<string, any>((project.groups ?? []).map((group: any) => [group.uuid, group]));
  const around = new Map<string, any[]>();
  const walk = (nodes: unknown[], parents: any[]) => {
    for (const node of nodes) {
      if (typeof node === 'string') {
        around.set(node, parents);
      } else if (Array.isArray((node as any)?.children)) {
        walk((node as any).children, [...parents, groups.get((node as any).uuid) ?? node]);
      }
    }
  };
  walk(project.outliner ?? [], []);
  return around;
}

/** The texture Blockbench picks when a face shows the default one, as it does on opening the project. */
function defaultTexture(files: any[], format: Format): number | undefined {
  if (format.singleTextureDefault) {
    const marked = files.findIndex((file) => file.use_as_default);
    if (marked !== -1) return marked;
  }
  if (files.length > 1 && files.some((file) => file.render_mode === 'layered')) {
    for (let index = files.length - 1; index >= 0; index--) {
      if (files[index].visible !== false) return index;
    }
  }
  return files.length > 0 ? 0 : undefined;
}

/** Which of the animation frames Minecraft shows first, by the order Blockbench writes into the .mcmeta. */
function firstFrame(file: any, frames: number): number {
  if (file.frame_order_type === 'backwards') return frames - 1;
  if (file.frame_order_type === 'custom' && typeof file.frame_order === 'string' && file.frame_order.trim()) {
    return parseInt(file.frame_order.trim().split(/\s+/)[0]); // "index" or "index:time"
  }
  return 0;
}

/** Reads a Blockbench project, turning each cube into the element Minecraft would need to show it the same way. */
function readBlockbenchModel(project: any, name: string): Model {
  const meta = project.meta;
  const formatName = meta.model_format ?? (meta.bone_rig ? 'bedrock_old' : 'java_block');
  const format = FORMATS[formatName];
  if (!format) {
    throw new Error(
      `This project is in a format this page does not know (${formatName}). In Blockbench, use ` +
        'File → Convert Project to make it a Generic Model, save it, and try again.',
    );
  }

  const resolution: Size = project.resolution ?? {width: 16, height: 16};
  const files: any[] = project.textures ?? [];
  const byUuid = new Map(files.map((file, index): [string, number] => [file.uuid, index]));
  const fallback = defaultTexture(files, format);
  const around = groupsAround(project);

  // A texture saved before it had a UV size of its own gets the project's, as Blockbench gives it
  const uvSize = (file: any): Size =>
    format.perTextureUv(project)
      ? {width: file.uv_width ?? resolution.width, height: file.uv_height ?? resolution.height}
      : resolution;
  // Blockbench moves cubes this far along X and Z when it turns a centred project into a Java block model
  const shift: Vec3 = format.centered ? [8, 0, 8] : [0, 0, 0];

  /** Which texture a face shows, decided the way Blockbench's Face.getTexture() decides it. */
  const textureOf = (face: any, group: any): number | null | undefined => {
    if (format.perGroupTexture && group?.texture) return byUuid.get(group.texture);
    if (face.texture === null) return null;
    // Blockbench keeps no texture for an index that points at nothing
    const own = typeof face.texture === 'number' && files[face.texture] ? face.texture : undefined;
    if (format.singleTexture || (format.singleTextureDefault && (format.perGroupTexture || own === undefined))) {
      return fallback;
    }
    return own;
  };

  const elements: Element[] = [];
  let skipped = 0;
  let untextured = 0;

  for (const cube of project.elements ?? []) {
    if ((cube.type ?? 'cube') !== 'cube') {
      if (SHAPES.includes(cube.type)) skipped++;
      continue;
    }
    if (cube.export === false) continue;

    const groups = around.get(cube.uuid) ?? [];
    const faces: Element['faces'] = {};
    for (const direction of DIRECTIONS) {
      const face = cube.faces?.[direction];
      if (!face) continue;

      const texture = textureOf(face, groups.at(-1));
      // A face made transparent in Blockbench, which its export leaves out as well
      if (texture === null) continue;
      if (texture === undefined) {
        untextured++;
        continue;
      }
      const uv = uvSize(files[texture]);
      faces[direction] = {
        // Without one, a face gets the UV Minecraft works out from where the face is
        uv:
          face.enabled === false || !face.uv
            ? undefined
            : [
                (face.uv[0] * 16) / uv.width,
                (face.uv[1] * 16) / uv.height,
                (face.uv[2] * 16) / uv.width,
                (face.uv[3] * 16) / uv.height,
              ],
        texture: String(texture),
        rotation: face.rotation || undefined,
        tintindex: face.tint >= 0 ? face.tint : undefined,
        cullface: face.cullface || undefined,
      };
    }

    const inflate = cube.inflate ?? 0;
    let from = add(cube.from.map((value: number) => value - inflate) as Vec3, shift);
    let to = add(cube.to.map((value: number) => value + inflate) as Vec3, shift);
    let origin = add(cube.origin ?? [0, 0, 0], shift);
    let angles: Vec3 = cube.rotation ?? [0, 0, 0];

    // A Minecraft model has no groups, so their rotation goes into each cube, about a pivot moved along with it
    const turning = format.boneRig ? groups.filter((group) => group.rotation?.some((angle: number) => angle !== 0)) : [];
    if (turning.length > 0) {
      let motion: Motion = {rotation: IDENTITY, offset: [0, 0, 0]};
      for (const group of turning) motion = turnedAbout(motion, group.rotation, add(group.origin, shift));
      motion = turnedAbout(motion, angles, origin);

      const pivot = add(apply(motion.rotation, origin), motion.offset);
      const moved = subtract(pivot, origin);
      from = add(from, moved).map(tidy) as Vec3;
      to = add(to, moved).map(tidy) as Vec3;
      origin = pivot.map(tidy) as Vec3;
      angles = eulerAngles(motion.rotation).map(tidy) as Vec3;
    }

    const element: Element = {
      from,
      to,
      rotation: rotationOf(angles, origin, cube.rescale),
      shade_direction_override: cube.shade_direction_override || (cube.shade === false ? 'up' : undefined),
      light_emission: cube.light_emission || undefined,
      faces,
    };
    if (hasFaces(element)) elements.push(element);
  }

  const textures = listTextures(elements, [...files.keys()].map(String), (key) => {
    const file = files[Number(key)];
    const uv = uvSize(file);
    return {
      keys: file.id === undefined ? [] : [`#${file.id}`],
      name: file.folder ? `${file.folder}/${file.name}` : file.name,
      image: typeof file.source === 'string' && file.source.startsWith('data:') ? file.source : null,
      mcmeta: false,
      frame: (image) => {
        const ratio = image.width / image.height;
        const uvRatio = uv.width / uv.height;
        // Blockbench's own count, which allows for a little rounding
        const frames = format.animatedTextures && ratio !== uvRatio ? Math.ceil(uvRatio / ratio - 0.05) : 1;
        if (frames <= 1) return wholeImage(image);
        const height = Math.round(image.height / frames);
        return {x: 0, y: firstFrame(file, frames) * height, width: image.width, height};
      },
    };
  });
  return {name, format: `Blockbench, ${formatName}`, elements, textures, skipped, untextured};
}

function hasFaces(element: Element): boolean {
  // Minecraft refuses an element without a single face
  return Object.keys(element.faces).length > 0;
}

async function readModel(file: File): Promise<Model> {
  const json = await readJson(file);
  if (typeof json !== 'object' || json === null) throw new Error(`${file.name} is not a model.`);

  // Only a Blockbench project has `meta`
  const model = json.meta ? readBlockbenchModel(json, file.name) : readJavaModel(json, file.name);
  if (model.elements.length === 0) throw new Error('This model has no cubes with a texture, so there is nothing to attach.');

  const outside = model.elements.filter((element) =>
    [...element.from, ...element.to].some((value) => value < MIN_COORDINATE || value > MAX_COORDINATE),
  ).length;
  if (outside > 0) {
    throw new Error(
      `${outside === 1 ? 'One cube reaches' : `${outside} cubes reach`} further than Minecraft allows, so the mod ` +
        `would refuse the whole model. Minecraft takes ${MIN_COORDINATE} to ${MAX_COORDINATE} on every axis of a ` +
        'block model, and the mod counts that from the feet: on the centred grid of the emote rig, 24 pixels to ' +
        'either side of the player, and from 16 below the feet to the top of the head, two blocks up.',
    );
  }
  return model;
}

/** The UV Minecraft gives a face that does not set one, in the 0-16 space of its texture. */
function defaultUv(direction: Direction, from: Vec3, to: Vec3): Uv {
  switch (direction) {
    case 'down':
      return [from[0], 16 - to[2], to[0], 16 - from[2]];
    case 'up':
      return [from[0], from[2], to[0], to[2]];
    case 'north':
      return [16 - to[0], 16 - to[1], 16 - from[0], 16 - from[1]];
    case 'south':
      return [from[0], 16 - to[1], to[0], 16 - from[1]];
    case 'west':
      return [from[2], 16 - to[1], to[2], 16 - from[1]];
    case 'east':
      return [16 - to[2], 16 - to[1], 16 - from[2], 16 - from[1]];
  }
}

/** Lays the pieces out left to right, in rows no wider than the atlas allows. */
function pack(pieces: Size[]): {places: Frame[]; size: Size} {
  const places: Frame[] = [];
  const size: Size = {width: 1, height: 1};
  let x = 0;
  let y = 0;
  let row = 0;

  for (const piece of pieces) {
    if (x > 0 && x + piece.width > ATLAS_WIDTH) {
      y += row;
      x = 0;
      row = 0;
    }
    places.push({x, y, width: piece.width, height: piece.height});
    x += piece.width;
    row = Math.max(row, piece.height);
    size.width = Math.max(size.width, x);
    size.height = Math.max(size.height, y + piece.height);
  }
  return {places, size};
}

/** The start of the file as it will be saved, with every texture's base64 cut short so that the lines stay readable. */
function previewOf(json: unknown): string {
  const lines = JSON.stringify(
    json,
    (key, value) =>
      key === 'texture' && typeof value === 'string' && !value.startsWith('#')
        ? `<${showSize((value.length * 3) / 4)} of PNG>`
        : value,
    2,
  ).split('\n');
  return (lines.length > PREVIEW_LINES ? [...lines.slice(0, PREVIEW_LINES), '...'] : lines).join('\n');
}

/** The element with every face moved onto the atlas, where its texture now sits at `placeOf(face)`. */
function onAtlas(element: Element, placeOf: (face: Face) => Frame, atlas: Size): Element {
  const faces: Element['faces'] = {};
  for (const direction of DIRECTIONS) {
    const face = element.faces[direction];
    if (!face) continue;

    const place = placeOf(face);
    const u = (value: number) => ((place.x + (value / 16) * place.width) * 16) / atlas.width;
    const v = (value: number) => ((place.y + (value / 16) * place.height) * 16) / atlas.height;
    const [u1, v1, u2, v2] = face.uv ?? defaultUv(direction, element.from, element.to);
    faces[direction] = {...face, uv: [u(u1), v(v1), u(u2), v(v2)], texture: '#texture'};
  }
  return {...element, faces};
}

export default function CbmEditor(): React.ReactElement {
  const [emote, setEmote] = useState<Emote | null>(null);
  const [emoteError, setEmoteError] = useState('');
  const [model, setModel] = useState<Model | null>(null);
  const [modelError, setModelError] = useState('');
  // Files picked for the textures the model does not carry, by texture index
  const [chosen, setChosen] = useState<Record<number, Chosen>>({});

  const [boneIndex, setBoneIndex] = useState(0);
  const [keep, setKeep] = useState(false);

  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const bone = emote?.bones[boneIndex];
  const boneCubes = bone?.data.elements?.length ?? 0;
  // The mod draws a bone only when it has both, so there is nothing to keep otherwise
  const boneHasModel = !!bone?.data.texture && boneCubes > 0;
  const embedded = model ? model.textures.filter((texture) => texture.image).length : 0;
  const missing = model ? model.textures.filter((texture, index) => !texture.image && !chosen[index]?.image).length : 0;
  const ready = !!emote && !!model && !!bone && missing === 0 && !busy;

  async function chooseEmote(file: File) {
    setResult(null);
    setBoneIndex(0);
    setKeep(false);
    try {
      const json = await readJson(file);
      setEmote({name: file.name, json, bones: bonesOf(json)});
      setEmoteError('');
    } catch (error) {
      setEmote(null);
      setEmoteError((error as Error).message);
    }
  }

  async function chooseModel(file: File) {
    setResult(null);
    setChosen({});
    try {
      setModel(await readModel(file));
      setModelError('');
    } catch (error) {
      setModel(null);
      setModelError((error as Error).message);
    }
  }

  async function chooseTexture(index: number, files: File[]) {
    setResult(null);
    try {
      const picked: Chosen = {...chosen[index]};
      for (const file of files) {
        if (file.name.endsWith('.mcmeta')) picked.animation = (await readJson(file)).animation ?? {};
        else picked.image = await readDataUrl(file);
      }
      setChosen((current) => ({...current, [index]: picked}));
      setModelError('');
    } catch (error) {
      setModelError((error as Error).message);
    }
  }

  function chooseBone(index: number) {
    setResult(null);
    setBoneIndex(index);
    setKeep(false);
  }

  async function attach() {
    if (!emote || !model || !bone || !ready) return;

    setBusy(true);
    setFailure('');
    setResult(null);

    try {
      const old = keep ? bone.data : null;
      const images = await Promise.all(
        model.textures.map((texture, index) => loadImage(texture.image ?? chosen[index].image!)),
      );
      const kept = old ? await loadImage(`data:image/png;base64,${old.texture}`) : null;

      // The bone's own texture first, if it stays, then the model's, each cut down to what its UVs span
      const pieces = [
        ...(kept ? [{image: kept, frame: wholeImage(kept)}] : []),
        ...model.textures.map((texture, index) => {
          const image = images[index];
          const frame = texture.frame(image, chosen[index]?.animation);
          if (frame.x < 0 || frame.y < 0 || frame.x + frame.width > image.width || frame.y + frame.height > image.height) {
            throw new Error(`The .mcmeta of ${texture.name} does not fit its image.`);
          }
          return {image, frame};
        }),
      ];
      const {places, size} = pack(pieces.map((piece) => piece.frame));

      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d')!;
      pieces.forEach(({image, frame}, index) => {
        const place = places[index];
        context.drawImage(image, frame.x, frame.y, frame.width, frame.height, place.x, place.y, frame.width, frame.height);
      });
      const atlas = canvas.toDataURL('image/png');
      const texture = atlas.slice(atlas.indexOf(',') + 1);

      const first = kept ? 1 : 0;
      const elements = [
        ...(old?.elements ?? []).map((element) => onAtlas(element, () => places[0], size)),
        ...model.elements.map((element) => onAtlas(element, (face) => places[first + Number(face.texture)], size)),
      ];

      const data: BoneData = {...bone.data, texture, elements};
      // Earlier versions of this page wrote it, and nothing reads it
      delete data.texture_size;

      const json = structuredClone(emote.json);
      const bones = bone.animation === null ? json.model : json.animations[bone.animation].model;
      bones[bone.name] = data;

      const bytes = atob(texture).length;
      setResult({
        url: URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], {type: 'application/json'})),
        name: emote.name,
        bone: bone.name,
        cubes: elements.length,
        atlas,
        size,
        bytes,
        preview: previewOf(json),
      });
    } catch (error) {
      setFailure(String(error));
    } finally {
      setBusy(false);
    }
  }

  const share = result ? Math.round((result.bytes / MAX_BYTES) * 100) : 0;
  const scale = result ? Math.max(1, Math.floor(PREVIEW_SIZE / Math.max(result.size.width, result.size.height))) : 1;

  return (
    <Layout
      title="Custom Bone Models Editor"
      description="Attach a Minecraft or Blockbench model to a custom bone of your emote.">
      <main className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>Custom Bone Models Editor</h1>
            <p>
              Attach a model to a <Link to="/emotecraft/creatingemotes/custom_pivot_points">custom bone</Link> of
              your emote, so that it moves with the animation. Everything happens inside your browser, so nothing
              is uploaded anywhere.
            </p>

            <div className="card margin-bottom--md">
              <div className="card__header">
                <h3>1. Pick your emote</h3>
              </div>
              <div className="card__body">
                <FileDrop
                  title="Drop your emote here, or click to choose"
                  hint={
                    emote
                      ? `${emote.name} — ${plural(emote.bones.length, 'custom bone', 'custom bones')}`
                      : 'The .json file from your emotes folder'
                  }
                  accept=".json"
                  onFile={chooseEmote}
                />
                {emoteError && (
                  <div className="alert alert--danger margin-top--sm" role="alert">
                    {emoteError}
                  </div>
                )}
                {emote && emote.bones.length === 0 && (
                  <div className="alert alert--warning margin-top--sm" role="alert">
                    This emote has no custom bones yet. Add one under <code>model</code> first, as{' '}
                    <Link to="/emotecraft/creatingemotes/custom_pivot_points">Custom Pivot Points/Bones</Link>{' '}
                    shows, then pick the emote again.
                  </div>
                )}
              </div>
            </div>

            <div className="card margin-bottom--md">
              <div className="card__header">
                <h3>2. Pick a model</h3>
              </div>
              <div className="card__body">
                <FileDrop
                  title="Drop a model here, or click to choose"
                  hint={
                    model
                      ? `${model.name} — ${plural(model.elements.length, 'cube', 'cubes')} · ${model.format}` +
                        (embedded > 0 ? ` · ${plural(embedded, 'embedded texture', 'embedded textures')}` : '')
                      : 'A .bbmodel from Blockbench, or a block model .json from a resource pack'
                  }
                  accept=".bbmodel,.json"
                  onFile={chooseModel}
                />
                {modelError && (
                  <div className="alert alert--danger margin-top--sm" role="alert">
                    {modelError}
                  </div>
                )}
                {model && (model.skipped > 0 || model.untextured > 0) && (
                  <div className="alert alert--info margin-top--sm" role="alert">
                    {model.skipped > 0 &&
                      'A Minecraft model is made of cubes only, so ' +
                        `${plural(model.skipped, 'other shape stays', 'other shapes stay')} behind. `}
                    {model.untextured > 0 &&
                      `${plural(model.untextured, 'face has', 'faces have')} no texture and will be left out.`}
                  </div>
                )}

                {model && (
                  <ul className={styles.textures}>
                    {model.textures.map((texture, index) => {
                      const image = texture.image ?? chosen[index]?.image;
                      return (
                        <li key={index} className={styles.texture}>
                          {image ? <img className={styles.thumb} src={image} alt="" /> : <span className={styles.thumb} />}
                          <span className={`${styles.textureName} text--truncate`}>
                            {texture.keys.length > 0 && <code>{texture.keys.join(' ')}</code>} {texture.name}
                          </span>
                          {chosen[index]?.animation && <span className="badge badge--info">animated</span>}
                          {texture.image ? (
                            <span className="badge badge--secondary">in the model</span>
                          ) : (
                            <label className={`button button--sm ${image ? 'button--secondary' : 'button--primary'}`}>
                              {image ? 'Change' : 'Choose PNG'}
                              <input
                                hidden
                                type="file"
                                accept={texture.mcmeta ? 'image/png,.mcmeta' : 'image/png'}
                                multiple={texture.mcmeta}
                                onChange={(event) => {
                                  const files = Array.from(event.target.files ?? []);
                                  event.target.value = '';
                                  if (files.length > 0) chooseTexture(index, files);
                                }}
                              />
                            </label>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {model?.textures.some((texture) => texture.mcmeta) && (
                  <p className="margin-top--sm margin-bottom--none">
                    For an animated texture, pick its <code>.png.mcmeta</code> along with the PNG. The bone shows
                    the first frame, as a bone's texture does not move.
                  </p>
                )}
              </div>
            </div>

            {emote && bone && (
              <div className="card margin-bottom--md">
                <div className="card__header">
                  <h3>3. Pick a bone</h3>
                </div>
                <div className="card__body">
                  {emote.bones.map((candidate, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`button margin-right--sm margin-bottom--sm ${
                        index === boneIndex ? 'button--primary' : 'button--outline button--primary'
                      }`}
                      onClick={() => chooseBone(index)}>
                      {candidate.animation === null ? candidate.name : `${candidate.name} (${candidate.animation})`}
                    </button>
                  ))}

                  <p className="margin-top--sm margin-bottom--sm">
                    <b>Pivot</b> {bone.data.pivot ? bone.data.pivot.join(', ') : 'none'} · <b>Elements</b> {boneCubes} ·{' '}
                    <b>Has texture</b> {bone.data.texture ? 'yes' : 'no'}
                  </p>
                  <p>
                    {bone.animation === null
                      ? 'Every animation of the emote that has no model of its own has this bone.'
                      : `Only the animation ${bone.animation} has this bone.`}
                    {boneHasModel && ' The new model replaces the one it carries, unless you keep that.'}
                    {!boneHasModel &&
                      boneCubes > 0 &&
                      ' Without a texture none of its elements show, so the new model replaces them.'}
                  </p>

                  {boneHasModel && (
                    <label>
                      <input
                        className="margin-right--sm"
                        type="checkbox"
                        checked={keep}
                        onChange={(event) => {
                          setResult(null);
                          setKeep(event.target.checked);
                        }}
                      />
                      Keep it, and add the new model to it
                    </label>
                  )}
                </div>
                <div className="card__footer">
                  <button className="button button--primary button--block" disabled={!ready} onClick={attach}>
                    {busy ? 'Working…' : 'Attach the model'}
                  </button>
                  {(!model || missing > 0) && (
                    <p className="margin-top--sm margin-bottom--none">
                      {model ? 'Choose a PNG for every texture of the model first.' : 'Pick a model first.'}
                    </p>
                  )}
                  {failure && (
                    <div className="alert alert--danger margin-top--sm" role="alert">
                      It did not work: {failure}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && (
              <div className="card margin-bottom--md">
                <div className="card__header">
                  <h3>4. Done</h3>
                </div>
                <div className="card__body">
                  <div
                    className={`alert margin-bottom--md ${
                      result.bytes > MAX_BYTES
                        ? 'alert--danger'
                        : share > CLOSE_TO_LIMIT
                          ? 'alert--warning'
                          : 'alert--success'
                    }`}
                    role="alert">
                    {result.bone} now carries {plural(result.cubes, 'cube', 'cubes')} and a texture of{' '}
                    {showSize(result.bytes)}, {share}% of the 1 MB an emote has to fit in.
                    {result.bytes > MAX_BYTES
                      ? ' That is more than it can carry, so no other player would get it. Use smaller textures.'
                      : share > CLOSE_TO_LIMIT &&
                        ' That is close to the edge — the animation and its sound need room in the same packet.'}
                  </div>

                  <p className="margin-bottom--sm">
                    <b>Atlas preview</b> ({result.size.width}×{result.size.height})
                  </p>
                  <img
                    className={styles.atlas}
                    src={result.atlas}
                    width={result.size.width * scale}
                    height={result.size.height * scale}
                    alt="The texture of the bone"
                  />

                  <p className="margin-bottom--sm">
                    <b>Result JSON</b>
                  </p>
                  <CodeBlock language="json">{result.preview}</CodeBlock>

                  <p>
                    Put the file back in your <code>emotes</code> folder in place of the old one. Keep its name, so
                    that the emote still finds its sound.
                  </p>
                </div>
                <div className="card__footer">
                  <a className="button button--primary button--block" href={result.url} download={result.name}>
                    Download {result.name}
                  </a>
                </div>
              </div>
            )}

            <h2>What it does for you</h2>
            <ul>
              <li>
                Turns a Blockbench project into the cubes a Minecraft model is made of, the way Blockbench's own
                Java export does, and carries over what that export would lose: the rotation of groups, and where a
                project on a centred grid puts things.
              </li>
              <li>Packs every texture into the single image a bone can have, and moves each face's UVs to match.</li>
              <li>Keeps the model a bone already has, if you ask it to.</li>
              <li>Refuses a model that Minecraft would not load.</li>
            </ul>
            <p>
              Only cubes come along: meshes and the other shapes Blockbench can make have no place in a Minecraft
              model. An animated texture shows its first frame, because a bone's texture does not move.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
