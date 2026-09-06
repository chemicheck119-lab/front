import { describe, expect, it } from "vitest";
import {
  AudioPreparationError,
  encodeMonoPcm16Wav,
  SPEECH_MAX_DURATION_SECONDS,
  SPEECH_SAMPLE_RATE_HZ,
} from "./wav";

describe("microphone PCM WAV 변환", () => {
  it("16 kHz mono PCM16 RIFF/WAVE header와 sample을 생성한다", async () => {
    const blob = encodeMonoPcm16Wav(new Float32Array([-1, 0, 1]));
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(blob);
    });
    const view = new DataView(buffer);
    const ascii = (offset: number, length: number) => String.fromCharCode(
      ...new Uint8Array(buffer, offset, length),
    );

    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(50);
    expect(ascii(0, 4)).toBe("RIFF");
    expect(ascii(8, 4)).toBe("WAVE");
    expect(ascii(36, 4)).toBe("data");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(SPEECH_SAMPLE_RATE_HZ);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getInt16(44, true)).toBe(-32768);
    expect(view.getInt16(46, true)).toBe(0);
    expect(view.getInt16(48, true)).toBe(32767);
  });

  it("빈 음성·60초 초과·허용 밖 sample rate를 거부한다", () => {
    expect(() => encodeMonoPcm16Wav(new Float32Array()))
      .toThrow(AudioPreparationError);
    expect(() => encodeMonoPcm16Wav(new Float32Array(
      SPEECH_SAMPLE_RATE_HZ * SPEECH_MAX_DURATION_SECONDS + 1,
    ))).toThrow(AudioPreparationError);
    expect(() => encodeMonoPcm16Wav(new Float32Array([0]), 4000))
      .toThrow(AudioPreparationError);
  });
});
