# Chapter 2: Data Types

In the previous chapter, we learned that variables are like labelled boxes in a massive warehouse. But there is a glaring problem we ignored: how does the warehouse manager know how big the box needs to be?

If you try to store an entire encyclopedia in a shoebox, it's going to spill over. If you reserve an entire shipping container just to store a single sticky note, you are wasting valuable space.

Furthermore, if the CPU looks at a string of binary like `01000001`, how does it know if that means the number `65` or the letter `A`? Without context, memory is just a meaningless stream of electricity.

:::definition
A data type is a blueprint. It tells the compiler exactly how much memory to allocate for a variable, and how to decode the binary data stored there.
:::

## The Shipping Port

:::mental-model
Differently Sized Shipping Containers
Think of your computer's memory like a massive global shipping port. When a client says "store this cargo," you must decide on the container size.
A `u8` is a tiny parcel bag. 
A `u32` is a standard pallet.
A `u64` is a massive, 40-foot steel shipping container.
:::

:::story
Imagine you manage this port. Someone hands you the number `250`. You know it's a small number, so you place it in a small parcel bag (a `u8` container, which holds up to 255). 

A minute later, someone asks you to add `10` to that number. You try to cram `260` into a bag that only fits `255`. The bag rips wide open. The data spills everywhere. In Rust, this is called an **Integer Overflow**, and it causes the program to panic and crash immediately to protect itself from corrupted data.
:::

## How the Machine Sees It

The CPU doesn't understand abstract concepts like "Strings" or "Booleans". It only understands how many bytes to grab and what circuitry to run them through.

:::cpu
Step 1: The CPU receives an instruction to create a new variable of type `u16`.
Step 2: The compiler has already done the math: `u16` means "unsigned 16-bit integer", which is exactly 2 bytes.
Step 3: The CPU allocates exactly 2 bytes of continuous space on the Stack.
Step 4: When reading the data later, the CPU uses the `u16` blueprint to decode the 16 bits back into a human-readable number (between 0 and 65,535).
:::

:::memory
Address: `0x7ffee943a120`
Name: `port_number`
Size: `2 Bytes` (16 bits)
Value: `53`
:::

## Writing Your First Types

In Rust, you can explicitly annotate a variable with its data type using a colon `:`. 

```rust
let port: u16 = 53;
```

Let's break down the types you will use every single day:

**Integers (Whole Numbers)**
- `u8`, `u16`, `u32`, `u64`: Unsigned integers (Positive numbers only. 'u' stands for unsigned).
- `i8`, `i16`, `i32`, `i64`: Signed integers (Can be negative or positive. 'i' stands for integer).

**Booleans**
- `bool`: Only two possible values: `true` or `false`. Takes up 1 byte.

**Floats (Decimals)**
- `f32`, `f64`: Numbers with decimal points, like `3.14`.

## How We Use This in Reality

In systems programming, choosing the correct size isn't just a matter of optimization; it is a matter of strict protocol compliance.

:::kinetic
In the Kinetic DNS project, we are constantly dealing with network protocols that demand exact bit sizes.

When parsing an IPv4 address, each of the four blocks (like `192.168.1.1`) is stored as a `u8` because an IP block can never exceed 255. 

When opening a network socket, the port number is always a `u16` because the highest possible port on a computer is 65,535. 

```rust
let ip_block: u8 = 192;
let dns_port: u16 = 53;
```
If we tried to use a `u8` for the DNS port, the compiler would stop us from creating a bug that would crash the server in production!
:::

## The Golden Rule of Inference

Rust is incredibly smart. Most of the time, you don't actually need to write the `: u16` part. 

```rust
let peer_count = 10;
```

If you don't explicitly declare the type, the Rust compiler will play detective. It looks at the value (`10`) and *infers* the type. By default, it will guess `i32` (a standard, 32-bit signed integer). 

:::warning
If the compiler cannot figure out the type from context, it will halt the compilation and force you to explicitly write the type annotation. It will never guess blindly.
:::

## Test Your Intuition

:::challenge
Become the CPU. 
What happens when you write this code?

```rust
let temperature: u8 = -5;
```

Does the CPU successfully store `-5`? 
*(Hint: Remember what the 'u' in `u8` stands for! Unsigned integers cannot hold negative numbers. The compiler will aggressively block this code from ever running).*
:::

:::remember
Data types are blueprints. They tell the CPU exactly how much memory to carve out, and exactly how to interpret the electrical signals stored inside those carved-out bytes.
:::
