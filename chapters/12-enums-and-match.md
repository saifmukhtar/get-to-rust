# Chapter 12: Enums and Pattern Matching

A `Struct` is fantastic for grouping data that belongs together. A `Peer` struct has an IP Address AND a Port AND a connection status. It is a logical `AND`.

But what if you need to represent a choice? 
Imagine a DNS packet arrives at your server. It can either be a `Query` (someone asking for an IP address), OR it can be a `Response` (another server giving you an answer), OR it can be an `Error` (the request failed). 

It can never be all three at the same time. If you use a `Struct` to represent this, you end up with a messy, bloated object filled with mostly empty fields and boolean flags.

We need a way to mathematically define a list of mutually exclusive possibilities.

:::definition
An Enum (short for enumeration) allows you to define a Data Type by enumerating its possible variants. A variable of this type can only be exactly one of those variants at a time.
:::

## The Restaurant Menu & The Waiter

:::mental-model
The Menu (Enum) and The Waiter (Match)
Think of an **Enum** like a strict restaurant menu. The menu says: "Your main course is either Steak, OR Chicken, OR Fish." You cannot order a combination. You must choose exactly one variant.

Think of **Pattern Matching** (`match`) like an incredibly disciplined waiter. When the chef hands the waiter a plate (a variant), the waiter checks their rulebook. The rulebook MUST contain instructions for every single item on the menu. If the waiter receives a Steak, they follow the Steak instructions. If they don't have instructions for Fish, the restaurant shuts down.
:::

:::story
Imagine you are building a routing system. You define a `PacketType` Enum with three variants: `Query`, `Response`, and `Error`.

When a packet arrives, you hand it to the router. The router uses a `match` statement to look at the packet type. 
- "Ah, this is a `Query`. I will send it to the resolver engine."
- "Ah, this is an `Error`. I will log it."

If you accidentally forget to write instructions for the `Response` variant, the Rust compiler will violently refuse to compile your code. It forces you to handle every single possibility.
:::

## How the Machine Sees It

When the CPU evaluates a `match` statement, it acts like a high-speed train switch track.

:::cpu
Step 1: The CPU evaluates the Enum variant (e.g., it sees a binary tag indicating this is variant #2).
Step 2: It hits the `match` block and rapidly compares the tag against the defined patterns in order.
Step 3: When it finds a match, it physically jumps execution to the specific block of code associated with that variant.
Step 4: Once that block finishes, it jumps completely out of the `match` statement, ignoring the rest of the options.
:::

## Defining Enums and Matching

In Rust, we use the `enum` keyword to define the menu, and the `match` keyword to handle the choices.

```rust
// 1. We define the Menu (The mutually exclusive variants)
enum PacketType {
    Query,
    Response,
    Error,
}

fn handle_packet(packet_type: PacketType) {
    // 2. We use match to handle the specific variant
    match packet_type {
        PacketType::Query => {
            println!("Routing to the query engine.");
        }
        PacketType::Response => {
            println!("Caching the answer.");
        }
        PacketType::Error => {
            println!("Logging a failure.");
        }
    }
}
```

## Enums with Data

Rust Enums have a superpower that most other programming languages don't possess: variants can actually hold their own data!

This means you don't just say "This is an Error". You can say "This is an Error, and here is a string explaining why."

:::kinetic
In the Kinetic project, a packet isn't just an abstract concept. It contains actual byte payloads.

```rust
// Our Enum variants can hold different types of data!
enum NetworkEvent {
    // A connection just happened (holds the IP address string)
    ConnectionEstablished(String),
    
    // Data arrived (holds a dynamic vector of bytes)
    DataReceived(Vec<u8>),
    
    // The connection dropped (holds no data, just the event)
    ConnectionDropped, 
}

fn process_event(event: NetworkEvent) {
    match event {
        // We actually extract the IP string from the variant right here!
        NetworkEvent::ConnectionEstablished(ip) => {
            println!("Saying hello to {}", ip);
        }
        // We extract the bytes from the payload!
        NetworkEvent::DataReceived(payload) => {
            println!("Received {} bytes.", payload.len());
        }
        NetworkEvent::ConnectionDropped => {
            println!("Cleaning up connection.");
        }
    }
}
```
Notice how `match` allows us to instantly "unwrap" the data hidden inside the variant (like extracting the `ip` string) and use it immediately!
:::

## The Golden Rule of Exhaustiveness

The `match` statement in Rust is incredibly strict. It requires **exhaustiveness**.

:::warning
You must handle every single variant.

If you add a new variant to an Enum (like `NetworkEvent::Timeout`) and forget to update your `match` statements across your codebase, the Rust compiler will immediately throw a fatal error pointing to every `match` block you missed. This is a massive feature for safe refactoring!
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Will this code compile?

```rust
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

fn intersection_logic(light: TrafficLight) {
    match light {
        TrafficLight::Red => println!("Stop!"),
        TrafficLight::Green => println!("Go!"),
    }
}
```

*(Hint: The `TrafficLight` enum has three variants. The `match` statement only has instructions for `Red` and `Green`. The compiler is the strict waiter! It will halt compilation and scream: "pattern `TrafficLight::Yellow` not covered!" You must handle the Yellow light!)*
:::

:::remember
An Enum allows you to define mutually exclusive variants (A OR B OR C). A `match` statement forces you to explicitly write handling logic for every single variant, ensuring you never accidentally ignore a possibility in your system.
:::
