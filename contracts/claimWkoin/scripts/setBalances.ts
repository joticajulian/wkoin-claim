import { Signer, Contract, Provider } from "koilib";
import * as dotenv from "dotenv";
import abi from "../build/claimwkoin-abi.json";
import snapshotSecrets from "../../../snapshotSecrets.json";

dotenv.config();

const privateKeyManaSupporter = process.env.PRIVATE_KEY_MANA_SUPPORTER ?? "";
const privateKeyContract = process.env.PRIVATE_KEY_CONTRACT ?? "";

async function main() {
  // const provider = new Provider(["http://api.koinos.io:8080"]);
  const provider = new Provider(["https://api.koinosblocks.com"]);
  const owner = Signer.fromWif(privateKeyManaSupporter);
  const contractId = Signer.fromWif(privateKeyContract).address;
  owner.provider = provider;

  const contract = new Contract({
    id: contractId,
    signer: owner,
    abi,
    provider,
  }).functions;

  const { receipt, transaction } = await contract.set_balances({
    accounts: snapshotSecrets.map(s => s.account),
    balances: snapshotSecrets.map(s => ({
      token_amount: s.balance,
      claimed: false,
    })),
  });
  console.log("Transaction submitted. Receipt: ");
  console.log(receipt);
  const { blockNumber } = await transaction.wait("byBlock", 60000);
  console.log(`Transaction mined in block number ${blockNumber}`);
}

main()
  .then(() => {})
  .catch((error) => console.error(error));
