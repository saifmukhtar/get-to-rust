# Chapter 4: Functions

If you are writing a distributed system, you will inevitably need to do the same task over and over again. For example, every time a new UDP packet arrives, you need to parse the headers, extract the IP address, and validate the checksum.

If you copy and paste those 50 lines of code every time a packet arrives, your program will swell to a massive size. Worse, if you find a bug in your parsing logic, you have to find and fix it in 50 different places.

We need a way to wrap logic up into a single, reusable block.

:::definition
A function is an isolated block of reusable code that takes inputs, performs an action, and optionally returns an output.
:::

## The Factory Floor

:::mental-model
The Assembly Line Station
Think of your program like a massive factory. A function is a specialized, sealed-off assembly station within that factory. 
Raw materials (Inputs) enter through a conveyor belt. The machines inside do their specific job (Process). A finished product (Output) is shipped out the other side.
:::

:::story
Imagine you build a coffee machine (a function). You don't rebuild the entire machine from scratch every time you want an espresso. You build the machine once. 

When you want a coffee, you pour in water and beans (the arguments). You press the button. The machine grinds and brews (the execution). Finally, it spits out a hot espresso (the return value). The machine doesn't care who you are or where the beans came from; it only knows how to process the inputs it was given.
:::

## How the Machine Sees It

When you create a function, you are actually creating a dedicated, temporary workspace in memory that is completely isolated from the rest of the program.

:::cpu
Step 1: The CPU is executing `main()` and encounters a call to your `parse()` function.
Step 2: The CPU pauses execution of `main()`. It jumps to the specific memory address where the `parse()` instructions live.
Step 3: The CPU creates a brand new "Stack Frame" in memory. This is a temporary, isolated workspace just for the `parse()` function to store its own local variables.
Step 4: The function finishes its work, returns the output back to `main()`, and the CPU instantly destroys the temporary Stack Frame, erasing all the function's internal variables.
Step 5: The CPU jumps back to `main()` and resumes where it left off.
:::

:::memory
Address: `0x1000` (Main Stack Frame)
Variables: `packet_data`

*JUMPS TO* -> Address: `0x8000` (Parse Stack Frame)
Variables: `temp_header`, `extracted_id` -> *(Destroyed after return!)*
:::

## Writing Your First Function

In Rust, we use the `fn` keyword to declare a function. Every function must explicitly declare the data types of its inputs and its output.

```rust
// fn name(input_name: input_type) -> output_type
fn multiply_by_two(number: i32) -> i32 {
    return number * 2;
}
```

Let's break down the syntax:
1. `fn`: The keyword telling Rust we are defining a function.
2. `multiply_by_two`: The human-readable name of the function.
3. `(number: i32)`: The inputs (parameters). We must strictly define the data type.
4. `-> i32`: The arrow points to the output. We promise to return a 32-bit signed integer.
5. `{ ... }`: The body of the function where the actual work happens.

## How We Use This in Reality

In the Kinetic project, we isolate complex networking logic into clean, reusable functions.

:::kinetic
When our server receives raw binary bytes from the network, we don't pollute our main server loop with parsing logic. We isolate it.

```rust
fn parse_dns_query(raw_bytes: &[u8]) -> DnsMessage {
    // 1. Extract the Transaction ID
    // 2. Read the Question Section
    // 3. Assemble the full message
    
    return parsed_message;
}
```

Now, anywhere in our entire codebase, if we have raw bytes and we need a structured `DnsMessage`, we just push the bytes through this function. If we ever find a bug in how we parse DNS headers, we only have to fix it in this one single function.
:::

## The Golden Rule of Return Expressions

Rust has a unique, extremely popular shortcut for returning values from functions.

:::warning
If the very last line of a function does not have a semicolon `;`, Rust automatically assumes you want to return that value.

You can omit the `return` keyword entirely!
:::

These two functions compile to the exact same machine code:

```rust
// Traditional way
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}

// The idiomatic Rust way (No 'return', no ';')
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```
If you accidentally put a semicolon at the end (`a + b;`), Rust thinks you are just doing math and throwing the result away, and it will throw a compiler error because you promised to return an `i32` but returned nothing.

## Test Your Intuition

:::challenge
Become the CPU. 
Look at the following code. Can the `main` function print the `secret_key`?

```rust
fn generate_key() {
    let secret_key = 9999;
}

fn main() {
    generate_key();
    // println!("{}", secret_key);
}
```

*(Hint: Remember the CPU walkthrough! When `generate_key()` finishes running, its temporary Stack Frame is instantly destroyed. `main()` has absolutely no idea that `secret_key` ever existed. Functions are strictly isolated!)*
:::

:::remember
A function is a reusable, isolated assembly line. It takes strict inputs, does work in a temporary workspace, and returns a strict output.
:::
