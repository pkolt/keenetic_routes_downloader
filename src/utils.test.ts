import { test } from 'node:test';
import assert from 'node:assert';
import { isIp, getRoutesFromConfig, convertRoutesToText, type Route, compareIPAddresses } from './utils.js';

test('good ip', () => {
  const result = isIp('192.168.1.1');
  assert.ok(result);
});

test('parse ip', () => {
  const result = getRoutesFromConfig('ip route 192.100.50.1 Network0');
  assert.deepEqual(result, [{ route: '192.100.50.1', mask: '255.255.255.255', gateway: '0.0.0.0' } satisfies Route]);
});

test('parse network + mask', () => {
  const result = getRoutesFromConfig('ip route 192.100.50.0 255.255.255.0 Network0');
  assert.deepEqual(result, [{ route: '192.100.50.0', mask: '255.255.255.0', gateway: '0.0.0.0' } satisfies Route]);
});

test('parse ip + gateway', () => {
  const result = getRoutesFromConfig('ip route 192.100.50.25 192.100.50.1 Guest');
  assert.deepEqual(result, [
    { route: '192.100.50.25', mask: '255.255.255.255', gateway: '192.100.50.1' } satisfies Route,
  ]);
});

test('parse network + mask + gateway', () => {
  const result = getRoutesFromConfig('ip route 192.100.50.0 255.255.255.0 192.100.50.1 Guest');
  assert.deepEqual(result, [{ route: '192.100.50.0', mask: '255.255.255.0', gateway: '192.100.50.1' } satisfies Route]);
});

test('ip/subnetwork address', () => {
  const result = convertRoutesToText([{ route: '127.0.0.1', mask: '255.255.255.255', gateway: '0.0.0.0' }]);
  assert(result, 'route ADD 127.0.0.1 MASK 255.255.255.0 0.0.0.0');
});

test('sort ip addresses', () => {
  const ipAddresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '192.168.0.1', '8.8.8.8'];
  const result = ipAddresses.sort((a, b) => compareIPAddresses(a, b));
  assert.deepEqual(result, ['8.8.8.8', '10.0.0.1', '172.16.0.1', '192.168.0.1', '192.168.1.1']);
});
