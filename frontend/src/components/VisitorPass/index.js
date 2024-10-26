import React, { useState, useRef, useCallback, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

function VisitorPass() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    idProof: "",
    personToMeet: "",
    designation: "",
    department: "IT", // Default to IT
    meetingPurpose: "",
    photo: null,
    createdAt: "",
  });

  const [passGenerated, setPassGenerated] = useState(false);
  const [qrData, setQrData] = useState("");
  const passRef = useRef();
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setFormData((prevData) => ({ ...prevData, photo: imageSrc }));
    }
  }, [webcamRef]);

  const handleRecapture = () => {
    setFormData((prevData) => ({ ...prevData, photo: null }));
    if (webcamRef.current) {
      webcamRef.current.video.play();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.photo) return;

    try {
      const response = await fetch('http://localhost:5000/visitor-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const visitorData = await response.json();
        setPassGenerated(true);
        const formattedDate = new Date().toLocaleString();
        setFormData((prevData) => ({
          ...visitorData,
          createdAt: formattedDate,
        }));
        generateQR(visitorData);
      } else {
        alert('Failed to generate pass. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
  };

  const generateQR = (data) => {
    const qrString = JSON.stringify({
      name: data.name || "",
      mobile: data.mobile || "",
      address: data.address || "",
      idProof: data.idProof || "",
      personToMeet: data.personToMeet || "",
      meetingPurpose: data.meetingPurpose || "",
    });
    setQrData(qrString);
  };

  const saveAsPDF = () => {
    const doc = new jsPDF();
    doc.html(passRef.current, {
      callback: function (doc) {
        doc.save("visitor-pass.pdf");
      },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 650,
    });
  };

  useEffect(() => {
    console.log("QR Data:", qrData);
  }, [qrData]);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
      {!passGenerated ? (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Create Visitor Pass</h2>
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="mobile" placeholder="Mobile No" value={formData.mobile} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="idProof" placeholder="Aadhaar/ID Proof" value={formData.idProof} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="personToMeet" placeholder="Person to Meet" value={formData.personToMeet} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />

          <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required>
            <option value="IT">IT</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="Management">Management</option>
          </select>

          <input type="text" name="meetingPurpose" placeholder="Meeting Purpose" value={formData.meetingPurpose} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />

          {!formData.photo && (
            <div className="mb-4">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded" />
              <button type="button" onClick={handleCapture} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 mt-4 w-full">
                Capture Photo
              </button>
            </div>
          )}

          {formData.photo && (
            <div className="mb-4 text-center">
              <img src={formData.photo} alt="Captured" />
              <button type="button" onClick={handleRecapture} className="bg-yellow-600 text-white font-bold py-2 px-4 rounded hover:bg-yellow-700 w-full mt-4">
                Recapture Photo
              </button>
            </div>
          )}

          <button type="submit" className={`bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 w-full ${!formData.photo ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!formData.photo}>
            Generate Pass
          </button>
        </form>
      ) : (
        <>
          <div ref={passRef} id="print-pass" className="print-container bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Visitor Pass</h2>
            {formData.photo && <img src={formData.photo} alt="Visitor" className="w-44 h-44 mx-auto rounded-full mb-4" />}
            <p className="text-lg font-semibold">{formData.name}</p>
            <p><b>Mobile:</b> {formData.mobile}</p>
            <p>Address: {formData.address}</p>
            <p>ID Proof: {formData.idProof}</p>
            <p>Meeting with: {formData.personToMeet}</p>
            <p>Designation: {formData.designation}</p>
            <p>Department: {formData.department}</p>
            <p>Purpose: {formData.meetingPurpose}</p>
            <div className="mt-4 flex flex-col justify-center items-center mb-3">
              <QRCodeCanvas value={qrData} size={128} />
            </div>
            <p className="text-gray-500 text-sm">Generated on: {formData.createdAt}</p>
          </div>
          <button onClick={saveAsPDF} className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 mt-4">
            Save as PDF
          </button>
          <button onClick={() => navigate('/')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 mt-4">
            Home
          </button>
        </>
      )}
    </div>
  );
}

export default VisitorPass;
