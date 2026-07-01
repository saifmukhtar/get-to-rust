# Chapter 7: Ownership (Move and Copy)

In the previous chapter, we left off with a terrifying question: Who cleans up the massive warehouse floor (the Heap) when you are done with a box?

In languages like C and C++, the programmer must manually write `free(pointer)`. If they forget, the program leaks memory and eventually crashes. If two different programmers accidentally call `free(pointer)` on the exact same box (a "Double Free"), the program corrupts data and opens up a catastrophic security vulnerability.

Other languages like Python or JavaScript use a "Garbage Collector" that pauses your program randomly to sweep the warehouse and clean up boxes nobody is looking at anymore. This is safe, but it makes the program slow and unpredictable.

Rust takes a third path. A path that makes it both lightning fast and perfectly safe. This path is called **Ownership**.

:::definition
Every single piece of data in Rust has one, and exactly one, owner. When the owner goes out of scope, the data is instantly destroyed.
:::

## The Golden Coin vs. The Text Message

:::mental-model
The Physical Gold Coin vs. The Text Message
Think of Heap data (like a `String` or `Vec`) as a highly valuable physical gold coin. If I hand you my gold coin, I no longer have it. It physically moved from my hand to yours. Only one person can own it.
Think of Stack data (like a simple `u32` integer) as a text message. If I text you a phone number, you have a copy on your phone, and I still have a copy on my phone. We both have it.
:::

:::story
Imagine you own a massive shipping container on the warehouse floor (the Heap). You hold the only key (the pointer). 

You decide to pass this container into a function called `process_container()`. You literally hand the key to that function. 
At that exact moment, you lose the key. You are legally no longer the owner. This is called a **Move**. If you try to open the container after handing away the key, the compiler slaps your hand and throws an error.

Because the `process_container()` function is now the sole owner of the key, when that function ends and its scope closes, it throws the key into the incinerator and destroys the container on the warehouse floor. It cleans up perfectly, automatically, and instantly.
:::

## How the Machine Sees It

This isn't magic. The Rust compiler enforces Ownership purely through strict tracking before the code ever runs.

:::cpu
Step 1: The CPU allocates a `String` on the Heap and gives the pointer to Variable A.
Step 2: The code says `let B = A;`. 
Step 3: The CPU copies the *pointer* (the index card) to Variable B. Crucially, it does NOT copy the massive string on the Heap.
Step 4: The Compiler permanently invalidates Variable A. It marks A as "moved". 
Step 5: When the scope ends, the CPU only destroys the Heap data once (for B). It ignores A, completely eliminating the "Double Free" bug.
:::

:::memory
--- THE HEAP ---
Address: `0x8000` 
Value: `"Kinetic"`

--- THE STACK ---
Variable A (Pointer): `0x8000` -> *INVALIDATED! Cannot be used!*
Variable B (Pointer): `0x8000` -> *Valid Owner. Will clean up 0x8000 when destroyed.*
:::

## Writing Moves and Copies

Let's see the gold coin (Move) in action:

```rust
let original_string = String::from("Kinetic");

// We hand the gold coin to a new owner
let new_owner = original_string;

// ❌ ERROR! original_string no longer owns the data!
// println!("{}", original_string); 
```

Now let's see the text message (Copy) in action. Simple integers are so small and fast that Rust just copies them entirely on the Stack.

```rust
let original_number = 53;

// We send a text message. The data is duplicated.
let new_number = original_number;

// ✅ PERFECTLY FINE! We both have a copy of 53.
println!("{}", original_number); 
```

## How We Use This in Reality

In the Kinetic project, Ownership is the ultimate guardrail against memory corruption when passing complex network data around.

:::kinetic
Imagine our Gateway receives a massive UDP `Packet`. This packet contains headers, flags, and a large raw byte payload. It lives on the Heap.

```rust
let incoming_packet = Packet::new(raw_bytes);

// We pass the packet into a processing function.
// Ownership is MOVED into the function.
process_packet(incoming_packet);

// If we tried to read the packet again here, the compiler stops us!
// We gave it away!
// println!("{:?}", incoming_packet); // ❌ ERROR: value borrowed here after move
```
Because `process_packet` took full ownership of the `Packet`, it is responsible for destroying it when it finishes. This guarantees that we never accidentally use a packet that has already been destroyed, and we never accidentally destroy a packet twice.
:::

## The Golden Rule of One

:::warning
There can only be one owner at a time.

If you pass a complex Heap variable to another variable or into a function, you lose it forever. It has moved. If you try to touch it again, the compiler will aggressively protect you from yourself.
:::

## Test Your Intuition

:::challenge
Become the CPU. 
Look at the following code. Which line will cause a fatal compiler error?

```rust
fn handle_peer(peer_id: String) {
    println!("Handling {}", peer_id);
} // peer_id is destroyed here!

fn main() {
    let current_peer = String::from("192.168.1.1"); // Line 1
    
    handle_peer(current_peer);                      // Line 2
    
    println!("Finished with {}", current_peer);     // Line 3
}
```

*(Hint: `String` lives on the Heap. It is a gold coin! On Line 2, `main` hands the gold coin to `handle_peer`. When `handle_peer` finishes, it melts the coin down. So on Line 3, when `main` tries to look at the coin... it fails! Line 3 is a compiler error.)*
:::

:::remember
Ownership means only one variable holds the key to Heap data. When that owner dies, the Heap data dies. Passing the key to someone else is called a Move, and you lose the key forever.
:::
