import { describe, expect, it } from "vitest";
import { renderEmail } from "./layout";

describe("renderEmail", () => {
  const mail = renderEmail("Asunto <x>", {
    preheader: "pre",
    title: "Hola <b>",
    paragraphs: ["Uno & dos"],
    rows: [{ label: "Empresa", value: "<script>" }],
    cta: { label: "Abrir", url: "https://itsrelify.com/a?b=1&c=2" },
    reason: "Porque sí.",
  });

  it("escapes every user value in the HTML", () => {
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("Hola &lt;b&gt;");
    expect(mail.html).toContain("https://itsrelify.com/a?b=1&amp;c=2");
  });

  it("builds a matching plain-text body", () => {
    expect(mail.text).toContain("Hola <b>");
    expect(mail.text).toContain("Empresa: <script>");
    expect(mail.text).toContain("Abrir: https://itsrelify.com/a?b=1&c=2");
  });

  it("centers the button and keeps the raw link out of the body", () => {
    expect(mail.html).not.toContain("Si el botón no funciona");
    expect(mail.html).toContain('align="center"');
    expect(mail.html).toContain(">Abrir</a>");
  });

  it("puts the category pill on the right of the banner", () => {
    const tagged = renderEmail("Asunto", {
      preheader: "pre",
      eyebrow: "Lista de espera",
      title: "Hola, Alexandre",
      paragraphs: ["Uno"],
      reason: "Porque sí.",
    });
    const banner = tagged.html.slice(0, tagged.html.indexOf("<h1"));
    expect(banner).toContain("Lista de espera");
    expect(banner).toContain('align="right"');
    expect(tagged.html).not.toContain("Lista de espera</span><br>");
  });

  it("refuses non-http links", () => {
    expect(() =>
      renderEmail("x", {
        preheader: "",
        title: "",
        paragraphs: [],
        reason: "",
        cta: { label: "x", url: "javascript:alert(1)" },
      }),
    ).toThrow();
  });
});
