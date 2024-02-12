// noinspection DuplicatedCode

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import ByteBuffer from "../../../src/ByteBuffer.js";
import { areUint8ArraysEqual } from '../utils.js';

describe( 'ByteBuffer', () => {
  describe( 'Constructor', () => {
    it('can construct with no data', () => {
      const byteBuffer = new ByteBuffer();
      assert.strictEqual(byteBuffer.length, 0);
    });

    it('can construct with one chunk', () => {
      const chunk = new Uint8Array([65, 66, 67, 68]);
      const byteBuffer = new ByteBuffer(chunk);
      assert.strictEqual(byteBuffer.length, 4);
    });

    it('can construct with multiple chunks', () => {
      const chunk1 = new Uint8Array([65, 66, 67, 68]);
      const chunk2 = new Uint8Array([69, 70, 71, 72, 73]);
      const byteBuffer = new ByteBuffer([chunk1, chunk2]);
      assert.strictEqual(byteBuffer.length, 9);
    });

  });

  describe('#append', () => {
    let byteBuffer: ByteBuffer;
    beforeEach(() => {
      const chunk = new Uint8Array([65, 66, 67, 68]);
      byteBuffer = new ByteBuffer(chunk);
      assert.strictEqual(byteBuffer.length, 4);
    });

    it('can push additional segment to back of buffer', () => {
      const chunk = new Uint8Array([100, 101, 102, 103, 104, 105]);
      byteBuffer.append(chunk);
      assert.strictEqual(byteBuffer.length, 10);
    });
    it('can push multiple additional segments to back of buffer', () => {
      const chunk1 = new Uint8Array([100, 101, 102, 103, 104, 105]);
      const chunk2 = new Uint8Array([106, 107, 108, 109, 110, 111]);
      byteBuffer.append(chunk1, chunk2);
      assert.strictEqual(byteBuffer.length, 16);
    });
  });

  describe('#slice', () => {
    let byteBuffer: ByteBuffer;
    beforeEach(() => {
      const chunk1 = new Uint8Array([65, 66, 67, 68]);
      const chunk2 = new Uint8Array([100, 101, 102, 103, 104, 105]);
      const chunk3 = new Uint8Array([106, 107, 108, 109, 110, 111]);
      byteBuffer = new ByteBuffer([chunk1, chunk2, chunk3]);
      assert.strictEqual(byteBuffer.length, 16);
    });

    it('slice with one parameter gets a copy of all of the chunks starting at that position', () => {

      const slice = byteBuffer.slice(1);
      assert.ok(areUint8ArraysEqual(slice, new Uint8Array(
        [66, 67, 68, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]
      )));

      assert.strictEqual(byteBuffer.length, 16);

    });

    it('slice with one parameter can be negative, and it starts at value + length', () => {

      const slice = byteBuffer.slice(-7);
      assert.ok(areUint8ArraysEqual(slice, new Uint8Array(
        [105, 106, 107, 108, 109, 110, 111]
      )));

      assert.strictEqual(byteBuffer.length, 16);

    });

    it('slice with one parameter can be negative, but if less than -length it is treated like 0', () => {

      const slice = byteBuffer.slice(-20);
      assert.ok(areUint8ArraysEqual(slice, new Uint8Array(
        [65, 66, 67, 68, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]
      )));

      assert.strictEqual(byteBuffer.length, 16);

    });

    it('slice with two parameter gets a copy of all of the chunks starting at and ending before those positions', () => {

      const slice = byteBuffer.slice(1, 15);
      assert.ok(areUint8ArraysEqual(slice, new Uint8Array(
        [66, 67, 68, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
      )));

      assert.strictEqual(byteBuffer.length, 16);

    });

    it('allows second parameter to be negative', () => {

      const slice = byteBuffer.slice(1, -1);
      assert.ok(areUint8ArraysEqual(slice, new Uint8Array(
        [66, 67, 68, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
      )));

      assert.strictEqual(byteBuffer.length, 16);

    });

    it('slice with no parameters gets a copy of all of the chunks starting at head', () => {

      const slice = byteBuffer.slice();
      assert.ok(areUint8ArraysEqual(slice, new Uint8Array(
        [65, 66, 67, 68, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111]
      )));

      assert.strictEqual(byteBuffer.length, 16);

    });

  });

  describe('#pull', () => {
    let byteBuffer: ByteBuffer;
    beforeEach(() => {
      const chunk1 = new Uint8Array([65, 66, 67, 68]);
      const chunk2 = new Uint8Array([100, 101, 102, 103, 104, 105]);
      const chunk3 = new Uint8Array([106, 107, 108, 109, 110, 111]);
      byteBuffer = new ByteBuffer([chunk1, chunk2, chunk3]);
      assert.strictEqual(byteBuffer.length, 16);
    });

    it('throws if attempt to call negative length value', () => {
      assert.throws(() => {
        byteBuffer.pull(-1);
      }, err => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, 'ByteBuffer#pull(): length cannot be less than 0.');
        return true;
      });
    });

    it('throws if attempt to call with value too long', () => {
      assert.throws(() => {
        byteBuffer.pull(20);
      }, err => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, 'ByteBuffer#pull(): length cannot be greater than current length of buffer.');
        return true;
      });
    });

    it('returns empty array if attempt to call with 0 value', () => {
      const pulled = byteBuffer.pull(0);
      assert.strictEqual(pulled.length, 0);

      assert.strictEqual(byteBuffer.length, 16);
    });

    it('allows caller to get first X bytes, where X would result in just one chunk', () => {

      const pulled = byteBuffer.pull(3);
      assert.ok(areUint8ArraysEqual(pulled, new Uint8Array([65, 66, 67])));

      assert.strictEqual(byteBuffer.length, 13);

    });

    it('allows caller to get first X bytes, where X is equal to the length of first chunk', () => {

      const pulled = byteBuffer.pull(4);
      assert.ok(areUint8ArraysEqual(pulled, new Uint8Array(
        [65, 66, 67, 68]
      )));

      assert.strictEqual(byteBuffer.length, 12);

    });

    it('allows caller to get first X bytes, where X is greater than the length of the first chunk', () => {

      const pulled = byteBuffer.pull(6);
      assert.ok(areUint8ArraysEqual(pulled, new Uint8Array(
        [65, 66, 67, 68, 100, 101]
      )));

      assert.strictEqual(byteBuffer.length, 10);

    });

    it('allows caller to get first X bytes, where X is greater than the length of the two chunks', () => {

      const pulled = byteBuffer.pull(13);
      assert.ok(areUint8ArraysEqual(pulled, new Uint8Array(
        [65, 66, 67, 68, 100, 101, 102, 103, 104, 105, 106, 107, 108]
      )));

      assert.strictEqual(byteBuffer.length, 3);

    });

    it('allows caller to call successively', () => {

      const pulled1 = byteBuffer.pull(3);
      assert.ok(areUint8ArraysEqual(pulled1, new Uint8Array(
        [65, 66, 67]
      )));

      const pulled2 = byteBuffer.pull(3);
      assert.ok(areUint8ArraysEqual(pulled2, new Uint8Array(
        [68, 100, 101]
      )));

      const pulled3 = byteBuffer.pull(3);
      assert.ok(areUint8ArraysEqual(pulled3, new Uint8Array(
        [102, 103, 104]
      )));

      assert.strictEqual(byteBuffer.length, 7);

    });
  });

  describe('#indexOf', () => {
    let byteBuffer: ByteBuffer;
    beforeEach(() => {
      const chunk1 = new Uint8Array([65, 66, 67, 68]);
      const chunk2 = new Uint8Array([100, 65, 66, 67, 68, 105]);
      const chunk3 = new Uint8Array([106, 65, 66, 67, 68, 111]);
      byteBuffer = new ByteBuffer([chunk1, chunk2, chunk3]);
      assert.strictEqual(byteBuffer.length, 16);
    });

    it('when passed empty search array, returns pos or length of array', () => {

      const pos1 = byteBuffer.indexOf(new Uint8Array([]));
      assert.strictEqual(pos1, 0);

      const pos2 = byteBuffer.indexOf(new Uint8Array([]), 5);
      assert.strictEqual(pos2, 5);

      const pos3 = byteBuffer.indexOf(new Uint8Array([]), 10);
      assert.strictEqual(pos3, 10);

      const pos4 = byteBuffer.indexOf(new Uint8Array([]), 15);
      assert.strictEqual(pos4, 15);

      const pos5 = byteBuffer.indexOf(new Uint8Array([]), 20);
      assert.strictEqual(pos5, 16);

    });

    it('when passed a search sequence that is longer than the buffer, returns -1', () => {
      const pos = byteBuffer.indexOf(new Uint8Array(20));
      assert.strictEqual(pos, -1);
    });

    it('when passed a search sequence that is longer than the remainder of partially consumed buffer, returns -1', () => {
      byteBuffer.pull(15);
      const pos = byteBuffer.indexOf(new Uint8Array([65, 66, 67, 68]));
      assert.strictEqual(pos, -1);
    });

    it('returns index of sequence found in first segment - one byte', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([68])), 3);
      byteBuffer.pull(2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([68])), 1);

    });

    it('returns index of sequence found in next segment - one byte', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([105])), 9);
      byteBuffer.pull(3);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([105])), 6);
      byteBuffer.pull(3);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([105])), 3);

    });

    it('returns index of sequence into successive segments after consumption - one byte', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67])), 2);
      byteBuffer.pull(2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67])), 0);
      byteBuffer.pull(2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67])), 3);

    });

    it('returns next index of sequence after passed position', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67])), 2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67]), 2), 2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67]), 4), 7);

    });

    it('returns index of sequence found in first segment - multiple bytes', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68])), 2);
      byteBuffer.pull(2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68])), 0);

    });

    it('returns index of sequence found in next segment - multiple bytes', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([68, 105])), 8);
      byteBuffer.pull(3);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([68, 105])), 5);
      byteBuffer.pull(3);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([68, 105])), 2);

    });

    it('returns index of sequence into successive segments after consumption - multiple bytes', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68])), 2);
      byteBuffer.pull(2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68])), 0);
      byteBuffer.pull(2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68])), 3);

    });

    it('returns next index of sequence after passed position - multiple bytes', () => {

      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68])), 2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68]), 2), 2);
      assert.strictEqual(byteBuffer.indexOf(new Uint8Array([67, 68]), 4), 7);

    });

    it('returns 0 if the two values are the same', () => {

      const value = new Uint8Array(
        [65, 66, 67, 68, 100, 65, 66, 67, 68, 105, 106, 65, 66, 67, 68, 111]);

      assert.strictEqual(byteBuffer.indexOf(value), 0);

    });

  });

});
