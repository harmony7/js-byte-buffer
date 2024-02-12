# Byte Buffer for JavaScript

ByteBuffer is a JavaScript class that can be used to work with chunks of Uint8Array data.
If data is provided to you in the form of chunks, but you need to consume chunks from the
front that aren't necessarily of the same size, this class can help you do that efficiently.
It's meant to be used with ReadableStream<Uint8Array> and the chunks of data obtained from its
reader.

The advantage of using this class is in its efficiency; it's implemented so that unnecessary
copies or modifications to the chunks are not made as you pull data. You can efficiently
pull arbitrary lengths of bytes from the beginning of the buffer and continue adding to
the end of the buffer.

Additionally, you can:
* make slices of data from arbitrary offsets and of arbitrary lengths
* search for byte sequences, even those that span chunks

## License

[MIT](./LICENSE).
