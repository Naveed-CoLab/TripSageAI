import * as React from "react";

export const TripSageLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-1"
  >
    {/* Main circle with yellow fill */}
    <path
      d="M12 3.953a7.442 7.442 0 1 0 .001 14.884A7.442 7.442 0 0 0 12 3.953m0 14.05a6.61 6.61 0 1 1 0-13.218 6.61 6.61 0 0 1 0 13.219"
      fill="#F7DF1E"
      stroke="#F7DF1E"
    />
    
    {/* Circle eyes */}
    <path
      d="M10.343 11.9a.91.91 0 1 1-1.821 0 .91.91 0 0 1 1.821 0m5.134 0a.91.91 0 1 1-1.821 0 .91.91 0 0 1 1.82 0"
      fill="#000000"
      stroke="none"
    />
    
    {/* Smile design */}
    <path
      d="m16.297 10.003.84-.913h-1.863A5.8 5.8 0 0 0 12 8.08a5.77 5.77 0 0 0-3.27 1.008H6.862l.84.913a2.567 2.567 0 1 0 3.475 3.78l.823.896.823-.895a2.568 2.568 0 1 0 3.474-3.78"
      fill="none"
      stroke="#CC8B00"
      strokeWidth="0.9"
    />
    
    {/* Details */}
    <path
      d="M9.432 15.271a1.738 1.738 0 1 1 0-3.476 1.738 1.738 0 0 1 0 3.476"
      fill="none"
      stroke="#CC8B00"
      strokeWidth="0.9"
    />
    
    <path
      d="M12 11.85c0-1.143-.832-2.124-1.929-2.543A5 5 0 0 1 12 8.92a5 5 0 0 1 1.928.386c-1.096.42-1.927 1.4-1.927 2.543"
      fill="none"
      stroke="#CC8B00"
      strokeWidth="0.9"
    />
    
    <path
      d="M14.566 15.271a1.738 1.738 0 1 1 .001-3.476 1.738 1.738 0 0 1 0 3.476"
      fill="none"
      stroke="#CC8B00"
      strokeWidth="0.9"
    />
  </svg>
);

export default TripSageLogo;