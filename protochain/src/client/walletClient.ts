import Wallet from "../lib/wallet";
import dotenv, { parse } from 'dotenv';
import axios from "axios";
import readline from 'readline';
import Transaction from "../lib/transaction";
import TransactionType from "../lib/transactionType";
import TransactionInput from "../lib/transactionInput";
dotenv.config();

const BLOCKCHAIN_SERVER = process.env.BLOCKCHAIN_SERVER;

let myWalletPub = "";
let myWalletPriv = "";


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function menu() {
  setTimeout(() => {
    console.clear();

    if (myWalletPub) {
      console.log(`You are logged as ${myWalletPub}`);
    } else {
      console.log(`You are not logged.`);
    }

    console.log("1 - Create wallet");
    console.log("2 - Recover wallet");
    console.log("3 - Balance");
    console.log("4 - Send tx");
    console.log("5 - Search Tx");

    rl.question("Choose your option: ", (answer) => {
      switch (answer) {
        case "1":
          createWallet();
          break;
        case "2":
          recoverWallet();
          break;
        case "3":
          getBalance();
          break;
        case "4":
          sendTx();
          break;
        case "5":
          searchTx();
          break;
        default: {
          console.log("wrong option!");
          menu();
        }

      }
    });
  }, 1000)
}

function preMenu() {
  rl.question("Press any key to continue...", () => {
    menu();
  });
}

function createWallet() {
  console.clear();
  const wallet = new Wallet();
  console.log("Your new wallet:");
  console.log(wallet);

  myWalletPub = wallet.publicKey;
  myWalletPriv = wallet.privateKey;
  preMenu();
}

function recoverWallet() {
  rl.question("What is  your private key or WIF", (wifOrPrivateKey) => {
    console.clear();
    const wallet = new Wallet(wifOrPrivateKey);
    console.log("Your recovery wallet: ");
    console.log(wallet);

    myWalletPub = wallet.publicKey;
    myWalletPriv = wallet.privateKey;
    preMenu();
  });
}


function getBalance() {
  console.clear();

  if (!myWalletPub) {
    console.log('You dont have a wallet yet...');
    return preMenu();
  }
  //TODO: get balance via API

  preMenu();
}


function sendTx() {
  console.clear();

  if (!myWalletPub) {
    console.log('You dont have a wallet yet...');
    return preMenu();
  }
  console.log(`You wallet is ${myWalletPub}`);

  rl.question("To wallet: ", (toWallet) => {
    if (toWallet.length < 60) {
      console.log('Invalid wallet');
      return preMenu();
    }

    rl.question('Amount: ', async (amountStr) => {
      const amount = parseInt(amountStr);
      if (!amount) {
        console.log('Invalid amount.')
        return preMenu();
      }

      const tx = new Transaction({
        timestamp: Date.now(),
        to: toWallet,
        type: TransactionType.REGULAR,
        txInput: {
          amount: amount,
          fromAddress: myWalletPub
        } as TransactionInput

      } as Transaction);

      tx.txInput?.sign(myWalletPriv);
      tx.hash = tx.getHash();

      try {
        const txResponse = await axios.post(`${BLOCKCHAIN_SERVER}/transactions/`, tx);
        console.log('Transaction accepted. Waiting the miners.')
        console.log(txResponse.data.hash);
      } catch (error: any) {
        console.error(error.response ? error.response.data : error.message);

      }
      return preMenu();

    });


  })


  preMenu();
}

function searchTx() {
  console.clear();
  rl.question("Your tx hash: ", async (hash) => {
    const txResponse = await axios.get(`${BLOCKCHAIN_SERVER}/transactions/${hash}`);
    console.log(txResponse.data);
    preMenu();
  });


}


menu();





/*
Wallet {
  privateKey: '55b5b78037d12010e413ca8f15abc284ac0533c048a155448b120a796187b8b1',
  publicKey: '02a5c99a8dd12bb98a7f8a846e019b19203f3e24253330c9ed6f814082a39682dc'
}
*/ 