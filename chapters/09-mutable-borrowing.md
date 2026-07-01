# Chapter 9: Mutable Borrowing

In the last chapter, we learned how to loan out read-only guest passes (`&`) so functions can look at our data without stealing ownership.

But what if you *want* a function to change your data? 

Imagine you have an empty `Buffer` and you want a `read_from_network()` function to fill that buffer with bytes. If you pass ownership, the function destroys the buffer when it finishes, and you lose the bytes! If you pass a read-only guest pass, the function can't write the bytes into the buffer!

We need a way to loan out our data, give the borrower permission to *change* it, and then get the data back when they are done. 

:::definition
Mutable Borrowing allows you to create a temporary reference that explicitly grants permission to modify the underlying data. A mutable reference is denoted by `&mut`.
:::

## The Golden Rule of Rust

Before we look at syntax, we must understand the single most important rule in the entire Rust programming language. This is the rule that eliminates race conditions and data corruption.

:::mental-model
The Shared Google Doc
Think of a standard reference (`&`) as sending someone a "View Only" link to a Google Doc. You can send out 1,000 "View Only" links. Everyone can read the document safely at the exact same time.

Think of a mutable reference (`&mut`) as the actual "Edit Password" to the document. 
If 1,000 people have the Edit Password and start typing over each other simultaneously, the document becomes corrupted garbage.
:::

Because of this, the Rust compiler strictly enforces the **One Mutable XOR Many Immutable** rule:

At any given microsecond in your program, you are allowed to have:
- **One** mutable reference (`&mut`). *(One active writer).*
- **OR**
- **Many** immutable references (`&`). *(Thousands of readers).*

You can **never** have both at the same time. If someone is writing to the document, nobody is allowed to read it until the writer puts the pen down. 

:::story
Imagine you are the warehouse manager. You give a worker a red "Edit Pass" (`&mut`) for a specific container. 

While that worker is inside the container rearranging the boxes, another worker walks up and asks for a blue "View Pass" (`&`) to look inside the same container. 

You violently reject the second worker. You say: "Absolutely not. The first worker is currently rearranging things. If you look inside right now, the boxes might fall on your head. You must wait until the first worker returns the red Edit Pass before I let anyone else look."
:::

## How the Machine Sees It

This rule is enforced entirely at compile-time. There is zero performance cost when the program actually runs.

:::cpu
Step 1: The Compiler scans your code and sees you gave out a `&mut` reference to Variable A.
Step 2: The Compiler sees that two lines later, you tried to give out a `&` read-only reference to Variable A while the `&mut` was still active.
Step 3: The Compiler immediately throws a fatal error: `cannot borrow Variable A as immutable because it is also borrowed as mutable`.
Step 4: The CPU never executes this code, because the binary is never generated. The race condition is physically impossible.
:::

## Writing Mutable References

To use a mutable reference, both the original variable AND the reference must be marked as mutable.

```rust
// 1. The original box MUST be mutable
let mut packet_buffer = String::from("Header:");

// 2. We pass a MUTABLE reference to the function
append_payload(&mut packet_buffer);

println!("Final packet: {}", packet_buffer); 

// 3. The function signature MUST explicitly demand a mutable reference
fn append_payload(buffer: &mut String) {
    // We can safely modify the original data!
    buffer.push_str(" 10101010");
}
```

## How We Use This in Reality

In the Kinetic project, mutable borrowing is the cornerstone of high-performance I/O operations.

:::kinetic
When our Gateway accepts a new TCP connection, we don't want to create a brand new `Vec<u8>` every time we read a chunk of bytes. Allocating new Heap memory is slow!

Instead, we allocate one single `Buffer` when the connection starts. Then, in a loop, we pass a `&mut Buffer` to the network reader.

```rust
let mut connection_buffer = Vec::new();

loop {
    // We hand out a temporary Edit Pass to the OS reader
    let bytes_read = socket.read(&mut connection_buffer);
    
    if bytes_read == 0 { break; }
    
    // The reader gave the Edit Pass back, so we can now safely 
    // hand out a View Pass (&) to the parser!
    parse_dns_query(&connection_buffer);
}
```
We achieved maximum performance. We reused the same memory allocation over and over again, and the compiler mathematically guaranteed that the parser would never try to read the buffer at the exact same millisecond the socket was writing to it.
:::

## Test Your Intuition

:::challenge
Become the CPU. 
Look at the following code. Will the compiler allow this?

```rust
let mut config = String::from("Port=53");

let reader1 = &config;
let reader2 = &config;
let writer = &mut config; // Line A

println!("{}, {}", reader1, writer);
```

*(Hint: Remember the Golden Rule! You can have many readers, OR one writer. Never both! On Line A, you ask for a writer pass while `reader1` and `reader2` are still active. The compiler will scream and halt compilation. You cannot mutate data while people are currently looking at it!)*
:::

:::remember
Mutable Borrowing (`&mut`) allows a function to temporarily edit your data without taking permanent ownership. But if someone is editing the data, nobody else is allowed to look at it until the edit is finished.
:::
