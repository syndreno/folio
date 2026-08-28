function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function contrastRatio(foreground: string, background: string): number {
  const parse = (value: string) => {
    const match = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!match) return [0, 0, 0] as const;
    return [
      Number.parseInt(match[1] ?? "00", 16),
      Number.parseInt(match[2] ?? "00", 16),
      Number.parseInt(match[3] ?? "00", 16),
    ] as const;
  };
  const luminance = (value: string) => {
    const [redChannel, greenChannel, blueChannel] = parse(value);
    const red = channelToLinear(redChannel);
    const green = channelToLinear(greenChannel);
    const blue = channelToLinear(blueChannel);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
