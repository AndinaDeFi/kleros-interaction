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

class Interact extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      escrowAddress: this.props.escrowAddress,
      transactionID: this.props.transactionID,
      remainingTimeToReclaim: "Unassigned",
      remainingTimeToDepositArbitrationFee: "Unassigned",
      status: "Unassigned",
      arbitrator: "Unassigned",
      payer: "Unassigned",
      payee: "Unassigned",
      value: "Unassigned",
      timeoutPayment: 0,
      feeTimeout: 0,
      lastInteraction: 0,
    };
  }

  async componentDidUpdate(prevProps) {
    let changed = false;
    if (this.props.escrowAddress !== prevProps.escrowAddress) {
      this.setState({ escrowAddress: this.props.escrowAddress });
      changed = true;
    }
    if (this.props.transactionID !== prevProps.transactionID) {
      this.setState({ transactionID: this.props.transactionID });
      changed = true;
    }
    if (changed && this.state.transactionID != null) this.updateBadges();
  }

  // onEscrowAddressChange = async (e) => {
  //   await this.setState({ escrowAddress: e.target.value });
  //   this.updateBadges();
  // };

  updateBadges = async () => {
    const { escrowAddress, transactionID, status } = this.state;

    try {
      let status = await MultipleArbitrableTransactionWithFee.status(
        escrowAddress,
        transactionID
      );
      this.setState({
        status: status,
      });
    } catch (e) {
      this.setState({ status: "ERROR" });
    }

    try {
      let arbitrator = await MultipleArbitrableTransactionWithFee.arbitrator(
        escrowAddress,
        transactionID
      );
      this.setState({
        arbitrator: arbitrator,
      });
    } catch (e) {
      this.setState({ arbitrator: "ERROR" });
    }

    try {
      let value = await MultipleArbitrableTransactionWithFee.value(
        escrowAddress,
        transactionID
      );
      this.setState({
        value: value,
      });
    } catch (e) {
      this.setState({ value: "ERROR" });
    }

    try {
      let payer = await MultipleArbitrableTransactionWithFee.payer(
        escrowAddress,
        transactionID
      );
      this.setState({
        payer: payer,
      });
    } catch (e) {
      this.setState({ payer: "ERROR" });
    }

    try {
      let payee = await MultipleArbitrableTransactionWithFee.payee(
        escrowAddress,
        transactionID
      );
      this.setState({
        payee: payee,
      });
    } catch (e) {
      this.setState({ payee: "ERROR" });
    }

    try {
      let feeTimeout = await MultipleArbitrableTransactionWithFee.feeTimeout(
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
      let timeoutPayment = await MultipleArbitrableTransactionWithFee.timeoutPayment(
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
      let lastInteraction = await MultipleArbitrableTransactionWithFee.lastInteraction(
        escrowAddress,
        transactionID
      );
      this.setState({
        lastInteraction: lastInteraction,
      });
    } catch (e) {
      this.setState({ lastInteraction: "ERROR" });
    }

    // if (Number(status) === 0)
    //   try {
    //     this.setState({
    //       remainingTimeToReclaim: await this.props.remainingTimeToReclaimCallback(
    //         escrowAddress
    //       ),
    //     });
    //   } catch (e) {
    //     console.error(e);
    //     this.setState({ status: "ERROR" });
    //   }

    // if (Number(status) === 1)
    //   try {
    //     this.setState({
    //       remainingTimeToDepositArbitrationFee: await this.props.remainingTimeToDepositArbitrationFeeCallback(
    //         escrowAddress
    //       ),
    //     });
    //   } catch (e) {
    //     console.error(e);
    //     this.setState({ status: "ERROR" });
    //   }
  };

  onReclaimFundsButtonClick = async (e) => {
    e.preventDefault();
    const { escrowAddress } = this.state;

    let arbitrator = await this.props.arbitratorCallback(escrowAddress);
    console.log(arbitrator);

    let arbitrationCost = await this.props.arbitrationCostCallback(
      arbitrator,
      ""
    );

    await this.props.reclaimFundsCallback(escrowAddress, arbitrationCost);

    this.updateBadges();
  };

  onReleaseFundsButtonClick = async (e) => {
    e.preventDefault();
    const { escrowAddress } = this.state;

    await this.props.releaseFundsCallback(escrowAddress);
    this.updateBadges();
  };

  onDepositArbitrationFeeFromPayeeButtonClicked = async (e) => {
    e.preventDefault();
    const { escrowAddress } = this.state;

    let arbitrator = await this.props.arbitratorCallback(escrowAddress);
    let arbitrationCost = await this.props.arbitrationCostCallback(
      arbitrator,
      ""
    );

    await this.props.depositArbitrationFeeForPayeeCallback(
      escrowAddress,
      arbitrationCost
    );

    this.updateBadges();
  };

  onInput = (e) => {
    console.log(e.target.files);
    this.setState({ fileInput: e.target.files[0] });
    console.log("file input");
  };

  onSubmitButtonClick = async (e) => {
    e.preventDefault();
    const { escrowAddress, fileInput } = this.state;
    console.log("submit clicked");
    console.log(fileInput);

    var reader = new FileReader();
    reader.readAsArrayBuffer(fileInput);
    reader.addEventListener("loadend", async () => {
      const buffer = Buffer.from(reader.result);
      this.props.submitEvidenceCallback(escrowAddress, buffer);
    });
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
    } = this.state;
    return (
      <Container className="container-fluid d-flex h-100 flex-column">
        <Card className="h-100 my-4 text-center" style={{ width: "auto" }}>
          <Card.Body>
            <Card.Title>
              {`Interact with Transaction ${transactionID}`}
            </Card.Title>
            <Button
              className="mr-2"
              variant="primary"
              type="button"
              onClick={this.updateBadges}
            >
              Update badges
            </Button>
            <ListGroup variant="flush">
              <ListGroup.Item>Value (weis): {value}</ListGroup.Item>
              <ListGroup.Item>Payer: {payer}</ListGroup.Item>
              <ListGroup.Item>Payee: {payee}</ListGroup.Item>
              <ListGroup.Item>Arbitrator: {arbitrator}</ListGroup.Item>
            </ListGroup>

            <Card.Subtitle className="mt-3 mb-1 text-muted">
              Smart Contract State
            </Card.Subtitle>
            <Badge className="m-1" pill variant="info">
              Status Code: {status}
            </Badge>
            <Badge className="m-1" pill variant="info">
              Timeout Payment: {timeoutPayment}
            </Badge>
            <Badge className="m-1" pill variant="info">
              Fee Timeout: {feeTimeout}
            </Badge>
            <Badge className="m-1" pill variant="info">
              Last Interaction: {lastInteraction}
            </Badge>
            <ButtonGroup className="mt-3">
              <Button
                className="mr-2"
                variant="primary"
                type="button"
                onClick={this.onReleaseFundsButtonClick}
              >
                Release
              </Button>
              <Button
                className="mr-2"
                variant="secondary"
                type="button"
                onClick={this.onReclaimFundsButtonClick}
              >
                Reclaim
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={this.onDepositArbitrationFeeFromPayeeButtonClicked}
                block
              >
                Deposit Arbitration Fee For Payee
              </Button>
            </ButtonGroup>
            <InputGroup className="mt-3">
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
                    {(fileInput && fileInput.name) || "Choose evidence file"}
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
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default Interact;
