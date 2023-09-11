import { resample, prune, dedup, draco, textureCompress, weld } from '@gltf-transform/functions';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { NodeIO } from '@gltf-transform/core';
import sharp from 'sharp'; // Node.js only.
import draco3d from 'draco3dgltf';

// TODO: add https://gltf-transform.dev/modules/functions/functions/simplify

const MODEL_URL = "geoffrey_lillemon_the_imaginary_museum"
const EXTENSION = "glb"

const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(), // Optional.
        'draco3d.encoder': await draco3d.createEncoderModule(), // Optional.
    });

const transform = async () => {
    // Read from URL.
    const document = await io.read(`model/${MODEL_URL}.${EXTENSION}`);

    await document.transform(
        // Losslessly resample animation frames.
        resample(),
        // Remove unused nodes, textures, or other data.
        prune(),
        // Remove duplicate vertex or texture data, if any.
        dedup(),
        // Index Primitives and (optionally) merge similar vertices.
        weld({ tolerance: 0.001, toleranceNormal: 0.5 }),
        // Compress mesh geometry with Draco.
        draco(),
        // Convert textures to WebP (Requires glTF Transform v3 and Node.js).
        textureCompress({
            encoder: sharp,
            targetFormat: 'webp',
            resize: [1024, 1024],
        }),
    );
    
    // Create optimized file
    await io.write(`model/${MODEL_URL}_min.${EXTENSION}`, document);
} 

transform()