import React from "react";

function TransferList({ wallet, from, transfers }){
  const approveTransfer = transfer => {
    if ( !transfer.sent ) {
      wallet.methods
        .approveTransfer(transfer.id)
        .send({from});
    }
  };

  return (
    <div>
      <h2>Transfers</h2>
      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Amount</th>
            <th>Recipient</th>
            <th>Approvals</th>
            <th>Sent</th>
          </tr>
        </thead>
        <tbody>
          {
            transfers.map((t, i) => 
              <tr key={i}>
                <td>{t.id}</td>
                <td>{t.amount}</td>
                <td>{t.to}</td>
                <td>{t.approvals}</td>
                <td>
                  <i onClick={e => approveTransfer(t)}>{t.sent ? "✅" : "🆕"}</i>
                </td>
              </tr>)
          }
        </tbody>
      </table>
    </div>
  );
}

export default TransferList;
