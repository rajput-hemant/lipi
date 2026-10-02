function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function extractPlainTextFromDocumentContent(
  content: string | null | undefined
): string {
  if (!content || !content.trim()) {
    return "";
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      return typeof parsed === "string" ? parsed : content;
    }

    const segments: string[] = [];

    const walkInline = (items: unknown[]) => {
      for (const item of items) {
        if (typeof item === "string") {
          segments.push(item);
        } else if (isRecord(item)) {
          if (typeof item.text === "string") {
            segments.push(item.text);
          }
          if (Array.isArray(item.content)) {
            walkInline(item.content);
          }
        }
      }
    };

    const walkBlocks = (blocks: unknown[]) => {
      for (const block of blocks) {
        if (!isRecord(block)) continue;

        if (Array.isArray(block.content)) {
          walkInline(block.content);
        } else if (typeof block.content === "string") {
          segments.push(block.content);
        }

        if (isRecord(block.props)) {
          if (typeof block.props.code === "string") {
            segments.push(block.props.code);
          }
        }

        if (Array.isArray(block.children)) {
          walkBlocks(block.children);
        }
      }
    };

    walkBlocks(parsed);
    return segments.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return content.trim();
  }
}

export function createSearchSnippet(
  text: string,
  query: string,
  contextRadius = 40
): string | undefined {
  if (!text || !query) return undefined;
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return undefined;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return undefined;
  }

  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(
    text.length,
    matchIndex + trimmedQuery.length + contextRadius
  );

  const prefix = start > 0 ? "... " : "";
  const suffix = end < text.length ? " ..." : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
