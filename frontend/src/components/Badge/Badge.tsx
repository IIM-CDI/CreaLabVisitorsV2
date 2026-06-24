import React from "react";
import "./Badge.css";

interface BadgeProps {
    label: "impression" | "electronique" | "peinture";
    usage: "form" | "event"
}

const LabelValues = {
    impression:{
        label: "Impression",
        color: "#FF5733",
        backgroundColor: "#FFE5E0"
    },
    electronique: {
        label: "Electronique",
        color: "#4A90E2",
        backgroundColor: "#D1E7FF"
    },
    peinture: {
        label: "Peinture",
        color: "#50E3C2",
        backgroundColor: "#C1F0E6"
    }
}

const Badge = ({ label, usage }: BadgeProps) => {

    return (
        <div className={`badge ${label} ${usage}`} style={{ backgroundColor: LabelValues[label]?.backgroundColor, color: LabelValues[label]?.color }}>
            <p>{LabelValues[label]?.label}</p>
        </div>
    );
}

export default Badge;
