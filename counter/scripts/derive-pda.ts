import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("Hoc6XZ1V9Fu4AEystdYZaoQ7zbo3FHY8uFX1abqrDVUV");

const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("counter")],
  programId
);

console.log("Seeds:        [\"counter\"]");
console.log("Program ID:   ", programId.toBase58());
console.log("PDA:          ", pda.toBase58());
console.log("Canonical bump:", bump);