import MultipleArbitrableTransactionWithFee from "../build/contracts/MultipleArbitrableTransactionWithFee.json";
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
