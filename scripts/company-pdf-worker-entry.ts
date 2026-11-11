import {
  buildCompanyPdf,
  sampleDossierView,
  sampleTeaserView,
} from "../src/lib/company-pdf";

const worker = {
  async fetch(request: Request): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      const view = path.includes("dossier") ? sampleDossierView() : sampleTeaserView();
      const bytes = await buildCompanyPdf(view);
      return new Response(bytes, {
        headers: { "content-type": "application/pdf" },
      });
    } catch (error) {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      return new Response(message, { status: 500 });
    }
  },
};

export default worker;
