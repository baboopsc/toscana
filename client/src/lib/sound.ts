// Mutfak zili. Tarayıcılar kullanıcı dokunmadan ses çalmaya izin vermediği için
// mutfak ekranı "Ekranı başlat" butonuyla açılır ve ses o anda etkinleşir.

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

export function unlockAudio(): void {
  try {
    if (!context) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      context = new Ctor();
    }
    void context.resume();
    playChime(0.0001); // sessiz deneme: iOS'ta sesi açar
  } catch {
    context = null;
  }
}

export function isAudioReady(): boolean {
  return context?.state === 'running';
}

function playChime(volume: number): void {
  if (!context) return;
  const ctx = context;
  const start = ctx.currentTime + 0.02;
  [880, 1318.5].forEach((frequency, index) => {
    const at = start + index * 0.18;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0001), at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.55);
  });
}

export function playNewTicketSound(): void {
  if (!isAudioReady()) return;
  playChime(0.4);
}
