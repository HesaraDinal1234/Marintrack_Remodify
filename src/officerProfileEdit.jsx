import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./Backend/Firebase";
import { updatePassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import backgroundImage from "./background.jpeg";
import logoImage from "./logo.png";

const OfficerProfileEdit = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    position: "",
    nic: "",
    address: "",
    password: "", // Optional password field
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "officers", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const officer = docSnap.data();
            setFormData({
              name: officer.name || "",
              phone: officer.phone || "",
              position: officer.position || "",
              nic: officer.nic || "",
              address: officer.address || "",
              password: "", // Do not pre-fill
            });
          } else {
            setError("Officer data not found.");
          }
        } catch (err) {
          setError("Failed to fetch profile.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const user = auth.currentUser;
    if (!user) {
      setError("User not authenticated.");
      return;
    }

    try {
      const { name, phone, position, nic, address, password } = formData;

      // Update Firestore officer data
      const docRef = doc(db, "officers", user.uid);
      await updateDoc(docRef, {
        name,
        phone,
        position,
        nic,
        address,
      });

      // Update password if provided
      if (password.trim() !== "") {
        await updatePassword(user, password);
      }

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error(err);
      setError("Error updating profile.");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading profile...</div>;

  return (
    <div
      className="min-vh-100 vw-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        padding: "2rem",
      }}
    >
      <div className="container">
        <div
          className="bg-light bg-opacity-85 p-4 p-md-5 rounded-4 shadow-lg"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <img
                src={logoImage}
                alt="Logo"
                width="60"
                height="60"
                className="me-3"
              />
              <h2 className="fw-bold mb-0">Edit Officer Profile</h2>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            {["name", "phone", "position", "nic", "address"].map((field) => (
              <div className="mb-3" key={field}>
                <label className="form-label fw-semibold">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type="text"
                  name={field}
                  className="form-control"
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}

            <div className="mb-4">
              <label className="form-label fw-semibold">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="btn btn-success w-100 rounded-pill fw-semibold py-2">
              Update Profile
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              className="btn btn-link text-decoration-none"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerProfileEdit;
