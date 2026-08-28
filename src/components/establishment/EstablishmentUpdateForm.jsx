import React from "react";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const segmentOptions = [
  { value: "corte_masculino", label: "Corte Masculino" },
  { value: "barba", label: "Barba" },
  { value: "sobrancelha", label: "Sobrancelha" },
  { value: "pintura", label: "Pintura" },
  { value: "hidratacao", label: "Hidratação" },
  { value: "alisamento", label: "Alisamento" },
];

export default function EstablishmentUpdateForm({
  register,
  handleSubmit,
  errors,
  isSubmitting,
  segments,
  logoPreview,
  backgroundPreview,
  handleLogoChange,
  handleBackgroundChange,
  handleSegmentsChange,
  onSubmit,
  watch,
}) {
  const name = watch?.("name") || "Nome da barbearia";
  const description = watch?.("description") || "A descrição da sua barbearia aparecerá aqui.";

  return (
    <form className="eup-form" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
      <div
        className="eup-preview"
        style={backgroundPreview ? {
          backgroundImage: `linear-gradient(90deg, rgba(3,8,17,.94), rgba(3,8,17,.56)), url('${backgroundPreview}')`,
        } : undefined}
      >
        <div className="eup-preview__logo">
          {logoPreview ? <img src={logoPreview} alt="Logo da barbearia" /> : <span>R</span>}
        </div>
        <div className="eup-preview__copy">
          <span>Prévia pública</span>
          <h2>{name}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="eup-uploadbar">
        <label htmlFor="backgroundInput">Alterar capa</label>
        <label htmlFor="logoInput">Alterar logo</label>
        <input id="backgroundInput" type="file" accept="image/*" onChange={handleBackgroundChange} />
        <input id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} />
      </div>

      <Section title="Informações da barbearia" subtitle="Dados principais exibidos no perfil público.">
        <div className="eup-grid">
          <Field label="Nome da barbearia *" className="span-4" error={errors?.name?.message}>
            <input {...register("name", { required: "Informe o nome da barbearia." })} />
          </Field>
          <Field label="Nome fantasia" className="span-4">
            <input {...register("fantasy")} />
          </Field>
          <Field label="CNPJ" className="span-4">
            <input {...register("cnpj")} />
          </Field>
          <Field label="Telefone da barbearia" className="span-4">
            <input {...register("phone")} />
          </Field>
          <Field label="E-mail da barbearia" className="span-4">
            <input type="email" {...register("email")} />
          </Field>
          <Field label="CEP" className="span-4">
            <input {...register("cep")} />
          </Field>
          <Field label="Descrição" className="span-12">
            <textarea rows={4} {...register("description")} />
          </Field>
        </div>
      </Section>

      <Section title="Localização" subtitle="Endereço e localização da barbearia.">
        <div className="eup-grid">
          <Field label="Endereço" className="span-8">
            <input {...register("address")} />
          </Field>
          <Field label="Cidade" className="span-2">
            <input {...register("city")} />
          </Field>
          <Field label="UF" className="span-2">
            <select {...register("uf")}>
              <option value="">Selecione</option>
              {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </Field>
          <Field label="Localização / Google Maps" className="span-12">
            <input {...register("location")} />
          </Field>
        </div>
      </Section>

      <Section title="Presença digital" subtitle="Links opcionais para os canais da barbearia.">
        <div className="eup-grid">
          <Field label="Instagram" className="span-4"><input type="url" {...register("instagram_url")} /></Field>
          <Field label="Facebook" className="span-4"><input type="url" {...register("facebook_url")} /></Field>
          <Field label="Site" className="span-4"><input type="url" {...register("website_url")} /></Field>
          <Field label="X / Twitter" className="span-6"><input type="url" {...register("twitter_url")} /></Field>
          <Field label="YouTube" className="span-6"><input type="url" {...register("youtube_url")} /></Field>
        </div>
      </Section>

      <Section title="Serviços oferecidos" subtitle="Selecione os segmentos que representam a barbearia.">
        <div className="eup-segments">
          {segmentOptions.map((option) => {
            const selected = segments.includes(option.value);
            return (
              <label key={option.value} className={`eup-segment ${selected ? "is-selected" : ""}`}>
                <input
                  type="checkbox"
                  value={option.value}
                  checked={selected}
                  onChange={handleSegmentsChange}
                />
                <span className="eup-segment__check" aria-hidden="true" />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
        <input type="hidden" {...register("segments")} value={segments.join(",")} readOnly />
      </Section>

      <div className="eup-actions">
        <button type="submit" className="eup-submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando alterações..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="eup-section">
      <div className="eup-section__heading">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ label, className = "", error, children }) {
  return (
    <label className={`eup-field ${className}`}>
      <span>{label}</span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}
