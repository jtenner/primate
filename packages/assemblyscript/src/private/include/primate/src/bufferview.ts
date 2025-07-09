const SIZE_8 = i32(1);
const SIZE_16 = i32(2);
const SIZE_32 = i32(4);
const SIZE_64 = i32(8);

export default class BufferView {
  private view: DataView;
  private _offset: i32;
  private _byteLength: i32;
  private _position: i32 = i32(0);
  public littleEndian = true;

  constructor(
    private _buffer: ArrayBuffer,
    offset: i32 = i32(0),
    byteLength: i32 = _buffer.byteLength - offset,
  ) {
    assert(offset >= 0, "BufferView offset must be positive.");
    assert(byteLength >= 0, "BufferView byteLength must be positive.");

    this._offset = offset;
    this._byteLength = byteLength;
    this.view = new DataView(_buffer, offset, byteLength);
  }

  private check_overflow(length: i32): void {
    assert(this.position + length <= this.byteLength, "Buffer overflow.");
  }

  get buffer(): ArrayBuffer {
    return this._buffer;
  }

  get offset(): i32 {
    return this._offset;
  }

  get byteLength(): i32 {
    return this._byteLength;
  }

  get position(): i32 {
    return this._position;
  }

  set position(position: i32) {
    assert(
      position >= 0 && position < this.byteLength,
      "BufferView position out of bounds.",
    );

    this.position = position;
  }

  subarray(offset: i32, byteLength: i32): BufferView {
    assert(offset >= i32(0), "BufferView offset must be positive.");
    assert(offset + byteLength <= this.byteLength, "Buffer overflow.");

    return new BufferView(this.buffer, this.offset + offset, byteLength);
  }

  readBytes(length: i32): Uint8Array {
    this.check_overflow(length);

    const value = Uint8Array.wrap(
      this.buffer,
      this.offset + this.position,
      length,
    );
    const output = new Uint8Array(length);
    output.set(value);
    this.position += length;
    return value;
  }

  read(length: i32): string {
    this.check_overflow(length);
    const value = String.UTF8.decodeUnsafe(
      changetype<usize>(this.buffer) + this._offset,
      length
    );
    this.position += length;
    return value;
  }

  readI8(): i8 {
    this.check_overflow(SIZE_8);

    return this.view.getInt8(this.position++);
  }

  readU8(): u8 {
    this.check_overflow(SIZE_8);

    return this.view.getUint8(this.position++);
  }

  readI16(littleEndian = this.littleEndian): i16 {
    this.check_overflow(SIZE_16);

    const value = this.view.getInt16(this.position, littleEndian);
    this.position += SIZE_16;
    return value;
  }

  readU16(littleEndian = this.littleEndian): u16 {
    this.check_overflow(SIZE_16);

    const value = this.view.getUint16(this.position, littleEndian);
    this.position += SIZE_16;
    return value;
  }

  readI32(littleEndian = this.littleEndian): i32 {
    this.check_overflow(SIZE_32);

    const value = this.view.getInt32(this.position, littleEndian);
    this.position += SIZE_32;
    return value;
  }

  readU32(littleEndian = this.littleEndian): u32 {
    this.check_overflow(SIZE_32);

    const value = this.view.getUint32(this.position, littleEndian);
    this.position += SIZE_32;
    return value;
  }

  readI64(littleEndian = this.littleEndian): i64 {
    this.check_overflow(SIZE_64);

    const value = this.view.getInt64(this.position, littleEndian);
    this.position += SIZE_64;
    return value;
  }

  readU64(littleEndian = this.littleEndian): u64 {
    this.check_overflow(SIZE_64);

    const value = this.view.getUint64(this.position, littleEndian);
    this.position += SIZE_64;
    return value;
  }

  readF32(littleEndian = this.littleEndian): f32 {
    this.check_overflow(SIZE_32);

    const value = this.view.getFloat32(this.position, littleEndian);
    this.position += SIZE_32;
    return value;
  }

  readF64(littleEndian = this.littleEndian): f64 {
    this.check_overflow(SIZE_64);

    const value = this.view.getFloat64(this.position, littleEndian);
    this.position += SIZE_64;
    return value;
  }

  write(value: string): BufferView {
    const size = String.UTF8.byteLength(value);
    this.check_overflow(size);
    
    String.UTF8.encodeUnsafe(
      changetype<usize>(value),
      value.length,
      changetype<usize>(this.buffer) + usize(this._offset),
    );

    this.position += size;

    return this;
  }

  writeBytes(value: Uint8Array): BufferView {
    this.check_overflow(value.length);

    const dest = changetype<usize>(this.buffer) + usize(this.offset);
    const src = changetype<usize>(value.buffer) + usize(value.byteOffset);
    const byteLength = usize(value.byteLength);
    memory.copy(dest, src, byteLength);

    this.position += value.length;
    return this;
  }

  writeI8(value: i32): BufferView {
    this.check_overflow(SIZE_8);

    this.view.setInt8(this.position++, value);
    return this;
  }

  writeU8(value: i32): BufferView {
    this.check_overflow(SIZE_8);

    this.view.setUint8(this.position++, value);
    return this;
  }

  writeI16(value: i32, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_16);

    this.view.setInt16(this.position, value, littleEndian);
    this.position += SIZE_16;
    return this;
  }

  writeU16(value: i32, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_16);

    this.view.setUint16(this.position, value, littleEndian);
    this.position += SIZE_16;
    return this;
  }

  writeI32(value: i32, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_32);

    this.view.setInt32(this.position, value, littleEndian);
    this.position += SIZE_32;
    return this;
  }

  writeU32(value: i32, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_32);

    this.view.setUint32(this.position, value, littleEndian);
    this.position += SIZE_32;
    return this;
  }

  writeI64(value: i64, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_64);

    this.view.setInt64(this.position, value, littleEndian);
    this.position += SIZE_64;
    return this;
  }

  writeU64(value: u64, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_64);

    this.view.setUint64(this.position, value, littleEndian);
    this.position += SIZE_64;
    return this;
  }

  writeF32(value: f32, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_32);

    this.view.setFloat32(this.position, value, littleEndian);
    this.position += SIZE_32;
    return this;
  }

  writeF64(value: f64, littleEndian = this.littleEndian): BufferView {
    this.check_overflow(SIZE_64);

    this.view.setFloat64(this.position, value, littleEndian);
    this.position += SIZE_64;
    return this;
  }

  toBytes(): Uint8Array {
    const size = this._byteLength;
    const bytes = new Uint8Array(size);
    const src = changetype<usize>(this._buffer);
    const dest = changetype<usize>(bytes.buffer);

    memory.copy(dest, src, usize(size));
    return bytes;
  }

  toString(): string {
    return String.UTF8.decodeUnsafe(
      changetype<usize>(this._buffer),
      usize(this._byteLength),
    );
  }
}