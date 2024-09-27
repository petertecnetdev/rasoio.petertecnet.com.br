import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaUsers, FaMoneyBillWave, FaCalendarCheck, FaTools, FaStar, FaUserPlus } from 'react-icons/fa';
import NavlogComponent from "../components/NavlogComponent";

// Dados fictícios para os gráficos
const barData = [
  { name: 'Janeiro', vendas: 4000 },
  { name: 'Fevereiro', vendas: 3000 },
  { name: 'Março', vendas: 2000 },
  { name: 'Abril', vendas: 2780 },
  { name: 'Maio', vendas: 1890 },
];

const lineData = [
  { name: 'Janeiro', visitantes: 2400 },
  { name: 'Fevereiro', visitantes: 2210 },
  { name: 'Março', visitantes: 2290 },
  { name: 'Abril', visitantes: 2000 },
  { name: 'Maio', visitantes: 2181 },
];

const areaData = [
  { name: 'Janeiro', lucros: 2400 },
  { name: 'Fevereiro', lucros: 2210 },
  { name: 'Março', lucros: 2290 },
  { name: 'Abril', lucros: 2000 },
  { name: 'Maio', lucros: 2181 },
];

const pieData = [
  { name: 'Grupo A', value: 400 },
  { name: 'Grupo B', value: 300 },
  { name: 'Grupo C', value: 300 },
  { name: 'Grupo D', value: 200 },
];

const indicatorData = [
  { title: 'Total de Clientes', value: 120, icon: <FaUsers />, color: '#4CAF50' },
  { title: 'Faturamento Mensal', value: 'R$ 18,000', icon: <FaMoneyBillWave />, color: '#FF9800' },
  { title: 'Agendamentos no Mês', value: 80, icon: <FaCalendarCheck />, color: '#2196F3' },
  { title: 'Serviços Prestados', value: 150, icon: <FaTools />, color: '#9C27B0' },
  { title: 'Avaliações Positivas', value: '95%', icon: <FaStar />, color: '#FF5722' },
  { title: 'Novos Clientes', value: 20, icon: <FaUserPlus />, color: '#795548' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  return (
    <>
      <NavlogComponent />
      <Container fluid className="main-content">
        {/* Indicadores para o gestor da barbearia */}
        <Card className="card-custom mb-4">
          <Row className="justify-content-between">
            {indicatorData.map((indicator, index) => (
              <Col xs={12} sm={6} md={4} key={index} className="mb-3">
                <Card className="card-indicators" style={{ backgroundColor: indicator.color }}>
                  <Card.Body className="d-flex align-items-center">
                    <div className="me-3">{indicator.icon}</div>
                    <div>
                      <h5>{indicator.title}</h5>
                      <h3>{indicator.value}</h3>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Row>
          {/* Card para Gráfico de Barras */}
          <Col xs={12} md={6} className="mb-4">
            <Card className="card-custom">
              <Card.Header>
                <h2>Vendas por Mês</h2>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="vendas" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Card para Gráfico de Linhas */}
          <Col xs={12} md={6} className="mb-4">
            <Card className="card-custom">
              <Card.Header>
                <h2>Visitantes por Mês</h2>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="visitantes" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Card para Gráfico de Área */}
          <Col xs={12} md={6} className="mb-4">
            <Card className="card-custom">
              <Card.Header>
                <h2>Lucros por Mês</h2>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={areaData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="lucros" stroke="#FFBB28" fillOpacity={0.3} fill="#FFBB28" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>

          {/* Card para Gráfico de Pizza */}
          <Col xs={12} md={6} className="mb-4">
            <Card className="card-custom">
              <Card.Header>
                <h2>Distribuição de Grupos</h2>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Dashboard;
