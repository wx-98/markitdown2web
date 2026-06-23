import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  X,
} from "lucide-react";

interface Props {
  slides: string[];
  aspectRatio?: string;
  onClose?: () => void;
}

export default function SlideShow({ slides, aspectRatio = "16/9", onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const total = slides.length;

  const goPrev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const goNext = useCallback(
    () => setCurrent((c) => (c < total - 1 ? c + 1 : c)),
    [total],
  );

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => {
          if (c >= total - 1) {
            setPlaying(false);
            return c;
          }
          return c + 1;
        });
      }, 3000);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, total]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      else if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext, onClose]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center ${
        isFullscreen ? "h-screen w-screen bg-black" : ""
      }`}
    >
      {/* Slide */}
      <div className={`relative w-full ${isFullscreen ? "flex-1 flex items-center justify-center p-4" : ""}`}>
        <img
          src={slides[current]}
          alt={`Slide ${current + 1}`}
          className={isFullscreen ? "max-h-full max-w-full object-contain" : "w-full rounded-xl"}
          style={isFullscreen ? {} : { aspectRatio }}
        />

        {/* Left/Right click zones */}
        <button
          onClick={goPrev}
          className="absolute inset-y-0 left-0 w-1/4 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-start pl-4"
          disabled={current <= 0}
        >
          <ChevronLeft size={40} className="text-white drop-shadow-lg" />
        </button>
        <button
          onClick={goNext}
          className="absolute inset-y-0 right-0 w-1/4 cursor-pointer opacity-0 hover:opacity-100 flex items-center justify-end pr-4"
          disabled={current >= total - 1}
        >
          <ChevronRight size={40} className="text-white drop-shadow-lg" />
        </button>
      </div>

      {/* Controls */}
      <div className={`flex items-center gap-3 ${
        isFullscreen
          ? "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-5 py-2.5 backdrop-blur"
          : "mt-3 rounded-full bg-gray-100 px-4 py-2 dark:bg-gray-700"
      }`}>
        <button
          onClick={goPrev}
          disabled={current <= 0}
          className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={() => setPlaying(!playing)}
          className="rounded-full p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <span className={`min-w-[4rem] text-center text-sm font-medium ${
          isFullscreen ? "text-white" : "text-gray-600 dark:text-gray-300"
        }`}>
          {current + 1} / {total}
        </span>

        <button
          onClick={goNext}
          disabled={current >= total - 1}
          className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <ChevronRight size={18} />
        </button>

        <button
          onClick={toggleFullscreen}
          className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Progress dots */}
      {total <= 40 && (
        <div className={`flex gap-1.5 ${isFullscreen ? "absolute bottom-16 left-1/2 -translate-x-1/2" : "mt-2"}`}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? "w-4 bg-primary-500"
                  : "w-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
