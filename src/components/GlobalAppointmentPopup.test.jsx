import React, { createRef } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import Swal from "sweetalert2";
import GlobalAppointmentPopup from "./GlobalAppointmentPopup";

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
  getHtmlContainer: jest.fn(),
}));
jest.mock("sweetalert2-react-content", () => (swal) => swal);

const employer = { id: 7, user: { first_name: "Ana" } };
const service = { id: 4, name: "Corte", price: 50, duration: 30 };

const mountPopup = (props = {}) => {
  const ref = createRef();
  const loadAvailableTimes = props.loadAvailableTimes || jest.fn().mockResolvedValue(["09:00"]);
  const handleCreateAppointment = jest.fn().mockResolvedValue(true);
  render(
    <GlobalAppointmentPopup
      ref={ref}
      employers={[employer]}
      services={[service]}
      imageUrl={() => "/rasoio-logo.webp"}
      loadAvailableTimes={loadAvailableTimes}
      handleCreateAppointment={handleCreateAppointment}
      {...props}
    />
  );
  return { ref, loadAvailableTimes, handleCreateAppointment };
};

beforeEach(() => {
  Swal.getHtmlContainer.mockImplementation(() => document.querySelector("#rasoio-test-popup"));
  Swal.fire.mockImplementation(async ({ html, didOpen }) => {
    const popup = document.createElement("div");
    popup.id = "rasoio-test-popup";
    popup.innerHTML = html;
    document.body.appendChild(popup);
    await didOpen?.();
    return {};
  });
});

afterEach(() => {
  document.querySelector("#rasoio-test-popup")?.remove();
  jest.clearAllMocks();
});

test("permite escolher serviço e concluir o agendamento com profissional e data predefinidos", async () => {
  const { ref, loadAvailableTimes, handleCreateAppointment } = mountPopup();

  await act(async () => {
    await ref.current.open({ employer, date: "2026-10-30" });
  });

  const serviceButton = document.querySelector(".swl-service");
  expect(serviceButton.getAttribute("aria-pressed")).toBe("false");
  expect(loadAvailableTimes).not.toHaveBeenCalled();

  await act(async () => {
    fireEvent.click(serviceButton);
  });

  expect(serviceButton.getAttribute("aria-pressed")).toBe("true");
  expect(loadAvailableTimes).toHaveBeenCalledWith("2026-10-30", employer, 30);
  const timeButton = document.querySelector(".swl-time");
  expect(timeButton.textContent).toBe("09:00");

  await act(async () => {
    fireEvent.click(timeButton);
  });
  expect(handleCreateAppointment).toHaveBeenCalledWith(
    [expect.objectContaining({ id: 4 })],
    employer,
    "2026-10-30",
    "09:00"
  );
});

test("não interpreta nomes e horários vindos da API como HTML", async () => {
  const hostileEmployer = { id: 7, user: { first_name: '<svg onload="alert(1)">' } };
  const hostileService = { id: 4, name: '<img src=x onerror="alert(2)">', price: 50, duration: 30 };
  const loadAvailableTimes = jest.fn().mockResolvedValue(['09:00" onclick="alert(3)']);
  const { ref } = mountPopup({
    employers: [hostileEmployer],
    services: [hostileService],
    loadAvailableTimes,
  });

  await act(async () => {
    await ref.current.open({
      employer: hostileEmployer,
      service: hostileService,
      date: "2026-10-30",
    });
  });

  const popup = document.querySelector("#rasoio-test-popup");
  expect(popup.textContent).toContain(hostileService.name);
  expect(popup.textContent).toContain(hostileEmployer.user.first_name);
  expect(popup.querySelector("svg")).toBeNull();
  expect(popup.querySelector("img[src='x']")).toBeNull();
  expect(popup.querySelector(".swl-time").getAttribute("onclick")).toBeNull();
});

test("não mostra horários de uma consulta antiga após remover o serviço", async () => {
  let resolveTimes;
  const loadAvailableTimes = jest.fn(() => new Promise((resolve) => {
    resolveTimes = resolve;
  }));
  const { ref } = mountPopup({ loadAvailableTimes });

  await act(async () => {
    await ref.current.open({ employer, date: "2026-10-30" });
  });

  const serviceButton = document.querySelector(".swl-service");
  fireEvent.click(serviceButton);
  expect(loadAvailableTimes).toHaveBeenCalledTimes(1);
  fireEvent.click(serviceButton);

  await act(async () => {
    resolveTimes(["09:00"]);
  });

  expect(serviceButton.getAttribute("aria-pressed")).toBe("false");
  expect(document.querySelector(".swl-time")).toBeNull();
});

test("apresenta erro de disponibilidade sem oferecer horário inventado", async () => {
  const loadAvailableTimes = jest.fn().mockRejectedValue(new Error("Falha de rede"));
  const { ref } = mountPopup({ loadAvailableTimes });

  await act(async () => {
    await ref.current.open({
      employer,
      service,
      date: "2026-10-30",
    });
  });

  expect(document.querySelector("#swl-times").textContent)
    .toContain("Não foi possível consultar horários");
  expect(document.querySelector(".swl-time")).toBeNull();
});
