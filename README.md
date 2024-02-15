# Byte Buffer for JavaScript

by Katsuyuki Omuro

ByteBuffer is a JavaScript class that can be used to work with chunks of Uint8Array data.
If data is provided to you in the form of chunks, but you need to consume chunks from the
front that aren't necessarily of the same size, this class can help you do that efficiently.
It's meant to be used with `ReadableStream<Uint8Array>` and the chunks of data obtained from
its reader.

The advantage of using this class is in its efficiency; it's implemented so that unnecessary
copies or modifications to the chunks are not made as you pull data. You can efficiently
pull arbitrary lengths of bytes from the beginning of the buffer and continue adding to
the end of the buffer.

Additionally, you can:
* make slices of data from arbitrary offsets and of arbitrary lengths
* search for byte sequences, even those that span chunks

## Usage

```
npm install @h7/byte-buffer
```

### Creating a buffer

Construct it with no parameters to make an empty buffer. Pass an `Uint8Array` or
an array of `Uint8Array`s to initialize the buffer with data.

```javascript
import { ByteBuffer } from '@h7/byte-buffer';

const buffer1 = new ByteBuffer();
console.log(buffer1.length); // 0

const buffer2 = new ByteBuffer(new Uint8Array([65, 66, 67, 68]));
console.log(buffer2.length); // 4

const buffer3 = new ByteBuffer([
  new Uint8Array([65, 66, 67, 68]),
  new Uint8Array([69, 70, 71, 72]),
]);
console.log(buffer3.length); // 8
```

### Adding to the end of the buffer

Call `.append()` with one or more `Uint8Array`s to add to the end of the data.

```javascript
const buffer = new ByteBuffer(new Uint8Array([65, 66, 67, 68]));
buffer.append(new Uint8Array([100, 101, 102]));
console.log(buffer.length); // 7
buffer.append(
  new Uint8Array([200, 201, 202]),
  new Uint8Array([250, 251, 252]),
);
console.log(buffer.length); // 13
```

### Extracting bytes from the start of the buffer

Call `.pull()` with the number of bytes to extract.

```javascript
const buffer = new ByteBuffer(new Uint8Array([65, 66, 67, 68, 69, 70, 71]));
console.log(buffer.length); // 7

const bytes = buffer.pull(3);
console.log(bytes); // Uint8Array [65, 66, 67]

console.log(buffer.length); // 4
```

### Copying a slice from the buffer

Call `.slice()`, passing in 0-2 parameters. The parameters specify the portion
of the string to copy, and act similar to how they do in
[`String.prototype.slice`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice).
This function returns a new `Uint8Array` and does not modify the buffer.

```javascript
const buffer = new ByteBuffer(new Uint8Array([65, 66, 67, 68, 69, 70, 71]));
console.log(buffer.length); // 7

const bytes = buffer.slice(0, 3);
console.log(bytes); // Uint8Array [65, 66, 67]

// Unlike with .pull(), this does not modify the buffer
console.log(buffer.length); // 7
```

### Finding a byte sequence

Call `.indexOf()`, passing in 1 or 2 parameters. The parameters specify the byte
sequence to look for and optionally the position in the buffer to start the search.
They act similar to how they do in [`String.prototype.indexOf`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf).
This function returns an number (integer) representing the 0-based index at which the
byte sequence was found, or `-1` if it was not found.

```javascript
const buffer = new ByteBuffer(new Uint8Array([65, 66, 67, 65, 66, 67, 68]));

console.log(buffer.indexOf(new Uint8Array([67, 65]))); // 2
console.log(buffer.indexOf(new Uint8Array([100, 101]))); // -1

console.log(buffer.indexOf(new Uint8Array([66, 67]))); // 1
console.log(buffer.indexOf(new Uint8Array([66, 67]), 2)); // 4
console.log(buffer.indexOf(new Uint8Array([66, 67]), 5)); // -1
```

## License

[MIT](./LICENSE).
