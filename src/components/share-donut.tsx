import { companyCopy } from "@/lib/company-copy";
import { formatBasisPoints, sliceCenterNoun, type SliceKind } from "@/lib/company-profile";

const sliceColors = ["#3d34b8", "#6d64d8", "#9d98e6", "#2a2468", "#8b95a7", "#4c6fff"];

export function ShareDonut({
  title,
  kind,
  slices,
}: {
  title: string;
  kind: SliceKind;
  slices: { label: string; basisPoints: number }[];
}) {
  const rings = slices.map((slice, index) => ({
    label: slice.label,
    length: slice.basisPoints / 100,
    offset: slices.slice(0, index).reduce((sum, item) => sum + item.basisPoints / 100, 0),
    color: sliceColors[index % sliceColors.length] ?? "#3d34b8",
  }));

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-[#1c2740]">{title}</h3>
      {slices.length === 0 ? (
        <p className="text-sm text-[#8b95a7]">{companyCopy.unavailable}</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 42 42" className="h-full w-full" aria-hidden="true">
              {rings.map((ring) => (
                <circle
                  key={ring.label}
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="transparent"
                  stroke={ring.color}
                  strokeWidth="6"
                  strokeDasharray={`${ring.length} ${100 - ring.length}`}
                  strokeDashoffset={-ring.offset}
                  transform="rotate(-90 21 21)"
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-[#1c2740]">{slices.length}</span>
              <span className="text-xs text-[#5c6b78]">{sliceCenterNoun(kind, slices.length)}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2 text-sm">
            {slices.map((slice, index) => (
              <li key={slice.label} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: sliceColors[index % sliceColors.length] }}
                />
                <span>
                  {slice.label} ({formatBasisPoints(slice.basisPoints)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
