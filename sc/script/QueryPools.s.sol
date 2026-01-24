// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// import "forge-std/Script.sol";
// import "../src/DAO/ZKTCore.sol";

// contract QueryPools is Script {
//     function run() external view {
//         ZKTCore dao = ZKTCore(0xabb2df0eb530c8317845f6dcd54a3b2fca9cd6a9);
        
//         uint256 totalPools = dao.poolCount();
//         console.log("Total pools:", totalPools);
        
//         for (uint256 i = 1; i <= totalPools; i++) {
//             IPoolManager.CampaignPool memory pool = dao.getPool(i);
//             console.log("\n=== Pool", i, "===");
//             console.log("Proposal ID:", pool.proposalId);
//             console.log("Title:", pool.campaignTitle);
//             console.log("Organizer:", pool.organizer);
//         }
//     }
// }