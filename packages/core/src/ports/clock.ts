// Kell — ainus koht, kust core aega küsib. Testides antakse ette fikseeritud kell.
export interface Clock {
  now(): Date;
}