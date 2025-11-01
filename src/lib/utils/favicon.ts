export async function fetchFavicon(websiteUrl: string): Promise<string | null> {
  try {
    const url = new URL(websiteUrl);
    const domain = url.origin;

    const faviconUrls = [
      `${domain}/favicon.ico`,
      `${domain}/favicon.png`,
      `${domain}/apple-touch-icon.png`,
      `${domain}/apple-touch-icon-precomposed.png`,
    ];

    for (const faviconUrl of faviconUrls) {
      try {
        const response = await fetch(faviconUrl, { method: "HEAD" });
        if (response.ok) {
          return faviconUrl;
        }
      } catch {
        continue;
      }
    }

    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    return googleFaviconUrl;
  } catch {
    return null;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
