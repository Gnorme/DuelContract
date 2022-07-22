# Vote-Contract

This project was started for completion of the NEAR Developer Certificate Program. I chose to build a contract that would be similar in functionality to the challenge system I will be making for the platform we’re building, AllSkills (https://allskills.ca).

At the core, the contract sets up a challenge between pieces of media that users can vote on to determine the winner. The contract is initialized with a chosen round length, number of opponents, and list of opponents to chose from. Users can vote more than once, and the time between is determined by a set cooldown. The system can be modified to accept challenges resulting in a tie, but currently If the challenge ends in a tie, the challenge goes in to overtime. After a winner is decided, a reward pool distribution is calculated. In the final system, all votes will be tokens that get distributed to voters and winners. 


This contract is written using AssemblyScript. I was in the process of building a factory for this contract and started to run in to some issues when I decided it would be best to switch over to using Rust. I’m using this as my submission for now though. 

# Deploy
To deploy the contract, follow these steps:
1. clone this repo locally
2. run yarn to install dependencies
3. run ./scripts/dev-deploy.sh and follow the on-screen instruction to deploy the contract

# Usage
Run ./scripts/run-duel.sh to simulate a duel
