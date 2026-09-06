export const SPEECH_SAMPLE_RATE_HZ = 16000;
export const SPEECH_MAX_DURATION_SECONDS = 60;

export class AudioPreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioPreparationError";
  }
}

export function encodeMonoPcm16Wav(
  samples: Float32Array,
  sampleRateHz = SPEECH_SAMPLE_RATE_HZ,
): Blob {
  if (!Number.isInteger(sampleRateHz) || sampleRateHz < 8000 || sampleRateHz > 48000) {
    throw new AudioPreparationError("지원하지 않는 sample rate입니다.");
  }
  if (samples.length === 0 || samples.length / sampleRateHz > SPEECH_MAX_DURATION_SECONDS) {
    throw new AudioPreparationError("녹음은 60초 이내여야 합니다.");
  }

  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRateHz, true);
  view.setUint32(28, sampleRateHz * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);

  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index] ?? 0));
    const value = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(44 + index * bytesPerSample, Math.round(value), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export async function recordedBlobToPcmWav(recording: Blob): Promise<Blob> {
  if (recording.size === 0) {
    throw new AudioPreparationError("녹음된 음성이 없습니다.");
  }
  if (typeof AudioContext === "undefined" || typeof OfflineAudioContext === "undefined") {
    throw new AudioPreparationError("이 브라우저는 음성 변환을 지원하지 않습니다.");
  }

  const decoder = new AudioContext();
  try {
    let decoded: AudioBuffer;
    try {
      decoded = await decoder.decodeAudioData(await recording.arrayBuffer());
    } catch {
      throw new AudioPreparationError("녹음 음성을 PCM WAV로 변환하지 못했습니다.");
    }
    if (!Number.isFinite(decoded.duration) || decoded.duration <= 0
      || decoded.duration > SPEECH_MAX_DURATION_SECONDS) {
      throw new AudioPreparationError("녹음은 60초 이내여야 합니다.");
    }

    const frameCount = Math.max(1,
      Math.ceil(decoded.duration * SPEECH_SAMPLE_RATE_HZ));
    const renderer = new OfflineAudioContext(1, frameCount, SPEECH_SAMPLE_RATE_HZ);
    const source = renderer.createBufferSource();
    source.buffer = decoded;
    source.connect(renderer.destination);
    source.start(0);
    const rendered = await renderer.startRendering();
    return encodeMonoPcm16Wav(rendered.getChannelData(0), SPEECH_SAMPLE_RATE_HZ);
  } finally {
    await decoder.close().catch(() => undefined);
  }
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let index = 0; index < text.length; index += 1) {
    view.setUint8(offset + index, text.charCodeAt(index));
  }
}
