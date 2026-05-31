/** Извлекает кадры из видео на клиенте для отправки в AI */
export async function extractVideoFrames(
  file: File,
  timestampsSec: number[] = [0, 1, 3],
): Promise<string[]> {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Не удалось загрузить видео"));
    });

    const duration = video.duration || 10;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas не поддерживается");
    }

    const frames: string[] = [];
    const uniqueTimes = [...new Set(timestampsSec.map((t) => Math.min(t, duration - 0.1)))];

    for (const time of uniqueTimes) {
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        video.currentTime = time;
      });

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.85));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}
