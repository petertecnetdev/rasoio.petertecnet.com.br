import React from "react";
import { Link } from "react-router-dom";

const segments = [
  "Barbearias",
  "Salões de beleza",
  "Manicures e nail designers",
  "Estética",
  "Tatuadores",
  "Massagistas",
  "Personal trainers",
  "Profissionais autônomos",
];

const benefits = [
  "Página pública para seus clientes agendarem sem trocar dezenas de mensagens",
  "Serviços, profissionais e horários organizados em um único lugar",
  "Agenda acessível pelo celular e pronta para compartilhar no WhatsApp e Instagram",
  "Menos risco de conflito de horários e agendamentos duplicados",
  "Estrutura preparada para crescer com equipe, gestão e recursos premium",
];

export default function AgendaOnlinePage() {
  return (
    <main>
      <section className="container py-5 py-lg-6">
        <div className="row align-items-center g-5">
          <div className="col-12 col-lg-7">
            <span className="badge text-bg-primary mb-3">Agenda online Rasoio</span>
            <h1 className="display-4 fw-bold lh-sm mb-3">
              Agenda online para organizar clientes, serviços e horários
            </h1>
            <p className="lead text-body-secondary mb-4">
              Crie sua presença de agendamento na Rasoio, publique seus serviços e compartilhe um link para seus clientes encontrarem horários disponíveis sem depender de atendimento manual para cada marcação.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3">
              <Link
                className="btn btn-primary btn-lg"
                to="/register?source=agenda-online"
              >
                Criar minha agenda
              </Link>
              <Link
                className="btn btn-outline-primary btn-lg"
                to="/planos?source=agenda-online"
              >
                Ver planos
              </Link>
            </div>
            <p className="small text-body-secondary mt-3 mb-0">
              Cadastro self-service. Você configura o negócio e começa a organizar sua agenda pelo próprio sistema.
            </p>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4 p-lg-5">
                <h2 className="h4 fw-bold mb-3">Feita para negócios que trabalham com horário marcado</h2>
                <div className="d-flex flex-wrap gap-2">
                  {segments.map((segment) => (
                    <span className="badge rounded-pill text-bg-light border" key={segment}>
                      {segment}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-body-tertiary py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-12 col-lg-5">
              <h2 className="fw-bold">Pare de administrar a agenda apenas por mensagens</h2>
              <p className="text-body-secondary mb-0">
                A Rasoio centraliza o fluxo de descoberta do estabelecimento, serviços, profissionais e agendamento. O cliente acessa a página pública, escolhe o que precisa e segue o fluxo disponível no sistema.
              </p>
            </div>
            <div className="col-12 col-lg-7">
              <ul className="list-group list-group-flush rounded shadow-sm overflow-hidden">
                {benefits.map((benefit) => (
                  <li className="list-group-item py-3" key={benefit}>
                    <span className="me-2" aria-hidden="true">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="text-center mx-auto" style={{ maxWidth: 760 }}>
          <h2 className="fw-bold">Sua agenda também pode trabalhar como canal de aquisição</h2>
          <p className="text-body-secondary mb-4">
            Compartilhe sua página pública com clientes e coloque o link na bio, no WhatsApp e nos seus canais digitais. Quanto mais fácil for encontrar seus serviços e horários, menor a dependência de conversas manuais para começar um agendamento.
          </p>
          <Link className="btn btn-primary btn-lg" to="/register?source=agenda-online-bottom">
            Começar agora
          </Link>
        </div>
      </section>
    </main>
  );
}
