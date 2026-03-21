import { useState } from "react";
import { predictRisk } from "../services/api";
import ShapChart from "../components/ShapChart";

// ─── Input Components (Outside to prevent re-renders) ───────────────────────

const InputField = ({ name, placeholder, value, onChange, type = "number" }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pl-1">{placeholder}</label>
    <input
      type={type}
      name={name}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className="bg-[#1e293b] border border-white/5 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-600 text-sm"
    />
  </div>
);

const SelectField = ({ name, label, value, onChange, options }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pl-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="bg-[#1e293b] border border-white/5 text-white p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer text-sm"
    >
      {options.map(opt => (
        <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt} className="bg-[#1e293b]">
          {typeof opt === 'object' ? opt.label : opt}
        </option>
      ))}
    </select>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    setLoading(true);

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
      setError("Failed to connect to backend. Please ensure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch("http://localhost:5000/download-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prediction: result.prediction === 1 ? "Default" : "Safe",
          probability: result.probability,
          shap_values: result.shap_values,
          features: formData
        })
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Report_#${Date.now()}.pdf`;
      a.click();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const getRiskLevel = (prob) => {
    if (prob < 0.3) return { label: "SAFE / LOW RISK", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
    if (prob < 0.6) return { label: "MEDIUM RISK", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
    return { label: "CRITICAL / HIGH RISK", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  };

  return (
    <div className="p-8 md:p-10 font-sans min-h-screen bg-[#0f172a]">

      {/* ── Header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-emerald-500 rounded-full"></div>
          <h1 className="text-3xl font-bold text-white tracking-tight">New Risk Assessment</h1>
        </div>
        <p className="text-slate-400 text-sm ml-5">
          Generate an AI-powered credit risk prediction by providing loan and applicant details.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ── Left: Form Section ── */}
        <div className="xl:col-span-2 bg-[#1e293b] rounded-2xl p-8 border border-white/5 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
            <InputField name="Age" placeholder="Applicant Age" value={formData.Age} onChange={handleChange} />
            <InputField name="Income" placeholder="Annual Income (USD)" value={formData.Income} onChange={handleChange} />
            <InputField name="LoanAmount" placeholder="Loan Amount (USD)" value={formData.LoanAmount} onChange={handleChange} />
            <InputField name="CreditScore" placeholder="Credit Score" value={formData.CreditScore} onChange={handleChange} />
            <InputField name="MonthsEmployed" placeholder="Employment Duration (Months)" value={formData.MonthsEmployed} onChange={handleChange} />
            <InputField name="NumCreditLines" placeholder="Existing Credit Lines" value={formData.NumCreditLines} onChange={handleChange} />
            <InputField name="InterestRate" placeholder="Proposed Interest Rate (%)" value={formData.InterestRate} onChange={handleChange} />
            <InputField name="LoanTerm" placeholder="Loan Term (Months)" value={formData.LoanTerm} onChange={handleChange} />
            <InputField name="DTIRatio" placeholder="DTI Ratio" value={formData.DTIRatio} onChange={handleChange} />

            <SelectField name="Education" label="Education Level" value={formData.Education} options={["High School", "Bachelor", "Master", "PhD"]} onChange={handleChange} />
            <SelectField name="EmploymentType" label="Employment Type" value={formData.EmploymentType} options={["Salaried", "Self-Employed", "Unemployed"]} onChange={handleChange} />
            <SelectField name="MaritalStatus" label="Marital Status" value={formData.MaritalStatus} options={["Single", "Married", "Divorced"]} onChange={handleChange} />
            <SelectField name="LoanPurpose" label="Loan Purpose" value={formData.LoanPurpose} options={["Home", "Auto", "Education", "Business", "Other"]} onChange={handleChange} />
            
            <SelectField 
              name="HasMortgage" 
              label="Existing Mortgage" 
              value={formData.HasMortgage}
              options={[{label: "No", value: 0}, {label: "Yes", value: 1}]} 
              onChange={handleChange}
            />
            <SelectField 
              name="HasDependents" 
              label="Dependents" 
              value={formData.HasDependents}
              options={[{label: "No", value: 0}, {label: "Yes", value: 1}]} 
              onChange={handleChange}
            />
            <SelectField 
                name="HasCoSigner" 
                label="Co-Signer" 
                value={formData.HasCoSigner}
                options={[{label: "No", value: 0}, {label: "Yes", value: 1}]} 
                onChange={handleChange}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 ${
              loading 
                ? "bg-blue-600/50 cursor-not-allowed text-slate-300" 
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white/50 border-t-white rounded-full"></div>
                Processing Assessment...
              </>
            ) : (
              <>🚀 Generate Risk Profile</>
            )}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl font-medium animate-pulse">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* ── Right: Result Section ── */}
        <div className="flex flex-col gap-6">
          {!result ? (
            <div className="flex-1 min-h-[400px] border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-600 p-8 text-center bg-[#1e293b]/30">
              <div className="text-5xl mb-4 opacity-20 font-bold tracking-tight">AI</div>
              <p className="text-sm font-medium">Ready for real-time risk evaluation</p>
              <p className="text-xs mt-1 opacity-60">Complete the form to generate model explanations and predictions.</p>
            </div>
          ) : (
            <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-5 duration-700">
               <div className={`absolute top-0 right-0 w-24 h-1 ${getRiskLevel(result.probability).color.replace('text-', 'bg-')}`}></div>

              <div className="mb-6 flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${getRiskLevel(result.probability).bg} ${getRiskLevel(result.probability).color} border ${getRiskLevel(result.probability).border}`}>
                  {getRiskLevel(result.probability).label}
                </span>
                <span className="text-slate-500 text-xs font-mono font-bold"># {Date.now().toString().slice(-6)}</span>
              </div>

              <div className="mb-8">
                <div className="text-5xl font-black text-white mb-2">
                  {(result.probability * 100).toFixed(1)}% <span className="text-lg text-slate-500 font-medium">Probability</span>
                </div>
                <p className={`text-lg font-bold ${result.prediction === 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {result.prediction === 1 ? '❌ High Risk: Defaulter Likely' : '✅ Verified: Creditworthy'}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Risk Explained (SHAP)</h3>
                   <div className="grid grid-cols-1 gap-3 mb-6">
                      {Object.entries(result.shap_values || {}).slice(0, 4).map(([f, v]) => (
                        <div key={f} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                          <span className="text-slate-300 text-xs font-medium">{f}</span>
                          <span className={`text-xs font-bold font-mono ${v > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {v > 0 ? '+' : ''}{parseFloat(v).toFixed(3)}
                          </span>
                        </div>
                      ))}
                   </div>
                   <div className="bg-white/5 p-4 rounded-xl border border-white/5 overflow-hidden">
                      <ShapChart shapData={result.shap_values} />
                   </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full py-3.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  📄 Download Detailed PDF Report
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}