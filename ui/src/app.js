import React from "react";
import web3 from "./ethereum/web3";
import generateEvidence from "./ethereum/generate-evidence";
import generateMetaevidence from "./ethereum/generate-meta-evidence";
import * as SimpleEscrowWithERC1497 from "./ethereum/simple-escrow-with-erc1497";
import * as MultipleArbitrableTransactionWithFee from "./ethereum/multiple-arbitrable-transaction-with-fee";
import MultipleContract from "./ethereum/MultipleArbitrableTransactionWithFee.json";

import * as Arbitrator from "./ethereum/arbitrator";
import Ipfs from "ipfs-http-client";
import ipfsPublish from "./ipfs-publish";

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
      activeAddress: "0x0000000000000000000000000000000000000000",
      multipleArbitrableAddress: "0x0962606142d3a3C0caF73CDc763EA1B79acD10D0",
      defaultPayee: "0x3623e33DE3Aa9cc60b300251fbDFA4ac29Fe1CFD",
      feeRecipient: "0xef5585851da91ab525839F6E8a7D4600Db77ea0c",
      arbitratorAddress: "0x0d1D0F28A9Ef572CDEB10FF4300146da1F84F0d5",
      arbitratorExtraData: web3.utils.utf8ToHex(0),
      feeTimeout: 5 * 60,
      feeRecipientBasisPoint: 500,
      timeoutPayment: 100,
      arbitrationFee: 20,
      lastTransactionID: null,
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

  reclaimFunds = async (contractAddress, value) => {
    const { activeAddress } = this.state;
    await MultipleArbitrableTransactionWithFee.reclaimFunds(
      activeAddress,
      contractAddress,
      value
    );
  };

  status = (contractAddress, transactionID) =>
    MultipleArbitrableTransactionWithFee.status(contractAddress, transactionID);

  // releaseFunds = async (contractAddress) => {
  //   const { activeAddress } = this.state;

  //   await SimpleEscrowWithERC1497.releaseFunds(activeAddress, contractAddress);
  // };

  // depositArbitrationFeeForPayee = (contractAddress, value) => {
  //   const { activeAddress } = this.state;

  //   SimpleEscrowWithERC1497.depositArbitrationFeeForPayee(
  //     activeAddress,
  //     contractAddress,
  //     value
  //   );
  // };

  // reclamationPeriod = (contractAddress) =>
  //   SimpleEscrowWithERC1497.reclamationPeriod(contractAddress);

  // arbitrationFeeDepositPeriod = (contractAddress) =>
  //   SimpleEscrowWithERC1497.arbitrationFeeDepositPeriod(contractAddress);

  // remainingTimeToReclaim = (contractAddress) =>
  //   SimpleEscrowWithERC1497.remainingTimeToReclaim(contractAddress);

  // remainingTimeToDepositArbitrationFee = (contractAddress) =>
  //   SimpleEscrowWithERC1497.remainingTimeToDepositArbitrationFee(
  //     contractAddress
  //   );

  // arbitrationCost = (arbitratorAddress, extraData) =>
  //   Arbitrator.arbitrationCost(arbitratorAddress, extraData);

  // arbitrator = (contractAddress) =>
  //   SimpleEscrowWithERC1497.arbitrator(contractAddress);

  // value = (contractAddress) => SimpleEscrowWithERC1497.value(contractAddress);

  // submitEvidence = async (contractAddress, evidenceBuffer) => {
  //   const { activeAddress } = this.state;

  //   const result = await ipfsPublish("name", evidenceBuffer);

  //   let evidence = generateEvidence(
  //     "/ipfs/" + result[0]["hash"],
  //     "name",
  //     "description"
  //   );
  //   const enc = new TextEncoder();
  //   const ipfsHashEvidenceObj = await ipfsPublish(
  //     "evidence.json",
  //     enc.encode(JSON.stringify(evidence))
  //   );

  //   SimpleEscrowWithERC1497.submitEvidence(
  //     contractAddress,
  //     activeAddress,
  //     "/ipfs/" + ipfsHashEvidenceObj[0]["hash"]
  //   );
  // };

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
            <Row style={{ justifyContent: "center" }}>
              <h3>{`Last interaction ID ${lastTransactionID}`}</h3>
            </Row>
            <Interact
              arbitratorCallback={this.arbitrator}
              arbitrationCostCallback={this.arbitrationCost}
              escrowAddress={multipleArbitrableAddress}
              transactionID={lastTransactionID}
              transactionIDCallback={this.transactionIDCallback}
              reclaimFundsCallback={
                this.reclaimFunds // loadCallback={this.load}
              }
              releaseFundsCallback={this.releaseFunds}
              depositArbitrationFeeForPayeeCallback={
                this.depositArbitrationFeeForPayee
              }
              remainingTimeToReclaimCallback={this.remainingTimeToReclaim}
              remainingTimeToDepositArbitrationFeeCallback={
                this.remainingTimeToDepositArbitrationFee
              }
              statusCallback={this.status}
              valueCallback={this.value}
              submitEvidenceCallback={this.submitEvidence}
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
