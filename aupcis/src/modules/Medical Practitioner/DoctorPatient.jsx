import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Modal from "../../components/Modal";
import axios from "axios";
import AccordionComponents from "../../components/AccordionComponents";
import { Form, Button, Container, Row, Col } from "react-bootstrap";

const DoctorPatient = () => {
  const doctorSidebarLinks = [
    { label: "Dashboard", path: "/nurse-dashboard" },
    { label: "Patient Queue", path: "/doctor-patient-management" },
  ];

  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [icdQuery, setIcdQuery] = useState("");
  const [icdResults, setIcdResults] = useState([]);
  const [selectedICD, setSelectedICD] = useState([]);
  const [doctorNote, setDoctorNote] = useState(""); // New state for doctor's note
  const [chiefComplaint, setChiefComplaint] = useState(""); // New state for chief complaint
  const [isEditingChiefComplaint, setIsEditingChiefComplaint] = useState(false); // New state for edit mode
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorFee, setDoctorFee] = useState("");
  const [patientType, setPatientType] = useState("Outpatient");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const addPrescription = (type) => {
    setPrescriptions([
      ...prescriptions,
      type === "medicinal"
        ? {
            type: "medicinal",
            medication: "",
            dosage: "",
            frequency: "",
            duration: "",
          }
        : {
            type: "non-medicinal",
            recommendation: "",
            notes: "",
          },
    ]);
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const response = await fetch("https://localhost:3000/doctor/get-patients");
      if (!response.ok) throw new Error("Failed to fetch visits");
      const data = await response.json();
      setVisits(data);
    } catch (error) {
      console.error("Error fetching visits:", error);
    }
  };

  const handleRowClick = (visit) => {
    setSelectedVisit(visit);
    setChiefComplaint(visit.chiefComplaints || ""); // Initialize chief complaint
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVisit(null);
    setSelectedICD(null);
  };

  // 🟢 Handle ICD-10 Search
  const handleICDSearch = async (e) => {
    const query = e.target.value;
    setIcdQuery(query);

    if (query.length > 1) {
      try {
        const response = await axios.get(
          `https://localhost:3000/icd/icd10/search?q=${query}`
        );
        setIcdResults(response.data); // Assume response returns [{ code, shortdescription }]
      } catch (error) {
        console.error("Error fetching ICD-10 codes:", error);
      }
    } else {
      setIcdResults([]); // Clear results when query is too short
    }
  };

  const handleICDSelect = (icd) => {
    if (!selectedICD?.some((selected) => selected.code === icd.code)) {
      setSelectedICD([...selectedICD, icd]); // Add new ICD code
    }
    setIcdQuery(""); // Clear search input
    setIcdResults([]); // Hide search results
  };

  const handleICDRemove = (icd) => {
    setSelectedICD(selectedICD.filter((item) => item.code !== icd.code));
  };

  const handleCompleteVisit = async (visitId) => {
    try {
      const response = await fetch(
        `https://localhost:3000/doctor/visits/${visitId}/complete`,
        { method: "PUT" }
      );

      if (!response.ok) throw new Error("Failed to complete visit");

      // Remove completed visit from state
      setVisits((prevVisits) =>
        prevVisits.filter((visit) => visit._id !== visitId)
      );

      alert("Visit marked as completed!");
    } catch (error) {
      console.error("Error completing visit:", error);
    }
  };

  const handleNoteChange = (e) => {
    setDoctorNote(e.target.value);
  };

  const handleChiefComplaintChange = (e) => {
    setChiefComplaint(e.target.value);
  };

  const toggleChiefComplaintEdit = () => {
    setIsEditingChiefComplaint(!isEditingChiefComplaint);
  };

  const handleSubmitVisitDetails = async () => {
    setLoading(true);
    setMessage("");
    try {
      const checkupResponse = await axios.post(
        "https://localhost:3000/checkup/create-new",
        {
          patientId: selectedVisit.patient_id?._id,
          icd: selectedICD.map((icd) => icd._id),
          additionalNotes: doctorNote,
          doctorFee: parseFloat(doctorFee),
          patientType, // Include patient type in creation request

        }
      );
      const checkupId = checkupResponse.data.checkupId;

      await axios.post(
        "https://localhost:3000/prescriptions/createPrescription",
        {
          checkupId, // Reference the existing checkup
          patientId: selectedVisit.patient_id?._id,
          prescriptions,
        }
      );

      alert("Visit recorded successfully!");
      setSelectedICD([]); // Reset selected ICDs
      setPrescriptions([]); // Clear prescriptions
      setDoctorFee("");
      setDoctorNote(""); // Clear doctor's note
    } catch (error) {
      console.error("Error submitting visit:", error);
    }
  };

  const handleChange = (index, field, value) => {
    const updatedPrescriptions = [...prescriptions]; // Copy current prescriptions
    updatedPrescriptions[index][field] = value; // Update specific field
    setPrescriptions(updatedPrescriptions); // Save updated state
  };

  return (
    <div>
      <Sidebar
        links={doctorSidebarLinks}
        pageContent={
          <div>
            <h2>Visits</h2>
            <table className="table table-striped table-bordered mx-3">
              <thead className="thead-dark">
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.length > 0 ? (
                  visits.map((visit) => (
                    <tr key={visit._id} style={{ cursor: "default" }}>
                      <td>{visit.patient_id?.patient_id}</td>
                      <td>
                        {visit.patient_id
                          ? `${visit.patient_id.firstname} ${visit.patient_id.lastname}`
                          : "Unknown Patient"}
                      </td>
                      <td>{visit.status}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(visit); // Open modal when button is clicked
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center">
                      No visits found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <Modal
              show={isModalOpen}
              body={
                <>
                  <div
                    className="modal-content"
                    style={{
                      width: "85%",
                      height: "85%",
                      margin: "50px 100px",
                      position: "fixed",
                      top: "0px",
                      left: "0px",
                      overflowY: "auto", // Enable vertical scrolling
                    }}
                  >
                    <div className="modal-header">
                      <h3 className="modal-title">Visit Details</h3>
                    </div>
                    <div className="modal-body">
                      {selectedVisit && (
                        <>
                          <div style={{ display: "flex" }}>
                            <div className="selectedPatient-name-ID">
                              <div>
                                <div>
                                  <h1>
                                    {selectedVisit.patient_id?.firstname}{" "}
                                    {selectedVisit.patient_id?.lastname}
                                  </h1>
                                </div>
                                <div style={{ display: "flex" }}>
                                  <div>
                                    <p>
                                      {selectedVisit.patient_id?.patient_id}
                                    </p>
                                  </div>
                                  <div style={{ margin: "0 10px" }}>
                                    <p> {selectedVisit.patient_id?.gender}</p>
                                  </div>
                                  <div style={{ margin: "0 10px" }}>
                                    <p> {selectedVisit.patient_id?.age}</p>
                                  </div>
                                  <div style={{ margin: "0 10px" }}>
                                    <p>
                                      {new Date(
                                        selectedVisit.patient_id?.dob
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div style={{ margin: "0 10px" }}>
                                    <p>For: {selectedVisit.purpose}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className="for-vital-signs"
                              style={{ margin: "5px", display: "flex" }}
                            >
                              <div style={{ margin: "0 10px" }}>
                                <p>
                                  <strong>BP: </strong>
                                  {selectedVisit.blood_pressure}
                                </p>
                                <p>
                                  <strong>Temp:</strong>{" "}
                                  {selectedVisit.temperature}
                                </p>
                              </div>
                              <div style={{ margin: "0 10px" }}>
                                <p>
                                  <strong>RR:</strong>{" "}
                                  {selectedVisit.respiratory_rate}
                                </p>
                                <p>
                                  <strong>PR:</strong>{" "}
                                  {selectedVisit.temperature} in C
                                </p>
                              </div>
                              <div style={{ margin: "0 10px" }}>
                                <p>
                                  <strong>Weight:</strong>{" "}
                                  {selectedVisit.weight} in kg
                                </p>
                                <p>
                                  <strong>Allergies:</strong>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div>
                              <div className="details-for-doctors">
                                <div className="details-for-doctors-wrapper">
                                  <div
                                    className="details-for-doctors-content"
                                    style={{ padding: "10px" }}
                                  >
                                    <AccordionComponents
                                      items={[
                                        {
                                          title: (
                                            <>
                                              <label>Chief Complaints:</label>
                                              <button
                                                className="btn btn-link btn-sm"
                                                onClick={
                                                  toggleChiefComplaintEdit
                                                }
                                                style={{ marginLeft: "10px" }}
                                              >
                                                {isEditingChiefComplaint
                                                  ? "Cancel"
                                                  : "Edit"}
                                              </button>
                                            </>
                                          ),
                                          content: (
                                            <>
                                              {isEditingChiefComplaint ? (
                                                <textarea
                                                  value={chiefComplaint}
                                                  onChange={
                                                    handleChiefComplaintChange
                                                  }
                                                  placeholder="Edit chief complaints here..."
                                                  className="form-control"
                                                  rows="3"
                                                />
                                              ) : (
                                                <p>
                                                  {`"${
                                                    chiefComplaint ||
                                                    "No chief complaints provided."
                                                  }"`}
                                                </p>
                                              )}
                                            </>
                                          ),
                                        },
                                        {
                                          title: "Medical History",
                                          content: "Content 1",
                                        },
                                        {
                                          title:
                                            "Previous Consultations and Treatments",
                                          content: "Content 1",
                                        },
                                      ]}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Add more details as needed */}

                              {/* 🔍 ICD-10 SEARCH BAR */}
                              <div>
                                <label>
                                  <strong>Diagnosis (ICD-10):</strong>
                                </label>
                                <input
                                  type="text"
                                  value={icdQuery}
                                  onChange={handleICDSearch}
                                  placeholder="Search ICD-10 codes..."
                                  className="form-control"
                                />

                                {/* ICD-10 Search Results */}
                                {icdResults.length > 0 && (
                                  <ul
                                    className="list-group"
                                    style={{
                                      maxHeight: "150px",
                                      overflowY: "scroll",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {icdResults.map((icd) => (
                                      <li
                                        key={icd.code}
                                        className="list-group-item"
                                        onClick={() => handleICDSelect(icd)}
                                      >
                                        {icd.code} - {icd.shortdescription}
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {/* Selected ICD-10 Codes */}
                                {selectedICD?.length > 0 && (
                                  <div className="mt-2">
                                    <strong>Selected Diagnoses:</strong>
                                    <div className="d-flex flex-wrap">
                                      {selectedICD.map((icd) => (
                                        <span
                                          key={icd.code}
                                          className="badge bg-primary m-1"
                                          style={{ cursor: "pointer" }}
                                          onClick={() => handleICDRemove(icd)}
                                        >
                                          {icd.code} - {icd.shortdescription} ✖
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="p-4 border rounded">
                                  <h3 className="text-lg font-bold">
                                    Change Patient Type
                                  </h3>
                                  {message && (
                                    <p className="text-green-600">{message}</p>
                                  )}
                                  <select
                                    value={patientType}
                                    onChange={(e) => setPatientType(e.target.value)}
                                    className="p-2 border rounded"
                                    disabled={loading} // Disables during API call
                                  >
                                    <option value="Outpatient">
                                      Outpatient
                                    </option>
                                    <option value="Inpatient">Inpatient</option>
                                  </select>
                                  {loading && (
                                    <p className="text-blue-500">Updating...</p>
                                  )}{" "}
                                  {/* Show loading message */}
                                </div>

                                <Container>
                                  <h2 className="my-4">Prescription Form</h2>
                                  {prescriptions.map((pres, index) => (
                                    <Row
                                      key={index}
                                      className="prescription-entry mb-3"
                                    >
                                      {pres.type === "medicinal" ? (
                                        <>
                                          <Col md={3}>
                                            <Form.Control
                                              type="text"
                                              placeholder="Medication"
                                              value={pres.medication}
                                              onChange={(e) =>
                                                handleChange(
                                                  index,
                                                  "medication",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </Col>
                                          <Col md={2}>
                                            <Form.Control
                                              type="text"
                                              placeholder="Dosage"
                                              value={pres.dosage}
                                              onChange={(e) =>
                                                handleChange(
                                                  index,
                                                  "dosage",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </Col>

                                          <Col md={2}>
                                            <Form.Control
                                              as="textarea"
                                              placeholder="Instruction"
                                              value={pres.instruction}
                                              onChange={(e) =>
                                                handleChange(
                                                  index,
                                                  "instruction",
                                                  e.target.value
                                                )
                                              }
                                              rows={3} // Optional: Adjust the number of rows
                                              style={{ resize: "horizontal" }} // Allow horizontal resizing
                                            />
                                          </Col>
                                        </>
                                      ) : (
                                        <>
                                          <Col md={6}>
                                            <Form.Control
                                              type="text"
                                              placeholder="Recommendation"
                                              value={pres.recommendation}
                                              onChange={(e) =>
                                                handleChange(
                                                  index,
                                                  "recommendation",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </Col>
                                          <Col md={6}>
                                            <Form.Control
                                              type="text"
                                              placeholder="Notes"
                                              value={pres.notes}
                                              onChange={(e) =>
                                                handleChange(
                                                  index,
                                                  "notes",
                                                  e.target.value
                                                )
                                              }
                                            />
                                          </Col>
                                        </>
                                      )}
                                    </Row>
                                  ))}

                                  <Row className="mt-4">
                                    <Col>
                                      <Button
                                        variant="primary"
                                        onClick={() =>
                                          addPrescription("medicinal")
                                        }
                                        className="me-2"
                                      >
                                        + Add Medicinal
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        onClick={() =>
                                          addPrescription("non-medicinal")
                                        }
                                        className="me-2"
                                      >
                                        + Add Non-Medicinal
                                      </Button>
                                    </Col>
                                  </Row>
                                </Container>
                              </div>
                            </div>
                          </div>

                          {selectedICD && (
                            <p>
                              <strong>Selected ICD Code:</strong>{" "}
                              {selectedICD.code} -{" "}
                              {selectedICD.shortdescription}
                            </p>
                          )}

                          <div>
                            <label>
                              <strong>Doctor's Note:</strong>
                            </label>
                            <textarea
                              value={doctorNote}
                              onChange={handleNoteChange}
                              placeholder="Add additional notes here..."
                              className="form-control"
                              rows="4"
                            />
                          </div>
                          <div>
                            <label>
                              <strong>Doctor's Fee: </strong>
                            </label>
                            <input
                              type="number"
                              placeholder="Doctor's Fee"
                              value={doctorFee}
                              onChange={(e) => setDoctorFee(e.target.value)}
                              className="w-full p-2 mb-2 border rounded"
                              required
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeModal}
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to mark this visit as complete?"
                            )
                          ) {
                            handleCompleteVisit(selectedVisit._id);
                            handleSubmitVisitDetails();
                            closeModal();
                          }
                        }}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </>
              }
            />
          </div>
        }
      />
    </div>
  );
};

export default DoctorPatient;
