import { Signer, Contract, Provider } from "koilib";
import * as dotenv from "dotenv";
import abi from "../build/claimwkoin-abi.json";

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

  const { result } = await contract.get_info();
  console.log(result);
}

main()
  .then(() => {})
  .catch((error) => console.error(error));
