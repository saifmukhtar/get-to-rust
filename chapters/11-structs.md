# Chapter 11: Structs

So far, we have built programs using individual variables: a `String` for an IP address, a `u16` for a port, a `bool` to track if the connection is active. 

But passing these isolated variables around your codebase is chaotic. If a function needs to connect to a server, do you pass it three separate variables (`connect(ip, port, is_active)`)? What if a server has 10 properties? Do you pass 10 variables?

Worse, the compiler has no idea these variables belong together. To the compiler, they are just random, unrelated boxes floating in the warehouse.

We need a way to group related data into a single, cohesive entity.

:::definition
A Struct (short for structure) allows you to define a custom data type that groups multiple related values together under one name.
:::

## The Specialized Shipping Crate

:::mental-model
The Custom Blueprint
Think of primitive types (`u16`, `bool`) as standard, loose items in a warehouse. 
A Struct is a blueprint for a highly specialized shipping crate. When you design a Struct, you explicitly define exact, labeled slots inside the crate. 
Once the crate is built, you can carry the entire crate around as a single object, rather than juggling a dozen loose items in your arms.
:::

:::story
Imagine you are managing the warehouse. A worker walks up holding a loose engine, four tires, and a steering wheel. They keep dropping them. 

You tell the worker: "Stop carrying loose parts. I am going to design a custom crate called a `CarCrate`. It has a slot labeled `engine`, a slot labeled `tires`, and a slot labeled `steering_wheel`. From now on, you will pack those items into the `CarCrate`, seal it, and move the crate as one single object."
:::

## How the Machine Sees It

When you define a Struct, you are literally teaching the compiler a brand new Data Type. 

:::cpu
Step 1: The Compiler reads your Struct definition. It calculates exactly how many bytes the crate will need by adding up the sizes of all the slots inside it.
Step 2: When you create an *instance* of the Struct, the CPU allocates a single, contiguous block of memory large enough to hold the entire crate.
Step 3: The CPU places the individual pieces of data into their designated offsets within that single block of memory.
Step 4: You can now pass a single Pointer to this memory block, and the function will have access to all the pieces inside.
:::

:::memory
Address: `0x1000` (Start of the Crate)
Name: `gateway_peer` (Type: Peer)

Offset +0: `192.168.1.1` (ip_address)
Offset +8: `53` (port)
Offset +10: `true` (is_active)
:::

## Defining and Creating Structs

In Rust, you use the `struct` keyword to design the blueprint. You define the names of the slots (fields) and the exact data type that is allowed to go into that slot.

```rust
// 1. We design the Blueprint (This doesn't create any data yet!)
struct Peer {
    ip_address: String,
    port: u16,
    is_active: bool,
}

// 2. We build an actual crate based on the blueprint
let my_peer = Peer {
    ip_address: String::from("10.0.0.1"),
    port: 8080,
    is_active: true,
};

// 3. We use dot notation to peek inside the crate's slots
println!("Connecting to Port: {}", my_peer.port);
```

## How We Use This in Reality

In the Kinetic project, Structs are the fundamental building blocks of our entire architecture. We never pass loose variables around.

:::kinetic
When our DNS Resolver talks to another server on the network, it needs to track a lot of state. We group all of this state into a `ResolverNode` struct.

```rust
struct ResolverNode {
    address: String,
    total_queries_sent: u64,
    cache_hits: u64,
    is_blacklisted: bool,
}

fn print_node_health(node: &ResolverNode) {
    println!("Node {} has {} hits.", node.address, node.cache_hits);
}
```

Notice the function signature: `fn print_node_health(node: &ResolverNode)`. 
We didn't pass 4 variables. We passed a single read-only Guest Pass (`&`) to the entire crate. The function can easily peek inside the crate using the `.` operator to read the cache hits.
:::

## The Golden Rule of Completion

Rust is obsessed with correctness. It will never let you build a half-empty crate.

:::warning
When you create an instance of a Struct, you MUST provide a value for every single field defined in the blueprint. 

If you design a crate with 4 slots and only put data into 3 of them, the compiler will violently refuse to compile your code. There is no such thing as an "uninitialized" field in a Rust struct.
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Will this code compile?

```rust
struct DnsHeader {
    transaction_id: u16,
    is_response: bool,
}

fn main() {
    let header = DnsHeader {
        transaction_id: 4242,
    };
    
    println!("ID: {}", header.transaction_id);
}
```

*(Hint: Look closely at the `DnsHeader` blueprint. It requires two slots! In `main()`, we only filled the `transaction_id` slot. We forgot to provide a value for `is_response`. The compiler will throw an error immediately: "missing field `is_response` in initializer".)*
:::

:::remember
A Struct is a custom blueprint for a highly specialized shipping crate. It allows you to group related variables together into a single, cohesive Data Type that the compiler understands and strictly enforces.
:::
