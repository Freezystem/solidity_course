import React, { useEffect, useState } from "react";
import { getWeb3, getWallet } from "../utils.js";
import Header from "./Header.js";
import NewTransfer from "./NewTransfer.js";
import TransferList from "./TransferList.js";

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [wallet, setWallet] = useState(undefined);
  const [approvers, setApprovers] = useState([]);
  const [quorum, setQuorum] = useState(undefined);
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const wallet = await getWallet(web3);
      const approvers = await wallet.methods.getApprovers().call();
      const quorum = await wallet.methods.quorum().call();
      const transfers = await wallet.methods.getTransfers().call();

      setWeb3(web3);
      setAccounts(accounts);
      setWallet(wallet);
      setApprovers(approvers);
      setQuorum(quorum);
      setTransfers(transfers);
    };

    init();
  }, []);

  if ( 
    typeof web3 === "undefined" || 
    typeof accounts === "undefined" || 
    typeof wallet === "undefined" ||
    typeof quorum === "undefined" ||
    approvers.length === 0
  ) {
    return <i>loading...</i>
  }
  else {
    return (
      <div className="App">
        <h1>MultiSig Wallet</h1>
        <Header approvers={approvers} quorum={quorum} />
        <NewTransfer wallet={wallet} from={accounts[0]} />
        <TransferList transfers={transfers} wallet={wallet} from={accounts[0]}/>
      </div>
    );
  }
}

export default App;
