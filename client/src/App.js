import React, { Component } from "react";
// import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";

import config from './config'

import Client from '@liquality/client'

import BitcoinRpcProvider from '@liquality/bitcoin-rpc-provider'
import BitcoinNodeWalletProvider from '@liquality/bitcoin-node-wallet-provider'
import BitcoinSwapProvider from '@liquality/bitcoin-swap-provider'
import BitcoinNetworks from '@liquality/bitcoin-networks'

import EthereumRpcProvider from '@liquality/ethereum-rpc-provider'
import EthereumMetaMaskProvider from '@liquality/ethereum-metamask-provider'
import EthereumSwapProvider from '@liquality/ethereum-swap-provider'
import EthereumNetworks from '@liquality/ethereum-networks'

import { sha256 } from '@liquality/crypto'

import "./App.css"

const btcClient = new Client()
const ethClient = new Client()

const chains = {
  btc: btcClient,
  eth: ethClient
}


class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      web3: null, 
      accounts: null, 
      currentChain: 'btc',
      alternateChain: 'eth',
      initValue: 0,
      initRecipientAddress: '',
      initRefundAddress: '',
      initSecretHash: '',
      initExpiration: 0,
      initTx: '',
      claimValue: 0,
      claimRecipientAddress: '',
      claimRefundAddress: '',
      claimSecret: '',
      claimExpiration: 0,
      claimTx: '',
      claimedTx: '',
      refundTx: ''
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleChangeAmount = this.handleChangeAmount.bind(this)
    this.switchChain = this.switchChain.bind(this)
    this.initiateSwap = this.initiateSwap.bind(this)
    this.claimSwap = this.claimSwap.bind(this)
    this.refundSwap = this.refundSwap.bind(this)
  }

  handleChange (event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleChangeAmount (event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: parseInt(value)
    });
  }

  async componentDidMount() {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      btcClient.addProvider(new BitcoinRpcProvider(config.bitcoin.rpc.host, config.bitcoin.rpc.username, config.bitcoin.rpc.password))
      btcClient.addProvider(new BitcoinNodeWalletProvider(BitcoinNetworks[config.bitcoin.network], config.bitcoin.rpc.host, config.bitcoin.rpc.username, config.bitcoin.rpc.password, 'bech32'))
      btcClient.addProvider(new BitcoinSwapProvider({ network: BitcoinNetworks[config.bitcoin.network] }, 'p2wsh'))

      ethClient.addProvider(new EthereumRpcProvider(config.ethereum.rpc.host))
      ethClient.addProvider(new EthereumMetaMaskProvider(web3.currentProvider, EthereumNetworks[config.ethereum.network]))
      ethClient.addProvider(new EthereumSwapProvider())

      this.setState({ web3, accounts });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  async switchChain() {
    if (this.state.currentChain === 'btc') {
      this.setState({ currentChain: 'eth', alternateChain: 'btc'})
    } else {
      this.setState({ currentChain: 'btc', alternateChain: 'eth'})
    }
  }

  async initiateSwap() {
    const { currentChain, initValue, initRecipientAddress, initRefundAddress, initSecretHash, initExpiration } = this.state

    const initTx = await chains[currentChain].swap.initiateSwap(initValue, initRecipientAddress, initRefundAddress, initSecretHash, initExpiration)

    if (currentChain === 'btc') { await chains[currentChain].chain.generateBlock(1) }

    this.setState({ initTx })
  }

  async claimSwap () {
    const { alternateChain, claimTx, claimRecipientAddress, claimRefundAddress, claimSecret, claimExpiration } = this.state

    const claimedTx = await chains[alternateChain].swap.claimSwap(claimTx, claimRecipientAddress, claimRefundAddress, claimSecret, claimExpiration)

    if (alternateChain === 'btc') { await chains[alternateChain].chain.generateBlock(1) }

    this.setState({ claimedTx })
  }

  async refundSwap() {
    const { currentChain, initTx, initRecipientAddress, initRefundAddress, initSecretHash, initExpiration } = this.state

    const refundTx = await chains[currentChain].swap.refundSwap(initTx, initRecipientAddress, initRefundAddress, initSecretHash, initExpiration)

    if (currentChain === 'btc') { await chains[currentChain].chain.generateBlock(1) }

    this.setState({ refundTx })
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <div>
          <button onClick={this.switchChain}>Switch to {this.state.alternateChain}</button>
        </div>

        <h1>{this.state.currentChain.toUpperCase()} Initiate Swap</h1>

        <div>
          <label>
            Value:
            <input
              id="initValue"
              name="initValue"
              value={this.state.initValue}
              onChange={this.handleChangeAmount}
            />
          </label>
        </div>

        <div>
          <label>
            Recipient Address:
            <input
              id="initRecipientAddress"
              name="initRecipientAddress"
              value={this.state.initRecipientAddress}
              onChange={this.handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Refund Address:
            <input
              id="initRefundAddress"
              name="initRefundAddress"
              value={this.state.initRefundAddress}
              onChange={this.handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Secret Hash:
            <input
              id="initSecretHash"
              name="initSecretHash"
              value={this.state.initSecretHash}
              onChange={this.handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Expiration: 
            <input
              id="initExpiration"
              name="initExpiration"
              value={this.state.initExpiration}
              onChange={this.handleChangeAmount}
            />
          </label>
        </div>

        <button onClick={this.initiateSwap}>Initate Swap</button>

        <p>Tx: {this.state.initTx}</p>

        <br/><br/>

        <h1>{this.state.alternateChain.toUpperCase()} Claim Swap</h1>

        <div>
          <label>
            Tx:
            <input
              id="claimTx"
              name="claimTx"
              value={this.state.claimTx}
              onChange={this.handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Recipient Address:
            <input
              id="claimRecipientAddress"
              name="claimRecipientAddress"
              value={this.state.claimRecipientAddress}
              onChange={this.handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Refund Address:
            <input
              id="claimRefundAddress"
              name="claimRefundAddress"
              value={this.state.claimRefundAddress}
              onChange={this.handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Secret:
            <input
              id="claimSecret"
              name="claimSecret"
              value={this.state.claimSecret}
              onChange={this.handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Expiration: 
            <input
              id="claimExpiration"
              name="claimExpiration"
              value={this.state.claimExpiration}
              onChange={this.handleChangeAmount}
            />
          </label>
        </div>

        <button onClick={this.claimSwap}>Claim Swap</button>

        <p>Tx: {this.state.claimedTx}</p>

        <h1>{this.state.currentChain.toUpperCase()} Refund Swap</h1>

        <button onClick={this.refundSwap}>Refund Swap</button>

        <p>Tx: {this.state.refundTx}</p>
      </div>
    );
  }
}

export default App;
