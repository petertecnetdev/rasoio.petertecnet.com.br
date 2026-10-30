import { renderHook } from "@testing-library/react";
import axios from "axios";
import useAppointment from "./useAppointment";

jest.mock("axios");

function useBookingUnderTest() {
  return useAppointment("https://api.example.test/api", 2, null, { id: 10 });
}

const renderPublicBooking = () => renderHook(useBookingUnderTest);

afterEach(() => jest.clearAllMocks());

test("retorna horários confirmados pela API para o dia civil solicitado", async () => {
  axios.post.mockResolvedValue({ data: { available_times: ["09:00", "10:30"] } });
  const { result } = renderPublicBooking();

  await expect(result.current.loadAvailableTimes("2026-10-30", { id: 7 }, 60))
    .resolves.toEqual(["09:00", "10:30"]);

  expect(axios.post).toHaveBeenCalledWith(
    "https://api.example.test/api/v1/apps/2/public-availability/times",
    { employer_id: 7, date: "2026-10-30", duration: 60 },
    expect.objectContaining({ headers: expect.objectContaining({ Accept: "application/json" }) })
  );
});

test("distingue agenda vazia de falha de rede", async () => {
  const { result } = renderPublicBooking();

  axios.post.mockResolvedValueOnce({ data: { available_times: [] } });
  await expect(result.current.loadAvailableTimes("2026-10-30", { id: 7 }, 30))
    .resolves.toEqual([]);

  axios.post.mockRejectedValueOnce(new Error("Network Error"));
  await expect(result.current.loadAvailableTimes("2026-10-30", { id: 7 }, 30))
    .rejects.toThrow("Não foi possível consultar horários");
});

test("não consulta disponibilidade sem profissional ou aplicação", async () => {
  const { result } = renderPublicBooking();
  await expect(result.current.loadAvailableTimes("2026-10-30", null, 30))
    .resolves.toEqual([]);
  expect(axios.post).not.toHaveBeenCalled();
});
