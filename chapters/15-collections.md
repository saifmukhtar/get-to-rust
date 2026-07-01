# Chapter 15: Collections (Vec and HashMap)

Variables are great for storing a single item. Structs are great for storing a known, fixed number of items. 

But what if you are writing a network server? You don't know how many clients will connect today. It might be 5, it might be 5,000. You cannot hardcode 5,000 separate variables in your code.

You need a way to store a *dynamic* group of items. A list that can grow and shrink while the program is running.

In Rust, the two most powerful tools for dynamic storage are the **Vector** (`Vec`) and the **HashMap**.

:::definition
A **Vector** (`Vec<T>`) is a growable array. It stores a list of items of the same type sequentially in memory.
A **HashMap** (`HashMap<K, V>`) is a dictionary. It maps unique Keys to specific Values, allowing you to instantly look up data without searching through a list.
:::

## The Expandable Train and the Giant Mailroom

:::mental-model
Vec vs HashMap
Think of a **Vec** like an expandable freight train. When you need to store a new item, you simply attach a new boxcar to the very end of the train. If you want to find an item, you have to walk down the train from car 1 to car X until you find what you are looking for. (Great for keeping things in order, but slow to search).

Think of a **HashMap** like a massive warehouse mailroom with a magical sorting machine. You hand the machine a name ("Alice"). The machine instantly calculates a mathematical formula (a Hash) that tells it exactly which cubby hole Alice's mail is in. You walk directly to cubby #4242 and grab it. (Incredible for instant lookups, but items are completely disorganized).
:::

:::story
Imagine you are building the DNS Gateway.

You need to keep a chronological log of every single packet that arrived today. You use a `Vec<Packet>`. Every time a packet arrives, you just push it to the end of the train.

Later, you need a way to instantly find the IP address for `google.com`. A train (`Vec`) is terrible for this; you would have to check every single car until you found Google. Instead, you use a `HashMap<String, String>`. You hand it the key `"google.com"`, and it instantly hands you back the value `"142.250.190.46"`.
:::

## How the Machine Sees It

Both `Vec` and `HashMap` must store their data on the **Heap** (Chapter 6). Why? Because the Stack requires the exact size of variables to be known at compile time. Since these collections can grow and shrink dynamically while the program is running, they must live in the massive, unstructured warehouse of the Heap.

:::cpu
Step 1: When you create a `Vec`, the OS allocates a block of memory on the Heap (e.g., room for 10 items).
Step 2: The `Vec` itself is just a tiny index card on the Stack that contains a Pointer to the Heap, the current Length (how many items are inside), and the Capacity (how much room is left).
Step 3: If you push an 11th item, the `Vec` realizes it is out of room. The CPU asks the OS for a brand new, larger block of memory (room for 20 items), copies the old items over, and deletes the old block.
:::

## Using Vec

Creating and adding to a vector is incredibly simple. Notice we must make the `Vec` mutable (`mut`) if we want to add items to it!

```rust
fn main() {
    // 1. Create a new, empty Train that holds Strings
    let mut domains: Vec<String> = Vec::new();
    
    // 2. Add cars to the end of the train
    domains.push(String::from("kinetic.local"));
    domains.push(String::from("rust-lang.org"));
    
    // 3. Loop through the train cars one by one
    for domain in domains {
        println!("We must resolve: {}", domain);
    }
}
```

## Using HashMap

To use a HashMap, you must bring it into scope from the standard library's `collections` module.

```rust
// Bring the magical mailroom into scope
use std::collections::HashMap;

fn main() {
    // 1. Create a new Mailroom (Keys are Strings, Values are Strings)
    let mut cache: HashMap<String, String> = HashMap::new();
    
    // 2. Insert items into specific cubbies
    cache.insert(String::from("localhost"), String::from("127.0.0.1"));
    cache.insert(String::from("router"), String::from("192.168.1.1"));
    
    // 3. Instantly look up a value without looping!
    // Remember Chapter 13! get() returns an Option because the key might not exist!
    let target = String::from("router");
    
    match cache.get(&target) {
        Some(ip) => println!("Found IP instantly: {}", ip),
        None => println!("Domain not found in cache!"),
    }
}
```

## How We Use This in Reality

In the Kinetic project, `Vec` and `HashMap` are the engine of our high-performance architecture.

:::kinetic
When our server boots up, we read a massive configuration file containing thousands of blocked domains (a Pi-Hole style blocklist).

If we stored this blocklist in a `Vec<String>`, every time a packet arrived, the CPU would have to check thousands of items sequentially to see if the domain was blocked. This would destroy our network speed.

Instead, we load the blocklist into a `HashMap<String, bool>`. 
When a query arrives for `malware.com`, we simply ask the HashMap: `blocklist.get("malware.com")`. 
The CPU executes a mathematical hash and returns the answer in `O(1)` time (instantaneous). The entire lookup takes nanoseconds.
:::

## Test Your Intuition

:::challenge
Become the Compiler. 
Which collection should you choose for the following scenarios?

1. You want to store a list of the last 100 IP addresses that connected to your server, ordered by time.
2. You want to store a list of user IDs and their current high scores, so you can quickly look up a specific user's score when they log in.

*(Answers: 1. A `Vec<String>` because you care about sequential order and appending to the end. 2. A `HashMap<String, u32>` because you need instant lookups based on a specific Key (the user ID)!)*
:::

:::remember
Use a `Vec` when you need an expandable list of items kept in a specific order. Use a `HashMap` when you need to instantly look up a Value based on a unique Key. Both live on the Heap because their sizes change at runtime!
:::
