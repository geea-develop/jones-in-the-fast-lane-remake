"use client";

type SoundName = "move" | "action" | "error" | "week";

let context: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

export function playSound(name: SoundName) {
  const audio = getContext();
  if (!audio) return;
  const now = audio.currentTime;
  const notes: Record<SoundName, number[]> = {
    move: [440],
    action: [523, 659],
    error: [180, 140],
    week: [392, 523, 659],
  };
  notes[name].forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.045, now + index * 0.08 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.09);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now + index * 0.08);
    oscillator.stop(now + index * 0.08 + 0.1);
  });
}
