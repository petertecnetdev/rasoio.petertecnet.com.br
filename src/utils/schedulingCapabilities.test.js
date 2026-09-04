import {
  canScheduleItem,
  isSchedulableEstablishment,
  schedulingCapabilityDecision,
} from "./schedulingCapabilities";

describe("schedulingCapabilities", () => {
  const establishment = { id: 10 };
  const employers = [{ id: 1, establishment_id: 10 }];
  const services = [{ id: 2, establishment_id: 10, type: "service" }];

  test("honors an explicit disabled scheduling flag", () => {
    expect(
      isSchedulableEstablishment({
        establishment: { ...establishment, scheduling_enabled: false },
        employers,
        services,
      })
    ).toBe(false);
  });

  test("accepts capability metadata when operational prerequisites exist", () => {
    expect(
      isSchedulableEstablishment({
        establishment: { ...establishment, capabilities: ["catalog", "appointments"] },
        employers,
        services,
      })
    ).toBe(true);
  });

  test("keeps backwards compatibility when capability metadata is absent", () => {
    expect(isSchedulableEstablishment({ establishment, employers, services })).toBe(true);
  });

  test("does not expose scheduling without a professional and a service", () => {
    expect(
      isSchedulableEstablishment({
        establishment: { ...establishment, can_schedule: true },
        employers: [],
        services,
      })
    ).toBe(false);
  });

  test("never schedules products", () => {
    expect(
      canScheduleItem({
        item: { id: 3, establishment_id: 10, type: "product" },
        establishment,
        employers,
        services,
      })
    ).toBe(false);
  });

  test("reads object capability maps", () => {
    expect(schedulingCapabilityDecision({ capabilities: { catalog: true, booking: true } })).toBe(true);
    expect(schedulingCapabilityDecision({ capabilities: { catalog: true, booking: false } })).toBe(false);
  });
});
