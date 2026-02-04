import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
  const client = getOpenAI();

  // Fetch the audio file from S3
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Create a File object from the buffer
  const file = new File([buffer], "audio.webm", { type: "audio/webm" });

  const transcription = await client.audio.transcriptions.create({
    file: file,
    model: "whisper-1",
    response_format: "text",
  });

  return transcription;
}

export { getOpenAI as openai };
