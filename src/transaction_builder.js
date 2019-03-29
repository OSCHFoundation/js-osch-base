import { UnsignedHyper } from 'js-xdr';
import BigNumber from 'bignumber.js';
import clone from 'lodash/clone';
import isUndefined from 'lodash/isUndefined';
import xdr from './generated/stellar-xdr_generated';
import { Keypair } from './keypair';
import { Transaction } from './transaction';
import { Memo } from './memo';

export const BASE_FEE = 100; // Stroops

/**
 * @constant
 * @see {@link TransactionBuilder#setTimeout}
 */
export const TimeoutInfinite = 0;

/**
 * <p>Transaction builder能帮助我们构建一个新的`{@link Transaction}`,首先使用传入的{@link Account}作为
 * "source account".Transaction将使用传入的{@link Account}的当前序列号作为其序列号，并将给定帐户的序列号递增一。
 * 给定的源帐户必须包含用于签名事务的私钥，否则将引发错误。
 *
 * <p>   Operations可以被相应的构建方法添加到transaction中。每次构建方法后都会再次返回TransactionBuilder对象，因此可以链式操作
 *  在添加所需要的Operations之后可以调用在`TransactionBuilder`调用`build()`方法，将返回一个完整的构造的
 * 可被签名的 `{@link Transaction}`。
 * 这个返回的transaction将包含序列号和源账户，和源账户的签名
 * 
 * <p><strong>注意使用不提交的transaction</strong>当构建一个trnsaction， osch-sdk
 * 将自动将来源账户的sequence number加一. 如果你没有提交这个交易而在这个账户发起了另一个交易。
 * 这个交易在发起时将失败 。因为该账户的sequence已经加一，必须更新transaction构建。
 *
 * <p>下面代码是创建包含 {@link Operation.createAccount}和{@link Operation.payment}的transaction实例
 * Transaction的来源账户`destinationA`, 发送一笔交易（payment）到`destinationB`.
 *  这个transaction应该被签名由`sourceKeypair`.</p>
 *
 * ```
 * var transaction = new TransactionBuilder(source)
 *  .addOperation(Operation.createAccount({
        destination: destinationA,
        startingBalance: "20"
    })) // <- funds and creates destinationA
    .addOperation(Operation.payment({
        destination: destinationB,
        amount: "100",
        asset: Asset.native()
    })) // <- sends 100 XLM to destinationB
 *   .setTimeout(30)
 *   .build();
 *
 * transaction.sign(sourceKeypair);
 * ```
 * @constructor
 * @param {Account} sourceAccount - The source account for this transaction.
 * @param {object} opts Options object
 * @param {number} opts.fee - The max fee willing to pay per operation in this transaction (**in stroops**). Required.
 * @param {object} [opts.timebounds] - The timebounds for the validity of this transaction.
 * @param {number|string|Date} [opts.timebounds.minTime] - 64 bit unix timestamp or Date object
 * @param {number|string|Date} [opts.timebounds.maxTime] - 64 bit unix timestamp or Date object
 * @param {Memo} [opts.memo] - The memo for the transaction
 */
export class TransactionBuilder {
  constructor(sourceAccount, opts = {}) {
    if (!sourceAccount) {
      throw new Error('must specify source account for the transaction');
    }
    this.source = sourceAccount;
    this.operations = [];

    if (isUndefined(opts.fee)) {
      // eslint-disable-next-line no-console
      console.log(
        '[TransactionBuilder] The `fee` parameter of `TransactionBuilder` is required. Future versions of this library will error if not provided.'
      );
    }

    this.baseFee = isUndefined(opts.fee) ? BASE_FEE : opts.fee;
    this.timebounds = clone(opts.timebounds) || null;
    this.memo = opts.memo || Memo.none();
    this.timeoutSet = false;
  }

  /**
   * Adds an operation to the transaction.
   * @param {xdr.Operation} operation The xdr operation object, use {@link Operation} static methods.
   * @returns {TransactionBuilder}
   */
  addOperation(operation) {
    this.operations.push(operation);
    return this;
  }

  /**
   * Adds a memo to the transaction.
   * @param {Memo} memo {@link Memo} object
   * @returns {TransactionBuilder}
   */
  addMemo(memo) {
    this.memo = memo;
    return this;
  }

  /**
   * Because of the distributed nature of Osch network it is possible that the status of your transaction
   * will be determined after a long time if the network is highly congested.
   * If you want to be sure to receive the status of the transaction within a given period you should set the
   * {@link TimeBounds} with <code>maxTime</code> on the transaction (this is what <code>setTimeout</code> does
   * internally; if there's <code>minTime</code> set but no <code>maxTime</code> it will be added).
   * Call to <code>TransactionBuilder.setTimeout</code> is required if Transaction does not have <code>max_time</code> set.
   * If you don't want to set timeout, use <code>{@link TimeoutInfinite}</code>. In general you should set
   * <code>{@link TimeoutInfinite}</code> only in smart contracts.
   *
   * Please note that Horizon may still return <code>504 Gateway Timeout</code> error, even for short timeouts.
   * In such case you need to resubmit the same transaction again without making any changes to receive a status.
   * This method is using the machine system time (UTC), make sure it is set correctly.
   * @param {number} timeout Number of seconds the transaction is good. Can't be negative.
   * If the value is `0`, the transaction is good indefinitely.
   * @return {TransactionBuilder}
   * @see TimeoutInfinite
   */
  setTimeout(timeout) {
    if (this.timebounds != null && this.timebounds.maxTime > 0) {
      throw new Error(
        'TimeBounds.max_time has been already set - setting timeout would overwrite it.'
      );
    }

    if (timeout < 0) {
      throw new Error('timeout cannot be negative');
    }

    this.timeoutSet = true;
    if (timeout > 0) {
      const timeoutTimestamp = Math.floor(Date.now() / 1000) + timeout;
      if (this.timebounds === null) {
        this.timebounds = { minTime: 0, maxTime: timeoutTimestamp };
      } else {
        this.timebounds = {
          minTime: this.timebounds.minTime,
          maxTime: timeoutTimestamp
        };
      }
    }

    return this;
  }

  /**
   * This will build the transaction.
   * It will also increment the source account's sequence number by 1.
   * @returns {Transaction} This method will return the built {@link Transaction}.
   */
  build() {
    // Ensure setTimeout called or maxTime is set
    if (
      (this.timebounds === null ||
        (this.timebounds !== null && this.timebounds.maxTime === 0)) &&
      !this.timeoutSet
    ) {
      throw new Error(
        'TimeBounds has to be set or you must call setTimeout(TimeoutInfinite).'
      );
    }

    const sequenceNumber = new BigNumber(this.source.sequenceNumber()).add(1);

    const attrs = {
      sourceAccount: Keypair.fromPublicKey(
        this.source.accountId()
      ).xdrAccountId(),
      fee: this.baseFee * this.operations.length,
      seqNum: xdr.SequenceNumber.fromString(sequenceNumber.toString()),
      memo: this.memo ? this.memo.toXDRObject() : null,
      ext: new xdr.TransactionExt(0)
    };

    if (this.timebounds) {
      if (isValidDate(this.timebounds.minTime)) {
        this.timebounds.minTime = this.timebounds.minTime.getTime() / 1000;
      }
      if (isValidDate(this.timebounds.maxTime)) {
        this.timebounds.maxTime = this.timebounds.maxTime.getTime() / 1000;
      }

      this.timebounds.minTime = UnsignedHyper.fromString(
        this.timebounds.minTime.toString()
      );
      this.timebounds.maxTime = UnsignedHyper.fromString(
        this.timebounds.maxTime.toString()
      );

      attrs.timeBounds = new xdr.TimeBounds(this.timebounds);
    }

    const xtx = new xdr.Transaction(attrs);
    xtx.operations(this.operations);

    const xenv = new xdr.TransactionEnvelope({ tx: xtx });
    const tx = new Transaction(xenv);

    this.source.incrementSequenceNumber();

    return tx;
  }
}

/**
 * Checks whether a provided object is a valid Date.
 * @argument {Date} d date object
 * @returns {boolean}
 */
export function isValidDate(d) {
  // isnan is okay here because it correctly checks for invalid date objects
  // eslint-disable-next-line no-restricted-globals
  return d instanceof Date && !isNaN(d);
}
