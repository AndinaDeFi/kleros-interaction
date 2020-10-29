import web3 from "./ethereum/web3";
import ipfsPublish from "./ipfs-publish";
import generateEvidence from "./ethereum/generate-evidence";

import React from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ListGroup from "react-bootstrap/ListGroup";
import Card from "react-bootstrap/Card";
import InputGroup from "react-bootstrap/InputGroup";

import * as MultipleArbitrableTransactionWithFee from "./ethereum/multiple-arbitrable-transaction-with-fee";
import * as MultipleArbitrableTokenTransactionWithFee from "./ethereum/multiple-arbitrable-token-transaction-with-fee";
import * as Arbitrator from "./ethereum/arbitrator";

import * as Config from "./config";
import Evidences from "./evidences";

class Interact extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      escrowClass: MultipleArbitrableTransactionWithFee,
      escrowAddress: this.props.transacEscrowAddress,
      transactionID: this.props.transactionID,
      candidateTransactionID: "",
      activeAddress: this.props.activeAddress,
      remainingTimeToReclaim: "Unassigned",
      remainingTimeToDepositArbitrationFee: "Unassigned",
      status: "Unassigned",
      arbitrator: "Unassigned",
      extraData: "",
      payer: "Unassigned",
      payee: "Unassigned",
      value: "Unassigned",
      arbitrationCost: 0,
      timeoutPayment: 0,
      feeTimeout: 0,
      lastInteraction: 0,
      disputeID: null,
      ruling: null,
      coin: this.props.coin,
      tokenAddress: null,
      payments: [],
    };
  }

  async componentDidUpdate(prevProps) {
    let changed,
      changedCoin = false;
    if (this.props.activeAddress !== prevProps.activeAddress) {
      this.setState({ activeAddress: this.props.activeAddress });
      changed = true;
    }
    if (this.props.escrowAddress !== prevProps.escrowAddress) {
      this.setState({ escrowAddress: this.props.escrowAddress });
      changed = true;
    }
    if (this.props.transactionID !== prevProps.transactionID) {
      const tID = this.props.transactionID;
      this.setState({ transactionID: tID, candidateTransactionID: tID });
      changed = true;
    }
    if (this.props.coin !== prevProps.coin) {
      let tokenAddress, escrowAddress, escrowClass;
      if (this.props.coin === "rbtc") {
        tokenAddress = null;
        escrowAddress = this.props.transacEscrowAddress;
        escrowClass = MultipleArbitrableTransactionWithFee;
      } else {
        tokenAddress = this.props.tokenAddresses.erc20;
        escrowAddress = this.props.tokenEscrowAddress;
        escrowClass = MultipleArbitrableTokenTransactionWithFee;
      }
      this.setState({
        coin: this.props.coin,
        tokenAddress,
        escrowAddress,
        escrowClass,
      });
      changedCoin = true;
    }
    if (changedCoin) this.cleanBadges();
    else if (changed && this.state.transactionID != null) this.updateBadges();
  }

  cleanBadges = () => {
    this.setState({
      status: "Unassigned",
      value: "Unassigned",
      arbitrator: "Unassigned",
      arbitratorCost: 0,
    });
  };

  updateBadges = async () => {
    const { escrowAddress, transactionID, extraData, escrowClass } = this.state;
    try {
      let status = await escrowClass.status(escrowAddress, transactionID);
      this.setState({
        status: status,
      });
    } catch (e) {
      this.setState({ status: "ERROR" });
    }

    try {
      let arbitrator = await escrowClass.arbitrator(
        escrowAddress,
        transactionID
      );
      this.setState({
        arbitrator: arbitrator,
      });
      try {
        let arbitrationCost = await Arbitrator.arbitrationCost(
          arbitrator,
          extraData
        );
        this.setState({
          arbitrationCost: arbitrationCost,
        });
      } catch (e) {
        this.setState({ arbitrationCost: "ERROR" });
      }
    } catch (e) {
      this.setState({ arbitrator: "ERROR" });
    }

    try {
      let value = await escrowClass.value(escrowAddress, transactionID);
      this.setState({
        value: value,
      });
    } catch (e) {
      this.setState({ value: "ERROR" });
    }

    try {
      let payer = await escrowClass.payer(escrowAddress, transactionID);
      this.setState({
        payer: payer,
      });
    } catch (e) {
      this.setState({ payer: "ERROR" });
    }

    try {
      let payee = await escrowClass.payee(escrowAddress, transactionID);
      this.setState({
        payee: payee,
      });
    } catch (e) {
      this.setState({ payee: "ERROR" });
    }

    try {
      let feeTimeout = await escrowClass.feeTimeout(
        escrowAddress,
        transactionID
      );
      this.setState({
        feeTimeout: feeTimeout,
      });
    } catch (e) {
      this.setState({ feeTimeout: "ERROR" });
    }

    try {
      let timeoutPayment = await escrowClass.timeoutPayment(
        escrowAddress,
        transactionID
      );
      this.setState({
        timeoutPayment: timeoutPayment,
      });
    } catch (e) {
      this.setState({ timeoutPayment: "ERROR" });
    }

    try {
      let lastInteraction = await escrowClass.lastInteraction(
        escrowAddress,
        transactionID
      );
      this.setState({
        lastInteraction: lastInteraction,
      });
    } catch (e) {
      this.setState({ lastInteraction: "ERROR" });
    }

    if (this.state.status >= 3) {
      try {
        let disputeID = await escrowClass.disputeID(
          escrowAddress,
          transactionID
        );
        this.setState({
          disputeID: disputeID,
        });
        try {
          let ruling = await escrowClass.getRuling(
            this.state.arbitrator,
            disputeID,
            escrowAddress
          );
          this.setState({
            ruling: ruling,
          });
        } catch (e) {
          console.error(e);
          this.setState({ ruling: "ERROR" });
        }
      } catch (e) {
        this.setState({ disputeID: "ERROR" });
      }
    }

    let payments;
    if (transactionID !== null && escrowAddress !== null) {
      payments = await escrowClass.getPayments(transactionID, escrowAddress);
      console.log(`Payments: ${payments.length}`);
    } else {
      payments = [];
    }
    this.setState({ payments });
  };

  onInput = (e) => {
    console.log(e.target.files);
    this.setState({ fileInput: e.target.files[0] });
    console.log("file input");
  };

  onSubmitButtonClick = async (e) => {
    e.preventDefault();
    const { fileInput } = this.state;
    console.log("submit clicked");
    console.log(fileInput);

    var reader = new FileReader();
    reader.readAsArrayBuffer(fileInput);
    reader.addEventListener("loadend", async () => {
      const buffer = Buffer.from(reader.result);
      this.submitEvidence(buffer);
    });
  };

  submitEvidence = async (evidenceBuffer) => {
    const {
      activeAddress,
      transactionID,
      escrowAddress,
      escrowClass,
    } = this.state;

    const result = await ipfsPublish("name", evidenceBuffer);

    let evidence = generateEvidence(
      "/ipfs/" + result[0]["hash"],
      "name",
      "description"
    );
    const enc = new TextEncoder();
    const ipfsHashEvidenceObj = await ipfsPublish(
      "evidence.json",
      enc.encode(JSON.stringify(evidence))
    );

    escrowClass.submitEvidence(
      "/ipfs/" + ipfsHashEvidenceObj[0]["hash"],
      transactionID,
      activeAddress,
      escrowAddress
    );
  };

  handleChange = (e) => {
    this.setState({ candidateTransactionID: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { escrowClass } = this.state;
    try {
      await escrowClass.status(
        this.state.escrowAddress,
        this.state.candidateTransactionID
      );
      this.setState({
        transactionID: this.state.candidateTransactionID,
      });
    } catch (e) {
      console.error(e);
      this.setState({ transactionID: null });
    }
    this.updateBadges();
  };

  onPayButtonClick = async (e) => {
    e.preventDefault();
    const {
      value,
      activeAddress,
      transactionID,
      escrowAddress,
      escrowClass,
    } = this.state;
    try {
      await escrowClass.pay(value, transactionID, activeAddress, escrowAddress);
      alert("Payee payed!");
    } catch (e) {
      console.error(e);
    }
    this.updateBadges();
  };

  onReimburseButtonClick = async (e) => {
    e.preventDefault();
    const {
      value,
      activeAddress,
      transactionID,
      escrowAddress,
      escrowClass,
    } = this.state;
    try {
      await escrowClass.reimburse(
        value,
        transactionID,
        activeAddress,
        escrowAddress
      );
      alert("Payer reimbursed!");
    } catch (e) {
      console.error(e);
    }
    this.updateBadges();
  };

  onReclaimBySenderFundsButtonClick = async (e) => {
    e.preventDefault();
    const {
      arbitrationCost,
      activeAddress,
      transactionID,
      escrowAddress,
      escrowClass,
    } = this.state;
    try {
      await escrowClass.payArbitrationFeeBySender(
        arbitrationCost,
        transactionID,
        activeAddress,
        escrowAddress
      );
      alert("Dispute created!");
    } catch (e) {
      console.error(e);
    }
    this.updateBadges();
  };

  onReclaimByReceiverFundsButtonClick = async (e) => {
    e.preventDefault();
    const {
      arbitrationCost,
      activeAddress,
      transactionID,
      escrowAddress,
      escrowClass,
    } = this.state;
    try {
      await escrowClass.payArbitrationFeeByReceiver(
        arbitrationCost,
        transactionID,
        activeAddress,
        escrowAddress
      );
      alert("Dispute created!");
    } catch (e) {
      console.error(e);
    }
    this.updateBadges();
  };

  isPayee = () => this.state.activeAddress === this.state.payee.toLowerCase();

  isPayer = () => this.state.activeAddress === this.state.payer.toLowerCase();

  suggestedAction = () => {
    const {
      feeTimeout,
      timeoutPayment,
      status,
      arbitrationCost,
      lastInteraction,
      ruling,
      value,
      escrowClass,
    } = this.state;
    let arbCostBN = web3.utils.toBN(arbitrationCost);
    let arbCostVerb = `${web3.utils.fromWei(arbCostBN, "ether")} ${
      Config.baseCoin
    }`;
    let reclaimLimit = new Date(
      (parseInt(lastInteraction) + parseInt(timeoutPayment)) * 1000
    );
    let feeDepositLimit = new Date(
      (parseInt(lastInteraction) + parseInt(feeTimeout)) * 1000
    );

    switch (status) {
      case "0":
        if (value != 0) {
          if (this.isPayer()) {
            return {
              title: `If you received the goods, pay the payee.`,
              body: `If not and you want the funds back, reclaim them. You will have to send ${arbCostVerb} as fees for possible arbitration.`,
            };
          } else if (this.isPayee()) {
            if (Date.now() - lastInteraction >= timeoutPayment) {
              return {
                title: `You can reclaim the funds.`,
                body: `Could not provide the goods? Reimburse the payer.`,
              };
            } else {
              return {
                title: `Wait until ${reclaimLimit.toUTCString()} and reclaim the funds.`,
                body: `Could not provide the goods? Reimburse the payer.`,
              };
            }
          }
        } else {
          return {
            title: "Transaction resolved",
            body: "Nothing else to be done",
          };
        }
        break;
      case "1":
        if (this.isPayer()) {
          return {
            title: `Payee has deposited arbitration fees.`,
            body: `You need to deposit ${arbCostVerb} before ${feeDepositLimit.toUTCString()} in order to start a dispute.`,
          };
        } else if (this.isPayee()) {
          if (Date.now() >= feeDepositLimit) {
            return {
              title: `You can now reclaim the funds.`,
              body: `Payer has not deposited arbitration fees.`,
            };
          } else {
            return {
              title: `Nothing to be done for now.`,
              body: `Payer still has until ${feeDepositLimit.toUTCString()} to deposit arbitration fees and start a dispute.`,
            };
          }
        }
        break;
      case "2":
        if (this.isPayer()) {
          if (Date.now() >= feeDepositLimit) {
            return {
              title: `You can now reclaim the funds.`,
              body: `Payee has not deposited arbitration fees.`,
            };
          } else {
            return {
              title: `Nothing to be done for now.`,
              body: `Payee still has until ${feeDepositLimit.toUTCString()} to deposit arbitration fees and start a dispute. `,
            };
          }
        } else if (this.isPayee()) {
          return {
            title: `Payer has deposited arbitration fees.`,
            body: `You need to deposit ${arbCostVerb} before ${feeDepositLimit.toUTCString()} in order to start a dispute.`,
          };
        }
        break;
      case "3":
        return {
          title: "Nothing to be done for now.",
          body: "Both parties are waiting for the arbitrator to rule.",
        };
      case "4":
        let outro = "The arbitrator has ruled.";

        let intro = `Ruling: ${ruling}`;
        if (
          (this.isPayer() && ruling === escrowClass.SENDER_WINS.toString()) ||
          (this.isPayee() && ruling === escrowClass.RECEIVER_WINS.toString())
        ) {
          intro = "You won! Funds have been sent to you.";
        } else {
          intro = "You lost... Sorry about that.";
        }
        return {
          title: intro,
          body: outro,
        };

      default:
        return { body: "Transaction correctly set?", title: "No status" };
    }
  };

  render() {
    const {
      fileInput,
      transactionID,
      status,
      value,
      payer,
      payee,
      arbitrator,
      timeoutPayment,
      feeTimeout,
      lastInteraction,
      activeAddress,
      candidateTransactionID,
      disputeID,
      escrowAddress,
      coin,
      escrowClass,
      payments,
    } = this.state;
    let statusVerbose = escrowClass.STATUS[status];
    if (statusVerbose !== undefined) {
      statusVerbose = statusVerbose
        .replace(/([A-Z]+)/g, " $1")
        .replace(/^ /, "");
    }
    let lastInteractionVerbose = "";
    if (lastInteraction !== 0)
      lastInteractionVerbose = new Date(
        parseInt(lastInteraction) * 1000
      ).toUTCString();
    let actionHint = this.suggestedAction() || { title: "", body: "" };
    const coinVerbose = coin === "rbtc" ? "(wei) RBTC" : coin.toUpperCase();

    return (
      <Container className="container-fluid d-flex h-100 flex-column">
        <Card className="h-100 my-4 text-center" style={{ width: "auto" }}>
          <Card.Body>
            <Card.Title>
              Interact with{" "}
              {coin == "rbtc" ? "Transaction Escrow" : "Token Escrow"}
            </Card.Title>
            <Card.Subtitle>
              {transactionID === null
                ? `Input Transaction ID to start interacting`
                : `Transaction ${transactionID}`}
            </Card.Subtitle>
            <Form.Group controlId="transaction-id">
              <Form.Control
                className="text-center"
                as="input"
                rows="1"
                value={candidateTransactionID}
                onChange={this.handleChange}
                // onFocus={() => this.setState({ candidateTransactionID: 0 })}
              />
            </Form.Group>
            <Form.Group>
              <Button
                type="submit"
                variant="primary"
                onClick={this.handleSubmit}
              >
                Set transaction ID
              </Button>{" "}
              <Button
                className="mr-2"
                type="button"
                variant="outline-primary"
                onClick={this.updateBadges}
              >
                Update status
              </Button>
            </Form.Group>
            <ListGroup variant="flush">
              <ListGroup.Item variant="primary" style={{ fontSize: "120%" }}>
                Status: {statusVerbose}
              </ListGroup.Item>
              <ListGroup.Item variant="info">
                <p style={{ fontStyle: "italic" }}>What should I do?</p>
                <h5>{actionHint.title}</h5>
                <p>{actionHint.body}</p>
                <h6>Payments</h6>
                {payments.length > 0 ? (
                  <ul>
                    {payments.map((e) => (
                      <li
                        key={e.returnValues[0]}
                      >{`${e.returnValues._party} paid ${e.returnValues._amount} ${coinVerbose}`}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No payments yet</p>
                )}

                {value != 0 && (
                  <div id="buttons">
                    <ButtonGroup className="mt-3" style={{ width: "100%" }}>
                      {activeAddress === payer.toLowerCase() && status == 0 && (
                        <Button
                          className="mr-2"
                          variant="success"
                          type="button"
                          onClick={this.onPayButtonClick}
                        >
                          Pay
                        </Button>
                      )}
                      {activeAddress === payee.toLowerCase() && status == 0 && (
                        <Button
                          className="mr-2"
                          variant="warning"
                          type="button"
                          onClick={this.onReimburseButtonClick}
                        >
                          Reimburse
                        </Button>
                      )}
                      {activeAddress === payer.toLowerCase() && status < 2 && (
                        <Button
                          className="mr-2"
                          variant="danger"
                          type="button"
                          onClick={this.onReclaimBySenderFundsButtonClick}
                        >
                          Reclaim
                        </Button>
                      )}
                    </ButtonGroup>
                    <ButtonGroup className="mt-3" style={{ width: "100%" }}>
                      {activeAddress === payee.toLowerCase() &&
                        (status === 0 || status === 2) && (
                          <Button
                            className="mr-2"
                            variant="danger"
                            type="button"
                            onClick={this.onReclaimByReceiverFundsButtonClick}
                          >
                            Reclaim
                          </Button>
                        )}
                    </ButtonGroup>
                    {(status === 1 || status === 2 || status === 3) && (
                      <InputGroup className="mt-3">
                        <h6>
                          You may submit evidence to backup your claim, for
                          consideration of the jurors.
                        </h6>
                        <div className="input-group">
                          <div className="custom-file">
                            <input
                              type="file"
                              className="custom-file-input"
                              id="inputGroupFile04"
                              onInput={this.onInput}
                            />
                            <label
                              className="text-left custom-file-label"
                              htmlFor="inputGroupFile04"
                            >
                              {(fileInput && fileInput.name) ||
                                "Choose evidence file"}
                            </label>
                          </div>
                          <div className="input-group-append">
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={this.onSubmitButtonClick}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      </InputGroup>
                    )}
                  </div>
                )}
              </ListGroup.Item>
              <ListGroup.Item>
                Value in escrow: {value}
                {coin === "rbtc" ? " (wei) " : " "}
                {coin.toUpperCase()}
              </ListGroup.Item>
              <ListGroup.Item>
                Payer: {payer}
                <Badge className="m-1" pill variant="success">
                  {activeAddress === payer.toLowerCase() && "You!"}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>
                Payee: {payee}
                <Badge className="m-1" pill variant="success">
                  {activeAddress === payee.toLowerCase() && "You!"}
                </Badge>
              </ListGroup.Item>
              <ListGroup.Item>Arbitrator: {arbitrator}</ListGroup.Item>
            </ListGroup>
            <Card.Subtitle className="mt-3 mb-1 text-muted">
              Smart Contract State
            </Card.Subtitle>
            <Badge className="m-1" pill variant="info">
              Status Code: {status}
            </Badge>
            <Badge className="m-1" pill variant="info">
              Dispute ID: {disputeID}
            </Badge>
            <Badge className="m-1" pill variant="info">
              Timeout Payment: {timeoutPayment}
            </Badge>
            <Badge className="m-1" pill variant="info">
              Fee Timeout: {feeTimeout}
            </Badge>
            <Badge className="m-1" pill variant="info">
              Last Interaction: {lastInteractionVerbose}
            </Badge>
          </Card.Body>
        </Card>
        <Evidences
          arbitratorAddress={arbitrator}
          arbitrableAddress={escrowAddress}
          disputeID={disputeID}
          payer={payer}
          payee={payee}
        />
      </Container>
    );
  }
}

export default Interact;
