import { System, Token, authority, Storage, Base58 } from "@koinos/sdk-as";
import { Ownable } from "./Ownable";
import { claimWkoin } from "./proto/claimWkoin";
import { common } from "./proto/common";

const BALANCES_SPACE_ID = 0;
const INFO_SPACE_ID = 1;

export class ClaimWkoin extends Ownable {
  callArgs: System.getArgumentsReturn | null;

  balances: Storage.Map<Uint8Array, claimWkoin.balance>;
  info: Storage.Obj<claimWkoin.info>;

  constructor() {
    super();
    this.balances = new Storage.Map(
      this.contractId,
      BALANCES_SPACE_ID,
      claimWkoin.balance.decode,
      claimWkoin.balance.encode,
      null
    );
    this.info = new Storage.Obj(
      this.contractId,
      INFO_SPACE_ID,
      claimWkoin.info.decode,
      claimWkoin.info.encode,
      () => new claimWkoin.info(0, 0, 0, 0),
    );
  }

  /**
   * Set initial values for general info
   * @external
   */
  set_info(info: claimWkoin.info): common.boole {
    System.require(this.only_owner(), "owner has not authorized to update info");
    this.info.put(info);
    return new common.boole(true);
  }

  /**
   * Get general statistics
   * @external
   * @readonly
   */
  get_info(): claimWkoin.info {
    return this.info.get()!;
  }

  /**
   * Claim koins
   * @external
   */
  claim(args: claimWkoin.claim_args): common.boole {
    const payee = System.getTransactionField("header.payee")!.bytes_value!;
    const balance = this.balances.get(payee);
    System.require(balance != null, "no KOIN claim with that address exists");
    System.require(!balance!.claimed, "KOIN has already been claimed for this address");
    
    const koin = new Token(Base58.decode(""));
    const result = koin.transfer(
      this.contractId,
      args.account!,
      balance!.token_amount
    );
    System.require(result, "could not transfer koin");

    balance!.claimed = true;
    this.balances.put(payee, balance!);

    const info = this.info.get()!;
    info.hive_accounts_claimed += 1;
    info.koin_claimed += balance!.token_amount;
    this.info.put(info);

    return new common.boole(true);
  }

  /**
   * authorize function
   * @external
   */
  authorize(args: authority.authorize_arguments): common.boole {
    return this.only_owner();
  }
}
