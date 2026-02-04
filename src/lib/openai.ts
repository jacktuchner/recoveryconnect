import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioUrl: string): Promise<string> {
  // Fetch the audio file from S3
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create a File object from the buffer
  const file = new File([buffer], "audio.webm", { type: "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
    response_format: "text",
  });

  return transcription;
}

export { openai };
