import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import {
  Video,
  Play,
  Film,
  Sparkles,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Smartphone,
  Layers
} from 'lucide-react';

interface GeneratedVideo {
  id: string;
  operationName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  videoUrl: string;
  timestamp: string;
}

const REASSURING_MESSAGES = [
  'Veo 3 neural diffusion engine initialized...',
  'Synthesizing temporal coherency & garment drape...',
  'Computing 3D camera trajectory & London street lighting...',
  'Rendering cotton loopback textures & atmospheric grain...',
  'Finalizing MP4 high-bitrate video stream...',
  'Processing final color grading & shadow passes...',
];

const VIDEO_PROMPT_PRESETS = [
  'Slow-motion 360-degree rotation of a heavy 500GSM black hoodie in a foggy London alleyway, fabric texture sharply defined under rain droplets, cinematic 4k.',
  'Skater riding through brutalist Barbican estate wearing duck canvas wide-leg pants and oversized acid box tee, low tracking camera angle, 9:16 portrait style.',
  'Macro camera slide across heavy double-stitched flatlock seams, raw hem distress, and oxidized brass YKK zipper on thick French Terry.',
  'Behind-the-scenes hand silkscreen squeegee pull in a dim London studio, drying racks glowing under warm incandescent lights, cinematic motion blur.',
];

export const VeoVideoStudioTab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [operationName, setOperationName] = useState<string | null>(null);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Video
  const [activeVideo, setActiveVideo] = useState<GeneratedVideo | null>(null);
  const [videoHistory, setVideoHistory] = useState<GeneratedVideo[]>([]);

  const pollIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Cycle reassuring loading messages
  useEffect(() => {
    if (isGenerating) {
      const msgTimer = setInterval(() => {
        setStatusMessageIndex((prev) => (prev + 1) % REASSURING_MESSAGES.length);
      }, 5000);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(msgTimer);
        clearInterval(timerRef.current);
      };
    } else {
      setElapsedSeconds(0);
    }
  }, [isGenerating]);

  // Clean up poll on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartGeneration = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setOperationName(null);

    try {
      const res = await api.geminiGenerateVideo({
        prompt: prompt.trim(),
        aspectRatio,
        resolution,
      });

      if (res.success && res.operationName) {
        setOperationName(res.operationName);
        startPolling(res.operationName, prompt.trim(), aspectRatio);
      } else {
        setIsGenerating(false);
        setErrorMessage(
          res.error || 'Failed to initialize Veo 3 video generation. Please verify API billing status.'
        );
      }
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || 'Network error during video generation startup.');
    }
  };

  const startPolling = (opName: string, usedPrompt: string, usedRatio: '16:9' | '9:16') => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await api.geminiVideoStatus(opName);

        if (statusRes.done) {
          clearInterval(pollIntervalRef.current);

          if (statusRes.error) {
            setIsGenerating(false);
            setErrorMessage(statusRes.error.message || 'Veo 3 generation failed on server.');
            return;
          }

          // Fetch video blob
          const blob = await api.geminiVideoDownload(opName);
          if (blob) {
            const videoUrl = URL.createObjectURL(blob);
            const newVideo: GeneratedVideo = {
              id: `veo-${Date.now()}`,
              operationName: opName,
              prompt: usedPrompt,
              aspectRatio: usedRatio,
              videoUrl,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setActiveVideo(newVideo);
            setVideoHistory((prev) => [newVideo, ...prev]);
          } else {
            setErrorMessage('Video generation completed, but download could not be finalized.');
          }

          setIsGenerating(false);
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 4000);
  };

  const handleDownload = (video: GeneratedVideo) => {
    const a = document.createElement('a');
    a.href = video.videoUrl;
    a.download = `tkn-veo3-${video.aspectRatio.replace(':', 'x')}-${Date.now()}.mp4`;
    a.click();
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white border-2 border-black overflow-y-auto">
      {/* Studio Header Bar */}
      <div className="bg-[#f4f2ea] border-b-2 border-black p-3 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-black text-yellow-300">
            <Video className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-headline font-black text-sm uppercase text-black">
              VEO 3 VIDEO STUDIO // TEXT TO VIDEO
            </h3>
            <p className="font-mono-tag text-[10px] text-neutral-600">
              Powered by <span className="font-bold text-black">veo-3.1-fast-generate-preview</span> • High-Performance Neural Video Synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-black text-yellow-300 text-[10px] font-mono-tag font-bold px-2 py-0.5 uppercase">
            VEO 3.1 FAST PIPELINE
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 border-b-2 lg:border-b-0 lg:border-r-2 border-black p-4 space-y-4 overflow-y-auto bg-[#faf9f5]">
          {/* Aspect Ratio Selector (strictly 16:9 or 9:16 as requested) */}
          <div className="space-y-1.5">
            <label className="font-mono-tag text-xs font-bold uppercase text-black flex items-center justify-between">
              <span>ASPECT RATIO (MANDATORY REQUIREMENT)</span>
              <span className="text-[10px] text-neutral-500 font-normal">16:9 or 9:16</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`p-2.5 border-2 text-left transition-all cursor-pointer ${
                  aspectRatio === '16:9'
                    ? 'border-black bg-black text-white shadow-[2px_2px_0px_#fff500]'
                    : 'border-neutral-300 bg-white text-black hover:border-black'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Monitor className="w-4 h-4 text-yellow-300" />
                  <span className="font-mono-tag font-bold text-xs">16:9 LANDSCAPE</span>
                </div>
                <p className="font-mono-tag text-[9px] opacity-75">
                  Desktop Lookbook & Cinematic Widescreen
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`p-2.5 border-2 text-left transition-all cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'border-black bg-black text-white shadow-[2px_2px_0px_#fff500]'
                    : 'border-neutral-300 bg-white text-black hover:border-black'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Smartphone className="w-4 h-4 text-yellow-300" />
                  <span className="font-mono-tag font-bold text-xs">9:16 PORTRAIT</span>
                </div>
                <p className="font-mono-tag text-[9px] opacity-75">
                  Mobile Story, TikTok, & Reel Video
                </p>
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="font-mono-tag text-xs font-bold uppercase text-black flex items-center justify-between">
              <span>VEO 3 TEXT PROMPT</span>
              <span className="text-[10px] text-neutral-500 font-normal">Describe motion & scenes</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isGenerating}
              placeholder="Describe camera motion, model styling, London weather, fabric dynamics, or 360-degree rotation..."
              className="w-full border-2 border-black p-2.5 text-xs font-mono-tag bg-white focus:outline-none focus:bg-yellow-50 shadow-[2px_2px_0px_#000] disabled:bg-neutral-100"
            />
          </div>

          {/* Prompt Presets */}
          <div className="space-y-1">
            <span className="font-mono-tag text-[10px] font-bold text-neutral-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-black" /> SAMPLE STREETWEAR VIDEO PROMPTS:
            </span>
            <div className="space-y-1">
              {VIDEO_PROMPT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  disabled={isGenerating}
                  onClick={() => setPrompt(p)}
                  className="w-full text-left p-1.5 border border-neutral-300 bg-white hover:border-black hover:bg-yellow-50 text-[10px] font-mono-tag text-neutral-800 truncate transition-colors cursor-pointer disabled:opacity-50"
                >
                  › {p}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 bg-red-100 border border-red-500 text-red-900 text-xs font-mono-tag flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Generation Error: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleStartGeneration}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-black text-yellow-300 hover:bg-neutral-800 disabled:opacity-50 font-mono-tag font-bold text-xs uppercase py-3 border-2 border-black flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] active:translate-y-0.5 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-300" />
                <span>VEO 3 GENERATING ({elapsedSeconds}s)...</span>
              </>
            ) : (
              <>
                <Film className="w-4 h-4 text-yellow-300" />
                <span>GENERATE VIDEO (VEO-3.1-FAST-GENERATE-PREVIEW)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Visual Stage / Player (7 cols) */}
        <div className="lg:col-span-7 p-4 flex flex-col justify-between overflow-y-auto bg-neutral-100">
          {isGenerating ? (
            /* Long-running Loading Screen with Reassuring Messages */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-black bg-white shadow-[3px_3px_0px_#000] min-h-[380px]">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-black border-t-yellow-400 rounded-full animate-spin" />
                <Film className="w-8 h-8 text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>

              <span className="bg-black text-yellow-300 text-[10px] font-mono-tag font-bold px-2 py-0.5 uppercase mb-2">
                SYNTHESIS IN PROGRESS • {elapsedSeconds} SECONDS ELAPSED
              </span>

              <h4 className="font-headline font-black text-lg text-black uppercase mb-1">
                GENERATING VIDEO VIA VEO 3
              </h4>

              <p className="font-mono-tag text-xs text-neutral-800 font-bold max-w-md min-h-[36px] transition-all">
                "{REASSURING_MESSAGES[statusMessageIndex]}"
              </p>

              <div className="mt-4 p-3 bg-[#faf9f5] border border-neutral-300 text-left max-w-md font-mono-tag text-[10px] text-neutral-600 space-y-1">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="font-bold text-black">veo-3.1-fast-generate-preview</span>
                </div>
                <div className="flex justify-between">
                  <span>Aspect Ratio:</span>
                  <span className="font-bold text-black">{aspectRatio}</span>
                </div>
                {operationName && (
                  <div className="flex justify-between truncate">
                    <span>Operation:</span>
                    <span className="font-bold text-black truncate ml-2">{operationName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : activeVideo ? (
            /* Active Video Player */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div>
                  <span className="bg-black text-yellow-300 text-[10px] font-mono-tag font-bold px-2 py-0.5 uppercase mr-2">
                    VEO 3 MP4 CLIP
                  </span>
                  <span className="font-mono-tag text-xs font-bold text-black">
                    RATIO: {activeVideo.aspectRatio}
                  </span>
                </div>

                <button
                  onClick={() => handleDownload(activeVideo)}
                  className="px-3 py-1 bg-black text-yellow-300 hover:bg-neutral-800 text-xs font-mono-tag font-bold border border-black flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> DOWNLOAD MP4
                </button>
              </div>

              {/* Video Player Display */}
              <div
                className={`border-2 border-black bg-black p-1 shadow-[3px_3px_0px_#000] mx-auto flex items-center justify-center ${
                  activeVideo.aspectRatio === '9:16' ? 'max-w-[320px]' : 'w-full'
                }`}
              >
                <video
                  src={activeVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full max-h-[440px] object-contain rounded-none"
                />
              </div>

              {/* Video Details */}
              <div className="border border-black bg-white p-2.5 font-mono-tag text-xs space-y-1">
                <div className="text-[10px] font-bold text-neutral-500 uppercase">PROMPT APPLIED:</div>
                <div className="text-black italic">"{activeVideo.prompt}"</div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-neutral-300 bg-white min-h-[340px]">
              <div className="w-16 h-16 bg-neutral-100 border-2 border-black flex items-center justify-center mb-3 shadow-[2px_2px_0px_#000]">
                <Film className="w-8 h-8 text-neutral-700" />
              </div>
              <h4 className="font-headline font-black text-base text-black uppercase mb-1">
                VEO 3 VIDEO GENERATION DOCK
              </h4>
              <p className="font-mono-tag text-xs text-neutral-600 max-w-md mb-4">
                Enter a text prompt to generate high-resolution video clips using <span className="font-bold text-black">veo-3.1-fast-generate-preview</span>. Choose between 16:9 landscape and 9:16 portrait.
              </p>
              <div className="font-mono-tag text-[10px] text-neutral-500">
                Aspect Ratio: 16:9 (Landscape) • 9:16 (Portrait)
              </div>
            </div>
          )}

          {/* Video History Reel */}
          {videoHistory.length > 1 && (
            <div className="mt-4 pt-3 border-t-2 border-black">
              <span className="font-mono-tag text-[10px] font-bold uppercase text-neutral-600 block mb-2">
                SESSION VIDEO ARCHIVE ({videoHistory.length} CLIPS)
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {videoHistory.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => setActiveVideo(vid)}
                    className={`w-28 h-20 flex-shrink-0 border-2 bg-black flex items-center justify-center cursor-pointer relative group transition-all ${
                      activeVideo?.id === vid.id
                        ? 'border-yellow-400 shadow-[2px_2px_0px_#fff500]'
                        : 'border-neutral-700 hover:border-white'
                    }`}
                  >
                    <video src={vid.videoUrl} className="w-full h-full object-cover opacity-75" />
                    <Play className="w-5 h-5 text-yellow-300 absolute" />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[8px] font-mono-tag text-white px-1">
                      {vid.aspectRatio}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
