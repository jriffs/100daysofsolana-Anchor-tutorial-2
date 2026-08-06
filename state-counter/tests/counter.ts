import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { Counter } from "../target/types/counter";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";

describe("counter with config", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Counter as Program<Counter>;
  const admin = provider.wallet;

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  const [counterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter"), admin.publicKey.toBuffer()],
    program.programId
  );

  it("initializes config and a counter, then increments", async () => {
    await program.methods.initConfig().rpc();
    await program.methods.initCounter().rpc();
    await program.methods.increment().rpc();

    const counter = await program.account.counter.fetch(counterPda);
    assert.equal(counter.count.toNumber(), 1);
  });

  it("refuses to increment when paused", async () => {
    await program.methods.setPaused(true).rpc();
    try {
      await program.methods.increment().rpc();
      assert.fail("expected pause error");
    } catch (err: any) {
      assert.include(err.toString(), "Paused");
    }
    await program.methods.setPaused(false).rpc();
  });

  it("closes a counter and refunds the rent", async () => {
    const user = provider.wallet.publicKey;
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), user.toBuffer()],
      program.programId,
    );

    // Initialize a fresh counter if the previous test already closed it.
    const existing = await provider.connection.getAccountInfo(counterPda);
    if (existing === null) {
      await program.methods.initCounter().rpc();
    }

    const counterAccount = await provider.connection.getAccountInfo(counterPda);
    const rentLamports = counterAccount!.lamports;
    const balanceBefore = await provider.connection.getBalance(user);

    await program.methods.closeCounter().rpc();

    const counterAfter = await provider.connection.getAccountInfo(counterPda);
    const balanceAfter = await provider.connection.getBalance(user);

    if (counterAfter !== null) {
      throw new Error("counter account still exists after close");
    }

    console.log("rent refunded (lamports):", rentLamports);
    console.log("net wallet change (lamports):", balanceAfter - balanceBefore);
  });

  it("closes the account of another user without closing admins account", async () => {
    const new_user = Keypair.generate();
    const [newuserpda] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter"), new_user.publicKey.toBuffer()],
      program.programId
    );

    // fund new user so they can pay rent
    const sig = await provider.connection.requestAirdrop(
      new_user.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    const latest = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({ signature: sig, ...latest }, "confirmed");

    // Initialize a fresh admin counter if the previous test already closed it.
    const existing = await provider.connection.getAccountInfo(counterPda);
    if (existing === null) {
      await program.methods.initCounter().rpc();
    }

    await program.methods.initCounter().accounts({ user: new_user.publicKey })
      .signers([new_user])
      .rpc();

    await program.methods.closeCounter().accounts({user: new_user.publicKey}).signers([new_user]).rpc();

    const newUserCounterAfter = await provider.connection.getAccountInfo(newuserpda);
    const adminCounterAfter = await provider.connection.getAccountInfo(counterPda);

    if (newUserCounterAfter != null || adminCounterAfter == null) {
      throw new Error("The new users account is still akkkktiiiiiivvvveeeee oooo");
    }
    
  });
});