import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Modal from "../../components/Modal";

const PharmacyTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [transactionType, setTransactionType] = useState("Sold");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchMedicines();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/pharma/transactions"
      );
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/pharma/medicines"
      );
      setMedicines(response.data.medicines);
    } catch (error) {
      console.error("Error fetching medicines", error);
    }
  };

  const handleTransactionSubmit = async () => {
    if (
      !selectedMedicine ||
      !quantity ||
      (transactionType === "Sold" && !price)
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const transactionData = {
      medication: selectedMedicine._id,
      type: transactionType,
      quantity: parseInt(quantity, 10),
      price: transactionType === "Sold" ? parseFloat(price) : undefined,
    };

    try {
      await axios.post(
        "http://localhost:3000/api/pharma/add-transactions",
        transactionData
      );
      alert("Transaction added successfully!");
      fetchTransactions();
      setShowModal(false);
    } catch (error) {
      console.error("Error adding transaction", error);
      alert("Failed to add transaction.");
    }
  };

  const pharmasidebarLinks = [
    { label: "Pharmacy Dashboard", path: "/pharma-dashboard" },
    { label: "Medicine List", path: "/medicine-list" },
    { label: "Pharmacy Transaction", path: "/pharma-transaction" },
    { label: "Analytics and Reports", path: "/pharma-analytics" },
  ];

  return (
    <div>
      <Sidebar
        props={pharmasidebarLinks}
        pageContent={
          <div className="container mt-4">
            <h2>Pharmacy Transactions</h2>
            <button
              className="btn btn-primary mb-3"
              onClick={() => setShowModal(true)}
            >
              Add Transaction
            </button>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td>{tx.medication.name}</td>
                    <td>{tx.type}</td>
                    <td>{tx.quantity}</td>
                    <td>{new Date(tx.transactionDate).toLocaleDateString()}</td>
                    <td>{tx.type === "Sold" ? `₱${tx.price}` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Transaction Modal */}
            {showModal && (
              <Modal
                show={showModal}
                onClose={() => setShowModal(false)}
                body={
                  <>
                    <h4>Add New Transaction</h4>
                    <select
                      className="form-control mb-2"
                      onChange={(e) =>
                        setSelectedMedicine(
                          medicines.find((med) => med._id === e.target.value)
                        )
                      }
                    >
                      <option value="">Select Medicine</option>
                      {medicines.map((med) => (
                        <option key={med._id} value={med._id}>
                          {med.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="form-control mb-2"
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value)}
                    >
                      <option value="Sold">Sold</option>
                      <option value="Emergency Dispense">
                        Emergency Dispense
                      </option>
                      <option value="Remove">Remove</option>
                    </select>
                    <input
                      type="number"
                      className="form-control mb-2"
                      placeholder="Quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    {transactionType === "Sold" && (
                      <input
                        type="number"
                        className="form-control mb-2"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={handleTransactionSubmit}
                    >
                      Submit
                    </button>
                  </>
                }
              ></Modal>
            )}
          </div>
        }
      />
    </div>
  );
};

export default PharmacyTransactions;
