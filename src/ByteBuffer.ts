// This class acts as a virtual "Buffer" of bytes
//
// It's used to manage bytes that are provided to us in the form of chunks.
// There will be utilities to:
// - keep track of the "current" position
// - add another chunk to the end
// - search for certain byte sequences
// - pull X bytes out of the front and receive them in the form of
//   the chunks that are included.

type BufferBytePos = {
  chunkNumber: number,
  headPos: number,
};

export default class ByteBuffer {

  constructor(chunks?: Uint8Array | Uint8Array[]) {
    this.chunks = [];
    if (chunks != null) {
      if (Array.isArray(chunks)) {
        this.chunks.push(...chunks);
      } else {
        this.chunks.push(chunks);
      }
    }
    this.head = 0;
  }

  append(...chunks: Uint8Array[]) {
    this.chunks.push(...chunks);
  }

  slice(start?: number, end?: number) {
    if (start === undefined) {
      start = 0;
    }
    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (start < 0) {
      start = Math.max(start + this.length, 0);
    }
    if (end < 0) {
      end = Math.max(end + this.length, 0);
    }

    const pos: BufferBytePos = {
      chunkNumber: 0,
      headPos: this.head,
    };

    // Advance the current chunk number/head position by "start"
    this._seek(pos, start);

    const result = new Uint8Array(end - start);

    // Advance the current chunk number/head position by "end - start",
    // copying out slices in to the resulting array.
    this._seek(pos, end - start, result);

    return result;
  }

  pull(x: number) {
    if (x < 0) {
      throw new Error('ByteBuffer#pull(): length cannot be less than 0.');
    }
    if (x > this.length) {
      throw new Error('ByteBuffer#pull(): length cannot be greater than current length of buffer.');
    }

    const pos: BufferBytePos = {
      chunkNumber: 0,
      headPos: this.head,
    };

    const result = new Uint8Array(x);

    // Advance the current chunk number/head position by "x",
    // copying out slices in to the resulting array.
    this._seek(pos, x, result);

    // After returning, we shift out the chunks we have moved passed
    // and update the head position
    while (pos.chunkNumber > 0) {
      this.chunks.shift();
      pos.chunkNumber = pos.chunkNumber - 1;
    }
    this.head = pos.headPos;

    return result;
  }

  _seek(pos: BufferBytePos, numBytes: number, resultArray?: Uint8Array) {

    let offset = 0;
    while (numBytes > 0) {
      const currentChunk = this.chunks[pos.chunkNumber];
      let remainingInCurrentChunk = currentChunk.length - pos.headPos;
      if (numBytes < remainingInCurrentChunk) {
        if (resultArray != null) {
          resultArray.set(currentChunk.slice(pos.headPos, pos.headPos + numBytes), offset);
        }
        pos.headPos += numBytes;
        break;
      }

      numBytes = numBytes - remainingInCurrentChunk;
      if (resultArray != null) {
        resultArray.set(currentChunk.slice(pos.headPos), offset);
        offset += remainingInCurrentChunk;
      }

      pos.chunkNumber = pos.chunkNumber + 1;
      pos.headPos = 0;
    }

  }

  indexOf(bytes: Uint8Array, position: number = 0): number {

    if (bytes.length === 0) {
      return Math.min(position, this.length);
    }

    if (bytes.length > this.length) {
      return -1;
    }

    // Strategy is to find the first byte and then
    // compare byte-by-byte
    const firstByte = bytes.at(0)!;

    const pos: BufferBytePos = {
      chunkNumber: 0,
      headPos: this.head,
    };

    // Seek to position
    if (position > 0) {
      this._seek(pos, position);
    }

    let searchChunkNumber = pos.chunkNumber;
    let searchPositionInChunk = pos.headPos;

    while (true) {
      const currentChunk = this.chunks[searchChunkNumber];

      const posFoundInChunk = currentChunk.indexOf(firstByte, searchPositionInChunk);
      if (posFoundInChunk === -1) {
        // not found in chunk, update pointers to try next chunk
        searchChunkNumber++;
        searchPositionInChunk = 0;
        if (searchChunkNumber < this.chunks.length) {
          continue;
        }
        // Wasn't found!
        return -1;
      }

      let match = true;
      if (bytes.length > 1) {
        // Compare byte by byte
        let compareChunkNumber = searchChunkNumber;
        let posByteInCompareChunk = posFoundInChunk;
        for (let i = 0; i < bytes.length; i++) {

          // Before checking for this.chunks[compareChunkNumber].at(posByteInCompareChunk),
          // we will check to make sure that compareChunkNumber and posByteInCompareChunk are in range.
          while (posByteInCompareChunk >= this.chunks[compareChunkNumber].length) {
            posByteInCompareChunk -= this.chunks[compareChunkNumber].length;
            compareChunkNumber = compareChunkNumber + 1;
            if (compareChunkNumber >= this.chunks.length) {
              match = false;
              break;
            }
          }
          if (!match) {
            break;
          }

          if (bytes.at(i) !== this.chunks[compareChunkNumber].at(posByteInCompareChunk)) {
            match = false;
            break;
          }
          posByteInCompareChunk = posByteInCompareChunk + 1;
        }
      }

      if (!match) {
        // This first byte didn't get the remainder of the bytes.
        // Try again with more of the chunk
        searchPositionInChunk = posFoundInChunk + 1;
        continue;
      }

      // Found!
      // Count up the number of bytes in each chunk leading up to this chunk
      // Subtract head at the beginning because those are consumed
      let total = -this.head;
      for (let i = 0; i < searchChunkNumber; i++) {
        total += this.chunks[i].length;
      }
      // Add offset
      total += posFoundInChunk;

      return total;
    }
  }

  get length() {
    return this.chunks.reduce((a, c) => { return a + c.length }, 0) - this.head;
  }

  chunks: Uint8Array[];
  head: number;

}
