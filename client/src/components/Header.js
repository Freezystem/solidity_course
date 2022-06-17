import React from "react";

function Header({approvers, quorum}) {
  return (
    <header>
      <p>Approvers:</p>
      <ul>
        {approvers.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
      <p>Quorum: {quorum}</p>
    </header>
  )
}

export default Header;
