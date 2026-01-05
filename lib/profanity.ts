import Filter from "bad-words";

const filter = new Filter();

export function containsProfanity(value: string) {
  return filter.isProfane(value);
}

export function sanitizeText(value: string) {
  return filter.clean(value);
}
