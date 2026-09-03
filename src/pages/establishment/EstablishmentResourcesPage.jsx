import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { apiV1BaseUrl } from "../../config";
import api from "../../services/api";
import schedulingApi from "../../services/schedulingApi";
import "./EstablishmentResourcesPage.css";

const RESOURCE_TYPES = [
  { key: "room", label: "Sala" },
  { key: "station", label: "Estação / box" },
  { key: "equipment", label: "Equipamento" },
  { key: "vehicle", label: "Veículo" },
  { key: "space", label: "Espaço" },
  { key: "other", label: "Outro recurso" },
];

const DAYS = [
  ["monday", "Segunda"],
  ["tuesday", "Terça"],
  ["wednesday", "Quarta"],
  ["thursday", "Quinta"],
  ["friday", "Sexta"],
  ["saturday", "Sábado"],
  ["sunday", "Domingo"],
];

const TYPE_LABELS = Object.fromEntries([
  ["professional", "Profissional"],
  ...RESOURCE_TYPES.map((item) => [item.key, item.label]),
]);

const emptyForm = {
  type: "room",
  name: "",
  description: "",
  capacity: 1,
  item_ids: [],
};

const emptyWeek = () =>
  Object.fromEntries(
    DAYS.map(([key]) => [key, { enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(key), start: "09:00", end: "18:00" }])
  );

export default function EstablishmentResourcesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const establishmentId = Number(id);

  const [establishment, setEstablishment] = useState(null);
  const [resources, setResources] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState(emptyForm);
  const [week, setWeek] = useState(emptyWeek);
  const [saving, setSaving] = useState(false);

  const physicalResources = useMemo(
    () => resources.filter((resource) => resource.type !== "professional"),
    [resources]
  );
  const professionals = useMemo(
    () => resources.filter((resource) => resource.type === "professional"),
    [resources]
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(establishmentId) || establishmentId <= 0) {
      setError("Estabelecimento inválido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [mineResponse, resourcesResponse, itemsResponse] = await Promise.all([
        api.get(`${apiV1BaseUrl}/me/establishments`),
        schedulingApi.resources.list(establishmentId),
        api.get(`${apiV1BaseUrl}/establishments/${establishmentId}/items`),
      ]);

      const mine = Array.isArray(mineResponse?.data?.data) ? mineResponse.data.data : [];
      const current = mine.find((item) => Number(item.id) === establishmentId) || null;
      if (!current) throw new Error("Você não possui acesso a este estabelecimento.");

      setEstablishment(current);
      setResources(Array.isArray(resourcesResponse?.data?.data) ? resourcesResponse.data.data : []);
      setServices(
        (Array.isArray(itemsResponse?.data?.data) ? itemsResponse.data.data : []).filter(
          (item) => item.type === "service" || item.type === "servico" || item.type === "serviço"
        )
      );
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Não foi possível carregar os recursos."
      );
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingResource(null);
    setResourceForm(emptyForm);
    setShowResourceModal(true);
  };

  const openEdit = (resource) => {
    setEditingResource(resource);
    setResourceForm({
      type: resource.type,
      name: resource.name || "",
      description: resource.description || "",
      capacity: resource.capacity || 1,
      item_ids: Array.isArray(resource.items) ? resource.items.map((item) => Number(item.id)) : [],
    });
    setShowResourceModal(true);
  };

  const saveResource = async () => {
    if (!resourceForm.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        establishment_id: establishmentId,
        type: resourceForm.type,
        name: resourceForm.name.trim(),
        description: resourceForm.description.trim() || null,
        capacity: Number(resourceForm.capacity || 1),
        item_ids: resourceForm.item_ids,
        is_active: true,
      };

      if (editingResource) {
        await schedulingApi.resources.update(editingResource.id, payload);
      } else {
        await schedulingApi.resources.create(payload);
      }

      setShowResourceModal(false);
      await load();
      await Swal.fire({
        icon: "success",
        title: editingResource ? "Recurso atualizado" : "Recurso criado",
        text: "O recurso já pode participar da disponibilidade dos agendamentos.",
      });
    } catch (saveError) {
      const validationMessage = saveError?.response?.data?.errors
        ? Object.values(saveError.response.data.errors).flat().filter(Boolean)[0]
        : null;
      await Swal.fire(
        "Não foi possível salvar",
        validationMessage || saveError?.response?.data?.message || "Revise os dados e tente novamente.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const removeResource = async (resource) => {
    const result = await Swal.fire({
      icon: "warning",
      title: `Remover ${resource.name}?`,
      text: "Recursos com histórico de agendamentos serão preservados e devem ser apenas desativados.",
      showCancelButton: true,
      confirmButtonText: "Remover",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await schedulingApi.resources.remove(resource.id);
      await load();
    } catch (removeError) {
      await Swal.fire(
        "Não foi possível remover",
        removeError?.response?.data?.message || "Desative o recurso se ele já possuir histórico.",
        "error"
      );
    }
  };

  const openSchedule = async (resource) => {
    setEditingResource(resource);
    setSaving(true);
    try {
      const { data } = await schedulingApi.resources.schedules(resource.id);
      const nextWeek = emptyWeek();
      const schedules = Array.isArray(data?.data) ? data.data : [];

      schedules
        .filter((schedule) => schedule.type === "work" && schedule.day_of_week)
        .forEach((schedule) => {
          nextWeek[schedule.day_of_week] = {
            enabled: Boolean(schedule.is_active),
            start: String(schedule.start_time || "09:00").slice(0, 5),
            end: String(schedule.end_time || "18:00").slice(0, 5),
          };
        });

      setWeek(nextWeek);
      setShowScheduleModal(true);
    } catch (scheduleError) {
      await Swal.fire(
        "Erro ao carregar agenda",
        scheduleError?.response?.data?.message || "Não foi possível carregar os horários deste recurso.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    if (!editingResource) return;
    setSaving(true);
    try {
      const schedules = DAYS.flatMap(([day]) => {
        const config = week[day];
        if (!config?.enabled) return [];
        return [
          {
            day_of_week: day,
            start_time: config.start,
            end_time: config.end,
            type: "work",
            is_active: true,
          },
        ];
      });

      await schedulingApi.resources.syncSchedules(editingResource.id, schedules);
      setShowScheduleModal(false);
      await Swal.fire("Disponibilidade salva", "Os novos horários já serão considerados nos agendamentos.", "success");
    } catch (scheduleError) {
      const validationMessage = scheduleError?.response?.data?.errors
        ? Object.values(scheduleError.response.data.errors).flat().filter(Boolean)[0]
        : null;
      await Swal.fire(
        "Não foi possível salvar",
        validationMessage || scheduleError?.response?.data?.message || "Revise os horários informados.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (itemId) => {
    setResourceForm((current) => ({
      ...current,
      item_ids: current.item_ids.includes(itemId)
        ? current.item_ids.filter((idValue) => idValue !== itemId)
        : [...current.item_ids, itemId],
    }));
  };

  if (loading) {
    return (
      <Container className="resources-loading py-5 text-center">
        <Spinner animation="border" />
        <p>Carregando recursos agendáveis…</p>
      </Container>
    );
  }

  return (
    <main className="resources-page">
      <Container className="py-4 py-lg-5">
        <div className="resources-hero">
          <div>
            <Button variant="link" className="resources-back" onClick={() => navigate("/establishment/my")}>← Meus estabelecimentos</Button>
            <span className="resources-kicker">Capacidade de atendimento</span>
            <h1>Recursos de {establishment?.fantasy || establishment?.name || "seu estabelecimento"}</h1>
            <p>
              Cadastre tudo que precisa estar disponível para executar um serviço: salas, boxes,
              equipamentos, veículos e espaços. Profissionais são sincronizados automaticamente pela equipe.
            </p>
          </div>
          <Button className="resources-primary" onClick={openCreate}>+ Adicionar recurso</Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <section className="resources-summary">
          <div><strong>{professionals.length}</strong><span>profissionais</span></div>
          <div><strong>{physicalResources.length}</strong><span>recursos físicos</span></div>
          <div><strong>{services.length}</strong><span>serviços cadastrados</span></div>
        </section>

        <section className="resources-section">
          <div className="resources-heading">
            <div><span>Equipe</span><h2>Profissionais agendáveis</h2></div>
            <p>Gerencie pessoas na área Equipe. Aqui você visualiza a integração com a agenda.</p>
          </div>
          <Row className="g-3">
            {professionals.map((resource) => (
              <Col key={resource.id} xs={12} md={6} xl={4}>
                <Card className="resource-card h-100">
                  <Card.Body>
                    <div className="resource-card-top">
                      <Badge bg="secondary">Profissional</Badge>
                      <span className="resource-status">Ativo</span>
                    </div>
                    <Card.Title>{resource.name}</Card.Title>
                    <Card.Text>{resource.items?.length || 0} serviço(s) vinculados</Card.Text>
                    <Button variant="outline-light" onClick={() => navigate(`/employer/update/${resource.employer_id}`)}>Gerenciar profissional</Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {!professionals.length && (
              <Col xs={12}><Alert variant="secondary">Nenhum profissional vinculado ainda.</Alert></Col>
            )}
          </Row>
        </section>

        <section className="resources-section">
          <div className="resources-heading">
            <div><span>Infraestrutura</span><h2>Salas, equipamentos e espaços</h2></div>
            <p>Estes recursos podem ser combinados com um profissional no mesmo agendamento.</p>
          </div>
          <Row className="g-3">
            {physicalResources.map((resource) => (
              <Col key={resource.id} xs={12} md={6} xl={4}>
                <Card className="resource-card h-100">
                  <Card.Body>
                    <div className="resource-card-top">
                      <Badge bg="secondary">{TYPE_LABELS[resource.type] || resource.type}</Badge>
                      <span className="resource-capacity">Capacidade {resource.capacity || 1}</span>
                    </div>
                    <Card.Title>{resource.name}</Card.Title>
                    <Card.Text>{resource.description || "Sem descrição."}</Card.Text>
                    <div className="resource-services">
                      {(resource.items || []).slice(0, 4).map((item) => <span key={item.id}>{item.name}</span>)}
                      {(resource.items || []).length > 4 && <span>+{resource.items.length - 4}</span>}
                    </div>
                    <div className="resource-actions">
                      <Button variant="outline-light" onClick={() => openSchedule(resource)}>Horários</Button>
                      <Button variant="outline-light" onClick={() => openEdit(resource)}>Editar</Button>
                      <Button variant="outline-danger" onClick={() => removeResource(resource)}>Remover</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {!physicalResources.length && (
              <Col xs={12}>
                <div className="resources-empty">
                  <strong>Nenhum recurso físico cadastrado.</strong>
                  <p>Se o serviço depende somente do profissional, você não precisa criar nada aqui.</p>
                  <Button onClick={openCreate}>Adicionar primeiro recurso</Button>
                </div>
              </Col>
            )}
          </Row>
        </section>
      </Container>

      <Modal show={showResourceModal} onHide={() => !saving && setShowResourceModal(false)} centered size="lg" contentClassName="resources-modal">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>{editingResource ? "Editar recurso" : "Novo recurso agendável"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Label>Tipo</Form.Label>
              <Form.Select value={resourceForm.type} onChange={(event) => setResourceForm((current) => ({ ...current, type: event.target.value }))}>
                {RESOURCE_TYPES.map((type) => <option key={type.key} value={type.key}>{type.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={5}>
              <Form.Label>Nome</Form.Label>
              <Form.Control value={resourceForm.name} onChange={(event) => setResourceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Sala 2, Box 3, Equipamento A" />
            </Col>
            <Col md={3}>
              <Form.Label>Capacidade</Form.Label>
              <Form.Control type="number" min="1" max="10000" value={resourceForm.capacity} onChange={(event) => setResourceForm((current) => ({ ...current, capacity: event.target.value }))} />
            </Col>
            <Col xs={12}>
              <Form.Label>Descrição</Form.Label>
              <Form.Control as="textarea" rows={3} value={resourceForm.description} onChange={(event) => setResourceForm((current) => ({ ...current, description: event.target.value }))} placeholder="Explique quando este recurso é necessário." />
            </Col>
            <Col xs={12}>
              <Form.Label>Serviços que podem utilizar este recurso</Form.Label>
              <div className="resource-service-selector">
                {services.map((service) => (
                  <Form.Check
                    key={service.id}
                    type="checkbox"
                    id={`resource-service-${service.id}`}
                    label={`${service.name}${service.duration ? ` · ${service.duration} min` : ""}`}
                    checked={resourceForm.item_ids.includes(Number(service.id))}
                    onChange={() => toggleService(Number(service.id))}
                  />
                ))}
                {!services.length && <span>Cadastre serviços primeiro para fazer vínculos específicos.</span>}
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={() => setShowResourceModal(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={saveResource} disabled={saving || !resourceForm.name.trim()}>{saving ? "Salvando…" : "Salvar recurso"}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showScheduleModal} onHide={() => !saving && setShowScheduleModal(false)} centered size="lg" contentClassName="resources-modal">
        <Modal.Header closeButton closeVariant="white"><Modal.Title>Disponibilidade · {editingResource?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="resources-modal-help">Defina os períodos recorrentes em que este recurso pode ser reservado.</p>
          <div className="resource-week">
            {DAYS.map(([day, label]) => (
              <div key={day} className="resource-day-row">
                <Form.Check
                  type="switch"
                  id={`day-${day}`}
                  label={label}
                  checked={Boolean(week[day]?.enabled)}
                  onChange={(event) => setWeek((current) => ({ ...current, [day]: { ...current[day], enabled: event.target.checked } }))}
                />
                <Form.Control type="time" value={week[day]?.start || "09:00"} disabled={!week[day]?.enabled} onChange={(event) => setWeek((current) => ({ ...current, [day]: { ...current[day], start: event.target.value } }))} />
                <span>até</span>
                <Form.Control type="time" value={week[day]?.end || "18:00"} disabled={!week[day]?.enabled} onChange={(event) => setWeek((current) => ({ ...current, [day]: { ...current[day], end: event.target.value } }))} />
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-light" onClick={() => setShowScheduleModal(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={saveSchedule} disabled={saving}>{saving ? "Salvando…" : "Salvar disponibilidade"}</Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
