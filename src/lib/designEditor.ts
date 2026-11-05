export type DesignObject = {
  id: string;
  kind: "text" | "rect" | "circle" | "image";
  x: number; y: number; width: number; height: number;
  rotation: number; flipped: boolean; color: string;
  text?: string; fontSize?: number; fontWeight?: number; imageData?: string;
};

export const escapeSvgText = (text: string) => text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char] || char));
export const clampNumber = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));

export function resizeDesign(objects: DesignObject[], fromWidth: number, fromHeight: number, toWidth: number, toHeight: number): DesignObject[] {
  const xScale = toWidth / fromWidth;
  const yScale = toHeight / fromHeight;
  return objects.map(object => ({ ...object, x: object.x * xScale, y: object.y * yScale, width: object.width * xScale, height: object.height * yScale, fontSize: object.fontSize ? object.fontSize * Math.min(xScale, yScale) : undefined }));
}

export function renderDesignSvg(width: number, height: number, background: string, objects: DesignObject[]) {
  const elements = objects.map(object => {
    const transform = `translate(${object.x} ${object.y}) rotate(${object.rotation}) scale(${object.flipped ? -1 : 1} 1)`;
    const fill = escapeSvgText(object.color);
    const x = -object.width / 2, y = -object.height / 2;
    if (object.kind === "rect") return `<g transform="${transform}"><rect x="${x}" y="${y}" width="${object.width}" height="${object.height}" rx="16" fill="${fill}"/></g>`;
    if (object.kind === "circle") return `<g transform="${transform}"><ellipse cx="0" cy="0" rx="${object.width / 2}" ry="${object.height / 2}" fill="${fill}"/></g>`;
    if (object.kind === "image") {
      const safe = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(object.imageData || "") ? object.imageData : "";
      return safe ? `<g transform="${transform}"><image x="${x}" y="${y}" width="${object.width}" height="${object.height}" href="${safe}" preserveAspectRatio="xMidYMid meet"/></g>` : "";
    }
    const size = object.fontSize || 32;
    const lines = (object.text || "").split("\n");
    const first = -(lines.length - 1) * size * 0.6;
    const tspans = lines.map((line, i) => `<tspan x="0" y="${first + i * size * 1.2}">${escapeSvgText(line)}</tspan>`).join("");
    return `<g transform="${transform}"><text text-anchor="middle" dominant-baseline="middle" font-family="Pretendard, sans-serif" font-size="${size}" font-weight="${object.fontWeight || 700}" fill="${fill}">${tspans}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${escapeSvgText(background)}"/>${elements}</svg>`;
}
