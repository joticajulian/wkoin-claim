import { System, Token, Storage, Base58 } from "@koinos/sdk-as";
import { Ownable } from "./Ownable";
import { claimWkoin } from "./proto/claimWkoin";
import { common } from "./proto/common";

const BALANCES_SPACE_ID = 0;
const INFO_SPACE_ID = 1;
const KOIN_CONTRACT_ID = Base58.decode("19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ");

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
      () => new claimWkoin.balance(0, false)
    );
    this.info = new Storage.Obj(
      this.contractId,
      INFO_SPACE_ID,
      claimWkoin.info.decode,
      claimWkoin.info.encode,
      () => new claimWkoin.info(0, 0, 0, 0)
    );
  }

  /**
   * Set initial values for general info. Only the contract can perform this operation.
   * @external
   */
  set_info(info: claimWkoin.info): common.boole {
    System.require(
      this.only_owner(),
      "owner has not authorized to update info"
    );
    this.info.put(info);
    System.event("set_info", this.callArgs!.args, []);
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
   * Create new balances in the accounts or update them.
   * Only the contract can perform this operation.
   * @external
   */
  set_balances(args: claimWkoin.list_balances): common.boole {
    System.require(
      args.accounts.length == args.balances.length,
      "accounts and balances length mismatch"
    );
    System.require(
      this.only_owner(),
      "owner has not authorized to update the balances"
    );
    for (let i = 0; i < args.accounts.length; i += 1) {
      this.balances.put(args.accounts[i], args.balances[i]);
    }
    System.event("set_balances", this.callArgs!.args, args.accounts);
    return new common.boole(true);
  }

  /**
   * Get balance info from an account
   * @external
   * @readonly
   */
  get_balance(args: claimWkoin.account): claimWkoin.balance {
    return this.balances.get(args.account!)!;
  }

  /**
   * Claim koins
   * @external
   */
  claim(args: claimWkoin.account): common.boole {
    const payee = System.getTransactionField("header.payee")!.bytes_value!;
    const balance = this.balances.get(payee)!;
    System.require(
      balance.token_amount > 0,
      "no KOIN claim with that address exists"
    );
    System.require(
      !balance.claimed,
      "KOIN has already been claimed for this address"
    );

    const koin = new Token(KOIN_CONTRACT_ID);
    const result = koin.transfer(
      this.contractId,
      args.account!,
      balance.token_amount
    );
    System.require(result, "could not transfer koin");

    balance.claimed = true;
    this.balances.put(payee, balance);

    const info = this.info.get()!;
    info.hive_accounts_claimed += 1;
    info.koin_claimed += balance.token_amount;
    this.info.put(info);

    System.event("claim", this.callArgs!.args, [args.account!]);
    return new common.boole(true);
  }

  /**
   * authorize function
   * @external
   */
  authorize(): common.boole {
    const authorized = this.only_owner();
    if (authorized) {
      System.event("authorize", this.callArgs!.args, []);
    }
    return new common.boole(authorized);
  }
}
