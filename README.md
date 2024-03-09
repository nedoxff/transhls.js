# transhls.js

**transhls.js** (short for _transcoded_ HLS.js) is a small addition to the HLS.js library that allows for interception of .ts video data and its transcoding into different formats via ffmpeg.wasm.

# usage

the fork was mainly created to be used in the [catavc](https://nedoxff.github.io/projects/catavc) project for transocing HEVC video to AVC. **it is not recommended to use this fork in other projects, because it will be neither maintained nor supported in the future. it's lacks many features to be a proper library and is thus considered a bodge.**

to use transhls.js, you need to pass additional arguments to the `Hls` object constructor:

```js
hls = new Hls({
  //... your HLS parameters

  transcoderPluginOptions: {
    // changes the version of ffmpeg.wasm loaded.
    // generally recommended to be true.
    multicore: true,
    // (multicore: boolean) => Ffmpeg
    // a callback that must return a Ffmpeg object
    loadFfmpeg: internalLoadFfmpeg,
    // not used or implemented.
    fallbackVideoUrl: undefined,
    // should the audio be enabled on startup?
    initialEnableAudio: true,
    // initial quality of the video
    // valid values range from 0-50 and are inputted into ffmpeg's CRF parameter (51 - initialQuality)
    initialQuality: 25,
    // not used or implemented.
    initialEnableFallbackVideo: true,
  },
});

// one example of internalLoadingFfpeg may look like this:
async function internalLoadFfmpeg(multicore) {
  const baseUrl = `https://cdn.jsdelivr.net/npm/@ffmpeg/core${multicore ? '-mt' : ''}@0.12.6/dist/esm`;

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(
      `${baseUrl}/ffmpeg-core.worker.js`,
      'text/javascript',
    ),
  });

  return ffmpeg;
}
```
