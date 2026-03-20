import { useState } from "react";
import { predictRisk } from "../services/api";

export default function NewAssessment() {
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
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setError("");
    setResult(null);

    try {
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

      if (!res || res.error) {
        setError(res?.error || "No response from server");
        return;
      }

      setResult(res);

    } catch (err) {
      setError("Failed to connect to backend");
    }
  };

  const getRiskLevel = (prob) => {
    if (prob < 0.3) return "🟢 LOW RISK";
    if (prob < 0.6) return "🟡 MEDIUM RISK";
    return "🔴 HIGH RISK";
  };

  const getPredictionText = (prediction) => {
    return prediction === 1
      ? "❌ Loan Defaulter"
      : "✅ Creditworthy Customer";
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">New Assessment</h1>

      <div className="grid grid-cols-2 gap-4 max-w-3xl">

        <input className="p-2 border rounded" name="Age" placeholder="Age" onChange={handleChange} />
        <input className="p-2 border rounded" name="Income" placeholder="Income" onChange={handleChange} />
        <input className="p-2 border rounded" name="LoanAmount" placeholder="Loan Amount" onChange={handleChange} />
        <input className="p-2 border rounded" name="CreditScore" placeholder="Credit Score" onChange={handleChange} />
        <input className="p-2 border rounded" name="MonthsEmployed" placeholder="Months Employed" onChange={handleChange} />
        <input className="p-2 border rounded" name="NumCreditLines" placeholder="Credit Lines" onChange={handleChange} />
        <input className="p-2 border rounded" name="InterestRate" placeholder="Interest Rate" onChange={handleChange} />
        <input className="p-2 border rounded" name="LoanTerm" placeholder="Loan Term" onChange={handleChange} />
        <input className="p-2 border rounded" name="DTIRatio" placeholder="DTI Ratio" onChange={handleChange} />

        <select className="p-2 border rounded" name="Education" onChange={handleChange}>
          <option>High School</option>
          <option>Bachelor</option>
          <option>Master</option>
          <option>PhD</option>
        </select>

        <select className="p-2 border rounded" name="EmploymentType" onChange={handleChange}>
          <option>Salaried</option>
          <option>Self-Employed</option>
          <option>Unemployed</option>
        </select>

        <select className="p-2 border rounded" name="MaritalStatus" onChange={handleChange}>
          <option>Single</option>
          <option>Married</option>
          <option>Divorced</option>
        </select>

        <select className="p-2 border rounded" name="LoanPurpose" onChange={handleChange}>
          <option>Home</option>
          <option>Auto</option>
          <option>Education</option>
          <option>Business</option>
          <option>Other</option>
        </select>

        <select className="p-2 border rounded" name="HasMortgage" onChange={handleChange}>
          <option value={0}>No Mortgage</option>
          <option value={1}>Has Mortgage</option>
        </select>

        <select className="p-2 border rounded" name="HasDependents" onChange={handleChange}>
          <option value={0}>No Dependents</option>
          <option value={1}>Has Dependents</option>
        </select>

        <select className="p-2 border rounded" name="HasCoSigner" onChange={handleChange}>
          <option value={0}>No Co-Signer</option>
          <option value={1}>Has Co-Signer</option>
        </select>

      </div>

      <button
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleSubmit}
      >
        Predict Risk
      </button>

      {error && (
        <div className="mt-4 text-red-500 font-semibold">
          {error}
        </div>
      )}

      {result && result.probability !== undefined && (
        <div className="mt-6 bg-white p-5 rounded-xl shadow w-96">
          <h2 className="text-xl font-bold mb-2">Assessment Result</h2>

          <p className="font-bold text-lg">
            {getRiskLevel(result.probability)}
          </p>

          <p>
            {(result.probability * 100).toFixed(2)}% default
          </p>

          <p className="mt-2 font-semibold">
            {getPredictionText(result.prediction)}
          </p>

          {result.shap_values && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Top Risk Factors</h3>

              {Object.entries(result.shap_values).map(([feature, value]) => (
                <p key={feature}>
                  <span className="font-semibold">{feature}</span>: {value}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}