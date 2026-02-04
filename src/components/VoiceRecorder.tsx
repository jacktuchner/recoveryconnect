"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number, transcript?: string) => void;
  disabled?: boolean;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setError(null);
    } catch (err) {
      setPermissionGranted(false);
      setError("Microphone permission denied. Please allow microphone access to record.");
    }
  }, []);

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        setTranscript(transcriptRef.current);
      }
      setIsTranscribing(interimTranscript.length > 0);
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event);
    };

    recognition.onend = () => {
      // Restart if still recording (speech recognition auto-stops after silence)
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          recognition.start();
        } catch (e) {
          console.log("Could not restart speech recognition:", e);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.log("Could not start speech recognition:", e);
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Error stopping speech recognition:", e);
      }
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");
      transcriptRef.current = "";
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Stop speech recognition
        stopSpeechRecognition();
        setIsTranscribing(false);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();

      // Start speech recognition for live transcription
      startSpeechRecognition();

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setPermissionGranted(false);
      setError("Failed to access microphone. Please check your browser permissions.");
      console.error("Error starting recording:", err);
    }
  }, [startSpeechRecognition, stopSpeechRecognition]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopSpeechRecognition();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, stopSpeechRecognition]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      const pausedDuration = duration;
      startTimeRef.current = Date.now() - pausedDuration * 1000;
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  }, [isRecording, isPaused, duration]);

  const retryRecording = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setTranscript("");
    transcriptRef.current = "";
  }, [recordedUrl]);

  const confirmRecording = useCallback(() => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, duration, transcript || undefined);
    }
  }, [recordedBlob, duration, transcript, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Check permission on mount
  useEffect(() => {
    if (permissionGranted === null) {
      navigator.permissions?.query({ name: "microphone" as PermissionName }).then((result) => {
        setPermissionGranted(result.state === "granted");
      }).catch(() => {
        // Permissions API not supported, will check on first record attempt
      });
    }
  }, [permissionGranted]);

  if (disabled) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-500">
        Recording is disabled
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          {permissionGranted === false && (
            <button
              onClick={requestPermission}
              className="ml-2 text-red-800 underline hover:no-underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Recording controls */}
      {!recordedBlob ? (
        <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-lg">
          {/* Timer display */}
          <div className="text-4xl font-mono text-gray-700">
            {formatTime(duration)}
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`} />
              <span className="text-sm text-gray-600">
                {isPaused ? "Paused" : "Recording..."}
              </span>
              {isTranscribing && (
                <span className="text-xs text-teal-600 animate-pulse">transcribing...</span>
              )}
            </div>
          )}

          {/* Live transcript preview */}
          {isRecording && transcript && (
            <div className="w-full max-w-md p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 max-h-24 overflow-y-auto">
              {transcript}
            </div>
          )}

          {/* Control buttons */}
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                title="Start recording"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                    title="Resume"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center justify-center w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
                    title="Pause"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-16 h-16 bg-gray-700 hover:bg-gray-800 text-white rounded-full transition-colors shadow-lg"
                  title="Stop recording"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {!isRecording && (
            <p className="text-sm text-gray-500">Click the microphone to start recording</p>
          )}
        </div>
      ) : (
        /* Playback and confirm */
        <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Recording duration: {formatTime(duration)}</span>
          </div>

          {/* Audio player */}
          <audio
            ref={audioRef}
            src={recordedUrl || undefined}
            controls
            className="w-full"
          />

          {/* Transcript preview */}
          {transcript && (
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Transcript (auto-generated):</p>
              <p className="text-sm text-gray-700">{transcript}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={retryRecording}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Record Again
            </button>
            <button
              onClick={confirmRecording}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Use This Recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
