import { hash } from './hashing';

/**
 *  当前包括公共网络的密钥:
 * * `Networks.PUBLIC`: `osch public network`
 * * `Networks.TESTNET`: `osch test network`
 * @type {{PUBLIC: string, TESTNET: string}}
 */
export const Networks = {
  PUBLIC: 'osch public network',
  TESTNET: 'osch test network'
};

let current = null;

/**
 *  Network类提供了一个帮助方法用来获取网络密码或id。
 * 它提供的 {@link Network.current} 类方法返回当进程使用的网络可以被用来网络签名 
 * 
 * 你应该选择选择添加好网络在创建transaction签名之前，可以用`use` helper methods.
 *
 * Creates a new `Network` object.
 * @constructor
 * @param {string} networkPassphrase Network passphrase
 */
export class Network {
  constructor(networkPassphrase) {
    this._networkPassphrase = networkPassphrase;
  }

  /**
   * Use Osch Public Network
   * @returns {void}
   */
  static usePublicNetwork() {
    this.use(new Network(Networks.PUBLIC));
  }

  /**
   * Use test network.
   * @returns {void}
   */
  static useTestNetwork() {
    this.use(new Network(Networks.TESTNET));
  }

  /**
   * Use network defined by Network object.
   * @param {Network} network Network to use
   * @returns {void}
   */
  static use(network) {
    current = network;
  }

  /**
   * @returns {Network} Currently selected network
   */
  static current() {
    return current;
  }

  /**
   * @returns {string} Network passphrase
   */
  networkPassphrase() {
    return this._networkPassphrase;
  }

  /**
   * @returns {string} Network ID (SHA-256 hash of network passphrase)
   */
  networkId() {
    return hash(this.networkPassphrase());
  }
}
