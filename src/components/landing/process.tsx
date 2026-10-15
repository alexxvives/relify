import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gazeAvatarUrl } from "@/lib/gaze-avatar";
import { landingCopy } from "@/lib/landing-copy";

type BuyerId = (typeof landingCopy.home.buyers)[number]["id"];

const board = { w: 880, h: 600 };
const hub = { x: 440, y: 292 };

const place: Record<BuyerId, { x: number; y: number }> = {
  zaragoza: { x: 440, y: 118 },
  barcelona: { x: 612, y: 156 },
  valencia: { x: 714, y: 240 },
  palma: { x: 714, y: 348 },
  canarias: { x: 608, y: 432 },
  malaga: { x: 440, y: 468 },
  sevilla: { x: 272, y: 432 },
  coruna: { x: 166, y: 348 },
  madrid: { x: 166, y: 240 },
  bilbao: { x: 272, y: 156 },
};

const ring: readonly (readonly [BuyerId, BuyerId])[] = [
  ["bilbao", "zaragoza"],
  ["zaragoza", "barcelona"],
  ["barcelona", "valencia"],
  ["valencia", "palma"],
  ["palma", "canarias"],
  ["canarias", "malaga"],
  ["malaga", "sevilla"],
  ["sevilla", "coruna"],
  ["coruna", "madrid"],
  ["madrid", "bilbao"],
];

function arc(from: { x: number; y: number }, to: { x: number; y: number }, bend: number) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx + (-dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M ${from.x} ${from.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x} ${to.y}`;
}

function Network() {
  const people = landingCopy.home.buyers;
  const spokes = people.map((person, index) => ({
    id: person.id,
    d: arc(hub, place[person.id], index % 2 === 0 ? 28 : -28),
    delay: `${index * 0.38}s`,
    dur: `${6.4 + (index % 3) * 0.7}s`,
  }));
  const rim = ring.map(([fromId, toId]) => ({
    id: `${fromId}-${toId}`,
    d: arc(place[fromId], place[toId], 16),
  }));

  return (
    <div className="releva-net hidden sm:block">
      <div className="releva-net-field">
        <svg className="releva-net-lines" viewBox={`0 0 ${board.w} ${board.h}`} role="presentation">
          <defs>
            <filter id="releva-net-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {rim.map((link) => (
            <path key={link.id} d={link.d} className="releva-net-rim" />
          ))}
          {spokes.map((link) => (
            <path key={`${link.id}-base`} d={link.d} className="releva-net-line" />
          ))}
          {spokes.map((link) => (
            <path key={`${link.id}-dash`} id={`releva-spoke-${link.id}`} d={link.d} className="releva-net-dash" style={{ animationDelay: link.delay }} />
          ))}
          {spokes.map((link) => (
            <circle key={`${link.id}-pulse`} r="4.2" fill="#e7fffc" filter="url(#releva-net-glow)">
              <animateMotion dur={link.dur} begin={link.delay} repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.42 0 0.2 1">
                <mpath href={`#releva-spoke-${link.id}`} />
              </animateMotion>
            </circle>
          ))}
        </svg>
        <div className="releva-node releva-node-hub" style={{ left: `${(hub.x / board.w) * 100}%`, top: `${(hub.y / board.h) * 100}%` }}>
          <span className="releva-node-photo relative">
            <Image src="/pymes/pyme-obrador.jpg" alt="" fill className="object-cover" sizes="120px" />
          </span>
          <span className="releva-node-label">Tu empresa</span>
        </div>
        {people.map((person) => {
          const spot = place[person.id];
          return (
            <div key={person.id} className="releva-node" style={{ left: `${(spot.x / board.w) * 100}%`, top: `${(spot.y / board.h) * 100}%` }}>
              <span className="releva-node-photo">
                <img src={gazeAvatarUrl(person.id)} alt="" width={64} height={64} className="size-full object-cover" />
              </span>
              <span className="releva-node-label">{person.city}</span>
              <span className="releva-node-seek">{person.seek}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NetworkList() {
  const people = landingCopy.home.buyers;

  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:hidden">
      <li className="col-span-2 flex items-center gap-3 rounded-2xl bg-public-ink p-3 text-white">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full">
          <Image src="/pymes/pyme-obrador.jpg" alt="" fill className="object-cover" sizes="56px" />
        </span>
        <span>
          <span className="block font-medium">Tu empresa</span>
          <span className="block text-sm text-white/70">La que pones a la venta</span>
        </span>
      </li>
      {people.map((person) => (
        <li key={person.id} className="flex items-center gap-3 rounded-2xl bg-public-card p-3 shadow-public">
          <span className="grid size-11 shrink-0 overflow-hidden rounded-full">
            <img src={gazeAvatarUrl(person.id)} alt="" width={44} height={44} className="size-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{person.city}</span>
            <span className="block text-sm text-public-clay">{person.seek}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Process() {
  const copy = landingCopy.home.process;

  return (
    <section id={copy.id} aria-labelledby={`${copy.id}-titulo`} className="scroll-mt-28 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12">
        <div>
          <p className="text-sm tracking-[0.16em] text-public-clay uppercase">{copy.kicker}</p>
          <h2 id={`${copy.id}-titulo`} className="mt-3 text-4xl leading-[1.02] font-medium tracking-tight sm:text-6xl">
            {copy.heading}
            <span className="mt-2 block text-public-clay">{copy.accent}</span>
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-public-muted">{copy.body}</p>
          <Link
            href="/empresas/vender"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-public-clay px-6 text-white transition hover:bg-public-clay-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-public-clay"
          >
            {copy.cta}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div>
          <Network />
          <NetworkList />
        </div>
      </div>
    </section>
  );
}
