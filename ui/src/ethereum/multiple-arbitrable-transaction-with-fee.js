import MultipleArbitrableTransactionWithFee from "./MultipleArbitrableTransactionWithFee.json";
import web3 from "./web3";

export const contractInstance = (address) =>
  new web3.eth.Contract(MultipleArbitrableTransactionWithFee.abi, address);

export const deploy = (
  sender,
  arbitrator,
  arbitratorExtra,
  feeRecipient,
  feeRecipientBasisPoint,
  feeTimeout
) =>
  new web3.eth.Contract(MultipleArbitrableTransactionWithFee.abi)
    .deploy({
      arguments: [
        arbitrator,
        arbitratorExtra,
        feeRecipient,
        feeRecipientBasisPoint,
        feeTimeout,
      ],
      data: MultipleArbitrableTransactionWithFee.bytecode,
    })
    .send({ from: sender });

export const createTransaction = (
  senderAddress,
  amount,
  instanceAddress,
  timeoutPayment,
  receiverAddress,
  metaevidence
) =>
  contractInstance(instanceAddress)
    .methods.createTransaction(timeoutPayment, receiverAddress, metaevidence)
    .send({ from: senderAddress, value: amount });

export const status = async (instanceAddress, transactionID) => {
  const res = await contractInstance(instanceAddress)
    .methods.transactions(transactionID)
    .call();
  const status = res.status;
  return status;
};

export const arbitrator = async (instanceAddress, transactionID) => {
  const arbitrator = await contractInstance(instanceAddress)
    .methods.arbitrator()
    .call();
  return arbitrator;
};

export const feeTimeout = async (instanceAddress, transactionID) => {
  const feeTimeout = await contractInstance(instanceAddress)
    .methods.feeTimeout()
    .call();
  return feeTimeout;
};

export const value = async (instanceAddress, transactionID) => {
  const res = await contractInstance(instanceAddress)
    .methods.transactions(transactionID)
    .call();
  const value = res.amount;
  return value;
};

export const payee = async (instanceAddress, transactionID) => {
  const res = await contractInstance(instanceAddress)
    .methods.transactions(transactionID)
    .call();
  const payee = res.receiver;
  return payee;
};

export const payer = async (instanceAddress, transactionID) => {
  const res = await contractInstance(instanceAddress)
    .methods.transactions(transactionID)
    .call();
  const payer = res.sender;
  return payer;
};

export const timeoutPayment = async (instanceAddress, transactionID) => {
  const res = await contractInstance(instanceAddress)
    .methods.transactions(transactionID)
    .call();
  const timeoutPayment = res.timeoutPayment;
  return timeoutPayment;
};

export const lastInteraction = async (instanceAddress, transactionID) => {
  const res = await contractInstance(instanceAddress)
    .methods.transactions(transactionID)
    .call();
  const lastInteraction = res.lastInteraction;
  return lastInteraction;
};

// Old

export const reclaimFunds = (senderAddress, instanceAddress, value) =>
  contractInstance(instanceAddress)
    .methods.reclaimFunds()
    .send({ from: senderAddress, value });

export const releaseFunds = (senderAddress, instanceAddress) =>
  contractInstance(instanceAddress)
    .methods.releaseFunds()
    .send({ from: senderAddress });

export const depositArbitrationFeeForPayee = (
  senderAddress,
  instanceAddress,
  value
) =>
  contractInstance(instanceAddress)
    .methods.depositArbitrationFeeForPayee()
    .send({ from: senderAddress, value });

export const reclamationPeriod = (instanceAddress) =>
  contractInstance(instanceAddress).methods.reclamationPeriod().call();

export const arbitrationFeeDepositPeriod = (instanceAddress) =>
  contractInstance(instanceAddress)
    .methods.arbitrationFeeDepositPeriod()
    .call();

export const createdAt = (instanceAddress) =>
  contractInstance(instanceAddress).methods.createdAt().call();

export const remainingTimeToReclaim = (instanceAddress) =>
  contractInstance(instanceAddress).methods.remainingTimeToReclaim().call();

export const remainingTimeToDepositArbitrationFee = (instanceAddress) =>
  contractInstance(instanceAddress)
    .methods.remainingTimeToDepositArbitrationFee()
    .call();

export const submitEvidence = (instanceAddress, senderAddress, evidence) =>
  contractInstance(instanceAddress)
    .methods.submitEvidence(evidence)
    .send({ from: senderAddress });