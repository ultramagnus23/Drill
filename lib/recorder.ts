export interface ActiveRecording {
  recorder: MediaRecorder;
  stream: MediaStream;
  stop: () => Promise<Blob>;
}

export async function startRecording(): Promise<ActiveRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
    };
  });

  recorder.start();

  return {
    recorder,
    stream,
    stop: async () => {
      if (recorder.state !== "inactive") recorder.stop();
      const blob = await stopped;
      stream.getTracks().forEach((t) => t.stop());
      return blob;
    },
  };
}
