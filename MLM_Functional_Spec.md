# **Comprehensive System Design Document: Custom 3x10 Matrix MLM**

Project Name: \[To Be Decided\]  
Version: 10.0 (Genesis & Stability Final)  
Architecture: Headless REST API \+ Decoupled Frontend (Mobile Ready)  
Date: November 30, 2025

## **1\. Executive Summary & Glossary**

This document serves as the single source of truth for developing a custom Multi-Level Marketing (MLM) platform. The system uses a **Dual-Threaded Matrix** architecture where every purchased position (Node) exists simultaneously in two separate trees: a **Self Pool** (Sponsor-Based) and an **Auto Pool** (Time-Based).

### **1.1 Core Definitions**

* **Master Account (Auth ID):** The human user entity (KYC, Login Credentials, Bank Details). One Master Account can own infinite Nodes.  
* **Node (Internal ID):** A distinct revenue-generating asset in the matrix. A user purchases Nodes (e.g., USR-001). Each Node has its own placement, referral code, and "Local Wallet."  
* **Node Status (Lifecycle State):**  
  * **INACTIVE (Probationary):** A Node that has purchased a package but has **\< 3 Direct Referrals**.  
    * *Restrictions:* Wallet Locked, Red Badge.  
    * *Risk:* Subject to Reclamation if the "Rolling 30-Day Timer" expires.  
  * **ACTIVE (Permanent):** A Node that has achieved **\>= 3 Direct Referrals**.  
    * *Privileges:* Wallet Unlocked, Green Badge, Immune to Inactivity Rules.  
* **Referral Identity:**  
  * **Code Format:** JSE-\[A-F0-9\]{6} (e.g., **JSE-0A475E**).  
  * **Link:** https://{app\_domain}/register?ref=JSE-0A475E

## **2\. Technical Stack & Architecture**

**Architecture:** **Headless REST API**. The Backend is a standalone service serving JSON. The Frontend (Web) is a separate client.

**Selected Stack:**

* **Backend:** Node.js \+ Express \+ TypeScript (API).  
* **Server:** HTTP Server instance (for Socket.io attachment).  
* **Database:** PostgreSQL (Data) \+ Redis (Queue/Cache).  
* **Frontend:** React \+ Vite \+ Tailwind CSS.  
* **Realtime:** Socket.io (Support Chat).  
* **Deployment:** Docker Compose.

## **3\. Financial Architecture & Entry Logic**

### **3.1 The Entry Split (Rs 1750\)**

| Component | Amount | Destination / Logic |
| :---- | :---- | :---- |
| **GST (Tax)** | Rs 300 | System\_Tax\_Wallet (Liability) |
| **Auto Pool Entry** | Rs 500 | Enters the **Global Matrix** algorithm. |
| **Self Pool Entry** | Rs 500 | Enters the **Sponsor Matrix** algorithm. |
| **Sponsor Bonus** | Rs 250 | Credited *instantly* to the Referrer's Master\_Wallet. |
| **Product Cost** | Rs 200 | System\_Logistics\_Wallet (Welcome Kit). |

### **3.2 Wallet Architecture (Two-Tier Security)**

1. **Tier 1: Local Node Wallet (Locked Asset):** Belongs to Node ID. Locked if Inactive.  
   * *Database Requirement:* Nodes table MUST have a wallet\_balance column.  
2. **Tier 2: Master Wallet (Liquid Cash):** Belongs to User. Receives unlocked funds.

### **3.3 Fast Achievement Bonus (Time-Sensitive)**

* **Time Window:** 10 Days from Node\_Activation\_Date.  
* **Rule:** One-Time Claim.  
* **Tiers:** 3 Refs (Rs 5k), 5 Refs (Rs 6k), 10 Refs (Rs 8k), 20 Refs (Rs 10k).

## **4\. The Matrix Engines & Genesis Logic**

### **4.0 Comparative Overview**

| Feature Category | Self Pool (Organic) | Auto Pool (Global) |
| :---- | :---- | :---- |
| **Primary Driver** | **Relationship / Effort** | **Time / Volume** |
| **Placement Anchor** | Relative to the **Sponsor's Node** | Relative to the **Company Root Node** |
| **Tree Structure** | **Unbalanced** (Some legs grow deep) | **Perfectly Balanced** (No gaps) |
| **Filling Logic** | Top-to-Bottom, Left-to-Right | **Layer-by-Layer**, Left-to-Right |

### **4.1 The Genesis Constraint (Root Node)**

* **Problem:** The first node cannot have a parent.  
* **Solution:** The Database Schema for Nodes must allow parent\_node\_id and sponsor\_node\_id to be **NULLABLE**.  
* **Bootstrapping:** A seed\_admin.ts script must run before any registration to create the **System Root Node** (JSE-ROOT).

### **4.2 Algorithm B: Auto Pool Placement (Redis-Powered)**

* **Logic:**  
  1. Worker pops Job from Redis Queue (NEW\_REGISTRATION or SPAWN\_REBIRTH).  
  2. Worker queries DB for the "Next Open Global Slot" (cached).  
  3. Worker inserts Node and updates the cache.

## **5\. The Transaction Sequencer (The Waterfall)**

Trigger: A Node N lands in Layer L relative to Parent P.  
Action: P processes the payout for Financial Level L.

### **5.1 Sequencer Logic (Pseudocode)**

FUNCTION ProcessPayout(BeneficiaryNode, Level, IncomingAmount):  
    Let EscrowBalance \= IncomingAmount  
      
    // PRIORITY 1: UPGRADE  
    Let UpgradeFee \= Config.levels\[Level\].upgradeFee  
    IF BeneficiaryNode.PaidUpgrades\[Level\] \< UpgradeFee:  
        Let Deduction \= MIN(EscrowBalance, UpgradeFee \- BeneficiaryNode.PaidUpgrades\[Level\])  
        BeneficiaryNode.PaidUpgrades\[Level\] \+= Deduction  
        EscrowBalance \-= Deduction  
        IF EscrowBalance \== 0: RETURN

    // PRIORITY 2: REBIRTH (System Growth)  
    Let RebirthFee \= Config.levels\[Level\].rebirth.cost  
    IF RebirthFee \> 0 AND BeneficiaryNode.RebirthsPaid\[Level\] \< RebirthFee:  
        Let Deduction \= MIN(EscrowBalance, RebirthFee)  
        EscrowBalance \-= Deduction  
          
        IF BeneficiaryNode.Type \== "MAIN":  
            // Pass origin\_node\_id so rebirths are linked to the wallet owner  
            RedisQueue.Push({ type: "SPAWN\_REBIRTH", owner\_id: BeneficiaryNode.id })  
        ELSE:  
            TransferToSystem("REBIRTH\_PENALTY", Deduction) // Sterile Node Profit  
              
        IF EscrowBalance \== 0: RETURN

    // PRIORITY 3: UPLINE SPLIT (50% Parent / 50% Grandparent)  
    Let TotalUplineShare \= Config.levels\[Level\].uplineShare  
    IF TotalUplineShare \> 0:  
        Let SplitAmount \= TotalUplineShare / 2  
        CreditNodeWallet(Parent, SplitAmount)  
        CreditNodeWallet(GrandParent, SplitAmount)  
        EscrowBalance \-= TotalUplineShare  
        IF EscrowBalance \== 0: RETURN

    // PRIORITY 4: SYSTEM/GIFT  
    Let SystemShare \= Config.levels\[Level\].systemFee  
    IF SystemShare \> 0:  
        TransferToSystem("ADMIN\_FEE", SystemShare)  
        EscrowBalance \-= SystemShare  
        IF EscrowBalance \== 0: RETURN

    // PRIORITY 5: WALLET  
    IF EscrowBalance \> 0:  
        // If Rebirth Node, credit Origin Node. If Main Node, credit Self.  
        let targetId \= BeneficiaryNode.origin\_node\_id || BeneficiaryNode.id  
        CreditNodeWallet(targetId, EscrowBalance)

## **6\. Node Governance & Lifecycle**

### **6.1 Transfer Protocol (P2P Trading)**

* **Constraint:** Only "Main Nodes" can be transferred.  
* **Process:** User Requests \-\> Admin Approves \-\> Ownership Updates.

### **6.2 The "Inactivity Reclamation" Clause**

* **Condition:** (CurrentDate \- LastActivityDate \> 30 Days) AND DirectReferrals \< 3\.  
* **Reset:** Bringing a referral resets the 30-Day timer.  
* **Immunity:** Reaching 3 Referrals removes the timer forever.

## **7\. Detailed Module Specifications**

### **7.1 User Dashboard**

* **Wallet Module:** "Add Funds" (Razorpay), "Request Payout".  
* **Node Shop:** Buy Node using Wallet Balance or Gateway.  
* **Genealogy:** Root-Centric View.  
* **Status Indicators:** Active (Green) / Inactive (Red).  
* **Fast Track Widget:** Countdown & Claim Button.  
* **Support Widget:** Quick Chat.

### **7.2 Admin Panel (Secured)**

* **Access Control:** Configurable Secret Route (e.g., /portal-secure).  
* **Modules:** News, Support, Sequencer Log, Claims Manager.  
* **Payout Manager:** Export CSV for Bulk Payouts.  
* **Impersonation Mode:** "Login as User" button.  
* **System Kill Switch:** Stored in SystemSettings table. Freeze operations.

### **7.3 Communication Hub (News & Updates)**

* **Admin:** POST News (Normal/Urgent).  
* **User:** Read News (Popup/Feed).

### **7.4 Support Desk (Chat Module)**

* **Architecture:** Socket.io (Realtime).

### **7.5 Public Frontend (Landing Page)**

* **Components:** Hero Banner, Scheme Logic, Login Button.

### **7.6 Claims Module (Fast Track Settlement)**

* **Workflow:** User Claims \-\> Admin Verifies \-\> Admin Enters Product Code \-\> Settled.

### **7.8 Notification Engine**

* **Triggers:**  
  * REGISTRATION\_SUCCESS:  
    * **To User:** Welcome Email (Creds) \+ SMS.  
    * **To Admin:** "New User Record" Email (contains User Creds \+ Mobile for manual support).  
  * REFERRAL\_JOINED: Email/SMS to Sponsor.  
  * COMMISSION\_CREDITED: Email/SMS.  
  * WITHDRAWAL\_PROCESSED: Email/SMS.

## **8\. Financial Parameters (Ref: plan\_config.json)**

See plan\_config.json for exact 3x10 Matrix values and payout tiers.