# Chapter 18: Modules (Organizing Code)

So far, we have imagined writing all of our Structs, Enums, Traits, and Functions into a single file. 

But real-world programs are massive. If you put 50,000 lines of code into a single `main.rs` file, it becomes physically impossible to navigate, debug, or maintain. 

Worse, if everything is in one file, any function can accidentally modify any variable. There are no boundaries.

We need a way to split our codebase across dozens of physical files and folders, while strictly controlling which pieces of code are allowed to talk to each other.

:::definition
A Module (`mod`) is a logical namespace that allows you to organize code into physical files and folders. In Rust, everything inside a module is strictly private by default. You must explicitly use the `pub` (public) keyword to allow outside code to access it.
:::

## The Sprawling Library

:::mental-model
The Library with Restricted Sections
Think of a large Rust codebase like a massive public library.
The library is divided into wings (Folders) and aisles (Files). 

By default, every single aisle in the library is a Restricted Employee-Only section. If a patron (another part of the code) tries to walk down an aisle to read a Struct or call a Function, security guards instantly tackle them. 

If you want a patron to be able to access a specific aisle, you must explicitly hang a `pub` (public) sign above the door. This unlocks the door and allows the outside world to interact with whatever is inside.
:::

:::story
Imagine you build a `parser.rs` file. Inside, you write a highly complex, dangerous function called `shift_bytes_dangerously()`, and a safe, friendly function called `parse_packet()`.

Because Rust is private by default, `main.rs` cannot see either of them. They are locked in the parser aisle.

You want `main.rs` to be able to use `parse_packet()`, but you DO NOT want it to ever touch `shift_bytes_dangerously()`. 

You simply add the `pub` keyword to `pub fn parse_packet()`. You leave the dangerous function alone. Now, `main.rs` can safely call the parser, but the dangerous internal mechanics remain perfectly protected behind a locked door.
:::

## How the Machine Sees It

Modules are entirely a compile-time concept for human organization. 

:::cpu
Step 1: When you compile a Rust program, the compiler starts at the "crate root" (usually `main.rs` or `lib.rs`).
Step 2: It looks for `mod` declarations, which tell it to go fetch other files (e.g., `mod network;` tells it to read `network.rs`).
Step 3: The compiler essentially stitches all of these files together into one massive, flattened abstract syntax tree in memory.
Step 4: It runs strict privacy checks. If File A tries to call a non-`pub` function in File B, it aborts compilation.
Step 5: The final binary machine code has no concept of files or folders. It is just one giant, optimized executable.
:::

## Creating Modules

To split code into files, you create a new file (e.g., `network.rs`) and then tell `main.rs` that the module exists using the `mod` keyword.

**File 1: `network.rs`**
```rust
// This struct is private! main.rs cannot create it directly!
struct UdpSocket {
    port: u16,
}

// We make the function PUBLIC so main.rs can call it
pub fn connect_to_server() {
    println!("Connecting to network...");
    
    // We can use the private struct here, because we are in the same room!
    let socket = UdpSocket { port: 53 };
}
```

**File 2: `main.rs`**
```rust
// 1. Declare that the module exists (looks for network.rs)
mod network;

fn main() {
    // 2. Call the public function using the path `network::`
    network::connect_to_server();
    
    // ERROR! We cannot do this! UdpSocket is locked behind a private door!
    // let bad_socket = network::UdpSocket { port: 80 }; 
}
```

## How We Use This in Reality

In the Kinetic project, strict privacy boundaries are what prevent our architecture from turning into spaghetti code.

:::kinetic
We organize the Kinetic Gateway into several distinct folders. For example, we have a `src/dns/` folder. 

Inside `src/dns/`, we have a file called `parser.rs`. The parser contains highly complex, bit-level manipulations to extract data from raw UDP packets.

We DO NOT want the rest of the application accidentally messing with raw bytes. 

So, in `parser.rs`, we mark the final `DnsPacket` struct as `pub`. But we leave all the internal bit-shifting helper functions as private. The network routing module can safely receive a fully-parsed `DnsPacket`, completely ignorant of the chaotic binary operations that occurred behind the locked doors of the parser module.
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Will this code compile?

**File: `math_utils.rs`**
```rust
fn add_two_numbers(a: i32, b: i32) -> i32 {
    a + b
}
```

**File: `main.rs`**
```rust
mod math_utils;

fn main() {
    let result = math_utils::add_two_numbers(5, 10);
    println!("Result: {}", result);
}
```

*(Hint: Look at `math_utils.rs`! Did you hang a `pub` sign on the door of the `add_two_numbers` function? No! It is private by default. When `main.rs` tries to call it, the compiler will aggressively block the attempt with a "function `add_two_numbers` is private" error. You must write `pub fn add_two_numbers`!)*
:::

:::remember
Modules allow you to organize code across multiple files and folders. In Rust, everything is strictly private by default. You must explicitly use the `pub` keyword to unlock structs, enums, or functions for use by the outside world, creating beautiful, protected boundaries in your architecture.
:::
