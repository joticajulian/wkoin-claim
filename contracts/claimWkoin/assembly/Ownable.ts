import { System, Storage, authority } from "@koinos/sdk-as";
import { ownable } from "./proto/ownable";
import { common } from "./proto/common";

// make sure to not use this id in the contract childs
const OWNER_SPACE_ID = 100;

export class Ownable {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array;
  owner: Storage.Obj<ownable.owner>;

  constructor() {
    this.contractId = System.getContractId();
    this.owner = new Storage.Obj(
      this.contractId,
      OWNER_SPACE_ID,
      ownable.owner.decode,
      ownable.owner.encode,
      null
    );
  }

  only_owner(): boolean {
    const owner = this.owner.get();
    if (!owner) {
      /**
       * any account can take the ownership at the beginning.
       * This means that this function must be called right
       * after the contract is uploaded
       */
      return true;
    }

    if (
      !System.checkAuthority(
        authority.authorization_type.contract_call,
        owner.account!,
        this.callArgs!.args
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Set owner
   * @external
   */
  set_owner(newOwner: ownable.owner): common.boole {
    System.require(
      this.only_owner(),
      "owner has not authorized to change the owner"
    );
    this.owner.put(newOwner);
    System.event("set_owner", this.callArgs!.args, [newOwner.account!]);
    return new common.boole(true);
  }

  /**
   * Get owner
   * @external
   * @readonly
   */
  get_owner(): ownable.owner {
    const owner = this.owner.get();
    if (!owner) return new ownable.owner();
    return owner;
  }
}
