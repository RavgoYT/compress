import { createFFmpeg, fetchFile } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';

let ffmpeg = null;

async function initializeFFmpeg() {
    if (!ffmpeg) {
        ffmpeg = createFFmpeg({ log: false });
        await ffmpeg.load();
    }
}

async function compressVideo(file, resolution, bitrateKB) {
    try {
        await initializeFFmpeg();

        // Write input file to FFmpeg's virtual filesystem
        const inputName = file.name;
        ffmpeg.FS('writeFile', inputName, await fetchFile(file));

        // Get resolution dimensions
        const [width, height] = getResolutionDimensions(resolution);

        // Output filename
        const outputName = `compressed_${inputName.replace(/\.[^/.]+$/, '')}.mp4`;

        // Run FFmpeg command: scale to resolution, set bitrate, use H.264 codec
        await ffmpeg.run(
            '-i', inputName,
            '-vcodec', 'libx264',
            '-b:v', `${bitrateKB}k`,
            '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
            '-acodec', 'aac',
            '-b:a', '128k',
            '-f', 'mp4',
            outputName
        );

        // Read output file
        const data = ffmpeg.FS('readFile', outputName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const dataUrl = URL.createObjectURL(blob);

        // Clean up
        ffmpeg.FS('unlink', inputName);
        ffmpeg.FS('unlink', outputName);

        return { name: outputName, dataUrl, blob };
    } catch (error) {
        throw new Error(`Video compression failed: ${error.message}`);
    }
}

function getResolutionDimensions(resolution) {
    switch (resolution) {
        case '360': return [640, 360];
        case '480': return [854, 480];
        case '720': return [1280, 720];
        case '1080': return [1920, 1080];
        case '1440': return [2560, 1440];
        case '2160': return [3840, 2160];
        default: return [1920, 1080];
    }
}

export { compressVideo, getResolutionDimensions };