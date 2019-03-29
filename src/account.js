import BigNumber from 'bignumber.js';
import isString from 'lodash/isString';
import { StrKey } from './strkey';

/**
 *  创建Account对象.
 *
 * `Account`返回在Oschain链上的账户和它的序列号 (sequence)
 * Account中跟踪的sequence将被用在 {@link TransactionBuilder}.
 * @constructor
 * @param {string} accountId ID of the account (ex. `GB3KJPLFUYN5VL6R3GU3EGCGVCKFDSD7BEDX42HWG5BWFKB3KQGJJRMA`)
 * @param {string} sequence current sequence number of the account
 */
export class Account {
  constructor(accountId, sequence) {
    if (!StrKey.isValidEd25519PublicKey(accountId)) {
      throw new Error('accountId is invalid');
    }
    if (!isString(sequence)) {
      throw new Error('sequence must be of type string');
    }
    this._accountId = accountId;
    this.sequence = new BigNumber(sequence);
  }

  /**
   * Returns Oschain account ID, ex. `GB3KJPLFUYN5VL6R3GU3EGCGVCKFDSD7BEDX42HWG5BWFKB3KQGJJRMA`
   * @returns {string}
   */
  accountId() {
    return this._accountId;
  }

  /**
   * @returns {string}
   */
  sequenceNumber() {
    return this.sequence.toString();
  }

  /**
   * Increments sequence number in this object by one.
   * @returns {void}
   */
  incrementSequenceNumber() {
    this.sequence = this.sequence.add(1);
  }
}
