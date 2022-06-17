import React, { useState } from "react";

function NewTransfer({ wallet, from }) {
  const addressRegex = "^0x[a-zA-Z0-9]{40}$";
  const [amount, setAmount] = useState("0");
  const [to, setTo] = useState("");
  
  const submit = e => {
    e.preventDefault();

    if (amount > 1 && to.match(addressRegex)) {
      wallet.methods
        .createTransfer(amount, to)
        .send({from});
    }
    else {
      console.alert("Invalid amount or recipient");
    }
  }

  return (
    <div>
      <h2>Create Transfer</h2>
      <form onSubmit={e => submit(e)}>
        <p>
          <label htmlFor="amount">amount (in wei)</label>
          <input 
            id="amount" 
            type="number"
            min="0"
            step="1"
            value={amount}
            required
            onChange={e => setAmount(e.target.value)}/>
        </p>
        <p>
          <label htmlFor="to">to</label>
          <input 
            id="to" 
            type="text"
            value={to}
            required
            pattern={addressRegex}
            placeholder="0x..."
            onChange={e => setTo(e.target.value)}/>
        </p>
        <p>
          <input type="submit" value="Send Transfer"/>
        </p>
      </form>
    </div>
  );
}

export default NewTransfer;
