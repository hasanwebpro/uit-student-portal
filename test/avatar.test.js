import test from 'node:test';
import assert from 'node:assert/strict';
import { isImage } from '../server/controllers/profile.controller.js';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

test('avatar upload trusts file bytes, not the Content-Type header', () => {
  assert.equal(isImage(jpeg, 'image/jpeg'), true);
  assert.equal(isImage(png, 'image/png'), true);
  assert.equal(isImage(jpeg, 'image/png'), false, 'JPEG bytes labelled PNG');
  assert.equal(isImage(Buffer.from('MZ\x90\x00 not an image'), 'image/jpeg'), false, 'executable renamed to .jpg');
  assert.equal(isImage(Buffer.from('<svg onload=alert(1)>'), 'image/svg+xml'), false, 'SVG (script-capable) is never accepted');
  assert.equal(isImage(Buffer.alloc(0), 'image/jpeg'), false);
});
