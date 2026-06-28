# Donor Tiers Vault

_type: coding_task_

### Donor Tiers Vault

**The Scenario** You're writing the contract layer for a charity platform. Anyone can send ETH along with a short message; the contract classifies each donor by their total contributed amount and lets the frontend query each donor's full history.

**What You'll Build** A single contract called `DonorVault` that records every donation as a struct, classifies donors into a tier enum based on cumulative amount, tracks the unique donor count, and exposes the view functions the frontend needs.

**Requirements**

1. **Tier Enum:** The contract MUST define an enum `Tier` with these values, in this exact order: `None`, `Bronze`, `Silver`, `Gold`, `Platinum`.
2. **Tier Boundaries:** A donor's tier MUST be derived from their cumulative total in wei according to these strict boundaries:
  - **None:** total = 0
  - **Bronze:** 0 < total < 0.1 ether
  - **Silver:** 0.1 ether ≤ total < 1 ether
  - **Gold:** 1 ether ≤ total < 10 ether
  - **Platinum:** 10 ether ≤ total *(Test cases to check your math: 0 is None. 1 wei is Bronze. Exactly 0.1 ether is Silver. Exactly 10 ether is Platinum.)*
3. **The Donation Struct:** You MUST define a `Donation` struct containing `amount` , `timestamp` , and `message`  **in that exact order**.
4. **The Donate Function:** The function `donate(string calldata message)` MUST be `external payable`.
  - It MUST revert with a custom error `ZeroDonation()` if `msg.value` is 0.
  - It MUST record the `Donation` in that donor's history.
  - It MUST update the donor's cumulative total correctly.
5. **Unique Donors:** The contract MUST track the count of unique donors. Subsequent donations from the same address MUST NOT increment that count.
6. **Storage:** Donor history MUST be stored exactly as `mapping(address => Donation[])`. Do not use a flat array, and do not wrap the array inside another struct.
7. **View Functions:** The view functions `tierOf`, `donationCount`, `getDonation`, `uniqueDonorCount`, and `totalDonatedBy` MUST behave as named and match the signatures shown in the starter code.
