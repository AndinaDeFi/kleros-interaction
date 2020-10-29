import React from "react";
import web3 from "./ethereum/web3";
import Ipfs from "ipfs-http-client";
import ipfsPublish from "./ipfs-publish";
import generateMetaevidence from "./ethereum/generate-meta-evidence";

import * as MultipleArbitrableTransactionWithFee from "./ethereum/multiple-arbitrable-transaction-with-fee";
import * as MultipleArbitrableTokenTransactionWithFee from "./ethereum/multiple-arbitrable-token-transaction-with-fee";

import TransactionEscrow from "./ethereum/MultipleArbitrableTransactionWithFee.json";
import TokenTransactionEscrow from "./ethereum/MultipleArbitrableTokenTransactionWithFee.json";

import Container from "react-bootstrap/Container";
// import Jumbotron from "react-bootstrap/Jumbotron";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Card from "react-bootstrap/Card";
import NewTransaction from "./new-transaction.js";
import Interact from "./interact.js";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.tokenAddresses = {
      erc20: "0xd6d519bcEF3eF45DB9604B72737766Ef7A6eC599",
    };
    this.state = {
      transacEscrowAddress: "0xc3b5fa1af1bcf1a9925d622e5fafca313089d03e",
      tokenEscrowAddress: "0x01965a722CB883Dd2516BBFFF21868D641bF2CBD",
      arbitratorAddress: "0xb304fe074073ec2dc4ada34d066d0db968bbecdd",
      activeAddress: "0x0000000000000000000000000000000000000000",
      defaultPayee: "0x3623e33DE3Aa9cc60b300251fbDFA4ac29Fe1CFD",
      feeRecipient: "0xef5585851da91ab525839F6E8a7D4600Db77ea0c",
      feeTimeout: 5 * 60,
      feeRecipientBasisPoint: 500,
      timeoutPayment: 100,
      arbitrationFee: 100,
      lastTransactionID: null,
      arbitratorExtraData: web3.utils.utf8ToHex(0),
      coin: "rbtc",
    };
    this.ipfs = new Ipfs({
      host: "ipfs.kleros.io",
      port: 5001,
      protocol: "https",
    });

    window.MultArbContract = TransactionEscrow;
  }

  coinChange = (coin) => {
    this.setState({ coin });
  };

  newTransaction = async (
    amount,
    payee,
    title,
    description,
    tokenAddress = null
  ) => {
    const {
      activeAddress,
      transacEscrowAddress,
      tokenEscrowAddress,
      timeoutPayment,
    } = this.state;

    let metaevidence = generateMetaevidence(
      web3.utils.toChecksumAddress(activeAddress),
      web3.utils.toChecksumAddress(payee),
      amount,
      title,
      description
    );
    const enc = new TextEncoder();
    const ipfsHashMetaEvidenceObj = await ipfsPublish(
      "metaEvidence.json",
      enc.encode(JSON.stringify(metaevidence))
    );
    let result;
    if (tokenAddress === null) {
      result = await MultipleArbitrableTransactionWithFee.createTransaction(
        activeAddress,
        amount,
        transacEscrowAddress,
        timeoutPayment,
        payee,
        "/ipfs/" +
          ipfsHashMetaEvidenceObj[1]["hash"] +
          ipfsHashMetaEvidenceObj[0]["path"]
      );
    } else {
      result = await MultipleArbitrableTokenTransactionWithFee.createTransaction(
        activeAddress,
        amount,
        tokenAddress,
        tokenEscrowAddress,
        timeoutPayment,
        payee,
        "/ipfs/" +
          ipfsHashMetaEvidenceObj[1]["hash"] +
          ipfsHashMetaEvidenceObj[0]["path"]
      );
    }
    this.setState({
      lastTransactionID:
        result.events.MetaEvidence.returnValues._metaEvidenceID,
    });
    console.log(
      `Transaction created: ${result.transactionHash} and state updated`
    );
  };

  // load = (contractAddress) =>
  //   MultipleArbitrableTransactionWithFee.contractInstance(contractAddress);

  onTransacEscrowAddressChange = async (e) => {
    const targetMultArbAddress = e.target.value.trim();
    try {
      this.setState({
        transacEscrowAddress: (await MultipleArbitrableTransactionWithFee.contractInstance(
          targetMultArbAddress
        ))._address,
      });
      console.log(`Transaction Escrow address: ${targetMultArbAddress}`);
    } catch (e) {
      alert("Failing. Deploy new one instead.");
      this.setState({ transacEscrowAddress: "ERROR" });
    }
  };

  onTokenEscrowAddressChange = async (e) => {
    const targetMultArbAddress = e.target.value.trim();
    try {
      this.setState({
        tokenEscrowAddress: (await MultipleArbitrableTokenTransactionWithFee.contractInstance(
          targetMultArbAddress
        ))._address,
      });
      console.log(`Token Escrow address: ${targetMultArbAddress}`);
    } catch (e) {
      alert("Failing. Deploy new one instead.");
      this.setState({ tokenEscrowAddress: "ERROR" });
    }
  };

  onDeployTransacEscrowClick = async (e) => {
    e.preventDefault();
    const {
      activeAddress,
      arbitratorAddress,
      arbitratorExtraData,
      feeRecipient,
      feeRecipientBasisPoint,
      feeTimeout,
    } = this.state;
    const multipleArbitrableInstance = await MultipleArbitrableTransactionWithFee.deploy(
      activeAddress,
      arbitratorAddress,
      arbitratorExtraData,
      feeRecipient,
      feeRecipientBasisPoint,
      feeTimeout
    );
    this.setState({
      transacEscrowAddress: multipleArbitrableInstance._address,
    });
  };

  onDeployTokenEscrowClick = async (e) => {
    e.preventDefault();
    const {
      activeAddress,
      arbitratorAddress,
      arbitratorExtraData,
      feeRecipient,
      feeRecipientBasisPoint,
      feeTimeout,
    } = this.state;
    const multipleArbitrableInstance = await MultipleArbitrableTokenTransactionWithFee.deploy(
      activeAddress,
      arbitratorAddress,
      arbitratorExtraData,
      feeRecipient,
      feeRecipientBasisPoint,
      feeTimeout
    );
    console.log(`Deployed at ${multipleArbitrableInstance._address}`);
    this.setState({
      tokenEscrowAddress: multipleArbitrableInstance._address,
    });
  };

  async componentDidMount() {
    if (window.web3 && window.web3.currentProvider.isMetaMask) {
      window.web3.eth.getAccounts((_, accounts) => {
        this.setState({
          activeAddress: accounts[0],
        });
      });
    } else console.error("MetaMask account not detected :(");

    window.ethereum.on("accountsChanged", (accounts) => {
      this.setState({
        activeAddress: accounts[0],
      });
    });
  }

  render() {
    const {
      transacEscrowAddress,
      tokenEscrowAddress,
      lastTransactionID,
      defaultPayee,
      activeAddress,
      coin,
    } = this.state;
    return (
      <Container>
        <Row style={{ marginBottom: "20px" }}>
          <Col>
            <h1 className="text-center my-5"> Defiant Transaction Escrow </h1>{" "}
            <Row>
              <Col>
                <Card className="h-100 my-4 text-center">
                  <Card.Body>
                    <Card.Title>Transaction Escrow</Card.Title>
                    <p>
                      <Button
                        type="submit"
                        variant="primary"
                        onClick={this.onDeployTransacEscrowClick}
                      >
                        Deploy new contract{" "}
                      </Button>{" "}
                    </p>{" "}
                    <Form.Group controlId="transac-escrow-address">
                      <Form.Control
                        className="text-center"
                        as="input"
                        rows="1"
                        value={transacEscrowAddress}
                        onChange={this.onTransacEscrowAddressChange}
                      />
                    </Form.Group>
                    <p>
                      <Badge
                        className="m-1"
                        pill
                        variant="info"
                      >{`Deployed at: ${transacEscrowAddress}`}</Badge>
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              <Col>
                <Card className="h-100 my-4 text-center">
                  <Card.Body>
                    <Card.Title>Token Escrow</Card.Title>
                    <p>
                      <Button
                        type="submit"
                        variant="primary"
                        onClick={this.onDeployTokenEscrowClick}
                      >
                        Deploy new contract{" "}
                      </Button>{" "}
                    </p>{" "}
                    <Form.Group controlId="etoken-scrow-address">
                      <Form.Control
                        className="text-center"
                        as="input"
                        rows="1"
                        value={tokenEscrowAddress}
                        onChange={this.onTokenEscrowAddressChange}
                      />
                    </Form.Group>
                    <p>
                      <Badge
                        className="m-1"
                        pill
                        variant="info"
                      >{`Deployed at: ${tokenEscrowAddress}`}</Badge>
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Col>{" "}
        </Row>{" "}
        <Row>
          <Col>
            <NewTransaction
              newTransactionCallback={this.newTransaction}
              coinChangeCallback={this.coinChange}
              defaultPayee={defaultPayee}
              activeAddress={activeAddress}
              tokenEscrowAddress={tokenEscrowAddress}
              tokenAddresses={this.tokenAddresses}
            />{" "}
          </Col>{" "}
          <Col>
            <Interact
              activeAddress={activeAddress}
              tokenEscrowAddress={tokenEscrowAddress}
              transacEscrowAddress={transacEscrowAddress}
              transactionID={lastTransactionID}
              tokenAddresses={this.tokenAddresses}
              coin={coin}
            />{" "}
          </Col>{" "}
        </Row>{" "}
      </Container>
    );
  }
}

export default App;
