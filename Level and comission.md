# The Financial Level System: Logic & Math Breakdown

**Project:** Custom 3x10 Matrix MLM  
**Document Type:** Business Logic Explanation  
**Version:** 3.1 (Enhanced Money Flow Clarity)

---

## 1. The Core Engine: "Pass-Up" + "Waterfall"

The system runs on two fundamental rules that dictate the flow of capital. Think of it as a "Holding Tank" where money enters, gets sorted into buckets, and then leaves.

### 1. Source (Money In):

- **Level 1:** Comes from Joining Fees paid by your direct recruits.
- **Levels 2-4:** Comes from Upgrade Fees passed up by your downline.

**Key Logic:** Money skips users to find the correct "Upline" matching the Level number (e.g., Level 3 fees flow to the 3rd Upline).

### 2. Distribution (Money Out): A Priority Waterfall.

- Money enters your "Holding Tank" and attempts to fill Bucket #1.
- Once Bucket #1 is full, it overflows to Bucket #2, and so on.

**Profit Rule:** You only pocket the "Wallet Profit" bucket.

**Completion Rule:** Actual level upgrade happens only when the entire sequence of the current level is completed (i.e., when the last layer/generation of that level is completely filled and has paid).

---

## 2. Level-by-Level Sequence & Deductions

### Level 1 Income

**The Source:** Generation 1 (3 Nodes). These are your direct referrals.

**The Mechanics:** When 3 people join directly under you (Layer 1) paying Rs 500 each.

**Incoming Amount:** 3 Nodes × Rs 500 = Rs 1,500.

| Priority Sequence | Bucket Name | Amount | Action/Logic |
|-------------------|-------------|---------|--------------|
| 1 (First) | Upgrade Deduction | - Rs 1,000 | Held by System. Used to unlock Level 2. This money flows up to your 2nd Upline (your Grandparent). |
| 2 | Upline Commission | - Rs 200 | Split 50/50: Rs 100 to Parent, Rs 100 to Grandparent. |
| 3 (Last) | Wallet Profit | + Rs 300 | The remaining balance is credited to your dashboard. |

---

### Level 2 Income

**The Source:** Generation 2 (9 Nodes). These are the recruits of your recruits.

**The Mechanics:** When these 9 people upgrade to Level 2, they pay a fee of Rs 1,000 each.

**Why you?** You are their 2nd Upline. Level 2 fees always skip the direct parent and flow to the 2nd Upline.

**Incoming Amount:** 9 Nodes × Rs 1,000 = Rs 9,000.

| Priority Sequence | Bucket Name | Amount | Action/Logic |
|-------------------|-------------|---------|--------------|
| 1 (First) | Upgrade Deduction | - Rs 3,000 | Held by System. Unlocks Level 3. Flows up to your 3rd Upline (Great-Grandparent). |
| 2 | Rebirth Deduction | - Rs 1,000 | Auto-Creation: System generates 2 New IDs (500 × 2) placed in your weak leg. |
| 3 | System/Product | - Rs 2,000 | Deducted for Product Costs. |
| 4 | Upline Commission | - Rs 2,000 | Split 50/50: Rs 1,000 to Parent, Rs 1,000 to Grandparent. |
| 5 (Last) | Wallet Profit | + Rs 1,000 | Net profit credited to you. |

---

### Level 3 Income

**The Source:** Generation 3 (27 Nodes).

**The Mechanics:** When these 27 people upgrade to Level 3, they pay a fee of Rs 3,000 each.

**Why you?** You are their 3rd Upline. Level 3 fees skip two layers to reach you.

**Incoming Amount:** 27 Nodes × Rs 3,000 = Rs 81,000.

| Priority Sequence | Bucket Name | Amount | Action/Logic |
|-------------------|-------------|---------|--------------|
| 1 (First) | Upgrade Deduction | - Rs 27,000 | Held by System. Unlocks Level 4. Flows up to your 4th Upline. |
| 2 | Rebirth Deduction | - Rs 3,000 | Auto-Creation: System generates 6 New IDs (500 × 6). |
| 3 | Upline Commission | - Rs 6,000 | Split 50/50: Rs 3,000 to Parent, Rs 3,000 to Grandparent. |
| 4 (Last) | Wallet Profit | + Rs 45,000 | Net profit credited to you. |

---

### Level 4 Income (The Jackpot)

**The Source:** Generation 4 (81 Nodes).

**The Mechanics:** When these 81 people upgrade to Level 4, they pay a fee of Rs 27,000 each.

**Why you?** You are their 4th Upline.

**Incoming Amount:** 81 Nodes × Rs 27,000 = Rs 21,87,000.

| Priority Sequence | Bucket Name | Amount | Action/Logic |
|-------------------|-------------|---------|--------------|
| 1 (First) | Rebirth Deduction | - Rs 27,000 | Auto-Creation: System generates 54 New IDs (500 × 54). |
| 2 | System Deduction | - Rs 27,000 | Administrative Fee. |
| 3 | Upline Commission | - Rs 54,000 | Split 50/50: Rs 27,000 to Parent, Rs 27,000 to Grandparent. |
| 4 | Gifts & Rewards | - Rs 1,75,300 | Held for Car/Gold/Tour distribution. |
| 5 (Last) | Wallet Profit | + Rs 19,03,700 | Final cash payout. |

---

## 3. Rebirth Mechanics (Crucial)

Rebirth Nodes are critical for sustaining the matrix, but they follow strict rules to prevent database loops.

### 3.1 The "Worker Bee" Logic

- **Spawn:** When a Main Node pays a Rebirth Fee (e.g., Rs 1000 at Level 2), the system creates new nodes (e.g., 2 Rebirth Nodes).
- **Placement:** These nodes are placed in the Main Node's own tree (Self Pool) or the Global Tree (Auto Pool) to fill gaps.
- **Earning:** Rebirth Nodes travel the exact same journey (Levels 1-4) and earn the exact same revenue.

### 3.2 The "Sterile" Rule

- **No Offspring:** A Rebirth Node CANNOT spawn more Rebirth Nodes.
- **The Rebirth Fee:** When a Rebirth Node reaches the "Rebirth Deduction" bucket (e.g., Level 2, Priority 2), the system deducts the money (Rs 1000) but keeps it as System Profit instead of creating new nodes.
- **No Wallet:** Rebirth Nodes do not have their own wallet. All "Profit" they generate is routed directly to the Parent Main Node's wallet.

---

## 4. Dual Pool Applicability

This entire logic applies twice for every user, running in parallel:

1. **Self Pool**
2. **Auto Pool**