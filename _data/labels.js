// Hand-curated wallet labels. Address keys are lowercase 0x-prefixed.
// Display label appears next to the shortened address in the UI.
//
// Two value forms:
//   "0x...": "Some Label"                          // simple label
//   "0x...": { label: "Some Vault", vault: true }  // known vault — excluded
//                                                  // from search by default,
//                                                  // shown with "Vaulted" badge
export default {
  "0xa858ddc0445d8131dac4d1de01f834ffcba52ef1": "Yuga Labs",
  "0x26f744711ee9e5079cbeaf318ba8a8e938844de6": "smithdavid888.eth",
  "0x577ebc5de943e35cdf9ecb5bbe1f7d7cb6c7c647": "Mr 703",
  "0xc6400a5584db71e41b0e5dfbdc769b54b91256cd": { label: "6529museum.eth", vault: true },
};
