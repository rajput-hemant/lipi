export type DocumentCoverPreset = {
  id: string;
  label: string;
  style: string;
};

export const documentCoverPresets: DocumentCoverPreset[] = [
  {
    id: "gradient:slate",
    label: "Slate",
    style: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
  },
  {
    id: "gradient:ocean",
    label: "Ocean",
    style: "linear-gradient(135deg, #0ea5e9 0%, #1e3a8a 100%)",
  },
  {
    id: "gradient:sunset",
    label: "Sunset",
    style: "linear-gradient(135deg, #f97316 0%, #db2777 100%)",
  },
  {
    id: "gradient:forest",
    label: "Forest",
    style: "linear-gradient(135deg, #22c55e 0%, #14532d 100%)",
  },
  {
    id: "gradient:lavender",
    label: "Lavender",
    style: "linear-gradient(135deg, #a78bfa 0%, #4c1d95 100%)",
  },
];

export function coverStyleForBannerUrl(bannerUrl: string | null | undefined) {
  if (!bannerUrl) {
    return undefined;
  }

  return documentCoverPresets.find((preset) => preset.id === bannerUrl)?.style;
}
