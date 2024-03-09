import { FFmpeg } from '@ffmpeg/ffmpeg';

export type TranscoderPluginOptions = {
  multicore: boolean;
  fallbackVideoUrl?: string;
  loadFfmpeg: (multicore: boolean) => Promise<FFmpeg>;

  initialQuality: number;
  initialEnableFallbackVideo: boolean;
  initialEnableAudio: boolean;
};

export class TranscoderPlugin {
  public ffmpeg: FFmpeg = new FFmpeg();
  public config: TranscoderPluginOptions;
  public fallbackVideoData?: ArrayBuffer;

  public quality: number;
  public enableFallbackVideo: boolean;
  public enableAudio: boolean;

  public readonly WORST_QUALITY_CRF: number = 51;

  constructor(config: TranscoderPluginOptions) {
    this.config = config;
    this.quality = config.initialQuality;
    this.enableFallbackVideo = config.initialEnableFallbackVideo;
    this.enableAudio = config.initialEnableAudio;

    console.log('%c(transhls) constructed', 'font-size: large');
    console.log(config);
  }

  async init() {
    // unfortunately ffmpeg.wasm cannot be loaded here because of CORS (hls.js is an external library)
    console.log('(transhls) loading ffmpeg.wasm');
    this.ffmpeg = await this.config.loadFfmpeg(this.config.multicore);

    if (this.config.fallbackVideoUrl !== undefined) {
      console.log('(transhls) loading fallback video');
      this.fallbackVideoData = await (
        await fetch(this.config.fallbackVideoUrl)
      ).arrayBuffer();
    }

    console.log(
      '%c(transhls) loaded ffmpeg.wasm & ready to transcode!',
      'font-size: large',
    );
  }

  async transcode(data: ArrayBuffer): Promise<Uint8Array> {
    const start = self.performance.now();

    await this.ffmpeg.writeFile('input.mp4', new Uint8Array(data));
    await this.ffmpeg.exec(
      `-re -i input.mp4 ${this.enableAudio ? '-c:a aac -b:a 128k' : '-an'} -c:v libx264 -crf ${this.WORST_QUALITY_CRF - this.quality} -preset ultrafast -movflags frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset+faststart out.mp4`.split(
        ' ',
      ),
    );
    const processedData = new Uint8Array(
      (await this.ffmpeg.readFile('out.mp4')) as Uint8Array,
    );

    await this.ffmpeg.deleteFile('input.mp4');
    await this.ffmpeg.deleteFile('out.mp4');

    console.log(
      `%c(transhls) processed payload with size ${data.byteLength} in ${Math.trunc(self.performance.now() - start)}ms`,
      'font-size: large;',
    );
    return processedData;
  }
}
