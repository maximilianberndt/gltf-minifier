import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  dedup,
  prune,
  resample,
  simplify,
  textureCompress,
  weld,
} from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp' // Node.js only.

const MODEL_URL = 'YM1'
const EXTENSION = 'glb'

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(), // Optional.
    'draco3d.encoder': await draco3d.createEncoderModule(), // Optional.
  })

// Read from URL.
const document = await io.read(`model/${MODEL_URL}.${EXTENSION}`)

await document.transform(
  // Losslessly resample animation frames.
  resample(),
  // Remove unused nodes, textures, or other data.
  prune(),
  // Remove duplicate vertex or texture data, if any.
  dedup(),
  // Index Primitives and (optionally) merge similar vertices.
  weld({ tolerance: 0.001, toleranceNormal: 0.5 }),
  simplify({
    simplifier: MeshoptSimplifier,
    ratio: 0.99,
    error: 0.001,
  }),
  // Compress mesh geometry with Draco.
  // draco(),
  // Convert textures to WebP (Requires glTF Transform v3 and Node.js).
  textureCompress({
    encoder: sharp,
    targetFormat: 'webp',
    resize: [64, 64],
  })
)

// Create optimized file
await io.write(`model/min/${MODEL_URL}.${EXTENSION}`, document)
