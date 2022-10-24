const fs = require("fs");
const axios = require("axios");
const { utils } = require("koilib");

(async () => {
  const response = await axios.post(
    "https://api.hive-engine.com/rpc/contracts",
    {
      jsonrpc: "2.0",
      id: 1,
      method: "find",
      params: {
        contract: "tokens",
        table: "balances",
        query: {
          symbol: "WKOIN",
        },
        offset: 0,
        limit: 1000,
      },
    }
  );

  let total = BigInt(0);
  const balances = [];
  response.data.result.forEach((b) => {
    let balance = BigInt(utils.parseUnits(b.balance, 8));
    if (balance <= 0 || ["koin.app", "harpagon"].includes(b.account)) return;
    balances.push({
      account: b.account,
      balance: balance.toString(),
    });
    total += balance;
  });

  fs.writeFileSync(
    "./snapshot.json",
    JSON.stringify(
      {
        balances,
        total: total.toString(),
      },
      null,
      2
    )
  );

  console.log({
    total_hive_accounts: balances.length,
    hive_accounts_claimed: 0,
    total_koin: total.toString(),
    koin_claimed: "0",
  });
})();
