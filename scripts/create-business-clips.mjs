// Short motion portfolios made from the app's authored business artwork.
import fs from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { newProfiles, originalBrands } from "./network-expansion-data.mjs";
const dir = new URL("../apps/web/public/demo/", import.meta.url);
await fs.mkdir(new URL("clips/", dir), { recursive: true });
for (const p of [...originalBrands, ...newProfiles]) {
  const cover = new URL(`covers/${p.key}-cover.png`, dir).pathname,
    process = new URL(`covers/${p.key}-process.png`, dir).pathname;
  const filter =
    "[0:v]scale=960:720:force_original_aspect_ratio=decrease,pad=960:720:(ow-iw)/2:(oh-ih)/2:color=0xF5F3ED,setsar=1,format=yuv420p,fps=24[a];[1:v]scale=960:720:force_original_aspect_ratio=decrease,pad=960:720:(ow-iw)/2:(oh-ih)/2:color=0xF5F3ED,setsar=1,format=yuv420p,fps=24[b];[a][b]xfade=transition=fade:duration=1:offset=4,fade=t=out:st=8.5:d=0.5[out]";
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-loop",
      "1",
      "-t",
      "5",
      "-i",
      cover,
      "-loop",
      "1",
      "-t",
      "5",
      "-i",
      process,
      "-filter_complex",
      filter,
      "-map",
      "[out]",
      "-t",
      "9",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      new URL(`clips/${p.key}.mp4`, dir).pathname,
    ],
    { stdio: "inherit" },
  );
  console.log(`${p.key}: 9-second business portfolio`);
}
