import React from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";

class NewTransaction extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      amount: "",
      // payee: "",
      title: "",
      description: "",
    };
  }

  onAmountChange = (e) => {
    this.setState({ amount: e.target.value });
  };

  onPayeeChange = (e) => {
    this.setState({ payee: e.target.value });
  };

  onTitleChange = (e) => {
    this.setState({ title: e.target.value });
  };

  onDescriptionChange = (e) => {
    this.setState({ description: e.target.value });
  };

  onDeployButtonClick = async (e) => {
    e.preventDefault();
    const { amount, payee, title, description } = this.state;
    await this.props.newTransactionCallback(amount, payee, title, description);
  };

  render() {
    const { amount, payee, title, description } = this.state;

    return (
      <Container>
        <Card className="my-4 text-center " style={{ width: "auto" }}>
          <Card.Body>
            <Card.Title>New Transaction</Card.Title>
            <Form>
              <Form.Group controlId="amount">
                <Form.Control
                  as="input"
                  rows="1"
                  value={amount}
                  onChange={this.onAmountChange}
                  placeholder={"Transaction amount (in weis)"}
                />
              </Form.Group>
              <Form.Group controlId="payee">
                <Form.Control
                  as="input"
                  rows="1"
                  value={payee}
                  onChange={this.onPayeeChange}
                  // placeholder={this.props.defaultPayee}
                  placeholder="Payee"
                />
              </Form.Group>
              <Form.Group controlId="title">
                <Form.Control
                  as="input"
                  rows="1"
                  value={title}
                  onChange={this.onTitleChange}
                  placeholder={"Title"}
                />
              </Form.Group>
              <Form.Group controlId="description">
                <Form.Control
                  as="input"
                  rows="1"
                  value={description}
                  onChange={this.onDescriptionChange}
                  placeholder={"Describe The Agreement"}
                />
              </Form.Group>
              <Button
                variant="primary"
                type="button"
                onClick={this.onDeployButtonClick}
                block
              >
                Create new transaction
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default NewTransaction;
