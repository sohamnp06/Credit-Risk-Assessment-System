import { useState } from "react";
import { predictRisk } from "./services/api";

function App() {
  const [formData, setFormData] = useState({
    Age: "",
    Income: "",
    LoanAmount: "",
    CreditScore: "",
    MonthsEmployed: "",
    NumCreditLines: "",
    InterestRate: "",
    LoanTerm: "",
    DTIRatio: "",
    Education: "Bachelor",
    EmploymentType: "Salaried",
    MaritalStatus: "Single",
    HasMortgage: 0,
    HasDependents: 0,
    LoanPurpose: "Home",
    HasCoSigner: 0
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ✅ FIX: Convert all numeric fields properly
  const handleSubmit = async () => {
    const formattedData = {
      ...formData,
      Age: Number(formData.Age),
      Income: Number(formData.Income),
      LoanAmount: Number(formData.LoanAmount),
      CreditScore: Number(formData.CreditScore),
      MonthsEmployed: Number(formData.MonthsEmployed),
      NumCreditLines: Number(formData.NumCreditLines),
      InterestRate: Number(formData.InterestRate),
      LoanTerm: Number(formData.LoanTerm),
      DTIRatio: Number(formData.DTIRatio),
      HasMortgage: Number(formData.HasMortgage),
      HasDependents: Number(formData.HasDependents),
      HasCoSigner: Number(formData.HasCoSigner)
    };

    const res = await predictRisk(formattedData);
    setResult(res);
  };

  const getRiskLevel = (prob) => {
    if (prob < 0.3) return { label: "🟢 LOW RISK", color: "green" };
    if (prob < 0.6) return { label: "🟡 MEDIUM RISK", color: "orange" };
    return { label: "🔴 HIGH RISK", color: "red" };
  };

  // ✅ FIX: Correct meaning
  const getPredictionText = (prediction) => {
    return prediction === 1
      ? "❌ Loan Defaulter"
      : "✅ Creditworthy Customer";
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Credit Risk Assessment</h1>

      {/* FORM */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "600px" }}>
        
        <input name="Age" placeholder="Age" onChange={handleChange} />
        <input name="Income" placeholder="Income" onChange={handleChange} />
        <input name="LoanAmount" placeholder="Loan Amount" onChange={handleChange} />
        <input name="CreditScore" placeholder="Credit Score" onChange={handleChange} />
        <input name="MonthsEmployed" placeholder="Months Employed" onChange={handleChange} />
        <input name="NumCreditLines" placeholder="Credit Lines" onChange={handleChange} />
        <input name="InterestRate" placeholder="Interest Rate" onChange={handleChange} />
        <input name="LoanTerm" placeholder="Loan Term" onChange={handleChange} />
        <input name="DTIRatio" placeholder="DTI Ratio" onChange={handleChange} />

        {/* Dropdowns */}
        <select name="Education" onChange={handleChange}>
          <option>Bachelor</option>
          <option>Master</option>
          <option>PhD</option>
        </select>

        <select name="EmploymentType" onChange={handleChange}>
          <option>Salaried</option>
          <option>Self-Employed</option>
          <option>Unemployed</option>
        </select>

        <select name="MaritalStatus" onChange={handleChange}>
          <option>Single</option>
          <option>Married</option>
          <option>Divorced</option>
        </select>

        <select name="LoanPurpose" onChange={handleChange}>
          <option>Home</option>
          <option>Auto</option>
          <option>Education</option>
          <option>Business</option>
        </select>

        <select name="HasMortgage" onChange={handleChange}>
          <option value={0}>No Mortgage</option>
          <option value={1}>Has Mortgage</option>
        </select>

        <select name="HasDependents" onChange={handleChange}>
          <option value={0}>No Dependents</option>
          <option value={1}>Has Dependents</option>
        </select>

        <select name="HasCoSigner" onChange={handleChange}>
          <option value={0}>No Co-Signer</option>
          <option value={1}>Has Co-Signer</option>
        </select>

      </div>

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          cursor: "pointer"
        }}
      >
        Predict Risk
      </button>

      {/* RESULT CARD */}
      {result && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            width: "350px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
          }}
        >
          <h2>Assessment Result</h2>

          {/* Risk Level */}
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
            Risk Level:{" "}
            <span style={{ color: getRiskLevel(result.probability).color }}>
              {getRiskLevel(result.probability).label}
            </span>
          </p>

          {/* Probability */}
          <p>
            Probability:{" "}
            {isNaN(result.probability)
              ? "Invalid Input"
              : (result.probability * 100).toFixed(2) + "% default"}
          </p>

          {/* Prediction */}
          <p style={{ marginTop: "10px", fontWeight: "bold" }}>
            {getPredictionText(result.prediction)}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;