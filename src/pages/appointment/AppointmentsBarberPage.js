// src/pages/appointment/AppointmentsBarberPage.js
import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Card, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import NavlogComponent from '../../components/NavlogComponent';
import ProcessingIndicatorComponent from '../../components/ProcessingIndicatorComponent';
import { apiBaseUrl, storageUrl } from '../../config';
import './Appointment.css';

const statusLabels = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Concluído',
};

const rowClasses = {
  pending: 'table-warning',
  confirmed: 'table-success',
  cancelled: 'table-danger',
  completed: 'table-secondary',
};

const cardVariants = {
  pending: { bg: 'warning', text: 'dark' },
  confirmed: { bg: 'success', text: 'white' },
  cancelled: { bg: 'danger', text: 'white' },
  completed: { bg: 'secondary', text: 'white' },
};

export default function AppointmentsBarberPage() {
  const [appointments, setAppointments] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterShop, setFilterShop] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const today = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);
      setMessages(['Carregando agendamentos...']);
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${apiBaseUrl}/appointment/listbyprovider`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = (data.appointments || []).map(a => {
          const services = Array.isArray(a.service_names)
            ? a.service_names
            : Array.isArray(a.services)
            ? a.services.map(s => s.name)
            : [];
            console.log(a.entity);
          return {
            ...a,
            service_names: services,
            shop_id: a.entity?.id ?? null,
            shop_name: a.entity?.name ?? '—',
            shop_slug: a.entity?.slug ?? '',
            shop_logo_url: a.entity?.logo ? `${storageUrl}/${a.entity.logo}` : '',
            client_id: a.client?.id ?? null,
            client_name: a.client?.first_name ?? '—',
            client_slug: a.client?.user_name ?? '',
            client_avatar_url: a.client?.avatar ? `${storageUrl}/${a.client.avatar}` : '',
            client_phone: a.client?.phone ?? '—',
          };
        });
        setAppointments(list);
        setShops(
          list
            .map(a => ({ id: a.shop_id, name: a.shop_name }))
            .filter((s, i, arr) => s.id && arr.findIndex(x => x.id === s.id) === i)
        );
      } catch {
        Swal.fire('Erro', 'Falha ao carregar agendamentos.', 'error');
        setAppointments([]);
      } finally {
        setLoading(false);
        setMessages([]);
      }
    }
    fetchAppointments();
  }, []);

  const cancelAppointment = async id => {
    const { isConfirmed } = await Swal.fire({
      title: 'Cancelar?',
      text: 'Deseja cancelar este agendamento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
    });
    if (!isConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${apiBaseUrl}/appointment/${id}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(prev =>
        prev.map(a => (a.id === id ? { ...a, status: 'cancelled' } : a))
      );
      Swal.fire('Cancelado', 'Agendamento cancelado.', 'success');
    } catch {
      Swal.fire('Erro', 'Falha ao cancelar. Tente novamente.', 'error');
    }
  };

  const filtered = appointments.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterShop && a.shop_id !== +filterShop) return false;
    if (filterDate && a.scheduled_at.slice(0, 10) !== filterDate) return false;
    return true;
  });

  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-container">
        <h3>Meus Agendamentos</h3>

        <div className="filters-container">
          <Form.Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Situação</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Form.Select>

          <Form.Select
            value={filterShop}
            onChange={e => setFilterShop(e.target.value)}
          >
            <option value="">Todas Barbearias</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Form.Select>

          <Form.Control
            type="date"
            value={filterDate}
            min={today}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>

        {loading ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <>
            {/* DESKTOP */}
            <div className="d-none d-md-block">
              <Table responsive className="appointments-table">
                <thead>
                  <tr>
                    <th>Agendado em</th>
                    <th>Solicitado em</th>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Barbearia</th>
                    <th>Serviços</th>
                    <th>Situação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        Nenhum agendamento encontrado.
                      </td>
                    </tr>
                  ) : filtered.map(a => (
                    <tr key={a.id} className={rowClasses[a.status] || ''}>
                      <td>
                        <div className="date-cell">
                          <span className="date-main">
                            {new Date(a.scheduled_at).toLocaleDateString('pt-BR', {
                              day: 'numeric', month: 'long'
                            })}
                          </span>
                          <span className="date-sub">
                            {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span className="date-main">
                            {new Date(a.created_at).toLocaleDateString('pt-BR', {
                              day: 'numeric', month: 'long'
                            })}
                          </span>
                          <span className="date-sub">
                            {new Date(a.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="provider-cell">
                          {a.client_avatar_url && (
                            <img
                              src={a.client_avatar_url}
                              alt={a.client_name}
                              className="provider-avatar"
                            />
                          )}
                          {a.client_slug ? (
                            <Link to={`/client/view/${a.client_slug}`} className="provider-name">
                              {a.client_name}
                            </Link>
                          ) : a.client_name}
                        </div>
                      </td>
                      <td>{a.client_phone}</td>
                      <td>
                        <div className="shop-cell">
                          <div className="shop-logo-wrapper">
                            <img
                              src={a.shop_logo_url}
                              alt={a.shop_name}
                              className="shop-logo"
                            />
                          </div>
                          <div className="shop-name">
                            <Link to={`/barbershop/view/${a.shop_slug}`}>
                              {a.shop_name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td>
                        {a.service_names.length ? a.service_names.join(' + ') : '—'}
                      </td>
                      <td>
                        <span className={`status-badge status-${a.status}`}>
                          {statusLabels[a.status]}
                        </span>
                      </td>
                      <td>
                        {['pending', 'confirmed'].includes(a.status) && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => cancelAppointment(a.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* MOBILE */}
            <div className="d-block d-md-none">
              <Row>
                {filtered.length === 0 && (
                  <Col xs={12}>
                    <p className="text-center">Nenhum agendamento encontrado.</p>
                  </Col>
                )}
                {filtered.map(a => {
                  const variant = cardVariants[a.status] || { bg: 'light', text: 'dark' };
                  return (
                    <Col xs={12} key={a.id} className="mb-3">
                      <Card className="appointment-card" bg={variant.bg} text={variant.text}>
                        <Card.Body>
                          <Card.Title>
                            Agendado:{' '}
                            {new Date(a.scheduled_at).toLocaleString('pt-BR', {
                              day: 'numeric', month: 'long',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </Card.Title>
                          <Card.Text>
                            <div className="provider-cell-mobile">
                              {a.client_avatar_url && (
                                <img
                                  src={a.client_avatar_url}
                                  alt={a.client_name}
                                  className="provider-avatar-mobile"
                                />
                              )}
                              {a.client_slug ? (
                                <Link to={`/client/view/${a.client_slug}`} className="provider-name-mobile">
                                  {a.client_name}
                                </Link>
                              ) : a.client_name}
                            </div>
                            <strong>Telefone:</strong> {a.client_phone}<br/>
                            <strong>Barbearia:</strong>{' '}
                            <div className="shop-cell-mobile">
                              <img
                                src={a.shop_logo_url}
                                alt={a.shop_name}
                                className="shop-logo-mobile"
                              />
                              <Link to={`/barbershop/view/${a.shop_slug}`}>
                                {a.shop_name}
                              </Link>
                            </div>
                            <br/>
                            <strong>Serviços:</strong>{' '}
                            {a.service_names.length ? a.service_names.join(' + ') : '—'}<br/>
                            <strong>Situação:</strong>{' '}
                            <span className={`status-badge status-${a.status}`}>
                              {statusLabels[a.status]}
                            </span>
                          </Card.Text>
                          {['pending', 'confirmed'].includes(a.status) && (
                            <Button variant="light" size="sm" onClick={() => cancelAppointment(a.id)}>
                              Cancelar
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </>
        )}
      </Container>
    </>
  );
}
