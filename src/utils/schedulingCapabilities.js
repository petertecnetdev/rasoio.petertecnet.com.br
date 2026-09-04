const SCHEDULING_CAPABILITY_KEYS = new Set([
  "scheduling",
  "schedule",
  "appointments",
  "appointment",
  "booking",
  "bookings",
  "appointment_scheduling",
  "schedulable_services",
]);

const normalizeCapabilityKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const collectCapabilityKeys = (entity) => {
  const source = entity?.capabilities ?? entity?.features ?? entity?.application_capabilities;
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (typeof item === "string") return normalizeCapabilityKey(item);
        return normalizeCapabilityKey(item?.slug ?? item?.key ?? item?.code ?? item?.name);
      })
      .filter(Boolean);
  }

  if (typeof source === "object") {
    return Object.entries(source)
      .filter(([, enabled]) => enabled === true || enabled === 1 || enabled === "1")
      .map(([key]) => normalizeCapabilityKey(key));
  }

  return [normalizeCapabilityKey(source)].filter(Boolean);
};

export const schedulingCapabilityDecision = (entity) => {
  const directFlags = [
    entity?.can_schedule,
    entity?.scheduling_enabled,
    entity?.appointments_enabled,
    entity?.booking_enabled,
  ];

  const direct = directFlags.find((value) => typeof value === "boolean");
  if (typeof direct === "boolean") return direct;

  const capabilityKeys = collectCapabilityKeys(entity);
  if (!capabilityKeys.length) return null;

  return capabilityKeys.some((key) => SCHEDULING_CAPABILITY_KEYS.has(key));
};

const establishmentIdOf = (entity) =>
  entity?.establishment_id ??
  entity?.establishmentId ??
  entity?.entity_id ??
  entity?.entityId ??
  entity?.establishment?.id ??
  null;

const matchesEstablishment = (entity, establishmentId) => {
  if (establishmentId == null) return false;
  const entityEstablishmentId = establishmentIdOf(entity);
  return entityEstablishmentId != null && String(entityEstablishmentId) === String(establishmentId);
};

export const isSchedulableEstablishment = ({ establishment, employers = [], services = [] }) => {
  const establishmentId = establishment?.id ?? null;
  if (establishmentId == null) return false;

  const decision = schedulingCapabilityDecision(establishment);
  if (decision === false) return false;

  const hasEmployer = employers.some((employer) => matchesEstablishment(employer, establishmentId));
  const hasService = services.some((service) => matchesEstablishment(service, establishmentId));

  // Even when the capability is explicitly enabled, the flow only becomes actionable
  // when the operational prerequisites exist. When the API does not expose capability
  // metadata yet, these prerequisites provide a backwards-compatible fallback.
  return hasEmployer && hasService;
};

export const canScheduleItem = ({ item, establishment, employers = [], services = [] }) => {
  const itemDecision = schedulingCapabilityDecision(item);
  if (itemDecision === false) return false;

  const normalizedType = normalizeCapabilityKey(item?.item_type ?? item?.type);
  if (normalizedType === "product" || item?.is_product === true || item?.isProduct === true) return false;

  return isSchedulableEstablishment({ establishment, employers, services });
};

export { collectCapabilityKeys, establishmentIdOf, matchesEstablishment };
