export interface Route {
  route: string;
  mask: string;
  gateway: string;
}

export function isIp(value: string): boolean {
  return value.match(/^(?:\d{1,3}\.){3}\d{1,3}$/) !== null;
}

const REGEXP_IP = /^ip route (?<ip>(?:\d{1,3}\.){3}\d{1,3}) \w+ auto$/gm;
const REGEXP_NETWORK_MASK =
  /^ip route (?<network>(?:\d{1,3}\.){3}\d{1,3}) (?<mask>(?:\d{1,3}\.){3}\d{1,3}) \w+ auto$/gm;
const REGEXP_IP_GATEWAY = /^ip route (?<ip>(?:\d{1,3}\.){3}\d{1,3}) (?<gateway>(?:\d{1,3}\.){3}\d{1,3}) \w+$/gm;
const REGEXP_NETWORK_MASK_GATEWAY =
  /^ip route (?<network>(?:\d{1,3}\.){3}\d{1,3}) (?<mask>(?:\d{1,3}\.){3}\d{1,3}) (?<gateway>(?:\d{1,3}\.){3}\d{1,3}) \w+$/gm;

const DEFAULT_MASK = '255.255.255.255';
const DEFAULT_GATEWAY = '0.0.0.0';

export function getRoutesFromConfig(configText: string): Route[] {
  const routes: Route[] = [];

  for (const match of configText.matchAll(REGEXP_IP)) {
    if (match.groups) {
      routes.push({
        route: match.groups.ip,
        mask: DEFAULT_MASK,
        gateway: DEFAULT_GATEWAY,
      });
    }
  }

  for (const match of configText.matchAll(REGEXP_NETWORK_MASK)) {
    if (match.groups) {
      routes.push({
        route: match.groups.network,
        mask: match.groups.mask,
        gateway: DEFAULT_GATEWAY,
      });
    }
  }

  for (const match of configText.matchAll(REGEXP_IP_GATEWAY)) {
    if (match.groups) {
      routes.push({
        route: match.groups.ip,
        mask: DEFAULT_MASK,
        gateway: match.groups.gateway,
      });
    }
  }

  for (const match of configText.matchAll(REGEXP_NETWORK_MASK_GATEWAY)) {
    if (match.groups) {
      routes.push({
        route: match.groups.network,
        mask: match.groups.mask,
        gateway: match.groups.gateway,
      });
    }
  }

  return routes;
}

export function convertRoutesToText(routes: Route[]): string {
  const lines: string[] = [];
  for (const { route, mask, gateway } of routes) {
    const line = `route ADD ${route} MASK ${mask} ${gateway}`;
    lines.push(line);
  }
  return lines.join('\n');
}

export function compareIPAddresses(a: string, b: string): number {
  const numA = a.split('.').map(Number);
  const numB = b.split('.').map(Number);

  for (let i = 0; i < 4; i++) {
    if (numA[i] !== numB[i]) {
      return numA[i] - numB[i];
    }
  }
  return 0;
}

export function sortRoutes(routes: Route[]): Route[] {
  return routes.toSorted((a, b) => compareIPAddresses(a.route, b.route));
}
