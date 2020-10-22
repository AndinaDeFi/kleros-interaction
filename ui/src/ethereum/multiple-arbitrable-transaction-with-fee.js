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

// Useless

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

export const arbitrator = (instanceAddress) =>
  contractInstance(instanceAddress).methods.arbitrator().call();

export const status = (instanceAddress) =>
  contractInstance(instanceAddress).methods.status().call();

export const value = (instanceAddress) =>
  contractInstance(instanceAddress).methods.value().call();

export const submitEvidence = (instanceAddress, senderAddress, evidence) =>
  contractInstance(instanceAddress)
    .methods.submitEvidence(evidence)
    .send({ from: senderAddress });
