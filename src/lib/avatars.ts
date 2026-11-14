import leo from "@/assets/avatar-leo.jpg";
import sarah from "@/assets/avatar-sarah.jpg";
import amara from "@/assets/avatar-amara.jpg";
import marcus from "@/assets/avatar-marcus.jpg";
import jonah from "@/assets/avatar-jonah.jpg";
import priya from "@/assets/avatar-priya.jpg";
import mei from "@/assets/avatar-mei.jpg";

const map: Record<string, string> = { leo, sarah, amara, marcus, jonah, priya, mei };

export function avatarSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("asset:")) return map[url.slice(6)] ?? null;
  return url;
}
