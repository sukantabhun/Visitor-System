import React, { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import Cookies from 'js-cookie';
import axios from 'axios'; // Import axios

function VisitorPass() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    idProofType: "",
    idProof: "",
    personToMeet: "",
    designation: "",
    department: "",
    meetingPurpose: "",
    photo: null,
    createdAt: "",
  });

  const [passGenerated, setPassGenerated] = useState(false);
  const [qrData, setQrData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const passRef = useRef();
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const jwtToken = Cookies.get('jwt_token');

  // Fetch departments from the backend
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/departments', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        const departmentNames = response.data.map((dept) => dept.name);
        setDepartments([ ...departmentNames]);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };

    fetchDepartments();
  }, [jwtToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setFormData((prevData) => ({ ...prevData, photo: imageSrc }));
    }
  };

  const handleRecapture = () => {
    setFormData((prevData) => ({ ...prevData, photo: null }));
    if (webcamRef.current) {
      webcamRef.current.video.play();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.photo || isSubmitting) return;
    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
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

  const validateIDProof = (value) => {
    const { idProofType } = formData;
    let regex;

    switch (idProofType) {
      case "Aadhaar":
        regex = /^\d{12}$/;
        break;
      case "Driving License":
        regex = /^[A-Z]{2}\d{2}(\d{4})(\d{7})$/;
        break;
      case "Passport":
        regex = /^[A-Z]\d{2} \d{4}\d$/;
        break;
      case "PAN":
        regex = /^[A-Z]{5}\d{4}[A-Z]$/;
        break;
      case "Voter ID":
        regex = /^[A-Z]{3}\d{7}$/;
        break;
      default:
        return false;
    }
    return regex.test(value);
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
          
          <select name="idProofType" value={formData.idProofType} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required>
            <option value="" disabled>Select ID Proof</option>
            <option value="Aadhaar">Aadhaar Card</option>
            <option value="Driving License">Driving License</option>
            <option value="Passport">Passport</option>
            <option value="PAN">PAN Card</option>
            <option value="Voter ID">Voter ID</option>
          </select>

          
          <input type="text" name="idProof" placeholder="ID Proof Number" value={formData.idProof} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required 
                 onBlur={(e) => !validateIDProof(e.target.value) && alert(`${formData.idProofType} format is incorrect.`)} />

          <input type="text" name="personToMeet" placeholder="Person to Meet" value={formData.personToMeet} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />

          <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required>
            <option value="" disabled>Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
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

          <button type="submit" className={`bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 w-full ${!formData.photo ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!formData.photo || isSubmitting}>
            {isSubmitting ? 'Generating...' : 'Generate Pass'}
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
            Back to Home
          </button>
        </>
      )}
    </div>
  );
}

export default VisitorPass;
