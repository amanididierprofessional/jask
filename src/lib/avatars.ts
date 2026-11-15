export function avatarSrc(url: string | null | undefined): string | null { return url && !url.startsWith("asset:") ? url : null; }
