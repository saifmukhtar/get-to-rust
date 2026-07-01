# Chapter 6: The Stack & The Heap

Up until this point, we have pretended that all data is created equal. We simply put data into labelled boxes in the warehouse. 

But not all data is equal. Some data, like an IP Address octet (`192`), is tiny, predictable, and fixed in size. The compiler knows exactly how much space it will take up.

Other data, like a list of every active connection to a Gateway, is dynamic. The list might contain 5 connections right now, and 50,000 connections tomorrow. The compiler cannot possibly predict how much space that list will need.

Because of this, the operating system splits memory into two distinct regions.

:::definition
The Stack is for data with a known, fixed size. It is incredibly fast.
The Heap is for data that can grow, shrink, or whose size is unknown at compile time. It is slower but massive.
:::

## The Filing Cabinet vs. The Warehouse Floor

:::mental-model
The Filing Cabinet vs. The Warehouse Floor
Think of the **Stack** like a perfectly organized, high-speed filing cabinet right next to your desk. To put paper in it, you *must* know exactly how big the paper is so you can choose the right drawer. 

Think of the **Heap** like a massive, unorganized warehouse floor. You can place a giant, expanding shipping container anywhere you find open space. But the warehouse is so big, you can't keep the container by your desk. Instead, you write down the coordinates (Row 4, Shelf 10) on a tiny index card, and you put that index card into your fast filing cabinet.
:::

:::story
Imagine you work at a shipping company. A customer hands you a standard, letter-sized invoice (`u32`). Because you know the exact size of the paper, you instantly slide it into the top drawer of your filing cabinet (The Stack). Lightning fast.

An hour later, a customer drops off a massive, expanding box of loose items (`Vec`). You can't put that in your cabinet. Instead, you walk down to the warehouse floor (The Heap), find an empty corner, and dump the box there. 

To remember where you put it, you write "Row 4, Shelf 10" on a small index card. Since an index card is always the exact same small size regardless of how big the box on the warehouse floor gets, you put the index card into your filing cabinet (The Stack).

That index card is called a **Pointer**.
:::

## How the Machine Sees It

When the CPU needs to access data on the Heap, it has to do double the work. It has to first read the pointer on the Stack, and then physically jump to a different location in RAM to find the actual data.

:::cpu
Step 1: The CPU receives an instruction to create a dynamic list (a `Vec`).
Step 2: The OS scans the Heap (the warehouse floor) for a chunk of free memory large enough to hold the list.
Step 3: The OS claims that chunk of memory and returns its physical address (e.g., `0x8000`).
Step 4: The CPU pushes a Pointer containing the address `0x8000` onto the Stack (the filing cabinet).
Step 5: When you want to read the list, the CPU first reads the Pointer on the Stack, sees `0x8000`, and then jumps to the Heap to fetch the actual data.
:::

:::memory
--- THE STACK (Fast, Fixed Size) ---
Address: `0x1000` 
Name: `port` (u16)
Value: `53`

Address: `0x1004`
Name: `peer_list` (Pointer)
Value: `Points to 0x8000`

--- THE HEAP (Slow, Dynamic Size) ---
Address: `0x8000` 
Value: `[Peer1, Peer2, Peer3...]` (Can grow indefinitely!)
:::

## Writing Heap Data

In Rust, simple primitive types (`u32`, `bool`, `f64`) live purely on the Stack. 

If you want data to live on the Heap, you use special types provided by Rust, such as `String` (a dynamic string of text) or `Vec` (a dynamic list).

```rust
// Lives entirely on the fast Stack (size is known)
let port = 53; 

// The pointer lives on the Stack, but the actual text lives on the Heap!
let server_name = String::from("Kinetic Gateway"); 
```

## How We Use This in Reality

In high-performance networking, minimizing Heap allocations is a religious obsession.

:::kinetic
When building the Kinetic DNS resolver, we parse hundreds of thousands of queries a second. 

If we parse a packet's 16-bit ID, we store it as a `u16` on the Stack. It is blazingly fast.

But what if we need to track all currently active TCP connections? The number of connections changes every millisecond. We are forced to use a `Vec<Connection>`. This data must live on the Heap because it expands and shrinks dynamically.

Our goal as systems engineers is to aggressively minimize how often we go to the warehouse (Heap allocations), because jumping around RAM to follow pointers destroys CPU cache performance.
:::

## The Golden Rule of Cleanup

Because the Stack is perfectly organized, the CPU automatically cleans it up the instant a function finishes (as we saw in Chapter 5: Scope). But the Heap is messy.

:::warning
Who cleans up the warehouse floor?

If you leave a box on the Heap and throw away the pointer (index card) in the Stack, you have lost the data forever. It will sit on the warehouse floor forever, hogging space. This is a Memory Leak. 

Rust has a brilliant system for automatically cleaning up the Heap without you ever writing a `free()` command. We will learn it in the next chapter.
:::

## Test Your Intuition

:::challenge
Become the CPU. 
Look at these three variables. Which ones live entirely on the Stack, and which ones allocate data on the Heap?

```rust
let active = true;
let buffer_size = 4096;
let cached_requests = Vec::new(); // A dynamic list
```

*(Hint: `bool` and integers have fixed, known sizes. They live purely on the Stack. `Vec` is a dynamic list that can grow, so it must allocate space on the Heap and leave a Pointer on the Stack!)*
:::

:::remember
The Stack is a fast, fixed-size filing cabinet. The Heap is a massive, dynamic warehouse floor. To find things on the Heap, you must keep a Pointer in the filing cabinet.
:::
