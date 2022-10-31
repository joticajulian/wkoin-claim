const { Client, PrivateKey } = require("@hiveio/dhive");
const steem = require("@hivechain/steem-js");
const dotenv = require("dotenv");
const snapshotSecrets = require("./snapshotSecrets.json");

dotenv.config();

const rpcNode = "https://api.hive.blog";
const client = new Client(rpcNode);

(async () => {
  const accounts = await client.database.getAccounts(
    snapshotSecrets.map((s) => s.hiveAccount)
  );
  snapshotSecrets.forEach((s) => {
    if (!accounts.find((a) => a.name === s.hiveAccount)) {
      console.log(`Warning: Account ${s.hiveAccount} was not found in hive`);
    }
  });

  const operations = accounts.map((a) => {
    const { secret } = snapshotSecrets.find((s) => s.hiveAccount === a.name);
    const memo = [
      `# Hi ${a.name} 👋, the process to move your wrapped koins (wkoin)`,
      `to the mainnet of koinos blockchain is ready. Your secret to claim`,
      `the koins is: ${secret} . For more information see`,
      "https://peakd.com/@jga/how-to-claim-wkoin",
    ].join(" ");
    const encryptedMemo = steem.memo.encode(
      process.env.MEMO_KEY_HIVE,
      a.memo_key,
      memo
    );
    return [
      "transfer",
      {
        from: process.env.HIVE_ACCOUNT,
        to: a.name,
        amount: "0.001 HIVE",
        memo: encryptedMemo,
      },
    ];
  });
  console.log(operations);

  const response = await client.broadcast.sendOperations(
    operations,
    PrivateKey.fromString(process.env.ACTIVE_KEY_HIVE)
  );
  console.log(response);
})();
