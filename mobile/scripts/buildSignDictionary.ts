// mnsl.mn-ийн үгийн дохионы жагсаалтаас src/lib/signDictionary.json үүсгэнэ (видео өөрийг нь татахгүй).
// Ажиллуулах: bun scripts/buildSignDictionary.ts https://mnsl.mn
// mnsl.mn-ийн зөвшөөрөлтэйгээр ашиглана.
import { writeFileSync } from "node:fs";

import { buildSignDictionary } from "../src/lib/signTitles";

const PAGE_SIZE = 100;
// Тэдний серверийг ачаалахгүй: хуудас хооронд түр хүлээнэ.
const PAUSE_MS = 1_000;
const UPLOADS = "/wp-content/uploads/";
const OUTPUT = new URL("../src/lib/signDictionary.json", import.meta.url);

type Media = { title: { rendered: string }; source_url: string };

function decodeTitle(html: string): string {
  return html.replace(/&#(\d+);/gu, (_, code: string) => String.fromCodePoint(Number(code))).replace(/&amp;/gu, "&");
}

async function fetchVideos(site: string): Promise<{ title: string; path: string }[]> {
  const videos: { title: string; path: string }[] = [];
  for (let page = 1; ; page += 1) {
    const url = `${site}/wp-json/wp/v2/media?mime_type=video/mp4&per_page=${PAGE_SIZE}&page=${page}&_fields=title,source_url`;
    const response = await fetch(url);
    if (!response.ok) break; // WordPress сүүлийн хуудасны дараа 400 буцаана
    const items = (await response.json()) as Media[];
    if (!items.length) break;
    videos.push(...items.map((item) => ({
      title: decodeTitle(item.title.rendered),
      path: decodeURIComponent(item.source_url.split(UPLOADS)[1] ?? ""),
    })));
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  }
  return videos;
}

const site = process.argv[2]?.replace(/\/$/u, "");
if (!site) throw new Error("Usage: bun scripts/buildSignDictionary.ts <mnsl.mn site URL>");
const dictionary = buildSignDictionary(await fetchVideos(site));
const sorted = Object.fromEntries(Object.entries(dictionary).sort(([a], [b]) => a.localeCompare(b, "mn")));
writeFileSync(OUTPUT, `${JSON.stringify(sorted, null, 1)}\n`);
process.stderr.write(`${Object.keys(sorted).length} words → ${OUTPUT.pathname}\n`);
