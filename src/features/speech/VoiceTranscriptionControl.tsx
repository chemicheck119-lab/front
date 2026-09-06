import { useEffect, useId, useRef, useState } from "react";
import { FileAudio, Mic, Square } from "lucide-react";
import { toUserFacingError } from "../../api/client";
import { transcribeIncidentAudio } from "../../api/speech";
import {
  AudioPreparationError,
  recordedBlobToPcmWav,
  SPEECH_MAX_DURATION_SECONDS,
} from "./wav";

type VoiceStatus =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "RECORDING"
  | "PREPARING"
  | "TRANSCRIBING"
  | "DONE"
  | "ABSTAINED"
  | "ERROR";

interface VoiceTranscriptionControlProps {
  incidentId?: string | null;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onTranscribed: (text: string) => void;
}

const busyStatuses = new Set<VoiceStatus>([
  "REQUESTING_PERMISSION", "RECORDING", "PREPARING", "TRANSCRIBING",
]);

export function VoiceTranscriptionControl({
  incidentId,
  disabled,
  onBusyChange,
  onTranscribed,
}: VoiceTranscriptionControlProps) {
  const inputId = useId();
  const [status, setStatus] = useState<VoiceStatus>("IDLE");
  const [message, setMessage] = useState("음성은 전사 초안으로만 입력되며 자동 분석되지 않습니다.");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const disposedRef = useRef(false);

  const busy = busyStatuses.has(status);

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  useEffect(() => () => {
    disposedRef.current = true;
    abortRef.current?.abort();
    clearTimers();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
    stopStream();
    onBusyChange(false);
  }, [onBusyChange]);

  async function startRecording() {
    if (disabled || busy) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("ERROR");
      setMessage("이 브라우저는 마이크 녹음을 지원하지 않습니다. PCM WAV 파일을 선택해주세요.");
      return;
    }
    setStatus("REQUESTING_PERMISSION");
    setMessage("마이크 권한을 확인하고 있습니다…");
    setElapsedSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      if (disposedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = preferredRecordingMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        releaseRecordingResources();
        if (!disposedRef.current) {
          setStatus("ERROR");
          setMessage("녹음 중 오류가 발생했습니다. 마이크 상태를 확인해주세요.");
        }
      };
      recorder.onstop = () => {
        const recording = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        releaseRecordingResources();
        if (!disposedRef.current) void prepareAndTranscribe(recording, false);
      };
      recorder.start(1000);
      setStatus("RECORDING");
      setMessage("녹음 중입니다. 최대 60초 후 자동으로 멈춥니다.");
      const startedAt = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.min(SPEECH_MAX_DURATION_SECONDS,
          Math.floor((Date.now() - startedAt) / 1000)));
      }, 250);
      stopTimerRef.current = window.setTimeout(() => stopRecording(),
        SPEECH_MAX_DURATION_SECONDS * 1000);
    } catch (error) {
      stopStream();
      if (disposedRef.current) return;
      const permissionDenied = error instanceof DOMException
        && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setStatus("ERROR");
      setMessage(permissionDenied
        ? "마이크 권한이 거부됐습니다. 권한을 허용하거나 PCM WAV 파일을 선택해주세요."
        : "마이크를 시작하지 못했습니다. 기기 연결과 브라우저 권한을 확인해주세요.");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  async function prepareAndTranscribe(recording: Blob, alreadyWav: boolean) {
    setStatus("PREPARING");
    setMessage(alreadyWav ? "PCM WAV를 확인하고 있습니다…" : "녹음을 16 kHz mono PCM WAV로 변환하고 있습니다…");
    try {
      const wav = alreadyWav ? recording : await recordedBlobToPcmWav(recording);
      if (disposedRef.current) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("TRANSCRIBING");
      setMessage("전사 중입니다. 이 요청은 자동으로 재시도하지 않습니다…");
      const response = await transcribeIncidentAudio(wav, incidentId, controller.signal);
      if (disposedRef.current || controller.signal.aborted) return;
      if (response.status === "ABSTAINED_NO_TRANSCRIPT") {
        setStatus("ABSTAINED");
        setMessage("전사할 수 있는 발화를 찾지 못해 기권했습니다. 직접 입력하거나 다시 녹음해주세요.");
        return;
      }
      onTranscribed(response.transcript.text);
      setStatus("DONE");
      setMessage("전사 초안을 입력했습니다. 반드시 듣고 수정한 뒤 분석을 시작하세요.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (disposedRef.current) return;
      setStatus("ERROR");
      setMessage(error instanceof AudioPreparationError
        ? error.message
        : toUserFacingError(error).message);
    } finally {
      abortRef.current = null;
    }
  }

  function handleFile(file: File | undefined) {
    if (!file || disabled || busy) return;
    void prepareAndTranscribe(file, true);
  }

  function clearTimers() {
    if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
    if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
    stopTimerRef.current = null;
    elapsedTimerRef.current = null;
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function releaseRecordingResources() {
    clearTimers();
    stopStream();
    recorderRef.current = null;
    chunksRef.current = [];
  }

  return (
    <div className="mb-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={status === "RECORDING" ? stopRecording : () => { void startRecording(); }}
          disabled={disabled || (busy && status !== "RECORDING")}
          className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold text-white disabled:opacity-40 ${status === "RECORDING" ? "bg-red-600 hover:bg-red-700" : "bg-slate-800 hover:bg-slate-700"}`}
          aria-label={status === "RECORDING" ? "음성 녹음 중지" : "음성 녹음 시작"}
        >
          {status === "RECORDING" ? <Square size={14} /> : <Mic size={15} />}
          {status === "RECORDING" ? `중지 ${elapsedSeconds}초` : "음성 녹음"}
        </button>
        <label
          htmlFor={inputId}
          className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold ${disabled || busy ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
        >
          <FileAudio size={15} />PCM WAV 선택
        </label>
        <input
          id={inputId}
          type="file"
          accept=".wav,audio/wav,audio/x-wav,audio/wave"
          className="sr-only"
          aria-label="PCM WAV 파일 선택"
          disabled={disabled || busy}
          onChange={(event) => {
            handleFile(event.currentTarget.files?.[0]);
            event.currentTarget.value = "";
          }}
        />
        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-800 dark:text-amber-200">
          사용자 검토 필수
        </span>
      </div>
      <p className={`mt-2 text-[10px] leading-relaxed ${status === "ERROR" ? "text-primary" : "text-muted-foreground"}`} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

function preferredRecordingMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/mp4",
    "audio/webm",
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}
