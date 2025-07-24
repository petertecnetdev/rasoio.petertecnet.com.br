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

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
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
          `${apiBaseUrl}/appointment/listmy`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const list = (data.appointments || []).map(a => {
          const services = Array.isArray(a.service_names)
            ? a.service_names
            : Array.isArray(a.services)
            ? a.services.map(s => s.name)
            : [];
          return {
            ...a,
            service_names: services,
            provider_id: a.provider?.id ?? null,
            provider_name: a.provider?.first_name ?? '—',
            provider_slug: a.provider?.user_name ?? '',
            provider_avatar_url: a.provider?.avatar
              ? `${storageUrl}/${a.provider.avatar}`
              : '',
            shop_id: a.entity?.id ?? null,
            shop_name: a.entity?.name ?? '—',
            shop_slug: a.entity?.slug ?? '',
            shop_logo_url: a.entity?.logo
              ? `${storageUrl}/${a.entity.logo}`
              : '',
          };
        });
        setAppointments(list);
        setProviders(
          list
            .map(a => ({ id: a.provider_id, name: a.provider_name }))
            .filter((p, i, arr) => p.id && arr.findIndex(x => x.id === p.id) === i)
        );
      } catch (err) {
        if (err.response?.status !== 404) Swal.fire('Erro', 'Falha ao carregar agendamentos.', 'error');
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
      setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: 'cancelled' } : a)));
      Swal.fire('Cancelado', 'Agendamento cancelado.', 'success');
    } catch {
      Swal.fire('Erro', 'Falha ao cancelar. Tente novamente.', 'error');
    }
  };

  const filtered = appointments.filter(a => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterProvider && a.provider_id !== +filterProvider) return false;
    if (filterDate && a.scheduled_at.slice(0, 10) !== filterDate) return false;
    return true;
  });

  return (
    <>
      <NavlogComponent />
      <Container fluid className='main-container'>
        <h3>Meus Agendamentos</h3>

        <div className='filters-container'>
          <Form.Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value=''>Situação</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Form.Select>
          <Form.Select value={filterProvider} onChange={e => setFilterProvider(e.target.value)}>
            <option value=''>Todos Barbeiros</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Form.Select>
          <Form.Control type='date' value={filterDate} min={today} onChange={e => setFilterDate(e.target.value)} />
        </div>

        {loading ? (
          <ProcessingIndicatorComponent messages={messages} />
        ) : (
          <>
            <div className='d-none d-md-block'>
              <Table responsive className='appointments-table'>
                <thead>
                  <tr>
                    <th>Agendado em</th>
                    <th>Solicitado em</th>
                    <th>Barbeiro</th>
                    <th>Barbearia</th>
                    <th>Serviços</th>
                    <th>Situação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='text-center'>Nenhum agendamento encontrado.</td>
                    </tr>
                  ) : (
                    filtered.map(a => (
                      <tr key={a.id} className={rowClasses[a.status] || ''}>
                        <td>
                          <div className='date-cell'>
                            <span className='date-main'>
                              {new Date(a.scheduled_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </span>
                            <span className='date-sub'>
                              {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className='date-cell'>
                            <span className='date-main'>
                              {new Date(a.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                            </span>
                            <span className='date-sub'>
                              {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className='provider-cell'>
                            {a.provider_avatar_url && (
                              <img src={a.provider_avatar_url} alt={a.provider_name} className='provider-avatar' />
                            )}
                            {a.provider_slug ? (
                              <Link to={`/barber/view/${a.provider_slug}`} className='provider-name'>{a.provider_name}</Link>
                            ) : a.provider_name}
                          </div>
                        </td>
                        <td>
                          <div className='shop-cell'>
                            <div className='shop-logo-wrapper'>
                              <img src={a.shop_logo_url} alt={a.shop_name} className='shop-logo' />
                            </div>
                            <div className='shop-name'>
                              <Link to={`/barbershop/view/${a.shop_slug}`}>{a.shop_name}</Link>
                            </div>
                          </div>
                        </td>
                        <td>{a.service_names.length ? a.service_names.join(' + ') : '—'}</td>
                        <td>
                          <span className={`status-badge status-${a.status}`}>{statusLabels[a.status]}</span>
                        </td>
                        <td>
                          {['pending', 'confirmed'].includes(a.status) && (
                            <Button variant='danger' size='sm' onClick={() => cancelAppointment(a.id)}>Cancelar</Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>

            <div className='d-block d-md-none'>
              <Row>
                {filtered.length === 0 && (
                  <Col xs={12}><p className='text-center'>Nenhum agendamento encontrado.</p></Col>
                )}
                {filtered.map(a => {
                  const variant = cardVariants[a.status] || { bg: 'light', text: 'dark' };
                  return (
                    <Col xs={12} key={a.id} className='mb-3'>
                      <Card className='appointment-card' bg={variant.bg} text={variant.text}>
                        <Card.Body>
                          <Card.Title>Agendado: {new Date(a.scheduled_at).toLocaleString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Card.Title>
                          <Card.Text>
                            <div className='provider-cell-mobile'>
                              {a.provider_avatar_url && <img src={a.provider_avatar_url} alt={a.provider_name} className='provider-avatar-mobile' />}
                              {a.provider_slug ? <Link to={`/barber/view/${a.provider_slug}`} className='provider-name-mobile'>{a.provider_name}</Link> : a.provider_name}
                            </div>
                            <strong>Solicitado em:</strong> {new Date(a.created_at).toLocaleString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}<br />
                            <strong>Barbearia:</strong> <div className='shop-cell-mobile'>{a.shop_logo_url && <img src={a.shop_logo_url} alt={a.shop_name} className='shop-logo-mobile' />}<Link to={`/barbershop/view/${a.shop_slug}`}>{a.shop_name}</Link></div><br />
                            <strong>Serviços:</strong> {a.service_names.length ? a.service_names.join(' + ') : '—'}<br />
                            <strong>Situação:</strong> <span className={`status-badge status-${a.status}`}>{statusLabels[a.status]}</span>
                          </Card.Text>
                          {['pending', 'confirmed'].includes(a.status) && <Button variant='light' size='sm' onClick={() => cancelAppointment(a.id)}>Cancelar</Button>}
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
