import { useState } from "react";

interface ModelInfoDropdownProps {
  bayesianParam?: Record<string, number> | null;
}

export default function ModelInfoDropdown({ bayesianParam }: ModelInfoDropdownProps) {
  const [open, setOpen] = useState(false);
  const group1 = ["a", "b", "c"];
  const group2 = ["noise_scale", "sig_slope", "sig_offset", "error_scale"];

  return (
    <div className="w-full max-w-xs mx-auto mt-2">
      <button
        type="button"
        className={`w-full flex items-center justify-center px-6 py-2 bg-white border border-gray-200 rounded-full text-base font-medium text-center transition focus:outline-none focus:ring-2 focus:ring-blue-400`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Current Model Details</span>
        <svg
          className={`w-5 h-5 ml-2 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 bg-white border border-gray-100 rounded-xl shadow p-4 animate-fade-in">
          <div className="font-bold text-lg mb-2 text-center">Bayesian Model Parameters</div>
          {bayesianParam ? (
            <table className="w-full text-sm">
              <tbody>
                {group1.map((key) => (
                  <tr key={key}>
                    <td className="font-bold text-gray-700 pr-2 text-right w-1/2">{key}:</td>
                    <td className="font-mono text-base text-gray-900 text-left w-1/2">{bayesianParam[key]?.toFixed(3)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2}><hr className="my-2 border-gray-200" /></td></tr>
                {group2.map((key) => (
                  <tr key={key}>
                    <td className="font-semibold text-gray-600 pr-2 text-right w-1/2">{key}:</td>
                    <td className="font-mono text-base text-gray-800 text-left w-1/2">{bayesianParam[key]?.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500 text-center py-2">No parameters available</div>
          )}
        </div>
      )}
    </div>
  );
} 