import { buildPublicEntitySeo } from "./usePublicEntitySeo";

describe("buildPublicEntitySeo", () => {
  it("builds LocalBusiness structured data for public establishment pages", () => {
    const seo = buildPublicEntitySeo({
      title: "Barbearia Central",
      description: "Cortes e barba com agendamento online.",
      canonicalPath: "/establishment/view/barbearia-central",
      image: "/uploads/barbearia-central.jpg",
    });

    expect(seo.url).toBe("https://rasoio.petertecnet.com.br/establishment/view/barbearia-central");
    expect(seo.image).toBe("https://rasoio.petertecnet.com.br/uploads/barbearia-central.jpg");
    expect(seo.jsonLd).toEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Barbearia Central",
      description: "Cortes e barba com agendamento online.",
      url: "https://rasoio.petertecnet.com.br/establishment/view/barbearia-central",
      image: "https://rasoio.petertecnet.com.br/uploads/barbearia-central.jpg",
    });
  });

  it("keeps other public entities generic and provides a useful fallback description", () => {
    const seo = buildPublicEntitySeo({
      title: "Profissional Teste",
      canonicalPath: "/employer/view/profissional-teste",
    });

    expect(seo.jsonLd["@type"]).toBe("WebPage");
    expect(seo.description).toBe(
      "Veja informações, serviços e disponibilidade de Profissional Teste na Rasoio."
    );
  });

  it("does not generate metadata without a title or canonical path", () => {
    expect(buildPublicEntitySeo({ title: "", canonicalPath: "/establishment/view/teste" })).toBeNull();
    expect(buildPublicEntitySeo({ title: "Teste", canonicalPath: "" })).toBeNull();
  });
});
