// VisitorPass.js
import React, { useState, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Webcam from "react-webcam";

function VisitorPass() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    idProof: "",
    personToMeet: "",
    designation: "",
    department: "",
    meetingPurpose: "",
    photo: null,
  });

  const [passGenerated, setPassGenerated] = useState(false);
  const [buttonText, setButtonText] = useState("Capture Button");
  const passRef = useRef();
  const webcamRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setFormData((prevData) => ({ ...prevData, photo: imageSrc }));
    setButtonText("Recapture Photo");
  }, [webcamRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      formData.name &&
      formData.mobile &&
      formData.address &&
      formData.idProof &&
      formData.personToMeet &&
      formData.meetingPurpose &&
      formData.photo
    ) {
      try {
        const response = await fetch('http://localhost:5000/visitor-pass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const visitorData = await response.json();
          setPassGenerated(true);
          setFormData(visitorData);
        } else {
          alert('Failed to generate pass. Please try again.');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Network error. Please try again.');
      }
    } else {
      alert('Please fill in all required fields and capture a photo.');
    }
  };

  const qrData = JSON.stringify({ name: formData.name ,
    mobile: formData.mobile,
    address: formData.address,
    idProof: formData.idProof,
    personToMeet: formData.personToMeet,
    meetingPurpose: formData.meetingPurpose});

  const downloadPass = () => {
    html2canvas(passRef.current).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 0, 0);
      pdf.save("visitor-pass.pdf");
    });
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
      {!passGenerated ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full"
        >
          <h2 className="text-2xl font-bold mb-6">Create Visitor Pass</h2>
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="mobile" placeholder="Mobile No" value={formData.mobile} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="idProof" placeholder="Aadhaar/ID Proof" value={formData.idProof} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="personToMeet" placeholder="Person to Meet" value={formData.personToMeet} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <input type="text" name="designation" placeholder="Designation" value={formData.designation} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />
          <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} className="w-full p-2 mb-4 border rounded" />
          <input type="text" name="meetingPurpose" placeholder="Meeting Purpose" value={formData.meetingPurpose} onChange={handleChange} className="w-full p-2 mb-4 border rounded" required />
          <div className="mb-4">
            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full rounded" />
            <button type="button" onClick={handleCapture} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 mt-4 w-full">
              {buttonText}
            </button>
          </div>
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 w-full">
            Generate Pass
          </button>
        </form>
      ) : (
        <>
          <div ref={passRef} className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Visitor Pass</h2>
            {formData.photo && <img src={formData.photo} alt="Visitor" className="w-24 h-24 mx-auto rounded-full mb-4" />}
            <p className="text-lg font-semibold">{formData.name}</p>
            <p>Mobile: {formData.mobile}</p>
            <p>Address: {formData.address}</p>
            <p>ID Proof: {formData.idProof}</p>
            <p>Meeting with: {formData.personToMeet}</p>
            <p>Designation: {formData.designation}</p>
            <p>Department: {formData.department}</p>
            <p>Purpose: {formData.meetingPurpose}</p>
            <div className="mt-4 flex flex-col justify-center items-center">
              <QRCodeCanvas value={qrData} size={300} bgColor="#ffffff" fgColor="#000000" />
            </div>
          </div>
          <div className="flex flex-row">
            <button onClick={downloadPass} className="mt-4 bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 mr-5">
              Download Pass
            </button>
            <button onClick={() => setPassGenerated(false)} className="mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700">
              Create New Pass
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default VisitorPass;
