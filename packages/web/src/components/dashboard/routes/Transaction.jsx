import React from 'react'
import { Route, Routes } from "react-router-dom"
import { TransactionDetail } from "../../resources/Transactions";
import { BrowserManager } from "../../../api/browserManager";

export default function Transaction() {
    // Set up page
    BrowserManager.setTransactionTitleFromURL();

    return (
        <div className="transaction-wrapper d-flex flex-column align-items-center">
            <div className="transaction-pane w-100">
                <Routes>
                    <Route path="*" element={<TransactionDetail />}/>
                </Routes>
            </div>
        </div>
  )
}
