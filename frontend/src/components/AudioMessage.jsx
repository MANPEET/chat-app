import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

const BAR_COUNT = 30;

const generateBars = (src) => {
    const bars = [];
    for (let i = 0; i < BAR_COUNT; i++) {
        const charCode = src?.charCodeAt(i * 3 % (src?.length || 1)) || 50;
        const height = 20 + (charCode % 60);
        bars.push(height);
    }
    return bars;
};

const AudioMessage = ({ src }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const bars = generateBars(src);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
            setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        };
        const onLoadedMetadata = () => setDuration(audio.duration);
        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            audio.currentTime = 0;
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("ended", onEnded);
        };
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play();
            setIsPlaying(true);
        }
    };

    const handleBarClick = (e) => {
        const audio = audioRef.current;
        if (!audio || !audio.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        audio.currentTime = ratio * audio.duration;
        setProgress(ratio);
    };

    const formatTime = (s) => {
        if (!s || isNaN(s)) return "0:00";
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    return (
        <div className="flex items-center gap-2 w-[220px] py-1">
            <audio ref={audioRef} src={src} preload="metadata" />

            <button
                onClick={togglePlay}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
                {isPlaying
                    ? <Pause size={14} className="fill-current" />
                    : <Play size={14} className="fill-current ml-0.5" />
                }
            </button>

            <div
                className="flex-1 flex items-center gap-[2px] h-8 cursor-pointer"
                onClick={handleBarClick}
            >
                {bars.map((height, i) => {
                    const barProgress = i / BAR_COUNT;
                    const isPast = barProgress < progress;
                    return (
                        <div
                            key={i}
                            className="flex-1 rounded-full transition-colors duration-100"
                            style={{
                                height: `${height}%`,
                                backgroundColor: isPast
                                    ? "rgba(255,255,255,0.95)"
                                    : "rgba(255,255,255,0.35)",
                            }}
                        />
                    );
                })}
            </div>

            <span className="flex-shrink-0 text-[11px] opacity-70 w-8 text-right">
                {isPlaying || currentTime > 0
                    ? formatTime(currentTime)
                    : formatTime(duration)}
            </span>
        </div>
    );
};

export default AudioMessage;