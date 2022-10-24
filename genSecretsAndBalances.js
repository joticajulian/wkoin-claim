const crypto = require("crypto");
const fs = require("fs");
const { Signer } = require("koilib");
const snapshot = require("./snapshot.json");

(async () => {
  const snapshotSecrets = snapshot.balances.map(b => {
    const signer = new Signer({
      privateKey: crypto.randomBytes(32),
    });
    return {
      secret: signer.getPrivateKey("wif", true),
      account: signer.address,
      hiveAccount: b.account,
      balance: b.balance,
    };
  });
  fs.writeFileSync(
    "./snapshotSecrets.json",
    JSON.stringify(snapshotSecrets, null, 2)
  );
})();