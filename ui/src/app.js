import React from "react";
import web3 from "./ethereum/web3";
import Ipfs from "ipfs-http-client";
import ipfsPublish from "./ipfs-publish";

import generateMetaevidence from "./ethereum/generate-meta-evidence";
import * as MultipleArbitrableTransactionWithFee from "./ethereum/multiple-arbitrable-transaction-with-fee";
import MultipleContract from "./ethereum/MultipleArbitrableTransactionWithFee.json";

import Container from "react-bootstrap/Container";
import Jumbotron from "react-bootstrap/Jumbotron";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import NewTransaction from "./new-transaction.js";
import Interact from "./interact.js";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      multipleArbitrableAddress: "0xc3b5fa1af1bcf1a9925d622e5fafca313089d03e",
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
    };
    this.ipfs = new Ipfs({
      host: "ipfs.kleros.io",
      port: 5001,
      protocol: "https",
    });

    window.MultArbContract = MultipleContract;
  }

  newTransaction = async (amount, payee, title, description) => {
    const {
      activeAddress,
      multipleArbitrableAddress,
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

    let result = await MultipleArbitrableTransactionWithFee.createTransaction(
      activeAddress,
      amount,
      multipleArbitrableAddress,
      timeoutPayment,
      payee,
      "/ipfs/" +
        ipfsHashMetaEvidenceObj[1]["hash"] +
        ipfsHashMetaEvidenceObj[0]["path"]
    );
    this.setState({
      lastTransactionID:
        result.events.MetaEvidence.returnValues._metaEvidenceID,
    });
    console.log(
      `Transaction created: ${result.transactionHash} and state updated`
    );
  };

  load = (contractAddress) =>
    MultipleArbitrableTransactionWithFee.contractInstance(contractAddress);

  onMultArbAddressChange = async (e) => {
    const targetMultArbAddress = e.target.value.trim();
    try {
      this.setState({
        multipleArbitrableAddress: (await MultipleArbitrableTransactionWithFee.contractInstance(
          targetMultArbAddress
        ))._address,
      });
      console.log(`Mult Arb address: ${targetMultArbAddress}`);
    } catch (e) {
      alert("Failing. Deploy new one instead.");
      this.setState({ multipleArbitrableAddress: "ERROR" });
    }
  };

  onDeployMultArbButtonClick = async (e) => {
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
      multipleArbitrableAddress: multipleArbitrableInstance._address,
    });
    console.log(
      `Mounted. MultipleAribtrableInstace at: ${
        multipleArbitrableInstance._address
      }`
    );
  };

  async componentDidMount() {
    if (window.web3 && window.web3.currentProvider.isMetaMask) {
      window.web3.eth.getAccounts((_, accounts) => {
        this.setState({
          activeAddress: accounts[0],
        });
        console.log("Account recognized");
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
      multipleArbitrableAddress,
      lastTransactionID,
      defaultPayee,
      activeAddress,
    } = this.state;
    return (
      <Container>
        <Row>
          <Col>
            <h1 className="text-center my-5"> Defiant Transaction Escrow </h1>{" "}
            <Row>
              <p>
                <Button
                  type="submit"
                  variant="outline-primary"
                  onClick={this.onDeployMultArbButtonClick}
                >
                  Deploy Multiple Arbitrator with Fee{" "}
                </Button>{" "}
              </p>{" "}
              <Form.Group controlId="escrow-address">
                <Form.Control
                  className="text-center"
                  as="input"
                  rows="1"
                  value={multipleArbitrableAddress}
                  onChange={this.onMultArbAddressChange}
                />
              </Form.Group>
              <p>
                <Badge
                  className="m-1"
                  pill
                  variant="info"
                >{`Deployed at: ${multipleArbitrableAddress}`}</Badge>
              </p>
            </Row>
          </Col>{" "}
        </Row>{" "}
        <Row>
          <Col>
            <NewTransaction
              newTransactionCallback={this.newTransaction}
              defaultPayee={defaultPayee}
            />{" "}
          </Col>{" "}
          <Col>
            <Interact
              // arbitratorCallback={this.arbitrator}
              // arbitrationCostCallback={this.arbitrationCost}
              activeAddress={activeAddress}
              escrowAddress={multipleArbitrableAddress}
              transactionID={lastTransactionID}
              transactionIDCallback={this.transactionIDCallback}
              // reclaimFundsCallback={
              //   this.reclaimFunds // loadCallback={this.load}
              // }
              // releaseFundsCallback={this.releaseFunds}
              // depositArbitrationFeeForPayeeCallback={
              //   this.depositArbitrationFeeForPayee
              // }
              // remainingTimeToReclaimCallback={this.remainingTimeToReclaim}
              // remainingTimeToDepositArbitrationFeeCallback={
              //   this.remainingTimeToDepositArbitrationFee
              // }
              // statusCallback={this.status}
              // valueCallback={this.value}
              // submitEvidenceCallback={this.submitEvidence}
            />{" "}
          </Col>{" "}
        </Row>{" "}
        <Row>
          <Col>
            <Form action="https://centralizedarbitrator.netlify.com">
              <Jumbotron className="m-5 text-center">
                <h1> Need to interact with your arbitrator contract ? </h1>{" "}
                <p>
                  We have a general purpose user interface for centralized
                  arbitrators(like we have developed in the tutorial) already.{" "}
                </p>{" "}
                <p>
                  <Button type="submit" variant="primary">
                    Visit Centralized Arbitrator Dashboard{" "}
                  </Button>{" "}
                </p>{" "}
              </Jumbotron>{" "}
            </Form>{" "}
          </Col>{" "}
        </Row>{" "}
      </Container>
    );
  }
}

export default App;
