import {
  System,
  Token,
  Storage,
  Base58,
  authority,
  Arrays,
  value,
  Protobuf,
  protocol,
} from "@koinos/sdk-as";
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
  claim(args: claimWkoin.claim_args): common.boole {
    System.require(
      System.checkAuthority(
        authority.authorization_type.contract_call,
        args.account!,
        this.callArgs!.args
      ),
      "account has not authorized the claim"
    );

    const balance = this.balances.get(args.account!)!;
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
      args.beneficiary!,
      balance.token_amount
    );
    System.require(result, "could not transfer koin");

    balance.claimed = true;
    this.balances.put(args.account!, balance);

    const info = this.info.get()!;
    info.hive_accounts_claimed += 1;
    info.koin_claimed += balance.token_amount;
    this.info.put(info);

    System.event("claim", this.callArgs!.args, [args.beneficiary!]);
    return new common.boole(true);
  }

  /**
   * authorize function
   * @external
   */
  authorize(args: authority.authorize_arguments): common.boole {
    // allow if it's the owner of the claim contract
    const ownerAuth = this.only_owner();
    if (ownerAuth) {
      System.event("authorize", this.callArgs!.args, []);
      return new common.boole(true);
    }

    // not the owner

    // authorize only mana delegations
    if (args.type != authority.authorization_type.transaction_application) {
      System.log("authorizations only for mana delegations");
      return new common.boole(false);
    }

    // only 1 operation
    const operations = Protobuf.decode<value.list_type>(
      System.getTransactionField("operations")!.message_value!.value!,
      value.list_type.decode
    );
    if (operations.values.length > 1) {
      System.log("Transaction must have only 1 operation");
      return new common.boole(false);
    }

    const operation = Protobuf.decode<protocol.operation>(
      operations.values[0].message_value!.value!,
      protocol.operation.decode
    );

    // only call contract
    if (operation.call_contract == null) {
      System.log("expected call contract operation");
      return new common.boole(false);
    }

    // mana delegations only on this contract
    if (!Arrays.equal(operation.call_contract!.contract_id, this.contractId)) {
      System.log("invalid contract id");
      return new common.boole(false);
    }

    return new common.boole(true);
  }
}
