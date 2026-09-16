import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Play, RefreshCw, AlertCircle, Sparkles, Volume2, ShieldAlert, Check } from 'lucide-react';

interface VoiceRecorderProps {
  transcript: string;
  setTranscript: (text: string) => void;
  onAnalyze: (transcript: string) => void;
  isAnalyzing: boolean;
  onTryDemo: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  transcript,
  setTranscript,
  onAnalyze,
  isAnalyzing,
  onTryDemo,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'requesting'>('prompt');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    // Check navigator.permissions for microphone if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          setMicPermission(permissionStatus.state as 'prompt' | 'granted' | 'denied');
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state as 'prompt' | 'granted' | 'denied');
          };
        })
        .catch(() => {
          // Some browsers don't support querying microphone permission, default to 'prompt'
          setMicPermission('prompt');
        });
    }
  }, []);

  // Timer loop when recording
  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const requestMicAndStart = async () => {
    setShowPermissionPrompt(false);
    setErrorMessage(null);
    setInterimText('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorMessage(
        'Web Speech Recognition is not supported by your current browser. You can type or paste instructions directly in the Text tab, or use modern Google Chrome or Microsoft Edge.'
      );
      return;
    }

    // Explicitly request microphone stream from user via getUserMedia to guarantee browser permission prompt
    setMicPermission('requesting');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        setMicPermission('granted');
      }
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      setMicPermission('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Microphone permission was denied. Please allow microphone access in your browser or site settings (click the lock/tune icon next to the URL).'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage(
          'No microphone device was detected on your system. Please connect an audio input device.'
        );
      } else {
        setErrorMessage(
          `Unable to access microphone (${err.message || err.name}). Please grant permission and try again.`
        );
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setMicPermission('granted');
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        if (finalStr) {
          setTranscript((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalStr.trim()}` : finalStr.trim();
          });
        }
        setInterimText(interimStr);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermission('denied');
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
        } else if (event.error === 'no-speech') {
          // Silent interval, keep listening
        } else {
          setErrorMessage(`Speech recognition notice: ${event.error}. You can still review or edit text below.`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
      setErrorMessage(err.message || 'Could not access microphone.');
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    // If permission has not been granted yet or is in prompt state, prompt the user first
    if (micPermission === 'prompt') {
      setShowPermissionPrompt(true);
    } else {
      requestMicAndStart();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleClear = () => {
    setTranscript('');
    setInterimText('');
    setErrorMessage(null);
  };

  return (
    <div className="space-y-5">
      {/* Microphone Control Console */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Subtle background glow effect when recording */}
        {isRecording && (
          <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
        )}

        {/* Status Indicator */}
        <div className="mb-4 flex items-center gap-2">
          {isRecording ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              RECORDING: {formatDuration(duration)}
            </span>
          ) : micPermission === 'requesting' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Requesting Permission...
            </span>
          ) : micPermission === 'denied' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              Microphone Permission Denied
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              Microphone Ready
            </span>
          )}
        </div>

        {/* Big Record Button */}
        <div className="my-2 relative">
          {isRecording && (
            <div className="absolute -inset-3 rounded-full border border-red-500/40 animate-ping pointer-events-none" />
          )}
          <button
            id="mic-toggle-btn"
            onClick={handleMicClick}
            disabled={isAnalyzing}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 cursor-pointer ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 ring-4 ring-red-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 ring-4 ring-indigo-500/20 hover:ring-indigo-500/40'
            }`}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Explicit Permission Request Prompt Modal/Banner */}
        {showPermissionPrompt && (
          <div className="mt-4 w-full max-w-md p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-left shadow-xl shadow-indigo-950/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Microphone Permission Request</span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  The assistant requires microphone access to transcribe your spoken voice into tasks in real-time. Your audio is processed directly in your browser.
                </p>
                <div className="flex items-center gap-2 pt-2.5">
                  <button
                    id="allow-mic-btn"
                    onClick={requestMicAndStart}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Allow Microphone
                  </button>
                  <button
                    id="cancel-mic-btn"
                    onClick={() => setShowPermissionPrompt(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description / Instructions */}
        <p className="mt-3 text-xs sm:text-sm text-slate-300 font-medium">
          {isRecording
            ? 'Speak clearly into your microphone... Click square to finish.'
            : 'Click to start speaking your instructions or meeting notes'}
        </p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
          Speech will be automatically transcribed in real time and structured into tasks.
        </p>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mt-4 w-full max-w-lg p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {!speechSupported && (
          <div className="mt-4 w-full max-w-lg p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center justify-between">
            <span>Speech recognition not supported in this browser.</span>
            <button
              onClick={onTryDemo}
              className="text-indigo-400 font-medium hover:underline text-xs"
            >
              Load Demo Audio Transcript
            </button>
          </div>
        )}
      </div>

      {/* Transcript Display & Editing Area (Section 7) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span>Generated Transcript</span>
            {transcript && (
              <span className="text-[10px] text-slate-400 font-normal lowercase font-mono">
                ({transcript.split(/\s+/).filter(Boolean).length} words)
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <button
              id="clear-transcript-btn"
              onClick={handleClear}
              disabled={!transcript && !interimText}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="voice-transcript-input"
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your spoken transcript will appear here automatically. You can also edit it before analyzing..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
          />
          {interimText && (
            <div className="text-xs text-indigo-400 italic px-1 pt-1 font-mono">
              Listening: {interimText}...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Tip: Review transcript to ensure names and deadlines are correct.</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="analyze-voice-transcript-btn"
              onClick={() => onAnalyze(transcript)}
              disabled={isAnalyzing || !transcript.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Transcript...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Transcript</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
