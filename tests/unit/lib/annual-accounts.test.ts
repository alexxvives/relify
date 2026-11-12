import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { parseAnnualAccounts } from "@/lib/annual-accounts";

const xbrl = `<?xml version="1.0" encoding="UTF-8"?>
<xbrli:xbrl>
  <xbrli:context id="D2023">
    <xbrli:period><xbrli:startDate>2023-01-01</xbrli:startDate><xbrli:endDate>2023-12-31</xbrli:endDate></xbrli:period>
  </xbrli:context>
  <xbrli:context id="D2024">
    <xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period>
  </xbrli:context>
  <xbrli:context id="D2024dim">
    <xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period>
    <xbrli:scenario><xbrldi:explicitMember dimension="d">m</xbrldi:explicitMember></xbrli:scenario>
  </xbrli:context>
  <xbrli:context id="I2024">
    <xbrli:period><xbrli:instant>2024-12-31</xbrli:instant></xbrli:period>
  </xbrli:context>
  <pgc:ImporteNetoCifraNegocios contextRef="D2024dim" unitRef="euro" decimals="0">1</pgc:ImporteNetoCifraNegocios>
  <pgc:ImporteNetoCifraNegocios contextRef="D2024" unitRef="euro" decimals="0">1000000</pgc:ImporteNetoCifraNegocios>
  <pgc:ImporteNetoCifraNegocios contextRef="D2023" unitRef="euro" decimals="0">800000</pgc:ImporteNetoCifraNegocios>
  <pgc:Aprovisionamientos contextRef="D2024" unitRef="euro" decimals="0">50000</pgc:Aprovisionamientos>
  <pgc:AmortizacionDelInmovilizado contextRef="D2024" unitRef="euro" decimals="2">40000.00</pgc:AmortizacionDelInmovilizado>
  <pgc:ResultadoDeExplotacion contextRef="D2024" unitRef="euro" decimals="0">200000</pgc:ResultadoDeExplotacion>
  <pgc:ActivoCorriente contextRef="I2024" unitRef="euro" decimals="0">300000</pgc:ActivoCorriente>
</xbrli:xbrl>`;

describe("parseAnnualAccounts", () => {
  it("reads the deposit totals and turns a positive expense into a negative line", () => {
    const parsed = parseAnnualAccounts(new TextEncoder().encode(xbrl), "cuentas.xbrl");

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    expect(parsed.statements.map((statement) => statement.year)).toEqual([2023, 2024]);
    expect(parsed.statements[0]?.salesCents).toBe(80_000_000);
    expect(parsed.statements[1]?.salesCents).toBe(100_000_000);
    expect(parsed.statements[1]?.pnlCents.supplies).toBe(-5_000_000);
    expect(parsed.statements[1]?.pnlCents.amortization).toBe(-4_000_000);
    expect(parsed.statements[1]?.ebitdaCents).toBe(24_000_000);
    expect(parsed.statements[1]?.balanceCents.currentAssets).toBe(30_000_000);
  });

  it("reads modelo 200 keys and keeps an expense that is already negative", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Declaracion ejercicio="2023">
        <Partida clave="00255">250000,50</Partida>
        <Partida clave="00284">-10000</Partida>
        <Partida clave="00296">40000</Partida>
      </Declaracion>`;
    const parsed = parseAnnualAccounts(new TextEncoder().encode(xml), "modelo-200.xml");

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    expect(parsed.statements).toHaveLength(1);
    expect(parsed.statements[0]?.year).toBe(2023);
    expect(parsed.statements[0]?.salesCents).toBe(25_000_050);
    expect(parsed.statements[0]?.pnlCents.amortization).toBe(-1_000_000);
    expect(parsed.statements[0]?.ebitdaCents).toBe(5_000_000);
  });

  it("applies an XBRL scale and ignores a dimensional-only figure", () => {
    const xml = `<?xml version="1.0"?>
      <xbrli:xbrl>
        <xbrli:context id="D2022">
          <xbrli:period><xbrli:startDate>2022-01-01</xbrli:startDate><xbrli:endDate>2022-12-31</xbrli:endDate></xbrli:period>
          <xbrli:scenario><xbrldi:explicitMember dimension="d">m</xbrldi:explicitMember></xbrli:scenario>
        </xbrli:context>
        <xbrli:context id="D2024">
          <xbrli:period><xbrli:startDate>2024-01-01</xbrli:startDate><xbrli:endDate>2024-12-31</xbrli:endDate></xbrli:period>
        </xbrli:context>
        <ix:nonFraction name="pgc:ImporteNetoCifraNegocios" contextRef="D2022" scale="0">999</ix:nonFraction>
        <ix:nonFraction name="pgc:ImporteNetoCifraNegocios" contextRef="D2024" scale="3" decimals="0">1000</ix:nonFraction>
      </xbrli:xbrl>`;
    const parsed = parseAnnualAccounts(new TextEncoder().encode(xml));

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    expect(parsed.statements).toHaveLength(1);
    expect(parsed.statements[0]?.year).toBe(2024);
    expect(parsed.statements[0]?.salesCents).toBe(100_000_000);
    expect(parsed.statements[0]?.ebitdaCents).toBeNull();
  });

  it("reads an XBRL stored inside a zip", () => {
    const parsed = parseAnnualAccounts(storedZip("cuentas.xbrl", xbrl), "deposito.zip");

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    expect(parsed.statements[1]?.salesCents).toBe(100_000_000);
  });

  it("reads a deflated XBRL entry", () => {
    const parsed = parseAnnualAccounts(deflatedZip("cuentas.xbrl", xbrl));

    expect(parsed.ok).toBe(true);

    if (!parsed.ok) {
      return;
    }

    expect(parsed.statements[1]?.ebitdaCents).toBe(24_000_000);
  });

  it("refuses a PDF of modelo 200", () => {
    const parsed = parseAnnualAccounts(new TextEncoder().encode("%PDF-1.7 modelo 200"), "modelo-200.pdf");

    expect(parsed).toEqual({ ok: false, code: "pdf" });
  });

  it("refuses a file with no revenue line", () => {
    const parsed = parseAnnualAccounts(new TextEncoder().encode("<Nota>sin cifras</Nota>"), "nota.xml");

    expect(parsed).toEqual({ ok: false, code: "no-sales" });
  });
});

function storedZip(name: string, content: string): Uint8Array {
  return zipEntry(name, Buffer.from(content, "utf8"), Buffer.from(content, "utf8"), 0);
}

function deflatedZip(name: string, content: string): Uint8Array {
  const raw = Buffer.from(content, "utf8");
  return zipEntry(name, raw, deflateRawSync(raw), 8);
}

function zipEntry(name: string, raw: Buffer, compressed: Buffer, method: number): Uint8Array {
  const nameBuf = Buffer.from(name, "utf8");
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(method, 8);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(method, 10);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(46 + nameBuf.length, 12);
  eocd.writeUInt32LE(30 + nameBuf.length + compressed.length, 16);
  return new Uint8Array(Buffer.concat([local, nameBuf, compressed, central, nameBuf, eocd]));
}
