export type TreemapInput = {
  id: string;
  label: string;
  value: number;
};

export type TreemapTile = {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type AreaItem = TreemapInput & {
  area: number;
};

export function layoutTreemap(items: readonly TreemapInput[], width: number, height: number): TreemapTile[] {
  const positive = items.filter((item) => item.value > 0).sort((left, right) => right.value - left.value);
  const total = positive.reduce((sum, item) => sum + item.value, 0);

  if (positive.length === 0 || total <= 0 || width <= 0 || height <= 0) {
    return [];
  }

  const weighted = positive.map((item) => ({
    ...item,
    area: (item.value / total) * width * height,
  }));
  const tiles: TreemapTile[] = [];
  squarify(weighted, { x: 0, y: 0, width, height }, tiles);
  return tiles;
}

function squarify(items: AreaItem[], box: Box, tiles: TreemapTile[]): void {
  const first = items[0];

  if (!first || box.width <= 0 || box.height <= 0) {
    return;
  }

  const side = Math.min(box.width, box.height);
  const row: AreaItem[] = [first];

  for (let index = 1; index < items.length; index += 1) {
    const next = items[index];

    if (!next) {
      break;
    }

    const candidate = [...row, next];

    if (worst(candidate, side) <= worst(row, side)) {
      row.push(next);
    } else {
      break;
    }
  }

  const placed = layoutRow(row, box);
  tiles.push(...placed.tiles);
  squarify(items.slice(row.length), placed.rest, tiles);
}

function worst(row: readonly AreaItem[], side: number): number {
  const sum = row.reduce((total, item) => total + item.area, 0);
  const thickness = sum / side;
  let score = 0;

  for (const item of row) {
    const length = item.area / thickness;
    const ratio = Math.max(length / thickness, thickness / length);
    score = Math.max(score, ratio);
  }

  return score;
}

function layoutRow(row: readonly AreaItem[], box: Box): { tiles: TreemapTile[]; rest: Box } {
  const sum = row.reduce((total, item) => total + item.area, 0);
  const alongWidth = box.width <= box.height;
  const span = alongWidth ? box.width : box.height;
  const thickness = sum / span;
  const tiles: TreemapTile[] = [];
  let offset = 0;

  for (const item of row) {
    const length = item.area / thickness;
    tiles.push({
      id: item.id,
      label: item.label,
      value: item.value,
      x: alongWidth ? box.x + offset : box.x,
      y: alongWidth ? box.y : box.y + offset,
      width: alongWidth ? length : thickness,
      height: alongWidth ? thickness : length,
    });
    offset += length;
  }

  const rest = alongWidth
    ? { x: box.x, y: box.y + thickness, width: box.width, height: box.height - thickness }
    : { x: box.x + thickness, y: box.y, width: box.width - thickness, height: box.height };

  return { tiles, rest };
}
